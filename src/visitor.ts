import { indent, getBaseTypeNode, buildScalars, ParsedScalarsMap, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import * as autoBind from 'auto-bind';
import {
  ASTNode,
  ConstDirectiveNode,
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
  isScalarType,
  Kind,
  ObjectTypeDefinitionNode,
  StringValueNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import {
  DefaultDocsPluginConfig,
  DEFAULT_DOCS_TO_GENERATE,
  DEFAULT_FRAGMENT_MINIMUM_FIELDS,
  DEFAULT_SKIP_TYPENAME,
  DEFAULT_COMMENTS_FROM_DESCRIPTIONS,
  DEFAULT_DEPRECATED_DIRECTIVE_IN_COMMENTS,
} from './config';

type FieldParentNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | UnionTypeDefinitionNode;

type FieldDefinitionPrintFn = (generateKind: string, objectTypeDefinitionParent: any) => string | null;

export interface DefaultDocsPluginParsedConfig {
  docsToGenerate?: string[];
  fragmentMinimumFields?: number;
  skipTypename?: boolean;
  providedDocsNames: { queries: string[]; mutations: string[]; subscriptions: string[]; fragments: string[] };
}

export class DefaultDocsVisitor<
  TRawConfig extends DefaultDocsPluginConfig = DefaultDocsPluginConfig,
  TParsedConfig extends DefaultDocsPluginParsedConfig = DefaultDocsPluginParsedConfig
> {
  readonly docsToGenerate: string[];
  readonly fragmentMinimumFields: number;
  readonly skipTypename: boolean;
  readonly commentsFromDescriptions: boolean;
  readonly deprecatedDirectiveInComments: boolean;
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
    this.skipTypename = rawConfig.skipTypename || DEFAULT_SKIP_TYPENAME;
    this.commentsFromDescriptions = rawConfig.commentsFromDescriptions || DEFAULT_COMMENTS_FROM_DESCRIPTIONS;
    this.deprecatedDirectiveInComments = rawConfig.deprecatedDirectiveInComments || DEFAULT_DEPRECATED_DIRECTIVE_IN_COMMENTS;
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

  // These definitions must be specifically dropped when visited as we are not processing them
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
    // Skip all object types without fields
    // Technically this should not happen in a valid schema
    if (!node.fields) {
      return null;
    }

    const name = this.getName(node);
    switch (name) {
      case 'Query':
      case 'Mutation':
      case 'Subscription':
        // Skip operations not listed in docsToGenerate config property
        if (!this.docsToGenerate.includes(name.toLowerCase())) {
          return null;
        }
        // Operations
        return (
          (node.fields as unknown as FieldDefinitionPrintFn[])
            .map((f) => {
              return f(name.toLowerCase(), parent);
            })
            .join('\n\n') + '\n'
        );
      default:
        // All other Object types - build 'AllFields' fragment for it
        if (this.docsToGenerate.includes('fragment')) {
          // Do not generate AllFields fragment for types with less than fragmentMinimumFields fields
          if (node.fields.length < this.fragmentMinimumFields) {
            return null;
          }
          const fragmentName = `${name}AllFields`;
          // Skip ignored fragments (provided in custom documents to the plugin) to avoid name conflicts
          if (this.ignoredFragmentsMap[fragmentName]) {
            return '## Skipped fragment ' + fragmentName + ' since it is already defined in provided documents';
          }
          const _typeName = this.skipTypename ? '' : '\n' + indent('__typename', 1);
          return (
            `fragment ${fragmentName} on ${name} {\n` +
            (node.fields as unknown as FieldDefinitionPrintFn[])
              .map((f) => {
                return f('fragment', parent);
              })
              .join('\n') +
            _typeName +
            `\n}\n`
          );
        } else {
          return null;
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
        return comment + indent(name, 1) + baseNodeFieldsString;
      } else {
        // Skip ignored operations (provided in custom documents to the plugin) to avoid name conflicts
        // Skipping ignored fragments is handled in ObjectTypeDefinition
        if (this.skipIgnoredOperations(generateKind, camelCaseName)) {
          return '## Skipped ' + generateKind + ' ' + camelCaseName + ' since it is already defined in provided documents';
        }
        // Operation field - query, mutation, subscription
        const opsArgs = node.arguments?.map((arg) => {
          const argName = this.getName(arg);
          let argTypeName = this.getName(getBaseTypeNode(arg.type));
          if (arg.type.kind === 'NonNullType') {
            if (arg.type.type.kind === 'ListType') {
              if (arg.type.type.type.kind === 'NonNullType') {
                argTypeName = `[${argTypeName}!]!`;
              } else {
                argTypeName = `[${argTypeName}]!`;
              }
            } else {
              argTypeName = `${argTypeName}!`;
            }
          } else {
            if (arg.type.kind === 'ListType') {
              if (arg.type.type.kind === 'NonNullType') {
                argTypeName = `[${argTypeName}!]`;
              } else {
                argTypeName = `[${argTypeName}]`;
              }
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
  // Expand fields of subtypes (including interfaces and unions) unless using 'AllFields' fragment
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
    const _typeName = this.skipTypename ? '' : '\n' + indent('__typename', subtype ? i + 1 : i);

    if (isScalarType(gqlBaseType) || isEnumType(gqlBaseType)) {
      return subtype ? indent(nodeName, i) : '';
    }

    const baseTypeDefNode: FieldParentNode = objectTypeDefinitionParent.find(
      (n: any) =>
        (n.kind === Kind.OBJECT_TYPE_DEFINITION || n.kind === Kind.INTERFACE_TYPE_DEFINITION || n.kind === Kind.UNION_TYPE_DEFINITION) &&
        this.getName(n) === baseNodeTypeName
    );

    switch (baseTypeDefNode.kind) {
      case Kind.OBJECT_TYPE_DEFINITION: {
        const fields = baseTypeDefNode.fields;
        // check if fragment is requested and print baseTypeName+AllFields on object type field instead of unfolding it
        const expandSubTypes =
          !this.docsToGenerate.includes('fragment') ||
          (this.docsToGenerate.includes('fragment') && Object.keys(fields).length < this.fragmentMinimumFields);

        const fieldsStr = expandSubTypes
          ? fields
              .map((f) => {
                return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, i);
              })
              .join('\n')
          : indent(`...${baseNodeTypeName}AllFields`, i);

        // print out the object type fields (or 'AllFields' fragment for it)
        return `${subtype ? indent(nodeName, i) : ''}` + ' {\n' + indentMultiline(fieldsStr, i) + '\n' + indent('}', i);
      }
      case Kind.INTERFACE_TYPE_DEFINITION: {
        const coreInterfaceFields = baseTypeDefNode.fields;
        const coreInterfaceFieldsStr =
          coreInterfaceFields
            .map((f) => {
              return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, subtype ? i + 1 : i);
            })
            .join('\n') + _typeName;
        // Get all object types that implement the interface
        const implTypes = this.schema.getImplementations(gqlBaseType as GraphQLInterfaceType).objects.map((o) => {
          const implType: FieldParentNode = objectTypeDefinitionParent.find(
            (n: any) =>
              (n.kind === Kind.OBJECT_TYPE_DEFINITION || n.kind === Kind.INTERFACE_TYPE_DEFINITION) &&
              this.getName(n) === this.getName(o.astNode)
          );
          return implType;
        });
        // Build implementations string
        const implementationsStr = implTypes
          .map((impl: InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode) => {
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
            return indent('... on ' + this.getName(impl.name) + ' {', i) + '\n' + indentMultiline(fieldsStr, i) + '\n' + indent('}', i);
          })
          .join('\n');
        return (
          `${subtype ? indent(nodeName, i) : ''}` +
          ' {\n' +
          indentMultiline(coreInterfaceFieldsStr, i) +
          '\n' +
          indentMultiline(implementationsStr, i) +
          '\n' +
          indent('}', i)
        );
      }
      case Kind.UNION_TYPE_DEFINITION: {
        const unionMemberTypes = baseTypeDefNode.types;
        // Build union string
        const unionStr =
          unionMemberTypes
            .map((t) => {
              // Union member types can only be Object Types
              const memberTypeDefinitionNode: ObjectTypeDefinitionNode = objectTypeDefinitionParent.find(
                (n: any) => n.kind === Kind.OBJECT_TYPE_DEFINITION && this.getName(n) === this.getName(t.name)
              );
              const fields = memberTypeDefinitionNode.fields;
              const fieldsStr = fields
                .map((f) => {
                  return this.printBaseNodeFields(f, true, objectTypeDefinitionParent, fieldDefinitionParent, subtype ? i + 1 : i);
                })
                .join('\n');
              return indent('... on ' + this.getName(t.name) + ' {', i) + '\n' + indentMultiline(fieldsStr, i) + '\n' + indent('}', i);
            })
            .join('\n') + _typeName;
        return `${subtype ? indent(nodeName, i) : ''}` + ' {\n' + indentMultiline(unionStr, i) + '\n' + indent('}', i);
      }
      default:
        return '';
    }
  }

  private getNodeComment(node: FieldDefinitionNode | EnumValueDefinitionNode | InputValueDefinitionNode): string {
    const descriptionCommentText = this.commentsFromDescriptions ? this.transformToComment(node.description, 1) : null;
    const deprecationDirective = node.directives.find((v) => v.name.value === 'deprecated');
    const deprecationCommentText =
      deprecationDirective && this.deprecatedDirectiveInComments
        ? this.transformToComment('@deprecated ' + this.getDeprecationReason(deprecationDirective), 1)
        : null;
    const comment = `${descriptionCommentText ? `${descriptionCommentText}\n` : ''}${
      deprecationCommentText ? `${deprecationCommentText}\n` : ''
    }`;
    return comment;
  }

  private getDeprecationReason(directive: ConstDirectiveNode | DirectiveNode): string {
    const hasArguments = directive.arguments.length > 0;
    return hasArguments ? (directive.arguments.find((a) => a.name.value === 'reason').value as StringValueNode).value : '';
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

  private transformToComment(text: string | StringValueNode, indentLevel = 0): string {
    if (!text || text === '') {
      return null;
    }

    if (this.isStringValueNode(text)) {
      text = text.value;
    }

    const lines = text.split('\n').map((line) => `# ${line}`);
    return this.stripTrailingSpaces(lines.map((line) => indent(line, indentLevel)).join('\n'));
  }

  private isStringValueNode(node: any): node is StringValueNode {
    return node && typeof node === 'object' && node.kind === Kind.STRING;
  }

  private stripTrailingSpaces(str: string): string {
    return str.replace(/ +\n/g, '\n');
  }
}
