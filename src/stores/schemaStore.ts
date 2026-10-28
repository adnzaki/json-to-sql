import { defineStore } from 'pinia';
import { samplePresets } from '../presets/sampleData';
import type {
  ColumnDefinition,
  ForeignKeyRelation,
  OptimizationOptions,
  SqlDialect,
  SqlGeneratorOptions,
  TableDefinition,
} from '../types/schema';
import {
  generateDbml,
  generatePrismaSchema,
  generateTypeScriptInterfaces,
} from '../utils/extraExporters';
import { normalizeJsonToSchema } from '../utils/normalizer';
import { generateSqlScript } from '../utils/sqlGenerator';

const initialDefaultPreset = samplePresets[0];

export const useSchemaStore = defineStore('schema', {
  state: () => ({
    rawJsonText: JSON.stringify(initialDefaultPreset.data, null, 2),
    rootTableName: 'orders',
    parseError: null as string | null,
    isAnalyzing: false,

    optimizationOptions: {
      normalizationLevel: '3nf_relational' as const,
      idStrategy: 'bigint_auto' as const,
      caseConvention: 'snake_case' as const,
      pluralizeTableNames: true,
      addTimestamps: true,
      addSoftDelete: false,
      autoIndexForeignKeys: true,
      detectEnums: true,
      optimizeVarcharLength: true,
      stringThresholdForText: 255,
    } as OptimizationOptions,

    sqlOptions: {
      dialect: 'mysql' as SqlDialect,
      includeData: true,
      includeDropTable: true,
      includeCreateDatabase: true,
      databaseName: 'app_production_db',
      includeForeignKeys: true,
      includeIndexes: true,
      includeComments: true,
      useTransactions: true,
      batchInsertSize: 50,
      postgresIdentityStyle: 'identity' as const,
      mysqlEngine: 'InnoDB' as const,
      mysqlCharset: 'utf8mb4',
    } as SqlGeneratorOptions,

    tables: [] as TableDefinition[],
    relations: [] as ForeignKeyRelation[],
    activeTableId: null as string | null,
  }),

  getters: {
    generatedSql(state): string {
      return generateSqlScript(state.tables, state.relations, state.sqlOptions);
    },

    dbmlCode(state): string {
      return generateDbml(state.tables, state.relations);
    },

    prismaCode(state): string {
      const provider = state.sqlOptions.dialect === 'postgres' ? 'postgresql' : 'mysql';
      return generatePrismaSchema(state.tables, state.relations, provider);
    },

    tsInterfacesCode(state): string {
      return generateTypeScriptInterfaces(state.tables);
    },

    activeTable(state): TableDefinition | undefined {
      return state.tables.find((t) => t.id === state.activeTableId) || state.tables[0];
    },

    stats(state) {
      const totalColumns = state.tables.reduce((acc, t) => acc + t.columns.length, 0);
      const totalRows = state.tables.reduce((acc, t) => acc + (t.rows?.length || 0), 0);
      return {
        tableCount: state.tables.length,
        columnCount: totalColumns,
        relationCount: state.relations.length,
        rowCount: totalRows,
      };
    },
  },

  actions: {
    init() {
      if (this.tables.length === 0) {
        this.runConversion();
      }
    },

    setJson(text: string) {
      this.rawJsonText = text;
      this.validateAndConvert();
    },

    loadPreset(presetId: string) {
      const preset = samplePresets.find((p) => p.id === presetId);
      if (preset) {
        this.rawJsonText = JSON.stringify(preset.data, null, 2);
        this.rootTableName = preset.id === 'ecommerce_order' ? 'orders' : preset.id === 'blog_and_comments' ? 'posts' : preset.id === 'saas_tenants' ? 'tenants' : 'devices';
        this.runConversion();
      }
    },

    setDialect(dialect: SqlDialect) {
      this.sqlOptions.dialect = dialect;
    },

    validateAndConvert() {
      this.parseError = null;
      try {
        const parsed = JSON.parse(this.rawJsonText);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('JSON harus berupa Object atau Array of Objects.');
        }
        this.runConversion();
      } catch (err: any) {
        this.parseError = err.message || 'Format JSON tidak valid.';
      }
    },

    runConversion() {
      try {
        this.isAnalyzing = true;
        this.parseError = null;
        const parsed = JSON.parse(this.rawJsonText);

        const result = normalizeJsonToSchema(
          parsed,
          this.rootTableName || 'items',
          this.optimizationOptions,
          this.sqlOptions.dialect
        );

        this.tables = result.tables;
        this.relations = result.relations;

        if (this.tables.length > 0 && !this.activeTableId) {
          this.activeTableId = this.tables[0].id;
        }
      } catch (err: any) {
        this.parseError = `Gagal memproses JSON: ${err.message}`;
      } finally {
        this.isAnalyzing = false;
      }
    },

    updateTable(tableId: string, updates: Partial<TableDefinition>) {
      const idx = this.tables.findIndex((t) => t.id === tableId);
      if (idx !== -1) {
        this.tables[idx] = { ...this.tables[idx], ...updates };
      }
    },

    deleteTable(tableId: string) {
      const tableToDelete = this.tables.find((t) => t.id === tableId);
      if (!tableToDelete) return;

      // Remove any relations involving this table
      this.relations = this.relations.filter(
        (r) => r.fromTable !== tableToDelete.name && r.toTable !== tableToDelete.name
      );

      this.tables = this.tables.filter((t) => t.id !== tableId);
      if (this.activeTableId === tableId) {
        this.activeTableId = this.tables[0]?.id || null;
      }
    },

    addTable(newTable: TableDefinition) {
      this.tables.push(newTable);
      this.activeTableId = newTable.id;
    },

    updateColumn(tableId: string, columnId: string, updates: Partial<ColumnDefinition>) {
      const table = this.tables.find((t) => t.id === tableId);
      if (!table) return;

      const colIdx = table.columns.findIndex((c) => c.id === columnId);
      if (colIdx !== -1) {
        // If changing to primary key, ensure other PKs in same table are handled if needed
        table.columns[colIdx] = { ...table.columns[colIdx], ...updates };
      }
    },

    addColumn(tableId: string, column: ColumnDefinition) {
      const table = this.tables.find((t) => t.id === tableId);
      if (table) {
        table.columns.push(column);
      }
    },

    deleteColumn(tableId: string, columnId: string) {
      const table = this.tables.find((t) => t.id === tableId);
      if (!table) return;

      const col = table.columns.find((c) => c.id === columnId);
      if (col) {
        // Remove relations attached to this column
        this.relations = this.relations.filter(
          (r) =>
            !(
              (r.fromTable === table.name && r.fromColumn === col.name) ||
              (r.toTable === table.name && r.toColumn === col.name)
            )
        );
      }

      table.columns = table.columns.filter((c) => c.id !== columnId);
    },

    updatePosition(tableId: string, x: number, y: number) {
      const table = this.tables.find((t) => t.id === tableId);
      if (table) {
        table.position = { x, y };
      }
    },

    toggleIncludeData() {
      this.sqlOptions.includeData = !this.sqlOptions.includeData;
    },
  },
});
