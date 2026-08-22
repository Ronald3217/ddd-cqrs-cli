import { Command } from 'commander';

const HELP_TEXT = `ddd-cqrs — Portable DDD-CQRS scaffolding generator v0.2.0

PROJECT INITIALIZATION

  init              Bootstrap a new project with Shared Kernel (~43 files)
    Required:       --name <project>
    Optional:       --target <dir>  --context <ctx>  --contexts-root <dir>  --no-services  --dry-run  --force
    Example:        ddd-cqrs init --name my-backend
    Example:        ddd-cqrs init --name my-backend --target /path/to/project
    Example:        ddd-cqrs init --name my-backend --dry-run

    NOTE: Generates Express-specific files by default (types, cors, server.ts).
          If using Elysia/Fastify, delete those files and create your HTTP layer.

MODULE GENERATION

  gen module        Generate a full DDD-CQRS module (17 files)
    Required:       --name <entity>
    Optional:       --fields <name:type,...>  --context <ctx>  --contexts-root <dir>  --container <file>  --dry-run  --force
    Example:        ddd-cqrs gen module --name BlogPost --fields "title:string,views:number"

ATOMICS

  gen entity        Generate Entity class
    Required:       --module <entity>  --name <entityName>
    Optional:       --fields <name:type,...>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen entity --module BlogPost --name BlogPost --fields "title:string"

  gen repository    Generate Repository interface + persistence implementations
    Required:       --module <entity>  --name <entityName>
    Optional:       --db <mongo,mysql,inmemory>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen repository --module BlogPost --name BlogPost --db "mongo,mysql"
    Example:        ddd-cqrs gen repository --module User --name User --db "inmemory"

  gen value-object  Generate a Value Object class
    Required:       --module <entity>  --name <voName>  --type <type>
    Optional:       --fields <name:type,...> (for object type)  --context <ctx>  --dry-run  --force
    --module:       PascalCase name, 'Shared' (global kernel), or 'BC/Shared' (BC-level)
    Types:          string, number, boolean, Date, string[], object
    Example:        ddd-cqrs gen value-object --module User --name Email --type string
    Example:        ddd-cqrs gen value-object --module Shared --name Email --type string
    Example:        ddd-cqrs gen value-object --module User --name Address --type object --fields "street:string,city:string"

  gen error         Generate a Domain Error class
    Required:       --module <entity>  --name <errorName>
    Optional:       --message <msg>  --status <code>  --context <ctx>  --dry-run  --force
    --module:       PascalCase name, 'Shared' (global kernel), or 'BC/Shared' (BC-level)
    Example:        ddd-cqrs gen error --module User --name InvalidCredentialsError --message "Invalid credentials" --status 401
    Example:        ddd-cqrs gen error --module Shared --name NotFoundError --message "Not found" --status 404
    Example:        ddd-cqrs gen error --module AdLinksManager/Shared --name LinkNotFoundError --message "Link not found" --status 404

  gen event         Generate a Domain Event class
    Required:       --module <entity>  --name <eventName>
    Optional:       --fields <name:type,...>  --context <ctx>  --dry-run  --force
    --module:       PascalCase name, 'Shared' (global kernel), or 'BC/Shared' (BC-level)
    Example:        ddd-cqrs gen event --module Link --name LinkCreatedDomainEvent --fields "title:string"
    Example:        ddd-cqrs gen event --module Shared --name SystemStartedEvent --fields "timestamp:string"
    Example:        ddd-cqrs gen event --module AdLinksManager/Shared --name PaymentProcessedEvent --fields "amount:number"

  gen subscriber    Generate a Domain Event Subscriber
    Required:       --module <entity>  --name <subscriberName>  --event <eventName>
    Optional:       --fields <name:type,...> (dependencies)  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen subscriber --module User --name SendWelcomeEmail --event UserRegisteredDomainEvent

  gen service       Generate Domain Service interface + implementation
    Required:       --module <entity>  --name <serviceName>
    Optional:       --methods <method1,method2>  --impl-name <className>  --context <ctx>  --dry-run  --force
    --module:       PascalCase name, 'Shared' (global kernel), or 'BC/Shared' (BC-level)
    Example:        ddd-cqrs gen service --module User --name PasswordService --methods "hash,compare"
    Example:        ddd-cqrs gen service --module Shared --name PasswordService --methods "hash,compare" --impl-name BcryptPasswordService
    Example:        ddd-cqrs gen service --module AdLinksManager/Shared --name AuthService --methods "validate,authenticate" --impl-name JwtAuthService

  gen command       Generate a Command and CommandHandler
    Required:       --module <entity>  --name <action>
    Optional:       --fields <name:type,...>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen command --module BlogPost --name Publish

  gen query         Generate a Query and QueryHandler
    Required:       --module <entity>  --name <action>
    Optional:       --fields <name:type,...>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen query --module BlogPost --name SearchByTitle --fields "title:string"

  gen controller    Generate Controller
    Required:       --module <entity>
    Optional:       --http <express,elysia>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen controller --module BlogPost

  gen router        Generate Router
    Required:       --module <entity>
    Optional:       --http <express,elysia>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen router --module BlogPost

  gen schema        Generate Zod schemas (Create/Update)
    Required:       --module <entity>
    Optional:       --fields <name:type,...>  --context <ctx>  --dry-run  --force
    Example:        ddd-cqrs gen schema --module BlogPost --fields "title:string"

  help              Show this help

GLOBAL OPTIONS

  --version         Show version number
  --help            Show help for a command

CONFIG

  Create ddd-cqrs.config.json in your project root:
  {
    "contextRoot": "src/Contexts",
    "defaultContext": "MyContext",
    "containerPath": "src/Apps/Backend/DependencyInjection/Container.ts"
  }
`;

export function registerHelpCommand(program: Command): void {
  program
    .command('help')
    .description('Show this help')
    .action(() => {
      console.log(HELP_TEXT);
    });
}
