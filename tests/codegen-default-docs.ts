import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: ['./schema/test-schema.graphql'],
  documents: ['./schema/test-custom-queries.graphql'],
  watch: false,
  generates: {
    'generated/default-documents.graphql': {
      plugins: ['../dist/commonjs/index.js'],
      config: {
        docsToGenerate: ['query', 'mutation', 'subscription', 'fragment'],
        fragmentMinimumFields: 3,
        skipTypename: false,
      },
    },
  },
};

export default config;
