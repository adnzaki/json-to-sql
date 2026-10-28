import type {
  ColumnDefinition,
  ForeignKeyRelation,
  SqlDialect,
  SqlGeneratorOptions,
  TableDefinition,
} from '../types/schema';

export function generateSqlScript(
  tables: TableDefinition[],
  relations: ForeignKeyRelation[],
  options: SqlGeneratorOptions
): string {
  const isMysql = options.dialect === 'mysql';
  const q = isMysql ? (id: string) => `\`${id}\`` : (id: string) => `"${id}"`;

  const lines: string[] = [];

  // Header Banner
  const timestamp = new Date().toISOString();
  lines.push(`-- ====================================================================`);
  lines.push(`-- SchemaCraft SQL Script`);
  lines.push(`-- Target Engine : ${isMysql ? 'MySQL 8.0+ / MariaDB' : 'PostgreSQL 14+'}`);
  lines.push(`-- Generated At  : ${timestamp}`);
  lines.push(`-- Total Tables  : ${tables.length}`);
  lines.push(`-- Total Relations: ${relations.length}`);
  lines.push(`-- ====================================================================\n`);

  if (options.useTransactions) {
    lines.push(isMysql ? 'START TRANSACTION;' : 'BEGIN;');
    lines.push('');
  }

  // Database / Schema creation
  if (options.includeCreateDatabase && options.databaseName) {
    if (isMysql) {
      lines.push(`-- Create & Select Database`);
      lines.push(
        `CREATE DATABASE IF NOT EXISTS ${q(options.databaseName)} CHARACTER SET ${options.mysqlCharset || 'utf8mb4'} COLLATE utf8mb4_unicode_ci;`
      );
      lines.push(`USE ${q(options.databaseName)};\n`);
    } else {
      lines.push(`-- Create & Set Schema`);
      lines.push(`CREATE SCHEMA IF NOT EXISTS ${q(options.databaseName)};`);
      lines.push(`SET search_path TO ${q(options.databaseName)}, public;\n`);
    }
  }

  // Drop tables in reverse order to respect foreign key dependencies
  if (options.includeDropTable) {
    lines.push(`-- --------------------------------------------------------------------`);
    lines.push(`-- Drop Existing Tables`);
    lines.push(`-- --------------------------------------------------------------------`);

    if (isMysql) {
      lines.push('SET FOREIGN_KEY_CHECKS = 0;');
      for (let i = tables.length - 1; i >= 0; i--) {
        lines.push(`DROP TABLE IF EXISTS ${q(tables[i].name)};`);
      }
      lines.push('SET FOREIGN_KEY_CHECKS = 1;\n');
    } else {
      for (let i = tables.length - 1; i >= 0; i--) {
        lines.push(`DROP TABLE IF EXISTS ${q(tables[i].name)} CASCADE;`);
      }
      lines.push('');
    }
  }

  // Create Tables
  lines.push(`-- --------------------------------------------------------------------`);
  lines.push(`-- Table Definitions`);
  lines.push(`-- --------------------------------------------------------------------`);

  tables.forEach((table) => {
    lines.push(generateCreateTableStatement(table, relations, options, q));
    lines.push('');
  });

  // Table & Column comments for PostgreSQL
  if (!isMysql && options.includeComments) {
    lines.push(`-- --------------------------------------------------------------------`);
    lines.push(`-- Metadata & Documentation Comments`);
    lines.push(`-- --------------------------------------------------------------------`);
    tables.forEach((table) => {
      if (table.comment) {
        lines.push(`COMMENT ON TABLE ${q(table.name)} IS '${escapeComment(table.comment)}';`);
      }
      table.columns.forEach((col) => {
        if (col.comment) {
          lines.push(`COMMENT ON COLUMN ${q(table.name)}.${q(col.name)} IS '${escapeComment(col.comment)}';`);
        }
      });
    });
    lines.push('');
  }

  // Separate Indexes if requested
  if (options.includeIndexes) {
    const indexStatements = generateIndexStatements(tables, options, q);
    if (indexStatements.length > 0) {
      lines.push(`-- --------------------------------------------------------------------`);
      lines.push(`-- Indexes`);
      lines.push(`-- --------------------------------------------------------------------`);
      indexStatements.forEach((stmt) => lines.push(stmt));
      lines.push('');
    }
  }

  // Insert Data rows
  if (options.includeData) {
    lines.push(`-- --------------------------------------------------------------------`);
    lines.push(`-- Sample Data Seed`);
    lines.push(`-- --------------------------------------------------------------------`);

    tables.forEach((table) => {
      const insertStmts = generateInsertStatements(table, options, q);
      if (insertStmts.length > 0) {
        lines.push(`-- Seed for ${table.name}`);
        insertStmts.forEach((stmt) => lines.push(stmt));
        lines.push('');
      }
    });
  }

  if (options.useTransactions) {
    lines.push('COMMIT;\n');
  }

  return lines.join('\n');
}

function generateCreateTableStatement(
  table: TableDefinition,
  relations: ForeignKeyRelation[],
  options: SqlGeneratorOptions,
  q: (id: string) => string
): string {
  const isMysql = options.dialect === 'mysql';
  const columnDefs: string[] = [];
  const primaryKeys: string[] = [];
  const tableFks = relations.filter((r) => r.fromTable === table.name);

  table.columns.forEach((col) => {
    columnDefs.push(`  ${generateColumnSql(col, isMysql, options, q)}`);
    if (col.isPrimaryKey) {
      primaryKeys.push(q(col.name));
    }
  });

  // MySQL allows PRIMARY KEY (...) constraint definition at table level
  if (primaryKeys.length > 0) {
    columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  // Foreign key constraints (if included inline)
  if (options.includeForeignKeys && tableFks.length > 0) {
    tableFks.forEach((fk) => {
      const constraintName = isMysql
        ? `fk_${table.name}_${fk.fromColumn}`.slice(0, 64)
        : `fk_${table.name}_${fk.fromColumn}`.slice(0, 63);

      columnDefs.push(
        `  CONSTRAINT ${q(constraintName)} FOREIGN KEY (${q(fk.fromColumn)}) REFERENCES ${q(fk.toTable)} (${q(
          fk.toColumn
        )}) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`
      );
    });
  }

  let sql = `CREATE TABLE IF NOT EXISTS ${q(table.name)} (\n`;
  sql += columnDefs.join(',\n');
  sql += `\n)`;

  if (isMysql) {
    sql += ` ENGINE=${options.mysqlEngine || 'InnoDB'} DEFAULT CHARSET=${options.mysqlCharset || 'utf8mb4'}`;
    if (options.includeComments && table.comment) {
      sql += ` COMMENT='${escapeComment(table.comment)}'`;
    }
  }

  sql += ';';
  return sql;
}

function generateColumnSql(
  col: ColumnDefinition,
  isMysql: boolean,
  options: SqlGeneratorOptions,
  q: (id: string) => string
): string {
  const parts: string[] = [q(col.name)];
  const typeStr = mapColumnTypeToDialect(col, isMysql, options);
  parts.push(typeStr);

  if (!col.isNullable && !typeStr.includes('BIGSERIAL') && !typeStr.includes('SERIAL')) {
    parts.push('NOT NULL');
  }

  if (isMysql && col.isAutoIncrement) {
    parts.push('AUTO_INCREMENT');
  }

  if (col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue !== '') {
    if (col.defaultValue === 'CURRENT_TIMESTAMP' || col.defaultValue.toUpperCase().includes('NOW()')) {
      parts.push(`DEFAULT CURRENT_TIMESTAMP`);
    } else {
      parts.push(`DEFAULT ${formatSqlValue(col.defaultValue, col.dataType, isMysql)}`);
    }
  }

  if (col.isUnique && !col.isPrimaryKey) {
    parts.push('UNIQUE');
  }

  if (isMysql && options.includeComments && col.comment) {
    parts.push(`COMMENT '${escapeComment(col.comment)}'`);
  }

  return parts.join(' ');
}

function mapColumnTypeToDialect(
  col: ColumnDefinition,
  isMysql: boolean,
  options: SqlGeneratorOptions
): string {
  const dt = col.dataType;

  if (isMysql) {
    switch (dt) {
      case 'INT':
        return 'INT';
      case 'BIGINT':
        return 'BIGINT';
      case 'SMALLINT':
        return 'SMALLINT';
      case 'DECIMAL':
        return `DECIMAL(${col.lengthOrPrecision || '12,2'})`;
      case 'FLOAT':
        return 'FLOAT';
      case 'DOUBLE':
        return 'DOUBLE';
      case 'VARCHAR':
        return `VARCHAR(${col.lengthOrPrecision || '255'})`;
      case 'CHAR':
        return `CHAR(${col.lengthOrPrecision || '1'})`;
      case 'TEXT':
        return 'TEXT';
      case 'LONGTEXT':
        return 'LONGTEXT';
      case 'BOOLEAN':
        return 'TINYINT(1)';
      case 'DATE':
        return 'DATE';
      case 'TIME':
        return 'TIME';
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'DATETIME';
      case 'JSON':
      case 'JSONB':
        return 'JSON';
      case 'UUID':
        return 'VARCHAR(36)';
      case 'SERIAL':
        return 'INT';
      case 'BIGSERIAL':
        return 'BIGINT';
      default:
        return 'VARCHAR(255)';
    }
  } else {
    // PostgreSQL
    switch (dt) {
      case 'INT':
        if (col.isAutoIncrement) {
          return options.postgresIdentityStyle === 'identity'
            ? 'INTEGER GENERATED ALWAYS AS IDENTITY'
            : 'SERIAL';
        }
        return 'INTEGER';
      case 'BIGINT':
        if (col.isAutoIncrement) {
          return options.postgresIdentityStyle === 'identity'
            ? 'BIGINT GENERATED ALWAYS AS IDENTITY'
            : 'BIGSERIAL';
        }
        return 'BIGINT';
      case 'SMALLINT':
        return 'SMALLINT';
      case 'DECIMAL':
        return `NUMERIC(${col.lengthOrPrecision || '12,2'})`;
      case 'FLOAT':
        return 'REAL';
      case 'DOUBLE':
        return 'DOUBLE PRECISION';
      case 'VARCHAR':
        return `VARCHAR(${col.lengthOrPrecision || '255'})`;
      case 'CHAR':
        return `CHAR(${col.lengthOrPrecision || '1'})`;
      case 'TEXT':
      case 'LONGTEXT':
        return 'TEXT';
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'DATE':
        return 'DATE';
      case 'TIME':
        return 'TIME';
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'TIMESTAMP WITH TIME ZONE';
      case 'JSON':
      case 'JSONB':
        return 'JSONB';
      case 'UUID':
        return 'UUID';
      case 'SERIAL':
        return 'SERIAL';
      case 'BIGSERIAL':
        return 'BIGSERIAL';
      default:
        return 'VARCHAR(255)';
    }
  }
}

function generateIndexStatements(
  tables: TableDefinition[],
  options: SqlGeneratorOptions,
  q: (id: string) => string
): string[] {
  const isMysql = options.dialect === 'mysql';
  const stmts: string[] = [];

  tables.forEach((table) => {
    table.columns.forEach((col) => {
      // Don't duplicate PK or UNIQUE which already create automatic indexes
      if (col.isIndex && !col.isPrimaryKey && !col.isUnique) {
        const indexName = `idx_${table.name}_${col.name}`.slice(0, 60);
        if (isMysql) {
          stmts.push(`CREATE INDEX ${q(indexName)} ON ${q(table.name)} (${q(col.name)});`);
        } else {
          stmts.push(`CREATE INDEX IF NOT EXISTS ${q(indexName)} ON ${q(table.name)} (${q(col.name)});`);
        }
      }
    });
  });

  return stmts;
}

function generateInsertStatements(
  table: TableDefinition,
  options: SqlGeneratorOptions,
  q: (id: string) => string
): string[] {
  if (!table.rows || table.rows.length === 0) return [];

  const isMysql = options.dialect === 'mysql';
  const validColumns = table.columns.filter((c) => !c.isAutoIncrement || options.includeData);
  const colNames = validColumns.map((c) => q(c.name)).join(', ');

  const stmts: string[] = [];
  const batchSize = Math.max(1, options.batchInsertSize || 50);

  for (let i = 0; i < table.rows.length; i += batchSize) {
    const batch = table.rows.slice(i, i + batchSize);
    const valueTuples: string[] = [];

    batch.forEach((row) => {
      const rowValues = validColumns.map((col) => {
        const rawVal = row[col.name];
        return formatSqlValue(rawVal, col.dataType, isMysql);
      });
      valueTuples.push(`  (${rowValues.join(', ')})`);
    });

    const stmt = `INSERT INTO ${q(table.name)} (${colNames}) VALUES\n${valueTuples.join(',\n')};`;
    stmts.push(stmt);
  }

  return stmts;
}

function formatSqlValue(value: any, dataType: string, isMysql: boolean): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    if (isMysql) return value ? '1' : '0';
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 'NULL' : String(value);
  }

  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return `'${escapeString(jsonStr)}'`;
  }

  const str = String(value);

  // If boolean string
  if (dataType === 'BOOLEAN') {
    const isTrue = str === 'true' || str === '1';
    return isMysql ? (isTrue ? '1' : '0') : isTrue ? 'TRUE' : 'FALSE';
  }

  // String escaping
  return `'${escapeString(str)}'`;
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function escapeComment(comment: string): string {
  return comment.replace(/'/g, "''");
}
