import { mergeOutputs, Types } from '@graphql-codegen/plugin-helpers';
import { validateTs } from '@graphql-codegen/testing';
import { buildSchema, GraphQLSchema, parse } from 'graphql';
import { plugin } from '../src/index';
import { DefaultDocsPluginConfig } from '../src/config';

describe('graphql-codegen-documents', () => {
  it('should pass', async () => {
    expect(1);
  });
});

describe('generate AllFields fragments', () => {
  const validate = async (content: Types.PluginOutput, config: DefaultDocsPluginConfig = {}, pluginSchema: GraphQLSchema) => {
    const m = mergeOutputs([await plugin(pluginSchema, [], config, { outputFile: '' }), content]);
    validateTs(m, undefined, undefined, undefined, []);

    return m;
  };

  const dummyUserTestSchema = buildSchema(/* GraphQL */ `
    type Produce {
      id: ID!
      name: String!
      quantity: Int!
      price: Int!
      nutrients: [String]
    }
    type Stall {
      id: ID!
      name: String!
      stallNumber: String!
      availableProduce: [Produce!]!
    }
    type Query {
      stall(id: ID!): Stall
      stalls: [Stall!]
      produce: [Produce!]
    }
    input AddProduceInput {
      id: ID!, name: String!, quantity: Int!, price: Int!, nutrients: [String]
    }
    type Mutation {
      addProduce(input: AddProduceInput!): Produce
    }
    type Subscription {
      produceAdded: Produce
    }
  `);

  const dummyUserDoc = parse(/* GraphQL */ `
    fragment ProduceFragment on Produce {
      id
      name
      quantity
      price
      nutrients
    }
    fragment StallFragment on Stall {
      id
      name
      stallNumber
      availableProduce {
        ...ProduceFragment
      }
    }
  `);

  it('should generate AllFields fragments', async () => {
    const config: DefaultDocsPluginConfig = {
      docsToGenerate: ['fragment'],
      fragmentMinimumFields: 3,
      skipTypename: false,
    };
    const { content } = await plugin(dummyUserTestSchema, [{ document: dummyUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment ProduceAllFields on Produce {
  id
  name
  quantity
  price
  nutrients
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    ...ProduceAllFields
  }
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
    const { content } = await plugin(dummyUserTestSchema, [{ document: dummyUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"

query Stall($id: ID!) {
  stall(id: $id) {
    id
    name
    stallNumber
    availableProduce {
      id
      name
      quantity
      price
      nutrients
    }
  }
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
    const { content } = await plugin(dummyUserTestSchema, [{ document: dummyUserDoc }], config, { outputFile: '' });
    expect(content).toMatchInlineSnapshot(`
"fragment ProduceAllFields on Produce {
  id
  name
  quantity
  price
  nutrients
  __typename
}

fragment StallAllFields on Stall {
  id
  name
  stallNumber
  availableProduce {
    ...ProduceAllFields
  }
  __typename
}

query Stall($id: ID!) {
  stall(id: $id) {
    ...StallAllFields
  }
}

query Stalls {
  stalls {
    ...StallAllFields
  }
}

query Produce {
  produce {
    ...ProduceAllFields
  }
}
"
`);
  });
});
