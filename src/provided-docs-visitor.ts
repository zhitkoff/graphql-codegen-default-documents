import { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import * as autoBind from 'auto-bind';
import { FragmentDefinitionNode, GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { DefaultDocsPluginConfig } from './config';

export class ProvidedDocsVisitor {
  queries: string[];
  mutations: string[];
  subscriptions: string[];
  fragments: string[];

  constructor(schema: GraphQLSchema, fragments: LoadedFragment[], rawConfig: DefaultDocsPluginConfig, documents: any[]) {
    this.queries = [];
    this.mutations = [];
    this.subscriptions = [];
    this.fragments = [];
    autoBind(this as any);
  }

  // TODO redo to drop getNames and use the visitor directly
  OperationDefinition(node: OperationDefinitionNode) {
    const operationName = node.name.value;
    switch (node.operation) {
      case 'query':
          this.queries.push(operationName);
          break;
      case 'mutation':
        this.mutations.push(operationName);
        break;
      case 'subscription':
        this.subscriptions.push(operationName);
        break;
      default:
        throw new Error('Unknown operation');
    }
  }

  FragmentDefinition(node: FragmentDefinitionNode) {
    this.fragments.push(node.name.value);
  }

  getNames(): {queries: string[]; mutations: string[]; subscriptions: string[]; fragments: string[]} {
    return {
      queries: this.queries,
      mutations: this.mutations,
      subscriptions: this.subscriptions,
      fragments: this.fragments
    };
  }
}
