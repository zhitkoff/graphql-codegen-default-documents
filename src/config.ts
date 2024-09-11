import { RawConfig } from '@graphql-codegen/visitor-plugin-common';

export const DEFAULT_DOCS_TO_GENERATE = ['fragment', 'query', 'mutation', 'subscription'];

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
  }