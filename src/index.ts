import {
  PluginFunction,
  PluginValidateFn,
  Types,
  getCachedDocumentNodeFromSchema,
  oldVisit,
} from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema, concatAST } from 'graphql';
import { DefaultDocsPluginConfig, DEFAULT_DOCS_TO_GENERATE } from './config';
import { DefaultDocsVisitor } from './visitor';
import { ProvidedDocsVisitor } from './provided-docs-visitor';

export const plugin: PluginFunction<DefaultDocsPluginConfig> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: DefaultDocsPluginConfig
) => {
  // There could be some documents that were provided and they might have some custom queries, mutations, subscriptions and fragments in them
  // Collect their combined AST
  const providedDocsAST = concatAST(
    documents.reduce((prev, v) => {
      return [...prev, v.document];
    }, [])
  );
  // Visit the provided documents AST and collect the operation names to be excluded from the generated documents
  // So we do not cause a conflict with the provided documents
  const providedDocsVisitor = new ProvidedDocsVisitor(schema, [], config, documents);
  oldVisit(providedDocsAST, { leave: providedDocsVisitor });
  const providedDocsNames = providedDocsVisitor.getNames();
  // Get AST of the full schema
  const astNode = getCachedDocumentNodeFromSchema(schema);
  // Generate
  const visitor = new DefaultDocsVisitor(schema, config, {
    providedDocsNames,
  });
  const visitorResult = oldVisit(astNode, { leave: visitor });
  return {
    prepend: ['## ', '## This file was generated by graphql-codegen.', '## DO NOT EDIT IT MANUALLY.', '## \n'],
    content: visitorResult.definitions.join('\n'),
  };
};

export const validate: PluginValidateFn<DefaultDocsPluginConfig> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: DefaultDocsPluginConfig,
  _outputFile: string,
  _allPlugins: Types.ConfiguredPlugin[]
) => {
  if (!config.docsToGenerate.every((doc) => DEFAULT_DOCS_TO_GENERATE.includes(doc))) {
    throw new Error(`Invalid value for docsToGenerate value, please use the following values: ${DEFAULT_DOCS_TO_GENERATE.join(', ')}`);
  }
};
