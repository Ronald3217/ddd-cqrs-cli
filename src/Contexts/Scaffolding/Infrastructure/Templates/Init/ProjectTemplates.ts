export function renderTsConfig(contextName: string): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/Apps/*": ["./src/Apps/*"],
      "@/Contexts/*": ["./src/Contexts/*"],
      "@/Contexts/Shared/*": ["./src/Contexts/Shared/*"],
      "@/Contexts/${contextName}/*": ["./src/Contexts/${contextName}/*"]
    },
    "types": ["node"],
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmitOnError": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noUncheckedIndexedAccess": false,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
}

export function renderPackageJson(projectName: string): string {
  return `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "DDD-CQRS backend application",
  "main": "dist/Apps/Backend/Start.js",
  "scripts": {
    "build": "tsc && tsc-alias",
    "dev": "npx tsx src/Apps/Backend/Start.ts",
    "start": "node dist/Apps/Backend/Start.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "commander": "^12.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.1",
    "nanoid": "^3.3.7",
    "nodemailer": "^6.9.14",
    "sequelize": "^6.37.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/nodemailer": "^6.4.15",
    "@types/node": "^20.14.10",
    "tsc-alias": "^1.8.10",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3"
  }
}
`;
}

export function renderContainer(contextName: string): string {
  return `import { env } from '@/Contexts/Shared/Infrastructure/config/env';
import { CommandBus } from '@/Contexts/Shared/Domain/Bus/CommandBus';
import { QueryBus } from '@/Contexts/Shared/Domain/Bus/QueryBus';
import { EventBus } from '@/Contexts/Shared/Domain/Bus/EventBus';

// Buses
import { InMemoryCommandBus } from '@/Contexts/Shared/Infrastructure/Bus/InMemoryCommandBus';
import { InMemoryQueryBus } from '@/Contexts/Shared/Infrastructure/Bus/InMemoryQueryBus';
import { InMemoryEventBus } from '@/Contexts/Shared/Infrastructure/Bus/InMemoryEventBus';

// Infrastructure services
import { UuidGenerator } from '@/Contexts/Shared/Infrastructure/UuidGenerator';
import { IdGenerator } from '@/Contexts/Shared/Domain/IdGenerator';

export interface ContainerOptions {
  // Add repository options here as you create modules
}

export class Container {
  public readonly commandBus: CommandBus;
  public readonly queryBus: QueryBus;
  public readonly eventBus: EventBus;
  public readonly idGenerator: IdGenerator;

  constructor(options: ContainerOptions = {}) {
    // Services
    this.idGenerator = new UuidGenerator();

    // Event bus (add subscribers here)
    this.eventBus = new InMemoryEventBus([]);

    // Command Handlers -
    this.commandBus = new InMemoryCommandBus([
      // Add command handlers here
    ]);

    // Query Handlers -
    this.queryBus = new InMemoryQueryBus([
      // Add query handlers here
    ]);
  }
}
`;
}

export function renderServerClass(): string {
  return `import express from 'express';
import cors from 'cors';
import { env } from '@/Contexts/Shared/Infrastructure/config/env';
import { corsOptions } from '@/Contexts/Shared/Infrastructure/config/cors';
import { Container } from '@/Apps/Backend/DependencyInjection/Container';

export class Server {
  public app = express();
  public port: number;
  private readonly container?: Container;
  private initialized = false;

  constructor(port?: number, container?: Container) {
    this.port = port ?? env.PORT;
    this.container = container;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const container = this.container ?? new Container();

    this.app.use(cors(corsOptions));
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Add your routers here
  }

  async start(): Promise<void> {
    await this.ensureInitialized();

    this.app.listen(this.port, () => {
      console.log(\`Server running on port \${this.port}\`);
    });
  }
}
`;
}

export function renderStartFile(): string {
  return `import { Server } from '@/Apps/Backend/Server';

const server = new Server();

// Local mode: start HTTP server
if (!process.env.VERCEL) {
  server.start().catch(console.error);
}

// Vercel mode: export handler for serverless
export default async function handler(req: any, res: any) {
  await server.ensureInitialized();
  server.app(req, res);
}
`;
}
