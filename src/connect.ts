import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

const secretsClient = new SecretsManagerClient({});
let client: Client | null = null;

export async function getDBClient() {
  if (client != null) {
    return client;
  }

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

  const secretArn = process.env.DB_SECRET_ARN!; // Match with env names in aws cdk deployment.
  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );

  if (!secret.SecretString) {
    console.error("Cannot find secret string");
    process.exit(1);
  }

  const creds = JSON.parse(secret.SecretString!);

  client = new Client({
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
