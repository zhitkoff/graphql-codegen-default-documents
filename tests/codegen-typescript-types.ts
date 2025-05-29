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
  documents: ['./schema/test-custom-queries.graphql', './generated/default-documents.graphql'],
  watch: false,
  generates: {
    'generated/types.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-document-nodes'],
      config: {
        useImplementingTypes: true,
        namingConvention: {
          enumValues: 'keep',
          typeNames: 'change-case-all#pascalCase',
        },
        declarationKind: {
          type: 'type',
          input: 'interface',
        },
        operationResultSuffix: 'Result',
        printFieldsOnNewLines: true,
      },
    },
  },
};

export default config;
