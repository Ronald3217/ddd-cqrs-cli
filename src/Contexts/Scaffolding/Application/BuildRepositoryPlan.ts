import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan, PlanFile } from '@/Contexts/Scaffolding/Application/Plan';
import { renderRepositoryTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/RepositoryTemplate';
import {
  renderMongoDBRepository,
  renderMySQLRepository,
  renderInMemoryRepository,
  renderMongooseModel,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/Persistence';

export type DbType = 'mongo' | 'mysql' | 'inmemory';

export class BuildRepositoryPlan {
  build(spec: PieceSpec, contextsRoot: string, dbs: DbType[], importBase: string = '@/Contexts'): GenerationPlan {
    // Repository is special: --name is the entity name, --module is the module/path
    // spec.entityName holds the --module value, spec.action holds the --name value
    const entityActualName = spec.action || spec.entityName;
    const names: EntityNames = deriveEntityNames(entityActualName, spec.context, importBase);
    const base = `${contextsRoot}/${names.context}/${names.entity}`;
    const files: PlanFile[] = [];

    // Always generate the repository interface
    files.push({
      relPath: `${base}/Domain/${names.entity}Repository.ts`,
      content: renderRepositoryTemplate(names),
    });

    // Generate persistence implementations based on --db flag
    for (const db of dbs) {
      switch (db) {
        case 'mongo':
          files.push({
            relPath: `${base}/Infrastructure/Persistence/MongoDB${names.entity}Repository.ts`,
            content: renderMongoDBRepository(names),
          });
          files.push({
            relPath: `${base}/Infrastructure/Persistence/Mongoose${names.entity}Model.ts`,
            content: renderMongooseModel(names),
          });
          break;
        case 'mysql':
          files.push({
            relPath: `${base}/Infrastructure/Persistence/MySQL${names.entity}Repository.ts`,
            content: renderMySQLRepository(names),
          });
          break;
        case 'inmemory':
          files.push({
            relPath: `${base}/Infrastructure/Persistence/InMemory${names.entity}Repository.ts`,
            content: renderInMemoryRepository(names),
          });
          break;
      }
    }

    return { files, registrations: [] };
  }
}
