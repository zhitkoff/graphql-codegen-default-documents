/*
 Copyright (C) 2024 Kepler Technologies, LLC - All Rights Reserved
 You may use, distribute and modify this code under the
 terms of the Emray license agreement.
 You should have received a copy of the Emray license agreement with
 this file. If not, please visit https://emray.health
*/

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
