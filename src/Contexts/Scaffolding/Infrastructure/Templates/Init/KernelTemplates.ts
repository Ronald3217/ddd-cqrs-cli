// ──────────────────────────────────────────────────────────────────────────────
// Domain Layer
// ──────────────────────────────────────────────────────────────────────────────

export function renderCommandBus(importBase: string = '@/Contexts'): string {
  return `import { Command } from '${importBase}/Shared/Domain/Commands/Command';

export interface CommandBus {
  dispatch<C extends Command, R = void>(command: C): Promise<R>;
}
`;
}

export function renderQueryBus(importBase: string = '@/Contexts'): string {
  return `import { Query } from '${importBase}/Shared/Domain/Queries/Query';
import { Response } from '${importBase}/Shared/Domain/Response';

export interface QueryBus {
  ask<T extends Response>(query: Query): Promise<T>;
}
`;
}

export function renderEventBus(importBase: string = '@/Contexts'): string {
  return `import { DomainEvent } from '${importBase}/Shared/Domain/Events/DomainEvent';

export interface EventBus {
  publish(events: DomainEvent[]): void;
}
`;
}

export function renderCommand(): string {
  return `export abstract class Command {}
`;
}

export function renderCommandHandler(): string {
  return `import { Command } from './Command';

export interface CommandHandler<T extends Command, R = void> {
  handle(command: T): Promise<R>;
  subscribedTo(): new (...args: any[]) => T;
}
`;
}

export function renderQuery(): string {
  return `export abstract class Query {}
`;
}

export function renderQueryHandler(importBase: string = '@/Contexts'): string {
  return `import { Query } from './Query';
import { Response } from '${importBase}/Shared/Domain/Response';

export interface QueryHandler<T extends Query, R extends Response> {
  handle(query: T): Promise<R>;
  subscribedTo(): new (...args: any[]) => T;
}
`;
}

export function renderDomainEvent(): string {
  return `export abstract class DomainEvent {
  public readonly aggregateId: string;
  public readonly eventId: string;
  public readonly occurredOn: Date;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
  }

  abstract toPrimitives(): Record<string, unknown>;
}
`;
}

export function renderDomainEventSubscriber(importBase: string = '@/Contexts'): string {
  return `import { DomainEvent } from '${importBase}/Shared/Domain/Events/DomainEvent';

export interface DomainEventSubscriber<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  subscribedTo(): new (...args: any[]) => T;
}
`;
}

export function renderAggregateRoot(): string {
  return `import { DomainEvent } from './Events/DomainEvent';

export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
`;
}

export function renderDomainError(): string {
  return `export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
`;
}

export function renderIdGenerator(): string {
  return `export interface IdGenerator {
  generate(): string;
}
`;
}

export function renderResponse(): string {
  return `export interface Response {}
`;
}

export function renderSlugGenerator(): string {
  return `export interface SlugGenerator {
  generate(): string;
}
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Domain/Errors
// ──────────────────────────────────────────────────────────────────────────────

export function renderErrorsIndex(): string {
  return `export { ApiError } from './ApiError';
export { BadRequestError } from './BadRequestError';
export { DatabaseError } from './DatabaseError';
export { NotFoundError } from './NotFoundError';
export { ConflictError } from './ConflictError';
export { UnauthorizedError } from './UnauthorizedError';
`;
}

export function renderApiError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class ApiError extends DomainError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode);
  }
}
`;
}

export function renderBadRequestError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}
`;
}

export function renderConflictError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}
`;
}

export function renderDatabaseError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class DatabaseError extends DomainError {
  constructor(message: string) {
    super(message, 500);
  }
}
`;
}

export function renderNotFoundError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class NotFoundError extends DomainError {
  constructor(resource: string = 'Resource') {
    super(\`\${resource} not found\`, 404);
  }
}
`;
}

export function renderUnauthorizedError(importBase: string = '@/Contexts'): string {
  return `import { DomainError } from '${importBase}/Shared/Domain/DomainError';

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Domain/ValueObjects
// ──────────────────────────────────────────────────────────────────────────────

export function renderDateTimeValueObject(): string {
  return `export class DateTime {
  private readonly _value: Date;

  constructor(value?: Date | string) {
    const date = value ? new Date(value) : new Date();
    if (isNaN(date.getTime())) {
      throw new Error('Invalid Date');
    }
    this._value = date;
  }

  get value(): Date {
    return this._value;
  }

  isBefore(other: DateTime): boolean {
    return this._value.getTime() < other.value.getTime();
  }

  equals(other: DateTime): boolean {
    return this._value.getTime() === other.value.getTime();
  }
}
`;
}

export function renderDocumentIdValueObject(): string {
  return `export class DocumentId {
  private _value: string;

  constructor(id: string) {
    this._value = id;
  }

  get value(): string {
    return this._value;
  }

  equals(id: string | DocumentId): boolean {
    if (typeof id === 'string') return this._value === id;
    return this._value === id.value;
  }
}
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Infrastructure Layer
// ──────────────────────────────────────────────────────────────────────────────

export function renderInMemoryCommandBus(importBase: string = '@/Contexts'): string {
  return `import { CommandBus } from '${importBase}/Shared/Domain/Bus/CommandBus';
import { Command } from '${importBase}/Shared/Domain/Commands/Command';
import { CommandHandler } from '${importBase}/Shared/Domain/Commands/CommandHandler';

export class InMemoryCommandBus implements CommandBus {
  private handlers: Map<string, CommandHandler<Command, unknown>> = new Map();

  constructor(handlers: CommandHandler<Command, unknown>[]) {
    for (const handler of handlers) {
      this.handlers.set(handler.subscribedTo().name, handler);
    }
  }

  async dispatch<C extends Command, R = void>(command: C): Promise<R> {
    const handler = this.handlers.get(command.constructor.name) as CommandHandler<C, R> | undefined;

    if (!handler) {
      throw new Error(\`No handler registered for command: \${command.constructor.name}\`);
    }

    return handler.handle(command);
  }
}
`;
}

export function renderInMemoryQueryBus(importBase: string = '@/Contexts'): string {
  return `import { QueryBus } from '${importBase}/Shared/Domain/Bus/QueryBus';
import { Query } from '${importBase}/Shared/Domain/Queries/Query';
import { QueryHandler } from '${importBase}/Shared/Domain/Queries/QueryHandler';
import { Response } from '${importBase}/Shared/Domain/Response';

export class InMemoryQueryBus implements QueryBus {
  private handlers: Map<string, QueryHandler<Query, Response>> = new Map();

  constructor(handlers: QueryHandler<Query, Response>[]) {
    for (const handler of handlers) {
      this.handlers.set(handler.subscribedTo().name, handler);
    }
  }

  async ask<T extends Response>(query: Query): Promise<T> {
    const handler = this.handlers.get(query.constructor.name);

    if (!handler) {
      throw new Error(\`No handler registered for query: \${query.constructor.name}\`);
    }

    return await handler.handle(query) as T;
  }
}
`;
}

export function renderInMemoryEventBus(importBase: string = '@/Contexts'): string {
  return `import { EventBus } from '${importBase}/Shared/Domain/Bus/EventBus';
import { DomainEvent } from '${importBase}/Shared/Domain/Events/DomainEvent';
import { DomainEventSubscriber } from '${importBase}/Shared/Domain/Events/DomainEventSubscriber';

export class InMemoryEventBus implements EventBus {
  private subscribers: Map<string, DomainEventSubscriber<DomainEvent>[]>;

  constructor(subscribers: DomainEventSubscriber<DomainEvent>[] = []) {
    this.subscribers = new Map();

    for (const subscriber of subscribers) {
      const eventName = subscriber.subscribedTo().name;
      const existing = this.subscribers.get(eventName) ?? [];
      existing.push(subscriber);
      this.subscribers.set(eventName, existing);
    }
  }

  publish(events: DomainEvent[]): void {
    for (const event of events) {
      const eventName = event.constructor.name;
      const subscribers = this.subscribers.get(eventName) ?? [];

      for (const subscriber of subscribers) {
        setImmediate(() => {
          subscriber.handle(event).catch((error) => {
            console.error('[%s] Subscriber error:', eventName, error);
          });
        });
      }
    }
  }
}
`;
}

export function renderEventEmitterEventBus(importBase: string = '@/Contexts'): string {
  return `import { EventEmitter } from 'events';
import { EventBus } from '${importBase}/Shared/Domain/Bus/EventBus';
import { DomainEvent } from '${importBase}/Shared/Domain/Events/DomainEvent';
import { DomainEventSubscriber } from '${importBase}/Shared/Domain/Events/DomainEventSubscriber';

export class EventEmitterEventBus implements EventBus {
  private emitter: EventEmitter;

  constructor(
    subscribers: DomainEventSubscriber<DomainEvent>[] = [],
    maxListeners: number = 20,
  ) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(maxListeners);

    for (const subscriber of subscribers) {
      const eventClass = subscriber.subscribedTo();

      this.emitter.on(eventClass.name, (event: DomainEvent) => {
        setImmediate(() => {
          subscriber.handle(event).catch((error) => {
            console.error(
              '[%s] Subscriber error:',
              event.constructor.name,
              error,
            );
          });
        });
      });
    }
  }

  publish(events: DomainEvent[]): void {
    for (const event of events) {
      this.emitter.emit(event.constructor.name, event);
    }
  }
}
`;
}

export function renderUuidGenerator(): string {
  return `import crypto from 'crypto';
import { IdGenerator } from '../Domain/IdGenerator';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
`;
}

export function renderNanoidSlugGenerator(importBase: string = '@/Contexts'): string {
  return `import { customRandom, random, urlAlphabet } from 'nanoid';
import { SlugGenerator } from '${importBase}/Shared/Domain/SlugGenerator';

export class NanoIdSlugGenerator implements SlugGenerator {
  private readonly generateSlug = customRandom(urlAlphabet, 10, random);

  generate(): string {
    return this.generateSlug();
  }
}
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Infrastructure/config
// ──────────────────────────────────────────────────────────────────────────────

export function renderEnvConfig(): string {
  return `import 'dotenv/config';

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  DB_MODE: JSON.parse(process.env.DB_MODE || 'true'), // true=mongodb, false=mysql
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  SECRET_KEY: process.env.SECRET_KEY,
  SECRET_IV: process.env.SECRET_IV,
  ENCRYPTION_METHOD: process.env.ENCRYPTION_METHOD,
  NODEMAILER_USER: process.env.NODEMAILER_USER,
  NODEMAILER_PASS: process.env.NODEMAILER_PASS,
  FRONTEND_URI: process.env.FRONTEND_URI,
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
};
`;
}

export function renderCorsConfig(): string {
  return `const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
};

export { corsOptions };
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Infrastructure/types
// ──────────────────────────────────────────────────────────────────────────────

export function renderTypesIndex(): string {
  return `import { Request } from 'express';

export interface CustomRequest extends Request {
  id: string;
  role: string;
  device: string;
  os: string;
  platform: string;
  browser: string;
  browserVersion: string;
  clientIp: string;
}
`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Infrastructure/Services (optional, included for completeness)
// ──────────────────────────────────────────────────────────────────────────────

export function renderPasswordServiceInterface(): string {
  return `export interface PasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
`;
}

export function renderBcryptPasswordService(importBase: string = '@/Contexts'): string {
  return `import bcrypt from 'bcrypt';
import { PasswordService } from '${importBase}/Shared/Domain/Services/PasswordService';

export class BcryptPasswordService implements PasswordService {
  private readonly saltRounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
`;
}

export function renderTokenServiceInterface(): string {
  return `export interface TokenService {
  generate(payload: Record<string, unknown>): string;
  verify(token: string): Record<string, unknown> | null;
}
`;
}

export function renderJwtTokenService(importBase: string = '@/Contexts'): string {
  return `import jwt from 'jsonwebtoken';
import { TokenService } from '${importBase}/Shared/Domain/Services/TokenService';

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  generate(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.secret, { expiresIn: '24h' });
  }

  verify(token: string): Record<string, unknown> | null {
    try {
      return jwt.verify(token, this.secret) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
`;
}

export function renderEmailServiceInterface(): string {
  return `export interface EmailService {
  send(to: string, subject: string, html: string): Promise<void>;
}
`;
}

export function renderNodeMailerEmailService(importBase: string = '@/Contexts'): string {
  return `import nodemailer from 'nodemailer';
import { EmailService } from '${importBase}/Shared/Domain/Services/EmailService';

export class NodeMailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor(user: string, pass: string) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: process.env.NODEMAILER_USER, to, subject, html });
  }
}
`;
}
