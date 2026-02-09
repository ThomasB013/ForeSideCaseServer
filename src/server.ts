import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";

const PROTO_PATH = path.join(__dirname, "../config/hello.proto");
const PORT = "0.0.0.0:50051";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const helloProto = grpc.loadPackageDefinition(packageDefinition).hello as any;

function sayHello(
  call: grpc.ServerUnaryCall<{ name: string }, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>,
) {
  const name = call.request.name || "world";
  callback(null, { message: `Hello, ${name}! 👋` });
}

const server = new grpc.Server();

server.addService(helloProto.HelloService.service, { SayHello: sayHello });
server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🚀 gRPC server running on ${PORT}`);
});
