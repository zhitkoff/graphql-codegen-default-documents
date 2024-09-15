import { RawConfig } from '@graphql-codegen/visitor-plugin-common';

export const DEFAULT_DOCS_TO_GENERATE = ['fragment', 'query', 'mutation', 'subscription'];
export const DEFAULT_FRAGMENT_MINIMUM_FIELDS = 2;

export interface DefaultDocsPluginConfig extends RawConfig {
    /**
     * @name docsToGenerate
     * @type [ string ]
     * @description Which documents to generate
     * @default [ "fragment", "query", "mutation", "subscription" ]
     *
     * @example
     * ```yml
     * generates:
     * path/to/file.graphql:
     *  plugins:
     *    - graphql-codegen-documents
     *  config:
     *    docsToGenerate: [ "fragment" ]
     * ```
    */
    docsToGenerate?: [ string ];
    /**
     * @name fragmentMininumFields
     * @type number
     * @description Minimum number of fields a fragment must have to be included in the generated documents
     * @default 2
     *
     * @example
     * ```yml
     * generates:
     * path/to/file.graphql:
     *  plugins:
     *    - graphql-codegen-documents
     *  config:
     *    fragmentMininumFields: 3
     * ```
    */
    fragmentMininumFields?: number;
  }