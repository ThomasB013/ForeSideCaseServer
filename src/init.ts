import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";
import beers from "./initialBeers.json";

const secretsClient = new SecretsManagerClient({});

const ENV_KEYS = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_SECRET_ARN",
  "AWS_REGION",
];

ENV_KEYS.forEach((key) => {
  if (process.env[key] == null) {
    console.error(`Cannot find ${key} in env`);
  }
});

async function connect() {
  const secretArn = process.env.DB_SECRET_ARN!; // Match with env names in aws cdk deployment.
  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );

  if (!secret.SecretString) {
    console.error("Cannot find secret string");
    process.exit(1);
  }

  const creds = JSON.parse(secret.SecretString!);

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: creds.username,
    password: creds.password,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();

  return client;
}

async function main() {
  const db_client = await connect();
  // Very bad, but I just want to test the database with typescript from ssh.
  const query = `
    DROP TABLE IF EXISTS beers;

    CREATE TABLE beers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(40) NOT NULL UNIQUE,
        bartender_preparation_time SMALLINT NOT NULL UNIQUE,
        volume SMALLINT NOT NULL UNIQUE,
        pour_time SMALLINT NOT NULL UNIQUE
    );
    
    ${beers.map((beer) => {
      `INSERT INTO beers VALUES (${beer.id}, ${beer.name}, ${beer.bartender_preparation_time}, ${beer.volume}, ${beer.pour_time});\n`;
    })}

    DROP TABLE IF EXISTS orders;

    CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(40) NOT NULL,
        message VARCHAR(128)
    );

    DROP TABLE IF EXISTS order_lines;

    CREATE TABLE order_lines (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        beer_id INTEGER NOT NULL REFERENCES beers(id),
        prepared SMALLINT NOT NULL,
        total SMALLINT NOT NULL
    );
`;

  console.log(`Executing query\n${query}`);
  await db_client.query(query);

  await db_client.end();
}

main()
  .catch((e) => console.error(`Error while initializing ${e}`, e))
  .finally(() => console.log("Done intializing"));
