import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

const secretsClient = new SecretsManagerClient({});

const ENV_KEYS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_SECRET_ARN"];

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
    console.error("Cannot find ");
  }

  const creds = JSON.parse(secret.SecretString!);

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: creds.username,
    password: creds.password,
  });
  await client.connect();

  return client;
}

async function main() {
  const db_client = await connect();
  // Very bad, but I just want to test the database with typescript from ssh.
  const query = process.argv[2];
  console.log("Got query", query);

  const result = await db_client.query(query);
  console.log(JSON.stringify(result.rows));

  await db_client.end();
}
