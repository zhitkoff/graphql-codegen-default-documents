import {
  BaseVisitor,
  BaseTypesVisitor,
  DeclarationBlock,
  DeclarationKind,
  getConfigValue,
  indent,
  isOneOfInputObjectType,
  normalizeAvoidOptionals,
  ParsedTypesConfig,
  ParsedConfig,
  transformComment,
  wrapWithSingleQuotes,
  LoadedFragment,
  getRootTypeNames,
  getBaseTypeNode,
} from '@graphql-codegen/visitor-plugin-common';
import * as autoBind from 'auto-bind';
import {
  ASTNode,
  DirectiveNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  isAbstractType,
  isEnumType,
  isInterfaceType,
  isListType,
  isNullableType,
  isObjectType,
  isOutputType,
  Kind,
  ListTypeNode,
  NamedTypeNode,
  NameNode,
  NonNullTypeNode,
  ObjectTypeDefinitionNode,
  OperationTypeNode,
  TypeDefinitionNode,
  TypeNode,
  UnionTypeDefinitionNode,
} from 'graphql';
// import { TypeScriptOperationVariablesToObject } from './typescript-variables-to-object.js';
import { DefaultDocsPluginConfig, DEFAULT_DOCS_TO_GENERATE } from './config';

// interface NodeFieldType {
//   type: string;
//   isNullable: boolean;
//   isArray: boolean;
//   isScalar: boolean;
// }

// interface OperationInput {
//   nameParts: string[];
//   type: NodeFieldType;
// }

// interface FieldType {
//   name: string;
//   type?: string;
//   inputs: InputValueDefinitionNode[];
// }

// type InterfaceName = string;

export interface DefaultDocsPluginParsedConfig {
  docsToGenerate?: string[];
  providedDocsNames: { queries: string[]; mutations: string[]; subscriptions: string[]; fragments: string[] };
}

export class DefaultDocsVisitor<
  TRawConfig extends DefaultDocsPluginConfig = DefaultDocsPluginConfig,
  TParsedConfig extends DefaultDocsPluginParsedConfig = DefaultDocsPluginParsedConfig
> {
  readonly docsToGenerate: string[];
  schema: GraphQLSchema;
  // typeDefsMap: { [name: string]: FieldType[] };
  typeMap: { [name: string]: GraphQLType };
  // scalars: ParsedScalarsMap;
  // interfaceImplementationsMap: { [objectName: string]: InterfaceName[] };
  // interfaceFieldsMap: { [interfaceName: string]: string[] };
  ignoredQueriesMap: { [name: string]: boolean };
  ignoredMutationsMap: { [name: string]: boolean };
  ignoredSubscriptionsMap: { [name: string]: boolean };
  ignoredFragmentsMap: { [name: string]: boolean };

  constructor(schema: GraphQLSchema, rawConfig: TRawConfig, additionalConfig: Partial<TParsedConfig> = {}) {
    this.docsToGenerate = rawConfig.docsToGenerate || DEFAULT_DOCS_TO_GENERATE;
    this.schema = schema;
    this.typeMap = schema.getTypeMap();
    // this.scalars = buildScalars(schema, {});
    // this.typeDefsMap = {};
    // this.interfaceFieldsMap = {};
    // this.interfaceImplementationsMap = {};
    this.ignoredQueriesMap = {};
    this.ignoredMutationsMap = {};
    this.ignoredSubscriptionsMap = {};
    this.ignoredFragmentsMap = {};
    this.buildIgnoredMaps(additionalConfig.providedDocsNames);
    autoBind(this as any);
  }

  // DirectiveDefinition
  // EnumTypeDefinition
  // InputObjectTypeDefinition
  // InterfaceTypeDefinition
  // * ObjectTypeDefinition
  // ScalarTypeDefinition
  // SchemaDefinition
  // Document

  Name(node: NameNode): string {
    return node.value;
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode, key: number | string, parent: any): string {
    // TODO should we really skip all object tyoes without fields?
    if (!node.fields) {
      return 'NO FIELDS';
    }
    return node.fields.join('\n\n');

    // Check against docsToGenerate config property
    // const generateKind = (() => {
    // switch (this.getName(node)) {
    //   case 'Query':
    //     return this.docsToGenerate.includes(OperationTypeNode.QUERY) ? OperationTypeNode.QUERY : undefined;
    //   case 'Mutation':
    //     return this.docsToGenerate.includes(OperationTypeNode.MUTATION) ? OperationTypeNode.MUTATION : undefined;
    //   case 'Subscription':
    //     return this.docsToGenerate.includes(OperationTypeNode.MUTATION) ? OperationTypeNode.SUBSCRIPTION : undefined;
    //   default:
    //     // All other Object types - build 'AllFields' fragment for it
    //     return this.docsToGenerate.includes('fragment') ? 'fragment' : undefined;
    // }
    // })();
    // console.log(node.name.value, generateKind);
    // Skip if we don't need to generate anything
    // if (!generateKind) {
    //   return 'WRONG KIND';
    // }
    // Generate
    // return generateKind === 'fragment' ? this.generateFragment(node) : this.generateOperation(generateKind, node);
  }

  // private generateOperation(operationType: OperationTypeNode, node: ObjectTypeDefinitionNode): string {
  //   return node.fields
  //     ?.map((op) => {
  //       // const { codes, operationInputs } =
  //       //   this.formatFieldsAndGetInputs(field);
  //       // const argsString = this.formatInputStringForOperation(op);
  //       const argsString = op.arguments.join(', ');
  //       const codes = 'TODO: Implement operation generation';
  //       console.log('Field');
  //       console.log('Operation:', operationType, op.name.value, argsString, codes);
  //       return this.wrapBlock(operationType, op.name.value, argsString, codes);
  //     })
  //     .join('\n\n');
  // }

  private generateFragment(node: ObjectTypeDefinitionNode): string {
    return 'TODO: Implement fragment generation';
  }

  private wrapBlock(operationType: string, operationName: string, args: string, code: string): string {
    return `${operationType} ${operationName}${args} { \n${code}}`;
  }

  FieldDefinition(node: FieldDefinitionNode): string {
    const name = this.getName(node);
    const baseType = getBaseTypeNode(node.type);
    const gqlBaseType = this.getGQLType(this.getName(baseType));
    const comment = this.getNodeComment(node);
    console.log('Field:', name, baseType, gqlBaseType);
    const opsArgs = node.arguments?.map((arg) => {
      const argName = this.getName(arg);
      const argType = getBaseTypeNode(arg.type);
      let typeValue = this.getName(argType);
      if (!isNullableType(arg.type)) {
        if (isListType(arg.type)) {
          typeValue = `[${typeValue}!]!`;
        } else {
          typeValue = `${typeValue}!`;
        }
      } else {
        if (isListType(arg.type)) {
          typeValue = `[${typeValue}]`;
        }
      }
      return '$' + `${argName}: ${typeValue}`;
    });
    const resolverArgs = node.arguments?.map((arg) => {
      const argName = this.getName(arg);
      return `${argName}:` + '$' + `${argName}`;
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
    const baseTypeFields = (() => {
      return this.printBaseTypeFields(gqlBaseType);
      // if (isObjectType(gqlBaseType)) {
      //   const fields = gqlBaseType.getFields();
      //   return ' {\n' + Object.keys(fields).map((f) => indent(f)).join('\n') + '\n}';
      // } else if (isInterfaceType(gqlBaseType)) {
      //   const coreInterfaceFields = gqlBaseType.getFields();
      //   const implObjTypes = this.schema.getImplementations(gqlBaseType).objects;
      //   const impls = implObjTypes.map((o) => {
      //     const fields = Object.keys(o.getFields()).filter((f) => !coreInterfaceFields[f]);
      //     return '\n\n... on ' + this.getName(o.astNode) + ' {\n' + fields.map((f) => indent(f)).join('\n') + '\n}';
      //   }).join('\n');
      //   return ' {\n'+ Object.keys(coreInterfaceFields).map((f) => indent(f)).join('\n') + impls + '\n}';
      // }
      // else {
      //   return '';
      // }
    })();




    return comment + '\n' + this.getCamelCase(name) + opsArgsString + ' {\n' + indent(name + resolverArgsString) + baseTypeFields + '\n}';
  }

  private printBaseTypeFields(gqlBaseType: GraphQLType): string {
    if (isObjectType(gqlBaseType)) {
      const fields = gqlBaseType.getFields();
      const fieldsStr = Object.keys(fields).map((f) => {
        const t = fields[f].type as GraphQLType;
        if (isObjectType(t) || isInterfaceType(t)) {
          return this.printBaseTypeFields(t);
        }
        return indent(f);
      }).join('\n')
      return ' {\n' + fieldsStr + '\n}';
    } else if (isInterfaceType(gqlBaseType)) {
      const coreInterfaceFields = gqlBaseType.getFields();
      const implObjTypes = this.schema.getImplementations(gqlBaseType).objects;
      const impls = implObjTypes.map((o) => {
        const allFields = o.getFields();
        const fields = Object.keys(allFields).filter((f) => !coreInterfaceFields[f]);
        const fieldsStr = fields.map((f) => {
          const t = allFields[f].type as GraphQLType;
          if (isObjectType(t) || isInterfaceType(t)) {
            return this.printBaseTypeFields(t);
          }
          return indent(f);
        }).join('\n')
        return '\n\n... on ' + this.getName(o.astNode) + ' {\n' + fieldsStr + '\n}';
      }).join('\n');
      return ' {\n'+ Object.keys(coreInterfaceFields).map((f) => indent(f)).join('\n') + impls + '\n}';
    }
    else {
      return '';
    }
  }

  private getGQLType(name: string): GraphQLType {
    return this.typeMap[name];
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

  // FieldDefinition(node: FieldDefinitionNode): FieldType {
  // const fieldType = this.parseType(node.type);
  // if (this.scalars[fieldType.type]) {
  //   return { name: node.name.value, inputs: [...node.arguments] };
  // }
  // return {
  //   name: node.name.value,
  //   type: fieldType.type,
  //   inputs: [...node.arguments],
  // };
  // }

  // InterfaceTypeDefinition(node: InterfaceTypeDefinitionNode) {
  //   // const fields = node.fields as unknown as FieldType[];
  //   // this.interfaceFieldsMap[node.name.value] = fields.map(
  //   //   (field) => field.name
  //   // );
  // }

  // generateDocuments(ignore: {
  //   queries: string[];
  //   mutations: string[];
  //   subscriptions: string[];
  //   fragments: string[];
  // }): string {
  //   // this.validateInterfaces();
  //   this.buildIgnoredMaps(ignore);

  //   const generatedCode = this.docsToGenerate.map((doc) => {
  //     let generateFrom: FieldType[];
  //     let generateKind: { kind: string; operationType?: OperationTypeNode };
  //     switch (doc) {
  //       case "fragment":
  //         generateFrom = this.typeDefsMap["Fragment"];
  //         generateKind = { kind: "fragment" };
  //         break;
  //       case "query":
  //         generateFrom = this.typeDefsMap["Query"];
  //         generateKind = {
  //           kind: "operation",
  //           operationType: OperationTypeNode.QUERY,
  //         };
  //         break;
  //       case "mutation":
  //         generateFrom = this.typeDefsMap["Mutation"];
  //         generateKind = {
  //           kind: "operation",
  //           operationType: OperationTypeNode.MUTATION,
  //         };
  //         break;
  //       case "subscription":
  //         generateFrom = this.typeDefsMap["Subscription"];
  //         generateKind = {
  //           kind: "operation",
  //           operationType: OperationTypeNode.SUBSCRIPTION,
  //         };
  //         break;
  //     }
  //     if (!generateFrom) {
  //       return "";
  //     }
  //     return this.generateOld(generateFrom, generateKind);
  //   });

  //   return generatedCode.join("\n\n\n");
  // }

  // private generateOld = (
  //   generateFrom: FieldType[],
  //   generateKind: { kind: string; operationType?: OperationTypeNode }
  // ) => {
  //   let results: string[] = [];
  //   switch (generateKind.kind) {
  //     case "fragment":
  //       results.push("TODO: Implement fragment generation");
  //     case "operation":
  //       const filteredOperations = (() => {
  //         switch (generateKind.operationType) {
  //           case OperationTypeNode.QUERY:
  //             return generateFrom.filter(
  //               (op) => !this.ignoredQueriesMap[op.name]
  //             );
  //           case OperationTypeNode.MUTATION:
  //             return generateFrom.filter(
  //               (op) => !this.ignoredMutationsMap[op.name]
  //             );
  //           case OperationTypeNode.SUBSCRIPTION:
  //             return generateFrom.filter(
  //               (op) => !this.ignoredSubscriptionsMap[op.name]
  //             );
  //           default:
  //             throw new Error("Unknown operation");
  //         }
  //       })();
  //       results.push(
  //         ...filteredOperations.map((operation) => {
  //           const { codes, operationInputs } =
  //             this.formatFieldsAndGetInputs(operation);
  //           const argsString =
  //             this.formatInputStringForOperation(operationInputs);
  //           return this.wrapBlock(
  //             generateKind.operationType,
  //             operation.name,
  //             argsString,
  //             codes
  //           );
  //         })
  //       );
  //   }
  //   return results.join("\n\n");
  // };

  // private formatInputStringForOperation(inputs: OperationInput[]): string {
  //   let inputString = '';
  //   const formatType = (nodeType: NodeFieldType): string => {
  //     let typeValue = nodeType.type;
  //     if (!nodeType.isNullable) {
  //       if (nodeType.isArray) {
  //         typeValue = `[${typeValue}!]!`;
  //       } else {
  //         typeValue = `${typeValue}!`;
  //       }
  //     } else {
  //       if (nodeType.isArray) {
  //         typeValue = `[${typeValue}]`;
  //       }
  //     }
  //     return typeValue;
  //   };
  //   if (inputs.length) {
  //     inputString = (() => {
  //       const inputsString = inputs
  //         .map((input) => {
  //           return ['$' + this.getCamelCase(input.nameParts), formatType(input.type)].join(': ');
  //         })
  //         .join(', ');
  //       return '(' + inputsString + ')';
  //     })();
  //   }
  //   return inputString;
  // }

  // private formatInputStringForResolver(names: string[], inputs: string[]): string {
  //   const argumentsString = names
  //     .map((name) => {
  //       return [name, '$' + this.getCamelCase([...inputs, name])].join(': ');
  //     })
  //     .join(', ');
  //   return '(' + argumentsString + ')';
  // }

  // private formatFieldsAndGetInputs(
  //   // field: FieldType,
  //   field: FieldDefinitionNode,
  //   indentCounter = 0,
  //   parentTypes: { [type: string]: number } = {},
  //   parentNames: string[] | null = null
  // ): { codes: string; operationInputs: OperationInput[] } {
  //   const namedType = this.schema.getType(this.getTypeName(field.type));
  //   const possibleTypes = getPossibleTypes(this.schema, namedType);
  //   // const recurCounter = parentTypes[field.type] || 0;
  //   // const isOverRecursionLimit = recurCounter > this.recursionLimit;
  //   // if (isOverRecursionLimit) {
  //   //   return { codes: "", operationInputs: [] };
  //   // }
  //   const newParentTypes = { ...parentTypes, [field.type]: recurCounter + 1 };
  //   const newParentNames = parentNames ? [...parentNames, field.name] : [];
  //   indentCounter++;
  //   const fieldInputsString = field.inputs.length
  //     ? this.formatInputStringForResolver(
  //         field.inputs.map((input) => input.name.value),
  //         newParentNames
  //       )
  //     : "";
  //   const subFields = this.typeDefsMap[field.type];
  //   const operationInputs = field.inputs.map((input): OperationInput => {
  //     return {
  //       nameParts: [...newParentNames, input.name.value],
  //       type: this.parseType(input.type),
  //     };
  //   });
  //   if (!subFields) {
  //     return {
  //       codes: `${TAB.repeat(indentCounter)}${
  //         field.name
  //       }${fieldInputsString}\n`,
  //       operationInputs,
  //     };
  //   }

  //   const results = subFields.map((subField) =>
  //     this.formatFieldsAndGetInputs(
  //       subField,
  //       indentCounter,
  //       newParentTypes,
  //       newParentNames
  //     )
  //   );
  //   const innerCode = results.map((r) => r.codes).join("");
  //   const codes = `${TAB.repeat(indentCounter)}${
  //     field.name
  //   }${fieldInputsString} {\n${innerCode}${TAB.repeat(indentCounter)}}\n`;
  //   const subFieldInputs = results
  //     .map((r) => r.operationInputs)
  //     .reduce((prev, curr) => prev.concat(curr));
  //   return { codes, operationInputs: [...operationInputs, ...subFieldInputs] };
  // }

  // private parseType(rawType: TypeNode | string): NodeFieldType {
  //   const typeNode = rawType as TypeNode;
  //   if (typeNode.kind === 'NamedType') {
  //     return {
  //       type: typeNode.name.value,
  //       isNullable: true,
  //       isArray: false,
  //       isScalar: !!this.scalars[typeNode.name.value],
  //     };
  //   } else if (typeNode.kind === 'NonNullType') {
  //     return {
  //       ...this.parseType(typeNode.type),
  //       isNullable: false,
  //     };
  //   } else if (typeNode.kind === 'ListType') {
  //     return {
  //       ...this.parseType(typeNode.type),
  //       isArray: true,
  //       isNullable: true,
  //     };
  //   }
  //   throw new Error('error');
  // }

  // private getTypeName(node: TypeNode): string {
  //   switch (node.kind) {
  //     case 'NamedType':
  //       return node.name.value;
  //     case 'NonNullType':
  //       return this.getTypeName(node.type);
  //     case 'ListType':
  //       return this.getTypeName(node.type);
  //     default:
  //       throw new Error('Unknown TypeNode kind: ' + node.kind);
  //   }
  // }

  // private validateInterfaces(): void {
  //   Object.keys(this.interfaceImplementationsMap).forEach((k) => {
  //     let fieldsFromInterfaces = [];
  //     const interfaces = this.interfaceImplementationsMap[k];
  //     interfaces.forEach((interfaceName) => {
  //       const names = this.interfaceFieldsMap[interfaceName];
  //       fieldsFromInterfaces = [...fieldsFromInterfaces, ...names];
  //     });
  //     const uniqueFields = Array.from(new Set(fieldsFromInterfaces));
  //     const objectMap: { [name: string]: true } = {};
  //     this.typeDefsMap[k].forEach((f) => {
  //       objectMap[f.name] = true;
  //     });
  //     uniqueFields.forEach((field) => {
  //       if (!objectMap[field]) {
  //         throw new Error("Missing " + field + " in " + k);
  //       }
  //     });
  //   });
  // }

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
