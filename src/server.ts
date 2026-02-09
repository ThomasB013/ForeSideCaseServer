import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";
import { getDBClient } from "./connect";
import { MenuResponse } from "./types";

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

function makeOrder(
  call: grpc.ServerUnaryCall<{ name: string }, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `Hello, order` });
}

function getOrderProgress(
  call: grpc.ServerUnaryCall<{ name: string }, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `Hello, progress` });
}

function health(
  _: grpc.ServerUnaryCall<{ name: string }, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `All is well!` });
}

const server = new grpc.Server();

server.addService(beerProto.BeerService.service, {
  GetMenu: getMenu,
  MakeOrder: makeOrder,
  GetOrderProgress: getOrderProgress,
  Health: health,
});

server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🚀 gRPC server running on ${PORT}`);
});
