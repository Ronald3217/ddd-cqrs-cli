export class ScaffoldingError extends Error {
  constructor(message: string) {
    super(`[ddd-cqrs] ${message}`);
    this.name = 'ScaffoldingError';
  }
}
