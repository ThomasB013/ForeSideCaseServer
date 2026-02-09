/*
    For now manual, as it is just small.
    Improvement: generate it from beer.proto.
*/

type BeerInfo = {
  id: number;
  name: string;
  bartender_preperation_time: number;
  volume: number;
  pour_time: number;
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
  message?: string;
  beer_orders: BeerOrderRequest[];
};

type BeerOrderResponse = {
  beer_id: number;
  beer_name: string;
  amount: number;
};

export type NewOrderResponse = {
  order_id: number;
  customer_name: string;
  message: string;
  beers_ordered: BeerOrderResponse[];
};

export type OrderProgressRequest = {
  order_id: number;
};

type OrderBeerProgress = {
  beer_id: number;
  beer_name: string;
  amount_ordered: number;
  amount_prepared: number;
};

export type OrderProgressResponse = {
  order_id: number;
  customer_name: string;
  message: string;
  beers_ordered: OrderBeerProgress[];
};

export type HealthCheck = {
  message: string;
};
