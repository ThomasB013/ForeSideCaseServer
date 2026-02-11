import { getDBClient } from "./connect";

async function main() {
  const db_client = await getDBClient();

  // This is just to test the database with typescript from ssh.
  const query = process.argv[2];
  console.log("Got query", query);

  const result = await db_client.query(query);
  console.log(JSON.stringify(result.rows));

  await db_client.end();
}

main()
  .then(() => console.log("Done executing"))
  .catch((e) => {
    console.log(e);
  });
