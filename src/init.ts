import beers from "./initialBeers.json";
import { getDBClient } from "./connect";

async function main() {
  const db_client = await getDBClient();
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
    
    ${beers
      .map((beer) => {
        return `INSERT INTO beers VALUES (${beer.id}, '${beer.name}', ${beer.bartender_preparation_time}, ${beer.volume}, ${beer.pour_time});`;
      })
      .join("\n")}

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
        total SMALLINT NOT NULL,
        UNIQUE (order_id, beer_id)
    );
`;

  console.log(`Executing query\n${query}`);
  await db_client.query(query);

  await db_client.end();
}

main()
  .catch((e) => console.error(`Error while initializing ${e}`, e))
  .finally(() => console.log("Done intializing"));
