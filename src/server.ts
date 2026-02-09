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
    SELECT * FROM BEERS ORDER BY id
  `);

  callback(null, {
    beers: result.rows,
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

  const params = [newOrderResult.rows[0].id];

  const query = call.request.beer_orders
    .map((_, i) => {
      `INSERT INTO order_lines (order_id, beer_id, prepared, total) VALUES ($1, ${2 + 2 * i}, 0, $${3 + 2 * i});`;
    })
    .join("\n");
  call.request.beer_orders.forEach((b) => {
    params.push(b.beer_id);
    params.push(b.amount);
  });

  call.request.beer_orders.map((beer_order, i) => {
    [beer_order.amount, beer_order];
  });

  const response1 = await db_client.query(query, params);

  console.log(response1);

  callback(null);
}

function getOrderProgress(
  call: grpc.ServerUnaryCall<OrderProgressRequest, OrderProgressResponse>,
  callback: grpc.sendUnaryData<OrderProgressResponse>,
) {
  //callback(null, { message: `Hello, progress` });
}

async function orderProgress(
  call: grpc.ServerUnaryCall<BeerCompletedRequest, BeerOrderProgress>,
  callback: grpc.sendUnaryData<BeerOrderProgress>,
) {}

function health(
  _: grpc.ServerUnaryCall<void, HealthCheckResponse>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `All is well!` });
}

const server = new grpc.Server();

server.addService(beerProto.BeerService.service, {
  GetMenu: getMenu,
  MakeOrder: makeOrder,
  GetOrderProgress: getOrderProgress,
  OrderProgress: orderProgress,
  Health: health,
});

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🚀 gRPC server running on ${PORT}`);
});
