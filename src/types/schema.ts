export type SqlDialect = 'mysql' | 'postgres';

export type ColumnDataType =
  | 'INT'
  | 'BIGINT'
  | 'SMALLINT'
  | 'DECIMAL'
  | 'FLOAT'
  | 'DOUBLE'
  | 'VARCHAR'
  | 'CHAR'
  | 'TEXT'
  | 'LONGTEXT'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'TIMESTAMP'
  | 'JSON'
  | 'JSONB'
  | 'UUID'
  | 'SERIAL'
  | 'BIGSERIAL';

export interface ColumnDefinition {
  id: string;
  name: string;
  dataType: ColumnDataType;
  lengthOrPrecision?: string; // e.g. "255" or "10,2"
  isNullable: boolean;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  isUnique: boolean;
  isIndex: boolean;
  defaultValue?: string;
  comment?: string;
  foreignKey?: {
    targetTable: string;
    targetColumn: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  };
  sampleValues?: any[];
}

export interface TableDefinition {
  id: string;
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
  rows: Record<string, any>[]; // Captured sample data rows
  primaryKeyColumn?: string;
  position?: { x: number; y: number }; // For visual ERD layout
}

export interface ForeignKeyRelation {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface OptimizationOptions {
  normalizationLevel: 'flat' | '1nf' | '3nf_relational';
  idStrategy: 'bigint_auto' | 'uuid' | 'int_auto';
  caseConvention: 'snake_case' | 'camelCase' | 'preserve';
  pluralizeTableNames: boolean;
  addTimestamps: boolean;
  addSoftDelete: boolean;
  autoIndexForeignKeys: boolean;
  detectEnums: boolean;
  optimizeVarcharLength: boolean;
  stringThresholdForText: number; // characters above which VARCHAR turns into TEXT
}

export interface SqlGeneratorOptions {
  dialect: SqlDialect;
  includeData: boolean;
  includeDropTable: boolean;
  includeCreateDatabase: boolean;
  databaseName: string;
  includeForeignKeys: boolean;
  includeIndexes: boolean;
  includeComments: boolean;
  useTransactions: boolean;
  batchInsertSize: number;
  postgresIdentityStyle: 'serial' | 'identity'; // SERIAL vs GENERATED ALWAYS AS IDENTITY
  mysqlEngine: 'InnoDB' | 'MyISAM';
  mysqlCharset: string;
}

export interface PresetSample {
  id: string;
  name: string;
  description: string;
  category: string;
  data: any;
}
