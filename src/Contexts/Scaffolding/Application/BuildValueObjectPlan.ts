import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderValueObjectTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ValueObjectTemplate';

export class BuildValueObjectPlan {
  build(spec: PieceSpec, contextsRoot: string, isObjectType: boolean = false): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const voName = spec.action; // The VO name comes from the --name option
    
    let valueType: string;
    let fields = undefined;
    
    if (isObjectType) {
      // Object type: use fields as object properties
      valueType = 'object';
      fields = spec.fields;
    } else {
      // Primitive type: use first field's type
      valueType = spec.fields[0]?.type ?? 'string';
    }

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Domain/ValueObjects/${voName}.ts`,
          content: renderValueObjectTemplate(names, voName, valueType, fields),
        },
      ],
      registrations: [],
    };
  }
}
