import {
  indent,
  transformComment,
  getBaseTypeNode,
  buildScalars,
  ParsedScalarsMap,
  indentMultiline,
} from '@graphql-codegen/visitor-plugin-common';
import * as autoBind from 'auto-bind';
import {
  ASTNode,
  DirectiveNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  isEnumType,
  isListType,
  isNullableType,
  isScalarType,
  ObjectTypeDefinitionNode,
} from 'graphql';
import { DefaultDocsPluginConfig, DEFAULT_DOCS_TO_GENERATE, DEFAULT_FRAGMENT_MINIMUM_FIELDS } from './config';

// TODO - handle Unions as well
type FieldParentNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;

type FieldDefinitionPrintFn = (generateKind: string, objectTypeDefinitionParent: any) => string | null;

export interface DefaultDocsPluginParsedConfig {
  docsToGenerate?: string[];
  fragmentMinimumFields?: number;
  providedDocsNames: { queries: string[]; mutations: string[]; subscriptions: string[]; fragments: string[] };
}

export class DefaultDocsVisitor<
  TRawConfig extends DefaultDocsPluginConfig = DefaultDocsPluginConfig,
  TParsedConfig extends DefaultDocsPluginParsedConfig = DefaultDocsPluginParsedConfig
> {
  readonly docsToGenerate: string[];
  readonly fragmentMinimumFields: number;
  schema: GraphQLSchema;
  typeMap: { [name: string]: GraphQLType };
  Query: GraphQLObjectType;
  Mutation: GraphQLObjectType;
  Subscription: GraphQLObjectType;
  scalars: ParsedScalarsMap;
  ignoredQueriesMap: { [name: string]: boolean };
  ignoredMutationsMap: { [name: string]: boolean };
  ignoredSubscriptionsMap: { [name: string]: boolean };
  ignoredFragmentsMap: { [name: string]: boolean };

  constructor(schema: GraphQLSchema, rawConfig: TRawConfig, additionalConfig: Partial<TParsedConfig> = {}) {
    this.docsToGenerate = rawConfig.docsToGenerate || DEFAULT_DOCS_TO_GENERATE;
    this.fragmentMinimumFields = rawConfig.fragmentMinimumFields || DEFAULT_FRAGMENT_MINIMUM_FIELDS;
    this.schema = schema;
    this.typeMap = schema.getTypeMap();
    this.Query = schema.getQueryType();
    this.Mutation = schema.getMutationType();
    this.Subscription = schema.getSubscriptionType();
    this.scalars = buildScalars(schema, {});
    this.ignoredQueriesMap = {};
    this.ignoredMutationsMap = {};
    this.ignoredSubscriptionsMap = {};
    this.ignoredFragmentsMap = {};
    this.buildIgnoredMaps(additionalConfig.providedDocsNames);
    autoBind(this as any);
  }

  // These definitions must be specifically dropped when visited as we are currently not processing them
  InterfaceTypeDefinition(node: InterfaceTypeDefinitionNode) {
    return null;
  }
  SchemaDefinition() {
    return null;
  }
  InputObjectTypeDefinition() {
    return null;
  }
  EnumTypeDefinition() {
    return null;
  }
  DirectiveDefinition() {
    return null;
  }
  UnionTypeDefinition() {
    return null;
  }
  ScalarTypeDefinition() {
    return null;
  }

  // Main entry point
  ObjectTypeDefinition(node: ObjectTypeDefinitionNode, key: number | string, parent: any): string {
    // TODO should we really skip all object types without fields?
    if (!node.fields) {
      return '';
    }

    const name = this.getName(node);
    switch (name) {
      case 'Query':
      case 'Mutation':
      case 'Subscription':
        // Skip operations not listed in docsToGenerate config property
        if (!this.docsToGenerate.includes(name.toLowerCase())) {
          return '';
        }
        // Operations
        return (node.fields as unknown as FieldDefinitionPrintFn[])
          .map((f) => {
            return f(name.toLowerCase(), parent);
          })
          .join('\n');
      default:
        // All other Object types - build 'AllFields' fragment for it
        if (this.docsToGenerate.includes('fragment')) {
          // Do not generate AllFields fragment for types with less than fragmentMinimumFields fields
          if (node.fields.length < this.fragmentMinimumFields) {
            return '';
          }
          const fragmentName = `${name}AllFields`;
          // Skip ignored fragments (provided in custom documents to the plugin) to avoid name conflicts
          if (this.ignoredFragmentsMap[fragmentName]) {
            return '';
          }
          return (
            `fragment ${fragmentName} on ${name} {\n` +
            (node.fields as unknown as FieldDefinitionPrintFn[])
              .map((f) => {
                return f('fragment', parent);
              })
              .join('\n') +
            `\n}`
          );
        } else {
          return '';
        }
    }
  }

  // Turn FieldDefinitionNode into a function that prints the field
  // To be used in ObjectTypeDefinition
  FieldDefinition(node: FieldDefinitionNode, key: string | number, parent: any): FieldDefinitionPrintFn {
    return (generateKind, objectTypeDefinitionParent) => {
      const fieldDefinitionParent = parent;
      const name = this.getName(node);
      const camelCaseName = this.getCamelCase(name);
      const comment = this.getNodeComment(node);
      if (generateKind === 'fragment') {
        const baseNodeFieldsString = this.printBaseNodeFields(node, false, objectTypeDefinitionParent, fieldDefinitionParent, 1);
        return comment + indent(name, 1) + indent(baseNodeFieldsString, 1);
      } else {
        // Skip ignored operations (provided in custom documents to the plugin) to avoid name conflicts
        // Skipping ignored fragments is handled in ObjectTypeDefinition
        if (this.skipIgnoredOperations(generateKind, camelCaseName)) {
          return '';
        }
        // Operation field - query, mutation, subscription
        const opsArgs = node.arguments?.map((arg) => {
          const argName = this.getName(arg);
          let argTypeName = this.getName(getBaseTypeNode(arg.type));
          if (!isNullableType(arg.type)) {
            if (isListType(arg.type)) {
              argTypeName = `[${argTypeName}!]!`;
            } else {
              argTypeName = `${argTypeName}!`;
            }
          } else {
            if (isListType(arg.type)) {
              argTypeName = `[${argTypeName}]`;
            }
          }
          return '$' + `${argName}: ${argTypeName}`;
        });
        const resolverArgs = node.arguments?.map((arg) => {
          const argName = this.getName(arg);
          return `${argName}: ` + '$' + `${argName}`;
        });
        const opsArgsString = (() => {
          if (opsArgs.length) {
            return '(' + opsArgs.join(', ') + ')';
          }
          return '';
        })();
        const resolverArgsString = (() => {
          if (resolverArgs.length) {
            return '(' + resolverArgs.join(', ') + ')';
          }
          return '';
        })();
        const baseNodeFieldsString = this.printBaseNodeFields(node, false, objectTypeDefinitionParent, fieldDefinitionParent, 1);
        // print out the operation (query, mutation, subscription)
        return (
          comment +
          generateKind +
          ' ' +
          camelCaseName +
          opsArgsString +
          ' {\n' +
          indent(name + resolverArgsString, 1) +
          baseNodeFieldsString +
          '\n}'
        );
      }
    };
  }

  private skipIgnoredOperations(op: string, name: string): boolean {
    switch (op) {
      case 'query':
        return this.ignoredQueriesMap[name];
      case 'mutation':
        return this.ignoredMutationsMap[name];
      case 'subscription':
        return this.ignoredSubscriptionsMap[name];
      default:
        // should not happen, but just in case
        throw new Error('Unknown generateKind: ' + op);
    }
  }

  // Recursively print fields of FieldDefinitionNode
  // Expand fields of subtypes/interfaces unless using 'AllFields' fragment
  private printBaseNodeFields(
    node: FieldDefinitionNode,
    subtype: boolean,
    objectTypeDefinitionParent: any,
    fieldDefinitionParent: any,
    i: number
  ): string {
    const baseTypeNode = getBaseTypeNode(node.type);
    const baseNodeTypeName = this.getName(baseTypeNode);
    const nodeName = this.getName(node);
    const gqlBaseType = this.typeMap[baseNodeTypeName] as GraphQLType;

    if (isScalarType(gqlBaseType) || isEnumType(gqlBaseType)) {
      return subtype ? indent(nodeName, i) : '';
    }

    const baseTypeDefNode: FieldParentNode = objectTypeDefinitionParent.find(
      (n: any) => (n.kind === 'ObjectTypeDefinition' || 'InterfaceTypeDefinition') && this.getName(n) === baseNodeTypeName
    );

    if (this.isObjectTypeDefinitionNode(baseTypeDefNode)) {
      const fields = baseTypeDefNode.fields;
      // check if fragment is requested and print baseTypeName+AllFields on object type field instead of unfolding it
      const expandSubTypes =
        !this.docsToGenerate.includes('fragment') ||
        (this.docsToGenerate.includes('fragment') && Object.keys(fields).length < this.fragmentMinimumFields);

      const fieldsStr = expandSubTypes
        ? fields
            .map((f) => {
              return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, subtype ? i + 1 : i);
            })
            .join('\n')
        : indent(`...${baseNodeTypeName}AllFields`, i);

      // print out the object type fields (or 'AllFields' fragment for it)
      return `${subtype ? indent(nodeName, i) : ''}` + '{\n' + indentMultiline(fieldsStr, i) + '\n' + indent('}', i);
    } else if (this.isInterfaceTypeDefinitionNode(baseTypeDefNode)) {
      const coreInterfaceFields = baseTypeDefNode.fields;
      const coreInterfaceFieldsStr = coreInterfaceFields
        .map((f) => {
          return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, subtype ? i + 1 : i);
        })
        .join('\n');
      // Get all object types that implement the interface
      const implTypes = this.schema.getImplementations(gqlBaseType as GraphQLInterfaceType).objects.map((o) => {
        const implType: FieldParentNode = objectTypeDefinitionParent.find(
          (n: any) => (n.kind === 'ObjectTypeDefinition' || 'InterfaceTypeDefinition') && this.getName(n) === this.getName(o.astNode)
        );
        return implType;
      });
      // Build implementations string
      const implementationsStr = implTypes
        .map((impl) => {
          const implTypeFields = impl.fields;
          const extraImplFields = implTypeFields.filter(
            (f) => !coreInterfaceFields.find((cf) => this.getName(cf.name) === this.getName(f.name))
          );
          // Always expand subtypes for interfaces
          const fieldsStr = extraImplFields
            .map((f) => {
              return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, subtype ? i + 2 : i);
            })
            .join('\n');
          return (
            '\n' +
            indent('... on ' + this.getName(impl.name) + ' {', i) +
            '\n' +
            indentMultiline(fieldsStr, i) +
            '\n' +
            indent('}', i)
          );
        })
        .join('\n');
      return (
        `${subtype ? indent(nodeName, i) : ''}` +
        '{\n' +
        indentMultiline(coreInterfaceFieldsStr, i) +
        indentMultiline(implementationsStr, i) +
        '\n' +
        indent('}', i)
      );
    } else {
      return '';
    }
  }
  private isObjectTypeDefinitionNode(node: FieldParentNode) {
    return !!node && node.kind === 'ObjectTypeDefinition';
  }
  private isInterfaceTypeDefinitionNode(node: FieldParentNode) {
    return !!node && node.kind === 'InterfaceTypeDefinition';
  }

  private getNodeComment(node: FieldDefinitionNode | EnumValueDefinitionNode | InputValueDefinitionNode): string {
    let commentText: string = node.description as any;
    const deprecationDirective = node.directives.find((v: any) => v.name === 'deprecated');
    if (deprecationDirective) {
      const deprecationReason = this.getDeprecationReason(deprecationDirective);
      commentText = `${commentText ? `${commentText}\n` : ''}@deprecated ${deprecationReason}`;
    }
    const comment = transformComment(commentText, 1);
    return comment;
  }

  private getDeprecationReason(directive: DirectiveNode): string | void {
    if ((directive.name as any) === 'deprecated') {
      const hasArguments = directive.arguments.length > 0;
      let reason = 'Field no longer supported';
      if (hasArguments) {
        reason = directive.arguments[0].value as any;
      }
      return reason;
    }
  }

  private getCamelCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

  private buildIgnoredMaps(ignore: { queries: string[]; mutations: string[]; subscriptions: string[]; fragments: string[] }) {
    ignore.queries.forEach((query) => (this.ignoredQueriesMap[query] = true));
    ignore.mutations.forEach((mutation) => (this.ignoredMutationsMap[mutation] = true));
    ignore.subscriptions.forEach((subscription) => (this.ignoredSubscriptionsMap[subscription] = true));
    ignore.fragments.forEach((fragment) => (this.ignoredFragmentsMap[fragment] = true));
  }

  private getName(node: ASTNode | string): string | undefined {
    if (node == null) {
      return undefined;
    }

    if (typeof node === 'string') {
      return node;
    }

    switch (node.kind) {
      case 'OperationDefinition':
      case 'Variable':
      case 'Argument':
      case 'FragmentSpread':
      case 'FragmentDefinition':
      case 'ObjectField':
      case 'Directive':
      case 'NamedType':
      case 'ScalarTypeDefinition':
      case 'ObjectTypeDefinition':
      case 'FieldDefinition':
      case 'InputValueDefinition':
      case 'InterfaceTypeDefinition':
      case 'UnionTypeDefinition':
      case 'EnumTypeDefinition':
      case 'EnumValueDefinition':
      case 'InputObjectTypeDefinition':
      case 'DirectiveDefinition': {
        return this.getName(node.name);
      }
      case 'Name': {
        return node.value;
      }
      case 'Field': {
        return this.getName(node.alias || node.name);
      }
      case 'VariableDefinition': {
        return this.getName(node.variable);
      }
    }

    return undefined;
  }
}
