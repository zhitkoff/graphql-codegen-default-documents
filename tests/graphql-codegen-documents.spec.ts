import { mergeOutputs, Types } from '@graphql-codegen/plugin-helpers';
import { validateTs } from '@graphql-codegen/testing';
import { buildSchema, GraphQLSchema, parse } from 'graphql';
import { plugin } from '../src/index';
import { DefaultDocsPluginConfig } from '../src/config';

describe('Process Schema', () => {
  const dummyUserTestSchema = buildSchema(/* GraphQL */ `
    interface Produce {
      id: ID!
      name: String!
      quantity: Int!
      price: Int!
      nutrients: [String]
    }

    type Fruit implements Produce {
      id: ID!
      "one line description"
      oldFieldWithDescription: String  @deprecated
      name: String!
      quantity: Int!
      "Price per unit"
      price: Int!
      nutrients: [String]
      isSeedless: Boolean
      ripenessIndicators: [String]
    }

    type Vegetable implements Produce {
      id: ID!
      """
      multiline
      description
      """
      oldName: String @deprecated(reason: "Field is no longer supported")
      name: String!
      quantity: Int!
      price: Int!
      nutrients: [String]
      vegetableFamily: String
      isPickled: Boolean
    }

    union Offer = Discount | Coupon

    type Discount {
      id: ID!
      oldFieldWithoutDescription: String  @deprecated
      code: String!
      percent: Float!
      description: String
      qualifications: [String]
    }

    type Coupon {
      id: ID!
      code: String!
      description: String
      amount: Float!
    }

    type Order {
      id: ID!
      vendor: Stall!
      items: [OrderItem!]!
      orderOffer: Offer
    }

    type Stall {
      id: ID!
      name: String!
      stallNumber: String!
      availableProduce: [Produce!]!
    }

    type OrderItem {
      id: ID!
      quantity: Int!
      price: Int!
      produce: Produce!
    }

    input OrderItemInput {
      quantity: Int!
      price: Int!
      produce: ID!
    }

    type Query {
      stalls: [Stall!]
      orders: [Order!]
      produce: [Produce!]
      fruits: [Fruit!]
      vegetables: [Vegetable!]
      discounts: [Discount!]
      coupons: [Coupon!]
    }

    type Mutation {
      createOrder(vendorId: ID!, items: [OrderItemInput!]!): Order!
      updateOrder(id: ID!, items: [OrderItemInput!]!): Order!
      deleteOrder(id: ID!): Order!
    }

    type Subscription {
      order: Order!
    }
  `);

  const customUserDoc = parse(/* GraphQL */ `
    # Must be excluded from generated default documents
    # if names collide
    query Vegetables {
      vegetables {
        id
        name
        quantity
        price
      }
    }
  `);

  it('should generate AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: customUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
  __typename
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
    __typename
  }
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}
"
`);
  });

  it('should generate AllFields fragments only for types with at least 6 fields', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment'],
      fragmentMinimumFields: 6,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: customUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}
"
`);
  });

  it('should generate queries without AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['query'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"query Stalls {
  stalls {
    id
    name
    stallNumber
    availableProduce {
        id
        name
        quantity
        price
        nutrients
        __typename
      ... on Fruit {
            oldFieldWithDescription
            isSeedless
            ripenessIndicators
      }
      ... on Vegetable {
            oldName
            vegetableFamily
            isPickled
      }
    }
  }
}

query Orders {
  orders {
    id
    vendor {
      id
      name
      stallNumber
      availableProduce {
          id
          name
          quantity
          price
          nutrients
          __typename
        ... on Fruit {
              oldFieldWithDescription
              isSeedless
              ripenessIndicators
        }
        ... on Vegetable {
              oldName
              vegetableFamily
              isPickled
        }
      }
    }
    items {
      id
      quantity
      price
      produce {
          id
          name
          quantity
          price
          nutrients
          __typename
        ... on Fruit {
              oldFieldWithDescription
              isSeedless
              ripenessIndicators
        }
        ... on Vegetable {
              oldName
              vegetableFamily
              isPickled
        }
      }
    }
    orderOffer {
      ... on Discount {
          id
          oldFieldWithoutDescription
          code
          percent
          description
          qualifications
      }
      ... on Coupon {
          id
          code
          description
          amount
      }
        __typename
    }
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    id
    oldFieldWithDescription
    name
    quantity
    price
    nutrients
    isSeedless
    ripenessIndicators
  }
}

query Vegetables {
  vegetables {
    id
    oldName
    name
    quantity
    price
    nutrients
    vegetableFamily
    isPickled
  }
}

query Discounts {
  discounts {
    id
    oldFieldWithoutDescription
    code
    percent
    description
    qualifications
  }
}

query Coupons {
  coupons {
    id
    code
    description
    amount
  }
}
"
`);
  });

  it('should generate queries with AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['query', 'fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
  __typename
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
    __typename
  }
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Orders {
  orders {
    ...OrderAllFields
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

query Vegetables {
  vegetables {
    ...VegetableAllFields
  }
}

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    ...CouponAllFields
  }
}
"
`);
  });

  it('should generate queries with AllFields fragments but only for types with at least 6 fields, expand all others`', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['query', 'fragment'],
      fragmentMinimumFields: 6,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

query Stalls {
  stalls {
    id
    name
    stallNumber
    availableProduce {
        id
        name
        quantity
        price
        nutrients
        __typename
      ... on Fruit {
            oldFieldWithDescription
            isSeedless
            ripenessIndicators
      }
      ... on Vegetable {
            oldName
            vegetableFamily
            isPickled
      }
    }
  }
}

query Orders {
  orders {
    id
    vendor {
      id
      name
      stallNumber
      availableProduce {
          id
          name
          quantity
          price
          nutrients
          __typename
        ... on Fruit {
              oldFieldWithDescription
              isSeedless
              ripenessIndicators
        }
        ... on Vegetable {
              oldName
              vegetableFamily
              isPickled
        }
      }
    }
    items {
      id
      quantity
      price
      produce {
          id
          name
          quantity
          price
          nutrients
          __typename
        ... on Fruit {
              oldFieldWithDescription
              isSeedless
              ripenessIndicators
        }
        ... on Vegetable {
              oldName
              vegetableFamily
              isPickled
        }
      }
    }
    orderOffer {
      ... on Discount {
          id
          oldFieldWithoutDescription
          code
          percent
          description
          qualifications
      }
      ... on Coupon {
          id
          code
          description
          amount
      }
        __typename
    }
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

query Vegetables {
  vegetables {
    ...VegetableAllFields
  }
}

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    id
    code
    description
    amount
  }
}
"
`);
  });

  it('should skip query defined in custom user doc', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['query', 'fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: customUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
  __typename
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
    __typename
  }
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Orders {
  orders {
    ...OrderAllFields
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

## Skipped query Vegetables since it is already defined in provided documents

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    ...CouponAllFields
  }
}
"
`);
  });
  it('should generate mutations with AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['mutation', 'fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: customUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
  __typename
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
    __typename
  }
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

mutation CreateOrder($vendorId: ID!, $items: [OrderItemInput!]!) {
  createOrder(vendorId: $vendorId, items: $items) {
    ...OrderAllFields
  }
}

mutation UpdateOrder($id: ID!, $items: [OrderItemInput!]!) {
  updateOrder(id: $id, items: $items) {
    ...OrderAllFields
  }
}

mutation DeleteOrder($id: ID!) {
  deleteOrder(id: $id) {
    ...OrderAllFields
  }
}
"
`);
  });
  it('should generate subscriptions with AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['subscription', 'fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: customUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
  __typename
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
  __typename
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
  __typename
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
  __typename
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
    __typename
  }
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    __typename
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
  __typename
}

subscription Order {
  order {
    ...OrderAllFields
  }
}
"
`);
  });
  it('should skip __typename', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment', 'query', 'mutation', 'subscription'],
      fragmentMinimumFields: 3,
      skipTypename: true,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  oldFieldWithDescription
  name
  quantity
  price
  nutrients
  isSeedless
  ripenessIndicators
}

fragment VegetableAllFields on Vegetable {
  id
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
  }
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Orders {
  orders {
    ...OrderAllFields
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

query Vegetables {
  vegetables {
    ...VegetableAllFields
  }
}

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    ...CouponAllFields
  }
}

mutation CreateOrder($vendorId: ID!, $items: [OrderItemInput!]!) {
  createOrder(vendorId: $vendorId, items: $items) {
    ...OrderAllFields
  }
}

mutation UpdateOrder($id: ID!, $items: [OrderItemInput!]!) {
  updateOrder(id: $id, items: $items) {
    ...OrderAllFields
  }
}

mutation DeleteOrder($id: ID!) {
  deleteOrder(id: $id) {
    ...OrderAllFields
  }
}

subscription Order {
  order {
    ...OrderAllFields
  }
}
"
`);
  });
  it('should add comments from descriptions, but do not include @deprecated directive', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment', 'query', 'mutation', 'subscription'],
      fragmentMinimumFields: 3,
      skipTypename: true,
      commentsFromDescriptions: true,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  # one line description
  oldFieldWithDescription
  name
  quantity
  # Price per unit
  price
  nutrients
  isSeedless
  ripenessIndicators
}

fragment VegetableAllFields on Vegetable {
  id
  # multiline
  # description
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
}

fragment DiscountAllFields on Discount {
  id
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
  }
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Orders {
  orders {
    ...OrderAllFields
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

query Vegetables {
  vegetables {
    ...VegetableAllFields
  }
}

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    ...CouponAllFields
  }
}

mutation CreateOrder($vendorId: ID!, $items: [OrderItemInput!]!) {
  createOrder(vendorId: $vendorId, items: $items) {
    ...OrderAllFields
  }
}

mutation UpdateOrder($id: ID!, $items: [OrderItemInput!]!) {
  updateOrder(id: $id, items: $items) {
    ...OrderAllFields
  }
}

mutation DeleteOrder($id: ID!) {
  deleteOrder(id: $id) {
    ...OrderAllFields
  }
}

subscription Order {
  order {
    ...OrderAllFields
  }
}
"
`);
  });

  it('should add comments from descriptions and include @deprecated directive', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment', 'query', 'mutation', 'subscription'],
      fragmentMinimumFields: 3,
      skipTypename: true,
      commentsFromDescriptions: true,
      deprecatedDirectiveInComments: true,
    };
    const { content } = await plugin(dummyUserTestSchema, [], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment FruitAllFields on Fruit {
  id
  # one line description
  # @deprecated 
  oldFieldWithDescription
  name
  quantity
  # Price per unit
  price
  nutrients
  isSeedless
  ripenessIndicators
}

fragment VegetableAllFields on Vegetable {
  id
  # multiline
  # description
  # @deprecated Field is no longer supported
  oldName
  name
  quantity
  price
  nutrients
  vegetableFamily
  isPickled
}

fragment DiscountAllFields on Discount {
  id
  # @deprecated 
  oldFieldWithoutDescription
  code
  percent
  description
  qualifications
}

fragment CouponAllFields on Coupon {
  id
  code
  description
  amount
}

fragment OrderAllFields on Order {
  id
  vendor {
    ...StallAllFields
  }
  items {
    ...OrderItemAllFields
  }
  orderOffer {
    ... on Discount {
      id
      oldFieldWithoutDescription
      code
      percent
      description
      qualifications
    }
    ... on Coupon {
      id
      code
      description
      amount
    }
  }
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

fragment OrderItemAllFields on OrderItem {
  id
  quantity
  price
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Orders {
  orders {
    ...OrderAllFields
  }
}

query Produce {
  produce {
    id
    name
    quantity
    price
    nutrients
    ... on Fruit {
      oldFieldWithDescription
      isSeedless
      ripenessIndicators
    }
    ... on Vegetable {
      oldName
      vegetableFamily
      isPickled
    }
  }
}

query Fruits {
  fruits {
    ...FruitAllFields
  }
}

query Vegetables {
  vegetables {
    ...VegetableAllFields
  }
}

query Discounts {
  discounts {
    ...DiscountAllFields
  }
}

query Coupons {
  coupons {
    ...CouponAllFields
  }
}

mutation CreateOrder($vendorId: ID!, $items: [OrderItemInput!]!) {
  createOrder(vendorId: $vendorId, items: $items) {
    ...OrderAllFields
  }
}

mutation UpdateOrder($id: ID!, $items: [OrderItemInput!]!) {
  updateOrder(id: $id, items: $items) {
    ...OrderAllFields
  }
}

mutation DeleteOrder($id: ID!) {
  deleteOrder(id: $id) {
    ...OrderAllFields
  }
}

subscription Order {
  order {
    ...OrderAllFields
  }
}
"
`);
  });
});
