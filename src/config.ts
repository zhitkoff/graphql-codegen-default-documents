import { RawConfig } from '@graphql-codegen/visitor-plugin-common';

export const DEFAULT_RECUR_LEVEL = 5;
export const DEFAULT_DOCS_TO_GENERATE = ['fragment', 'query', 'mutation', 'subscription'];
// export const DOCS_GENERATION_ORDER = [ "fragments", "queries", "mutations", "subscriptions" ];
export const TAB = "  ";

export interface DocsGenPluginConfig extends RawConfig {
    /**
     * @name recursionLimit
     * @type number
     * @description Will limit the number of nested objects when an object has one or more fields,
     *  that has the same type as the object like `type Person { parent: Person }`
     * @default 5
     *
     * @example
     * ```yml
     * generates:
     * path/to/file.graphql:
     *  plugins:
     *    - graphql-codegen-documents
     *  config:
     *    recursionLimit: 7
     * ```
    */
    recursionLimit?: number;
    /**
     * @name docsToGenerate
     * @type [ string ]
     * @description Which documents to generate
     * @default [ "fragments", "queries", "mutations", "subscriptions" ]
     *
     * @example
     * ```yml
     * generates:
     * path/to/file.graphql:
     *  plugins:
     *    - graphql-codegen-documents
     *  config:
     *    docsToGenerate: [ "fragments" ]
     * ```
    */
    docsToGenerate?: [ string ];
  }