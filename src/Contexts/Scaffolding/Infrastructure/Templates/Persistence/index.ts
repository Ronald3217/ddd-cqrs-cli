import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import { renderMongoDBRepositoryTemplate } from './MongoDB/MongoDBRepositoryTemplate';
import { renderMongooseModelTemplate } from './MongoDB/MongooseModelTemplate';
import { renderMySQLRepositoryTemplate } from './MySQL/MySQLRepositoryTemplate';
import { renderInMemoryRepositoryTemplate } from './InMemory/InMemoryRepositoryTemplate';

// Re-export individual templates
export { renderMongoDBRepositoryTemplate } from './MongoDB/MongoDBRepositoryTemplate';
export { renderMongooseModelTemplate } from './MongoDB/MongooseModelTemplate';
export { renderMySQLRepositoryTemplate } from './MySQL/MySQLRepositoryTemplate';
export { renderInMemoryRepositoryTemplate } from './InMemory/InMemoryRepositoryTemplate';

// Legacy names for backward compatibility
export const renderMongoDBRepository = renderMongoDBRepositoryTemplate;
export const renderMongooseModel = renderMongooseModelTemplate;
export const renderMySQLRepository = renderMySQLRepositoryTemplate;
export const renderInMemoryRepository = renderInMemoryRepositoryTemplate;
