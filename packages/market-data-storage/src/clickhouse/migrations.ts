/**
 * **Versioned schema migrations.** Schema creation is versioned, repeatable, deterministic, and safe
 * to run on every deploy: each migration is a list of idempotent DDL statements, applied in order and
 * recorded in a `schema_migrations` registry table so already-applied versions are skipped. No manual
 * SQL is ever copied to a server — the runner applies them. `now` (the recorded `applied_at`) is
 * passed in, never read from an ambient clock.
 */
import type { ClickHouseClient } from './client';
import { eventTableDdl, migrationsTableDdl } from './schema';

export interface Migration {
  readonly version: number;
  readonly name: string;
  /** Idempotent DDL statements, applied in array order. */
  readonly statements: readonly string[];
}

/** The ordered migration set. Table names are injected so tests can isolate. */
export function migrations(eventTable: string): readonly Migration[] {
  return [
    {
      version: 1,
      name: 'create_market_data_events',
      statements: [eventTableDdl(eventTable)],
    },
  ];
}

export interface MigrationResult {
  readonly applied: readonly number[];
  readonly alreadyApplied: readonly number[];
}

export class MigrationRunner {
  private readonly registryTable: string;

  constructor(
    private readonly client: ClickHouseClient,
    private readonly eventTable = 'market_data_events',
    registryTable = 'schema_migrations',
  ) {
    this.registryTable = registryTable;
  }

  /** Apply all pending migrations. Idempotent: re-running applies nothing new. */
  async migrate(now: number): Promise<MigrationResult> {
    await this.client.command(migrationsTableDdl(this.registryTable));
    const applied = new Set(await this.appliedVersions());

    const justApplied: number[] = [];
    const alreadyApplied: number[] = [];
    for (const migration of migrations(this.eventTable)) {
      if (applied.has(migration.version)) {
        alreadyApplied.push(migration.version);
        continue;
      }
      for (const statement of migration.statements) {
        await this.client.command(statement);
      }
      await this.client.insert(this.registryTable, [
        { version: migration.version, name: migration.name, applied_at: now },
      ]);
      justApplied.push(migration.version);
    }
    return { applied: justApplied, alreadyApplied };
  }

  /** The set of already-applied migration versions. */
  async appliedVersions(): Promise<readonly number[]> {
    const rows = await this.client.query<{ version: number }>(
      `SELECT DISTINCT version FROM ${this.registryTable} FINAL ORDER BY version`,
    );
    return rows.map((r) => Number(r.version));
  }
}
