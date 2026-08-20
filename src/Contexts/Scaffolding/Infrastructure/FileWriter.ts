import * as path from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

export interface WriteResult {
  filePath: string;
  status: 'created' | 'skipped' | 'overwritten';
}

export interface FileWriterOptions {
  force: boolean;
  dryRun: boolean;
  baseDir?: string;
}

export class FileWriter {
  constructor(private readonly options: FileWriterOptions) {}

  write(relativePath: string, content: string): WriteResult {
    const abs = this.options.baseDir
      ? path.resolve(this.options.baseDir, relativePath)
      : path.resolve(relativePath);
    const existed = existsSync(abs);

    if (existed && !this.options.force) {
      return { filePath: abs, status: 'skipped' };
    }

    const status: WriteResult['status'] = existed ? 'overwritten' : 'created';

    if (!this.options.dryRun) {
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, content, 'utf-8');
    }

    return { filePath: abs, status };
  }
}
