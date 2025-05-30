import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Coupon = {
  __typename?: 'Coupon';
  amount: Scalars['Float']['output'];
  code: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type Discount = {
  __typename?: 'Discount';
  code: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  percent: Scalars['Float']['output'];
  qualifications?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type Fruit = Produce & {
  __typename?: 'Fruit';
  id: Scalars['ID']['output'];
  isSeedless?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  nutrients?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
  ripenessIndicators?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createOrder: Order;
  deleteOrder: Order;
  updateOrder: Order;
};


export type MutationCreateOrderArgs = {
  items: Array<OrderItemInput>;
  vendorId: Scalars['ID']['input'];
};


export type MutationDeleteOrderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateOrderArgs = {
  id: Scalars['ID']['input'];
  items: Array<OrderItemInput>;
};

export type Offer = Coupon | Discount;

export type Order = {
  __typename?: 'Order';
  id: Scalars['ID']['output'];
  items: Array<OrderItem>;
  orderOffer?: Maybe<Offer>;
  vendor: Stall;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  id: Scalars['ID']['output'];
  price: Scalars['Int']['output'];
  produce: Fruit | Vegetable;
  quantity: Scalars['Int']['output'];
};

export interface OrderItemInput {
  price: Scalars['Int']['input'];
  produce: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
}

export type Produce = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  nutrients?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  coupons?: Maybe<Array<Coupon>>;
  discounts?: Maybe<Array<Discount>>;
  fruits?: Maybe<Array<Fruit>>;
  orders?: Maybe<Array<Order>>;
  produce?: Maybe<Array<Fruit | Vegetable>>;
  stalls?: Maybe<Array<Stall>>;
  vegetables?: Maybe<Array<Vegetable>>;
};

export type Stall = {
  __typename?: 'Stall';
  availableProduce: Array<Fruit | Vegetable>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  stallNumber: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  order: Order;
};

export type Vegetable = Produce & {
  __typename?: 'Vegetable';
  id: Scalars['ID']['output'];
  isPickled?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  nutrients?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
  vegetableFamily?: Maybe<Scalars['String']['output']>;
};

export type CouponAllFieldsFragment = {
  __typename: 'Coupon',
  amount: number,
  code: string,
  description?: string | null,
  id: string
};

export type DiscountAllFieldsFragment = {
  __typename: 'Discount',
  code: string,
  description?: string | null,
  id: string,
  percent: number,
  qualifications?: Array<string | null> | null
};

export type FruitAllFieldsFragment = {
  __typename: 'Fruit',
  id: string,
  isSeedless?: boolean | null,
  name: string,
  nutrients?: Array<string | null> | null,
  price: number,
  quantity: number,
  ripenessIndicators?: Array<string | null> | null
};

export type CreateOrderMutationVariables = Exact<{
  items: Array<OrderItemInput> | OrderItemInput;
  vendorId: Scalars['ID']['input'];
}>;


export type CreateOrderMutationResult = {
  __typename?: 'Mutation',
  createOrder: {
    __typename: 'Order',
    id: string,
    items: Array<{
      __typename: 'OrderItem',
      id: string,
      price: number,
      quantity: number,
      produce: {
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }
    }>,
    orderOffer?: {
      __typename: 'Coupon',
      amount: number,
      code: string,
      description?: string | null,
      id: string
    } | {
      __typename: 'Discount',
      code: string,
      description?: string | null,
      id: string,
      percent: number,
      qualifications?: Array<string | null> | null
    } | null,
    vendor: {
      __typename: 'Stall',
      id: string,
      name: string,
      stallNumber: string,
      availableProduce: Array<{
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }>
    }
  }
};

export type DeleteOrderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOrderMutationResult = {
  __typename?: 'Mutation',
  deleteOrder: {
    __typename: 'Order',
    id: string,
    items: Array<{
      __typename: 'OrderItem',
      id: string,
      price: number,
      quantity: number,
      produce: {
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }
    }>,
    orderOffer?: {
      __typename: 'Coupon',
      amount: number,
      code: string,
      description?: string | null,
      id: string
    } | {
      __typename: 'Discount',
      code: string,
      description?: string | null,
      id: string,
      percent: number,
      qualifications?: Array<string | null> | null
    } | null,
    vendor: {
      __typename: 'Stall',
      id: string,
      name: string,
      stallNumber: string,
      availableProduce: Array<{
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }>
    }
  }
};

export type UpdateOrderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  items: Array<OrderItemInput> | OrderItemInput;
}>;


export type UpdateOrderMutationResult = {
  __typename?: 'Mutation',
  updateOrder: {
    __typename: 'Order',
    id: string,
    items: Array<{
      __typename: 'OrderItem',
      id: string,
      price: number,
      quantity: number,
      produce: {
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }
    }>,
    orderOffer?: {
      __typename: 'Coupon',
      amount: number,
      code: string,
      description?: string | null,
      id: string
    } | {
      __typename: 'Discount',
      code: string,
      description?: string | null,
      id: string,
      percent: number,
      qualifications?: Array<string | null> | null
    } | null,
    vendor: {
      __typename: 'Stall',
      id: string,
      name: string,
      stallNumber: string,
      availableProduce: Array<{
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }>
    }
  }
};

export type OrderAllFieldsFragment = {
  __typename: 'Order',
  id: string,
  items: Array<{
    __typename: 'OrderItem',
    id: string,
    price: number,
    quantity: number,
    produce: {
      __typename: 'Fruit',
      isSeedless?: boolean | null,
      ripenessIndicators?: Array<string | null> | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    } | {
      __typename: 'Vegetable',
      isPickled?: boolean | null,
      vegetableFamily?: string | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    }
  }>,
  orderOffer?: {
    __typename: 'Coupon',
    amount: number,
    code: string,
    description?: string | null,
    id: string
  } | {
    __typename: 'Discount',
    code: string,
    description?: string | null,
    id: string,
    percent: number,
    qualifications?: Array<string | null> | null
  } | null,
  vendor: {
    __typename: 'Stall',
    id: string,
    name: string,
    stallNumber: string,
    availableProduce: Array<{
      __typename: 'Fruit',
      isSeedless?: boolean | null,
      ripenessIndicators?: Array<string | null> | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    } | {
      __typename: 'Vegetable',
      isPickled?: boolean | null,
      vegetableFamily?: string | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    }>
  }
};

export type OrderItemAllFieldsFragment = {
  __typename: 'OrderItem',
  id: string,
  price: number,
  quantity: number,
  produce: {
    __typename: 'Fruit',
    isSeedless?: boolean | null,
    ripenessIndicators?: Array<string | null> | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  } | {
    __typename: 'Vegetable',
    isPickled?: boolean | null,
    vegetableFamily?: string | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  }
};

export type CouponsQueryVariables = Exact<{ [key: string]: never; }>;


export type CouponsQueryResult = {
  __typename?: 'Query',
  coupons?: Array<{
    __typename: 'Coupon',
    amount: number,
    code: string,
    description?: string | null,
    id: string
  }> | null
};

export type DiscountsQueryVariables = Exact<{ [key: string]: never; }>;


export type DiscountsQueryResult = {
  __typename?: 'Query',
  discounts?: Array<{
    __typename: 'Discount',
    code: string,
    description?: string | null,
    id: string,
    percent: number,
    qualifications?: Array<string | null> | null
  }> | null
};

export type FruitsQueryVariables = Exact<{ [key: string]: never; }>;


export type FruitsQueryResult = {
  __typename?: 'Query',
  fruits?: Array<{
    __typename: 'Fruit',
    id: string,
    isSeedless?: boolean | null,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number,
    ripenessIndicators?: Array<string | null> | null
  }> | null
};

export type OrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type OrdersQueryResult = {
  __typename?: 'Query',
  orders?: Array<{
    __typename: 'Order',
    id: string,
    items: Array<{
      __typename: 'OrderItem',
      id: string,
      price: number,
      quantity: number,
      produce: {
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }
    }>,
    orderOffer?: {
      __typename: 'Coupon',
      amount: number,
      code: string,
      description?: string | null,
      id: string
    } | {
      __typename: 'Discount',
      code: string,
      description?: string | null,
      id: string,
      percent: number,
      qualifications?: Array<string | null> | null
    } | null,
    vendor: {
      __typename: 'Stall',
      id: string,
      name: string,
      stallNumber: string,
      availableProduce: Array<{
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }>
    }
  }> | null
};

export type ProduceQueryVariables = Exact<{ [key: string]: never; }>;


export type ProduceQueryResult = {
  __typename?: 'Query',
  produce?: Array<{
    __typename: 'Fruit',
    isSeedless?: boolean | null,
    ripenessIndicators?: Array<string | null> | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  } | {
    __typename: 'Vegetable',
    isPickled?: boolean | null,
    vegetableFamily?: string | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  }> | null
};

export type StallsQueryVariables = Exact<{ [key: string]: never; }>;


export type StallsQueryResult = {
  __typename?: 'Query',
  stalls?: Array<{
    __typename: 'Stall',
    id: string,
    name: string,
    stallNumber: string,
    availableProduce: Array<{
      __typename: 'Fruit',
      isSeedless?: boolean | null,
      ripenessIndicators?: Array<string | null> | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    } | {
      __typename: 'Vegetable',
      isPickled?: boolean | null,
      vegetableFamily?: string | null,
      id: string,
      name: string,
      nutrients?: Array<string | null> | null,
      price: number,
      quantity: number
    }>
  }> | null
};

export type StallAllFieldsFragment = {
  __typename: 'Stall',
  id: string,
  name: string,
  stallNumber: string,
  availableProduce: Array<{
    __typename: 'Fruit',
    isSeedless?: boolean | null,
    ripenessIndicators?: Array<string | null> | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  } | {
    __typename: 'Vegetable',
    isPickled?: boolean | null,
    vegetableFamily?: string | null,
    id: string,
    name: string,
    nutrients?: Array<string | null> | null,
    price: number,
    quantity: number
  }>
};

export type OrderSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OrderSubscriptionResult = {
  __typename?: 'Subscription',
  order: {
    __typename: 'Order',
    id: string,
    items: Array<{
      __typename: 'OrderItem',
      id: string,
      price: number,
      quantity: number,
      produce: {
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }
    }>,
    orderOffer?: {
      __typename: 'Coupon',
      amount: number,
      code: string,
      description?: string | null,
      id: string
    } | {
      __typename: 'Discount',
      code: string,
      description?: string | null,
      id: string,
      percent: number,
      qualifications?: Array<string | null> | null
    } | null,
    vendor: {
      __typename: 'Stall',
      id: string,
      name: string,
      stallNumber: string,
      availableProduce: Array<{
        __typename: 'Fruit',
        isSeedless?: boolean | null,
        ripenessIndicators?: Array<string | null> | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      } | {
        __typename: 'Vegetable',
        isPickled?: boolean | null,
        vegetableFamily?: string | null,
        id: string,
        name: string,
        nutrients?: Array<string | null> | null,
        price: number,
        quantity: number
      }>
    }
  }
};

export type VegetableAllFieldsFragment = {
  __typename: 'Vegetable',
  id: string,
  isPickled?: boolean | null,
  name: string,
  nutrients?: Array<string | null> | null,
  price: number,
  quantity: number,
  vegetableFamily?: string | null
};

export type VegetablesQueryVariables = Exact<{ [key: string]: never; }>;


export type VegetablesQueryResult = {
  __typename?: 'Query',
  vegetables?: Array<{
    __typename?: 'Vegetable',
    id: string,
    name: string,
    quantity: number,
    price: number
  }> | null
};

export const CouponAllFields = gql`
    fragment CouponAllFields on Coupon {
  amount
  code
  description
  id
  __typename
}
    `;
export const DiscountAllFields = gql`
    fragment DiscountAllFields on Discount {
  code
  description
  id
  percent
  qualifications
  __typename
}
    `;
export const FruitAllFields = gql`
    fragment FruitAllFields on Fruit {
  id
  isSeedless
  name
  nutrients
  price
  quantity
  ripenessIndicators
  __typename
}
    `;
export const OrderItemAllFields = gql`
    fragment OrderItemAllFields on OrderItem {
  id
  price
  produce {
    id
    name
    nutrients
    price
    quantity
    __typename
    ... on Fruit {
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      isPickled
      vegetableFamily
    }
  }
  quantity
  __typename
}
    `;
export const StallAllFields = gql`
    fragment StallAllFields on Stall {
  availableProduce {
    id
    name
    nutrients
    price
    quantity
    __typename
    ... on Fruit {
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      isPickled
      vegetableFamily
    }
  }
  id
  name
  stallNumber
  __typename
}
    `;
export const OrderAllFields = gql`
    fragment OrderAllFields on Order {
  id
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Coupon {
      amount
      code
      description
      id
    }
    ... on Discount {
      code
      description
      id
      percent
      qualifications
    }
    __typename
  }
  vendor {
    ...StallAllFields
  }
  __typename
}
    ${OrderItemAllFields}
${StallAllFields}`;
export const VegetableAllFields = gql`
    fragment VegetableAllFields on Vegetable {
  id
  isPickled
  name
  nutrients
  price
  quantity
  vegetableFamily
  __typename
}
    `;
export const CreateOrder = gql`
    mutation CreateOrder($items: [OrderItemInput!]!, $vendorId: ID!) {
  createOrder(items: $items, vendorId: $vendorId) {
    ...OrderAllFields
  }
}
    ${OrderAllFields}`;
export const DeleteOrder = gql`
    mutation DeleteOrder($id: ID!) {
  deleteOrder(id: $id) {
    ...OrderAllFields
  }
}
    ${OrderAllFields}`;
export const UpdateOrder = gql`
    mutation UpdateOrder($id: ID!, $items: [OrderItemInput!]!) {
  updateOrder(id: $id, items: $items) {
    ...OrderAllFields
  }
}
    ${OrderAllFields}`;
export const Coupons = gql`
    query Coupons {
  coupons {
    ...CouponAllFields
  }
}
    ${CouponAllFields}`;
export const Discounts = gql`
    query Discounts {
  discounts {
    ...DiscountAllFields
  }
}
    ${DiscountAllFields}`;
export const Fruits = gql`
    query Fruits {
  fruits {
    ...FruitAllFields
  }
}
    ${FruitAllFields}`;
export const Orders = gql`
    query Orders {
  orders {
    ...OrderAllFields
  }
}
    ${OrderAllFields}`;
export const Produce = gql`
    query Produce {
  produce {
    id
    name
    nutrients
    price
    quantity
    __typename
    ... on Fruit {
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      isPickled
      vegetableFamily
    }
  }
}
    `;
export const Stalls = gql`
    query Stalls {
  stalls {
    ...StallAllFields
  }
}
    ${StallAllFields}`;
export const Order = gql`
    subscription Order {
  order {
    ...OrderAllFields
  }
}
    ${OrderAllFields}`;
export const Vegetables = gql`
    query Vegetables {
  vegetables {
    id
    name
    quantity
    price
  }
}
    `;