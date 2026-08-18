import { Command } from 'commander';

const HELP_TEXT = `ddd-cqrs — Portable DDD-CQRS scaffolding generator v0.1.0

COMMANDS

  gen module      Generate a full DDD-CQRS module
    Required:     --name <entity>
    Optional:     --fields <name:type,...>  --owned  --no-admin  --context <ctx>  --contexts-root <dir>  --container <file>  --dry-run  --force
    Example:      ddd-cqrs gen module --name BlogPost --fields "title:string,views:number"

  gen command     Generate a Command and CommandHandler
    Required:     --module <entity>  --name <action>
    Optional:     --fields <name:type,...>  --context <ctx>  --contexts-root <dir>  --container <file>  --dry-run  --force
    Example:      ddd-cqrs gen command --module BlogPost --name Publish

  gen query       Generate a Query and QueryHandler
    Required:     --module <entity>  --name <action>
    Optional:     --fields <name:type,...>  --context <ctx>  --contexts-root <dir>  --container <file>  --dry-run  --force
    Example:      ddd-cqrs gen query --module BlogPost --name SearchByTitle --fields "title:string"

  gen controller  Generate Controller and Router
    Required:     --module <entity>
    Optional:     --context <ctx>  --contexts-root <dir>  --container <file>  --dry-run  --force
    Example:      ddd-cqrs gen controller --module BlogPost

  gen schema      Generate Zod schemas (Create/Update)
    Required:     --module <entity>
    Optional:     --fields <name:type,...>  --context <ctx>  --contexts-root <dir>  --dry-run  --force
    Example:      ddd-cqrs gen schema --module BlogPost --fields "title:string"

  help            Show this help

GLOBAL OPTIONS

  --version       Show version number
  --help          Show help for a command

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
