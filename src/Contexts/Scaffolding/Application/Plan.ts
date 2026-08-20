export interface PlanFile {
  relPath: string;
  content: string;
}

export type BusKind = 'command' | 'query';
export type HttpFramework = 'express' | 'elysia';

export interface HandlerRegistration {
  bus: BusKind;
  entity: string;
  handlerClassName: string;
  importPath: string;
  instantiation: string;
  variableName: string;
}

export interface RepositoryWiring {
  context: string;
  entity: string;
  entityCamel: string;
}

export interface GenerationPlan {
  files: PlanFile[];
  registrations: HandlerRegistration[];
  repositoryWiring?: RepositoryWiring;
}
