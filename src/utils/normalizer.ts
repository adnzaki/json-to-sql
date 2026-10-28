import type {
  ColumnDefinition,
  ForeignKeyRelation,
  OptimizationOptions,
  SqlDialect,
  TableDefinition,
} from '../types/schema';
import {
  formatIdentifier,
  inferColumnType,
  pluralize,
  toSnakeCase,
} from './typeInference';

interface NormalizationContext {
  tables: Map<string, TableDefinition>;
  relations: ForeignKeyRelation[];
  options: OptimizationOptions;
  dialect: SqlDialect;
  generatedIdCounter: number;
}

export function normalizeJsonToSchema(
  rawData: any,
  rootTableName: string = 'items',
  options: OptimizationOptions,
  dialect: SqlDialect = 'mysql'
): { tables: TableDefinition[]; relations: ForeignKeyRelation[] } {
  const ctx: NormalizationContext = {
    tables: new Map(),
    relations: [],
    options,
    dialect,
    generatedIdCounter: 1,
  };

  // Ensure root data is an array of objects
  let records: Record<string, any>[] = [];
  if (Array.isArray(rawData)) {
    records = rawData.filter((item) => typeof item === 'object' && item !== null);
    if (records.length === 0 && rawData.length > 0) {
      // Array of primitives, e.g. ["a", "b"]
      records = rawData.map((val) => ({ value: val }));
    }
  } else if (typeof rawData === 'object' && rawData !== null) {
    // If the object has top-level keys that are arrays or collections, check if we should extract multiple tables
    const keys = Object.keys(rawData);
    const hasMultipleArrayProperties =
      keys.length > 0 &&
      keys.every((k) => Array.isArray(rawData[k]) || (typeof rawData[k] === 'object' && rawData[k] !== null));

    if (hasMultipleArrayProperties && keys.length > 1) {
      // Multi-collection JSON root like { users: [...], products: [...], orders: [...] }
      keys.forEach((key) => {
        const val = rawData[key];
        const subRecords = Array.isArray(val)
          ? val.filter((item) => typeof item === 'object' && item !== null)
          : [val];
        processCollection(key, subRecords, null, null, ctx);
      });

      return finalizeResult(ctx);
    } else {
      records = [rawData];
    }
  } else {
    records = [{ value: rawData }];
  }

  processCollection(rootTableName, records, null, null, ctx);

  return finalizeResult(ctx);
}

function processCollection(
  rawTableName: string,
  records: Record<string, any>[],
  parentTable: string | null,
  parentFkName: string | null,
  ctx: NormalizationContext
): string {
  const convention = ctx.options.caseConvention;
  let formattedTableName = formatIdentifier(rawTableName, convention);
  if (ctx.options.pluralizeTableNames) {
    formattedTableName = pluralize(formattedTableName);
  }

  // Ensure unique table name if collision occurs
  let finalTableName = formattedTableName;
  let counter = 1;
  while (ctx.tables.has(finalTableName) && ctx.tables.get(finalTableName)?.rows !== records) {
    finalTableName = `${formattedTableName}_${counter++}`;
  }

  if (ctx.tables.has(finalTableName)) {
    return finalTableName;
  }

  // Collect all unique property names across all records in this collection
  const propertySet = new Set<string>();
  records.forEach((row) => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => propertySet.add(k));
    }
  });

  const columns: ColumnDefinition[] = [];
  const processedRows: Record<string, any>[] = [];

  // Determine Primary Key candidate in records
  let pkCandidate: string | null = null;
  for (const prop of propertySet) {
    const lower = prop.toLowerCase();
    if (lower === 'id' || lower === '_id' || lower === `${toSnakeCase(rawTableName)}_id` || lower === 'uuid') {
      pkCandidate = prop;
      break;
    }
  }

  // If no PK candidate exists, inject synthetic ID column
  const idColName = formatIdentifier('id', convention);
  let syntheticPk = false;

  if (!pkCandidate) {
    syntheticPk = true;
    const isUuid = ctx.options.idStrategy === 'uuid';
    columns.push({
      id: crypto.randomUUID(),
      name: idColName,
      dataType: isUuid ? (ctx.dialect === 'postgres' ? 'UUID' : 'VARCHAR') : ctx.options.idStrategy === 'int_auto' ? 'INT' : 'BIGINT',
      lengthOrPrecision: isUuid ? (ctx.dialect === 'postgres' ? undefined : '36') : undefined,
      isNullable: false,
      isPrimaryKey: true,
      isAutoIncrement: !isUuid,
      isUnique: true,
      isIndex: true,
      comment: 'Primary Key',
    });
  }

  // If this is a child table with a foreign key to parent
  if (parentTable && parentFkName) {
    columns.push({
      id: crypto.randomUUID(),
      name: parentFkName,
      dataType: ctx.options.idStrategy === 'uuid' ? (ctx.dialect === 'postgres' ? 'UUID' : 'VARCHAR') : 'BIGINT',
      lengthOrPrecision: ctx.options.idStrategy === 'uuid' && ctx.dialect !== 'postgres' ? '36' : undefined,
      isNullable: false,
      isPrimaryKey: false,
      isAutoIncrement: false,
      isUnique: false,
      isIndex: true,
      comment: `Foreign Key to ${parentTable}`,
      foreignKey: {
        targetTable: parentTable,
        targetColumn: idColName,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    });

    ctx.relations.push({
      id: crypto.randomUUID(),
      fromTable: finalTableName,
      fromColumn: parentFkName,
      toTable: parentTable,
      toColumn: idColName,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }

  // Pending child extractions for normalization
  const pendingNestedExtractions: {
    propName: string;
    childRecords: { parentRowId: any; data: any }[];
    isPrimitiveArray: boolean;
  }[] = [];

  // Iterate over properties
  for (const rawProp of propertySet) {
    const formattedColName = formatIdentifier(rawProp, convention);
    const sampleValues = records.map((r) => r[rawProp]);

    // Check if property is nested object or array
    const sampleItem = sampleValues.find((v) => v !== null && v !== undefined);
    const isArray = Array.isArray(sampleItem);
    const isObject = typeof sampleItem === 'object' && sampleItem !== null && !isArray;

    if (isArray && ctx.options.normalizationLevel !== 'flat') {
      // Normalization of array
      const isArrayOfObjects = (sampleItem as any[]).some((el) => typeof el === 'object' && el !== null);

      if (isArrayOfObjects) {
        // Prepare extraction of child table (1-to-many)
        const childRecordsList: { parentRowId: any; data: any }[] = [];
        records.forEach((row, idx) => {
          const parentRowId = syntheticPk ? idx + 1 : row[pkCandidate!];
          const arr = Array.isArray(row[rawProp]) ? row[rawProp] : [];
          arr.forEach((childItem: any) => {
            if (typeof childItem === 'object' && childItem !== null) {
              childRecordsList.push({ parentRowId, data: childItem });
            }
          });
        });

        pendingNestedExtractions.push({
          propName: rawProp,
          childRecords: childRecordsList,
          isPrimitiveArray: false,
        });
        continue;
      } else {
        // Array of primitives (e.g. tags: ["a", "b"])
        if (ctx.options.normalizationLevel === '3nf_relational') {
          const childRecordsList: { parentRowId: any; data: any }[] = [];
          records.forEach((row, idx) => {
            const parentRowId = syntheticPk ? idx + 1 : row[pkCandidate!];
            const arr = Array.isArray(row[rawProp]) ? row[rawProp] : [];
            arr.forEach((primitiveVal: any) => {
              childRecordsList.push({ parentRowId, data: { value: primitiveVal } });
            });
          });

          pendingNestedExtractions.push({
            propName: rawProp,
            childRecords: childRecordsList,
            isPrimitiveArray: true,
          });
          continue;
        }
      }
    } else if (isObject && ctx.options.normalizationLevel === '3nf_relational') {
      // Normalization of nested 1-to-1 object
      const childRecordsList: { parentRowId: any; data: any }[] = [];
      records.forEach((row, idx) => {
        const parentRowId = syntheticPk ? idx + 1 : row[pkCandidate!];
        if (typeof row[rawProp] === 'object' && row[rawProp] !== null) {
          childRecordsList.push({ parentRowId, data: row[rawProp] });
        }
      });

      pendingNestedExtractions.push({
        propName: rawProp,
        childRecords: childRecordsList,
        isPrimitiveArray: false,
      });
      continue;
    } else if (isObject && ctx.options.normalizationLevel === '1nf') {
      // 1NF: Flatten nested object properties into current table as prefix_column
      const nestedKeys = new Set<string>();
      records.forEach((r) => {
        if (r[rawProp] && typeof r[rawProp] === 'object') {
          Object.keys(r[rawProp]).forEach((nk) => nestedKeys.add(nk));
        }
      });

      nestedKeys.forEach((nk) => {
        const flattenedColName = formatIdentifier(`${rawProp}_${nk}`, convention);
        const nestedVals = records.map((r) => (r[rawProp] ? r[rawProp][nk] : null));
        const inferred = inferColumnType(nestedVals, ctx.dialect, ctx.options.stringThresholdForText);

        columns.push({
          id: crypto.randomUUID(),
          name: flattenedColName,
          dataType: inferred.dataType,
          lengthOrPrecision: inferred.lengthOrPrecision,
          isNullable: inferred.isNullable,
          isPrimaryKey: false,
          isAutoIncrement: false,
          isUnique: false,
          isIndex: false,
          sampleValues: nestedVals.slice(0, 5),
        });
      });
      continue;
    }

    // Normal column inference
    const isThisPk = rawProp === pkCandidate;
    const inferred = inferColumnType(sampleValues, ctx.dialect, ctx.options.stringThresholdForText);

    const isEmailOrUser =
      formattedColName.toLowerCase().includes('email') || formattedColName.toLowerCase() === 'username';

    const isIdField =
      formattedColName.toLowerCase().endsWith('_id') || formattedColName.toLowerCase() === 'code';

    columns.push({
      id: crypto.randomUUID(),
      name: formattedColName,
      dataType: isThisPk
        ? ctx.options.idStrategy === 'uuid'
          ? (ctx.dialect === 'postgres' ? 'UUID' : 'VARCHAR')
          : (ctx.dialect === 'postgres' ? 'BIGSERIAL' : 'BIGINT')
        : inferred.dataType,
      lengthOrPrecision: isThisPk && ctx.options.idStrategy === 'uuid' && ctx.dialect !== 'postgres' ? '36' : inferred.lengthOrPrecision,
      isNullable: isThisPk ? false : inferred.isNullable,
      isPrimaryKey: isThisPk,
      isAutoIncrement: isThisPk && ctx.options.idStrategy !== 'uuid',
      isUnique: isThisPk || isEmailOrUser,
      isIndex: isThisPk || isEmailOrUser || isIdField,
      sampleValues: sampleValues.slice(0, 5),
    });
  }

  // Add standard audit timestamps if requested
  if (ctx.options.addTimestamps) {
    const hasCreatedAt = columns.some((c) => c.name.toLowerCase() === 'created_at');
    const hasUpdatedAt = columns.some((c) => c.name.toLowerCase() === 'updated_at');

    if (!hasCreatedAt) {
      columns.push({
        id: crypto.randomUUID(),
        name: formatIdentifier('created_at', convention),
        dataType: ctx.dialect === 'postgres' ? 'TIMESTAMP' : 'DATETIME',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        isUnique: false,
        isIndex: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        comment: 'Creation timestamp',
      });
    }

    if (!hasUpdatedAt) {
      columns.push({
        id: crypto.randomUUID(),
        name: formatIdentifier('updated_at', convention),
        dataType: ctx.dialect === 'postgres' ? 'TIMESTAMP' : 'DATETIME',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        isUnique: false,
        isIndex: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        comment: 'Last update timestamp',
      });
    }
  }

  // Add soft-delete flag if requested
  if (ctx.options.addSoftDelete) {
    const hasDeletedAt = columns.some((c) => c.name.toLowerCase() === 'deleted_at');
    if (!hasDeletedAt) {
      columns.push({
        id: crypto.randomUUID(),
        name: formatIdentifier('deleted_at', convention),
        dataType: ctx.dialect === 'postgres' ? 'TIMESTAMP' : 'DATETIME',
        isNullable: true,
        isPrimaryKey: false,
        isAutoIncrement: false,
        isUnique: false,
        isIndex: true,
        comment: 'Soft delete marker',
      });
    }
  }

  // Populate processed row values for SQL INSERT generation
  records.forEach((row, idx) => {
    const rowObj: Record<string, any> = {};

    if (syntheticPk) {
      rowObj[idColName] = ctx.options.idStrategy === 'uuid' ? crypto.randomUUID() : idx + 1;
    }

    columns.forEach((col) => {
      // Check original matching property
      const originalProp = Array.from(propertySet).find(
        (p) => formatIdentifier(p, convention) === col.name
      );

      if (originalProp && row[originalProp] !== undefined) {
        rowObj[col.name] = row[originalProp];
      } else if (col.name === parentFkName && row.__parentFkValue !== undefined) {
        rowObj[col.name] = row.__parentFkValue;
      }
    });

    processedRows.push(rowObj);
  });

  // Register this table in context
  ctx.tables.set(finalTableName, {
    id: crypto.randomUUID(),
    name: finalTableName,
    comment: `Table for ${rawTableName}`,
    columns,
    rows: processedRows,
    primaryKeyColumn: columns.find((c) => c.isPrimaryKey)?.name,
  });

  // Now process pending nested extractions into child tables
  pendingNestedExtractions.forEach((ext) => {
    let childTableName = `${toSnakeCase(finalTableName)}_${toSnakeCase(ext.propName)}`;
    const fkColName = formatIdentifier(`${toSnakeCase(finalTableName)}_id`, convention);

    const childRecordsForProcessing = ext.childRecords.map((item) => ({
      ...item.data,
      __parentFkValue: item.parentRowId,
    }));

    processCollection(childTableName, childRecordsForProcessing, finalTableName, fkColName, ctx);
  });

  return finalTableName;
}

function finalizeResult(ctx: NormalizationContext): {
  tables: TableDefinition[];
  relations: ForeignKeyRelation[];
} {
  const tableList = Array.from(ctx.tables.values());

  // Assign auto-spread positions for visual ERD canvas
  const cols = 2;
  const colWidth = 340;
  const rowHeight = 320;

  tableList.forEach((table, index) => {
    const colIdx = index % cols;
    const rowIdx = Math.floor(index / cols);
    table.position = {
      x: 60 + colIdx * colWidth,
      y: 60 + rowIdx * rowHeight,
    };
  });

  return {
    tables: tableList,
    relations: ctx.relations,
  };
}
