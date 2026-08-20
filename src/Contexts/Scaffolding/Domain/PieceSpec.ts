import { FieldSpec } from './FieldSpec';
import { assertPascalCase } from './NamingRules';

export type PieceKind = 'command' | 'query' | 'controller' | 'schema' | 'value-object' | 'entity' | 'event' | 'repository';

export class PieceSpec {
  private constructor(
    public readonly kind: PieceKind,
    public readonly entityName: string,
    public readonly action: string,
    public readonly fields: FieldSpec[],
    public readonly context: string,
  ) {}

  static create(
    kind: PieceKind,
    entityName: string,
    action: string,
    fieldsRaw: string | undefined,
    context: string,
  ): PieceSpec {
    return new PieceSpec(
      kind,
      assertPascalCase(entityName, 'Module name'),
      action ? assertPascalCase(action, 'Action name') : '',
      FieldSpec.parseList(fieldsRaw),
      assertPascalCase(context, 'Context name'),
    );
  }
}
