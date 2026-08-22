import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import {
  // Domain/Bus
  renderCommandBus,
  renderQueryBus,
  renderEventBus,
  // Domain/Commands
  renderCommand,
  renderCommandHandler,
  // Domain/Queries
  renderQuery,
  renderQueryHandler,
  // Domain/Events
  renderDomainEvent,
  renderDomainEventSubscriber,
  // Domain/Core
  renderAggregateRoot,
  renderDomainError,
  renderIdGenerator,
  renderResponse,
  renderSlugGenerator,
  // Domain/Errors
  renderErrorsIndex,
  renderApiError,
  renderBadRequestError,
  renderConflictError,
  renderDatabaseError,
  renderNotFoundError,
  renderUnauthorizedError,
  // Domain/ValueObjects
  renderDateTimeValueObject,
  renderDocumentIdValueObject,
  // Infrastructure/Bus
  renderInMemoryCommandBus,
  renderInMemoryQueryBus,
  renderInMemoryEventBus,
  renderEventEmitterEventBus,
  // Infrastructure/Core
  renderUuidGenerator,
  renderNanoidSlugGenerator,
  // Infrastructure/config
  renderEnvConfig,
  renderCorsConfig,
  // Infrastructure/types
  renderTypesIndex,
  // Infrastructure/Services
  renderPasswordServiceInterface,
  renderBcryptPasswordService,
  renderTokenServiceInterface,
  renderJwtTokenService,
  renderEmailServiceInterface,
  renderNodeMailerEmailService,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/Init/KernelTemplates';
import {
  renderTsConfig,
  renderPackageJson,
  renderContainer,
  renderServerClass,
  renderStartFile,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/Init/ProjectTemplates';

export interface InitOptions {
  contextName: string;
  projectName: string;
  contextsRoot: string;
  includeServices?: boolean; // Default: true
}

export class BuildInitPlan {
  build(options: InitOptions): GenerationPlan {
    const { contextName, projectName, contextsRoot, includeServices = true } = options;
    // Derive importBase from contextsRoot: src/Contexts → @/Contexts, src/MyContexts → @/MyContexts
    const importBase = `@/${contextsRoot.replace(/^.*\bsrc\//, '')}`;
    const shared = `${contextsRoot}/Shared`;
    const files: { relPath: string; content: string }[] = [];

    const addFile = (relPath: string, content: string) => {
      files.push({ relPath, content });
    };

    // ────────────────────────────────────────────────────────────────────────
    // Domain Layer
    // ────────────────────────────────────────────────────────────────────────

    // Domain/Bus
    addFile(`${shared}/Domain/Bus/CommandBus.ts`, renderCommandBus(importBase));
    addFile(`${shared}/Domain/Bus/QueryBus.ts`, renderQueryBus(importBase));
    addFile(`${shared}/Domain/Bus/EventBus.ts`, renderEventBus(importBase));

    // Domain/Commands
    addFile(`${shared}/Domain/Commands/Command.ts`, renderCommand());
    addFile(`${shared}/Domain/Commands/CommandHandler.ts`, renderCommandHandler());

    // Domain/Queries
    addFile(`${shared}/Domain/Queries/Query.ts`, renderQuery());
    addFile(`${shared}/Domain/Queries/QueryHandler.ts`, renderQueryHandler(importBase));

    // Domain/Events
    addFile(`${shared}/Domain/Events/DomainEvent.ts`, renderDomainEvent());
    addFile(`${shared}/Domain/Events/DomainEventSubscriber.ts`, renderDomainEventSubscriber(importBase));

    // Domain/Core
    addFile(`${shared}/Domain/AggregateRoot.ts`, renderAggregateRoot());
    addFile(`${shared}/Domain/DomainError.ts`, renderDomainError());
    addFile(`${shared}/Domain/IdGenerator.ts`, renderIdGenerator());
    addFile(`${shared}/Domain/Response.ts`, renderResponse());
    addFile(`${shared}/Domain/SlugGenerator.ts`, renderSlugGenerator());

    // Domain/Errors
    addFile(`${shared}/Domain/Errors/index.ts`, renderErrorsIndex());
    addFile(`${shared}/Domain/Errors/ApiError.ts`, renderApiError(importBase));
    addFile(`${shared}/Domain/Errors/BadRequestError.ts`, renderBadRequestError(importBase));
    addFile(`${shared}/Domain/Errors/ConflictError.ts`, renderConflictError(importBase));
    addFile(`${shared}/Domain/Errors/DatabaseError.ts`, renderDatabaseError(importBase));
    addFile(`${shared}/Domain/Errors/NotFoundError.ts`, renderNotFoundError(importBase));
    addFile(`${shared}/Domain/Errors/UnauthorizedError.ts`, renderUnauthorizedError(importBase));

    // Domain/ValueObjects
    addFile(`${shared}/Domain/ValueObjects/DateTime.ts`, renderDateTimeValueObject());
    addFile(`${shared}/Domain/ValueObjects/DocumentId.ts`, renderDocumentIdValueObject());

    // ────────────────────────────────────────────────────────────────────────
    // Infrastructure Layer
    // ────────────────────────────────────────────────────────────────────────

    // Infrastructure/Bus
    addFile(`${shared}/Infrastructure/Bus/InMemoryCommandBus.ts`, renderInMemoryCommandBus(importBase));
    addFile(`${shared}/Infrastructure/Bus/InMemoryQueryBus.ts`, renderInMemoryQueryBus(importBase));
    addFile(`${shared}/Infrastructure/Bus/InMemoryEventBus.ts`, renderInMemoryEventBus(importBase));
    addFile(`${shared}/Infrastructure/Bus/EventEmitterEventBus.ts`, renderEventEmitterEventBus(importBase));

    // Infrastructure/Core
    addFile(`${shared}/Infrastructure/UuidGenerator.ts`, renderUuidGenerator());
    addFile(`${shared}/Infrastructure/SlugGenerator.ts`, renderNanoidSlugGenerator(importBase));

    // Infrastructure/config
    addFile(`${shared}/Infrastructure/config/env.ts`, renderEnvConfig());
    addFile(`${shared}/Infrastructure/config/cors.ts`, renderCorsConfig());

    // Infrastructure/types
    addFile(`${shared}/Infrastructure/types/index.ts`, renderTypesIndex());

    // ────────────────────────────────────────────────────────────────────────
    // Infrastructure/Services (optional)
    // ────────────────────────────────────────────────────────────────────────

    if (includeServices) {
      addFile(`${shared}/Domain/Services/PasswordService.ts`, renderPasswordServiceInterface());
      addFile(`${shared}/Infrastructure/Services/BcryptPasswordService.ts`, renderBcryptPasswordService(importBase));
      addFile(`${shared}/Domain/Services/TokenService.ts`, renderTokenServiceInterface());
      addFile(`${shared}/Infrastructure/Services/JwtTokenService.ts`, renderJwtTokenService(importBase));
      addFile(`${shared}/Domain/Services/EmailService.ts`, renderEmailServiceInterface());
      addFile(`${shared}/Infrastructure/Services/NodeMailerEmailService.ts`, renderNodeMailerEmailService(importBase));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Project Root (tsconfig, package.json, Container, server)
    // ────────────────────────────────────────────────────────────────────────

    addFile('tsconfig.json', renderTsConfig(contextName, importBase));
    addFile('package.json', renderPackageJson(projectName));
    addFile(`src/Apps/Backend/DependencyInjection/Container.ts`, renderContainer(contextName, importBase));
    addFile(`src/Apps/Backend/Server.ts`, renderServerClass(importBase));
    addFile(`src/Apps/Backend/Start.ts`, renderStartFile());

    return {
      files,
      registrations: [],
    };
  }
}
