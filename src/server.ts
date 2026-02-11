import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";
import { getDBClient } from "./connect";
import {
  BeerCompletedRequest,
  BeerOrderProgress,
  HealthCheckResponse,
  MenuResponse,
  NewOrderRequest,
  OrderProgressRequest,
  OrderProgressResponse,
  NewOrderResponse,
  BeerInfoRequest,
  BeerInfo,
} from "./types";

const PROTO_PATH = path.join(__dirname, "../proto/beer.proto");
const PORT = "0.0.0.0:50051";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const beerProto = grpc.loadPackageDefinition(packageDefinition).proto as any;

async function getMenu(
  _: grpc.ServerUnaryCall<void, MenuResponse>,
  callback: grpc.sendUnaryData<MenuResponse>,
) {
  const db_client = await getDBClient();

  const result = await db_client.query(`
    SELECT * FROM beers ORDER BY id
  `);

  callback(null, {
    beers: result.rows,
  });
}

async function getBeer(
  call: grpc.ServerUnaryCall<BeerInfoRequest, BeerInfo>,
  callback: grpc.sendUnaryData<BeerInfo>,
) {
  try {
    const db_client = await getDBClient();
    const result = await db_client.query(`SELECT * FROM beers WHERE id=$1`, [
      call.request.beer_id,
    ]);
    if (result.rows.length == 1) {
      return callback(null, result.rows[0]);
    }
  } catch (e) {
    console.error(e);
  }
  callback(null, {
    id: call.request.beer_id,
    name: "",
    bartender_preperation_time: 0,
    volume: 0,
    pour_time: 0,
  });
}

async function makeOrder(
  call: grpc.ServerUnaryCall<NewOrderRequest, NewOrderResponse>,
  callback: grpc.sendUnaryData<NewOrderResponse>,
) {
  const db_client = await getDBClient();

  const newOrderResult = await db_client.query(
    "INSERT INTO orders (customer_name, message) VALUES ($1, $2) RETURNING id;",
    [call.request.customer_name || "Anonymous", call.request.message || ""],
  );

  const placeholders: string[] = [];
  const params = [newOrderResult.rows[0].id];
  call.request.beer_orders.forEach((b, i) => {
    placeholders.push(`($1, $${2 * i + 2}, 0, $${2 * i + 3})`);
    params.push(b.beer_id, b.amount);
  });

  await db_client.query(
    `INSERT INTO order_lines (order_id, beer_id, prepared, total) VALUES ${placeholders.join(", ")};`,
    params,
  );

  const result = await db_client.query(
    "SELECT orders.id, customer_name, message, name as beer_name, beer_id, total as amount FROM orders, order_lines, beers WHERE orders.id = $1 AND order_id = orders.id AND beers.id = beer_id",
    [newOrderResult.rows[0].id],
  );

  if (result.rows.length == 0) {
    callback(null);
    return;
  }

  callback(null, {
    order_id: result.rows[0].id,
    customer_name: result.rows[0].customer_name,
    message: result.rows[0].message,
    beers_ordered: result.rows.map(({ amount, beer_id, beer_name }) => {
      return {
        amount,
        beer_id,
        beer_name,
      };
    }),
  });
}

async function getOrderProgress(
  call: grpc.ServerUnaryCall<OrderProgressRequest, OrderProgressResponse>,
  callback: grpc.sendUnaryData<OrderProgressResponse>,
) {
  const db_client = await getDBClient();

  const result = await db_client.query(
    "SELECT orders.id, customer_name, message, name as beer_name, beer_id, total as amount_ordered, prepared as amount_prepared FROM orders, order_lines, beers WHERE orders.id = $1 AND order_id = orders.id AND beers.id = beer_id",
    [call.request.order_id],
  );

  if (result.rows.length == 0) {
    callback(null);
    return;
  }

  callback(null, {
    order_id: result.rows[0].id,
    customer_name: result.rows[0].customer_name,
    message: result.rows[0].message,
    beers_ordered: result.rows.map(
      ({ beer_id, beer_name, amount_ordered, amount_prepared }) => {
        return {
          beer_id,
          beer_name,
          amount_ordered,
          amount_prepared,
        };
      },
    ),
  });
}

async function orderProgress(
  call: grpc.ServerUnaryCall<BeerCompletedRequest, BeerOrderProgress>,
  callback: grpc.sendUnaryData<BeerOrderProgress>,
) {
  const db_client = await getDBClient();
  const { order_id, beer_id } = call.request;

  await db_client.query(
    "UPDATE order_lines SET prepared = prepared + 1 WHERE order_id=$1 AND beer_id=$2",
    [order_id, beer_id],
  );

  const result = await db_client.query(
    "SELECT total AS amount_ordered, prepared AS amount_prepared, beer_id, name as beer_name FROM beers, order_lines WHERE beers.id = beer_id AND order_id=$1 AND beer_id=$2",
    [order_id, beer_id],
  );

  callback(null, result.rows[0]);
}

function health(
  _: grpc.ServerUnaryCall<void, HealthCheckResponse>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `All is well!` });
}

const server = new grpc.Server();

server.addService(beerProto.BeerService.service, {
  GetMenu: getMenu,
  GetBeer: getBeer,
  MakeOrder: makeOrder,
  GetOrderProgress: getOrderProgress,
  OrderProgress: orderProgress,
  Health: health,
});

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🚀 gRPC server running on ${PORT}`);
});
