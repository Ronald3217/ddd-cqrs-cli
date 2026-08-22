import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderValueObjectTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ValueObjectTemplate';

export class BuildValueObjectPlan {
  build(spec: PieceSpec, contextsRoot: string, isObjectType: boolean = false, importBase: string = '@/Contexts'): GenerationPlan {
    // Parse 'BC/Shared' → last segment for entity names, full path for output location
    const moduleParts = spec.entityName.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : spec.entityName;
    const names: EntityNames = deriveEntityNames(entityName, spec.context, importBase);
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

    // Determine base path:
    //  --module Shared              → ${contextsRoot}/Shared/
    //  --module AdLinksManager/Shared → ${contextsRoot}/AdLinksManager/Shared/
    //  --module User                → ${contextsRoot}/${context}/User/
    const modulePath = spec.entityName;
    let base: string;
    if (modulePath === 'Shared') {
      base = `${contextsRoot}/Shared`;
    } else if (modulePath.endsWith('/Shared')) {
      const bcName = modulePath.split('/')[0];
      base = `${contextsRoot}/${bcName}/Shared`;
    } else {
      base = `${contextsRoot}/${names.context}/${names.entity}`;
    }

    return {
      files: [
        {
          relPath: `${base}/Domain/ValueObjects/${voName}.ts`,
          content: renderValueObjectTemplate(names, voName, valueType, fields),
        },
      ],
      registrations: [],
    };
  }
}
