import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";

const PROTO_PATH = path.join(__dirname, "../proto/beer.proto");
const PORT = "0.0.0.0:50051";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const beerProto = grpc.loadPackageDefinition(packageDefinition).beer as any;
// const name = call.request.name || "world";

function getMenu(
  call: grpc.ServerUnaryCall<{ name: string }, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  callback(null, { message: `Hello menu` });
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
