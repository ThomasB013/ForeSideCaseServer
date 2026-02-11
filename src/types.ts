/*
  For now manual, as it is just small.
  Improvement => generate it from beer.proto.

  Based on that missing values get their default assigned:
  e.g. list => []
  number => 0

  In case of error we do not have data to pass in, that's why we make the types optional.

  https://github.com/grpc/grpc-web/issues/715
  https://github.com/protocolbuffers/protobuf-javascript/blob/main/docs/index.md#singular-message-fields
*/

export type BeerInfo = {
  id?: number;
  name?: string;
  bartender_preperation_time?: number;
  volume?: number;
  pour_time?: number;
};

export type BeerInfoRequest = {
  beer_id?: number;
};

export type MenuResponse = {
  beers: BeerInfo[];
};

type BeerOrderRequest = {
  beer_id: number;
  amount: number;
};

export type NewOrderRequest = {
  customer_name: string;
  message: string;
  beer_orders: BeerOrderRequest[];
};

type BeerOrderResponse = {
  beer_id?: number;
  beer_name?: string;
  amount?: number;
};

export type NewOrderResponse = {
  order_id?: number;
  customer_name?: string;
  message?: string;
  beers_ordered?: BeerOrderResponse[];
};

export type OrderProgressRequest = {
  order_id: number;
};

export type BeerOrderProgress = {
  order_id?: number;
  beer_id?: number;
  beer_name?: string;
  amount_ordered?: number;
  amount_prepared?: number;
};

export type OrderProgressResponse = {
  order_id?: number;
  customer_name?: string;
  message?: string;
  beers_ordered?: BeerOrderProgress[];
};

export type BeerCompletedRequest = {
  order_id: number;
  beer_id: number;
};

export type HealthCheckResponse = {
  message?: string;
};
