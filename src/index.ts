import { PluginFunction, Types, getCachedDocumentNodeFromSchema, oldVisit } from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema, parse, printSchema, concatAST } from 'graphql';
import { DocsGenPluginConfig } from './config';
import { DocumentsGeneratorVisitor } from './visitor';
import { ProvidedDocsVisitor } from './provided-docs-visitor';
// export * from './visitor';
// export { DocumentsGeneratorVisitor };



export const plugin: PluginFunction<DocsGenPluginConfig> = (schema: GraphQLSchema, documents: Types.DocumentFile[], config: DocsGenPluginConfig) => {
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
  const astNode = getCachedDocumentNodeFromSchema(schema)
  // Generate
  const visitor = new DocumentsGeneratorVisitor(schema, [], config, documents);
  oldVisit(astNode, { leave: visitor });
  return visitor.generateDocuments(providedDocsNames);
};
