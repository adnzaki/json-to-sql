import type { ColumnDataType, SqlDialect } from '../types/schema';

// UUID pattern check
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ISO 8601 Date or DateTime pattern
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

export interface InferredTypeResult {
  dataType: ColumnDataType;
  lengthOrPrecision?: string;
  isNullable: boolean;
  hasDefault?: string;
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/([-_][a-z0-9])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
}

export function formatIdentifier(name: string, convention: 'snake_case' | 'camelCase' | 'preserve'): string {
  if (convention === 'snake_case') return toSnakeCase(name);
  if (convention === 'camelCase') return toCamelCase(name);
  return name;
}

export function pluralize(noun: string): string {
  if (noun.endsWith('y') && !/[aeiou]y$/i.test(noun)) {
    return noun.slice(0, -1) + 'ies';
  }
  if (noun.endsWith('s') || noun.endsWith('x') || noun.endsWith('z') || noun.endsWith('ch') || noun.endsWith('sh')) {
    return noun + 'es';
  }
  return noun + 's';
}

export function singularize(noun: string): string {
  if (noun.endsWith('ies')) {
    return noun.slice(0, -3) + 'y';
  }
  if (noun.endsWith('es') && (noun.endsWith('ches') || noun.endsWith('shes') || noun.endsWith('sses') || noun.endsWith('xes'))) {
    return noun.slice(0, -2);
  }
  if (noun.endsWith('s') && !noun.endsWith('ss')) {
    return noun.slice(0, -1);
  }
  return noun;
}

/**
 * Infers SQL data type from an array of sampled values
 */
export function inferColumnType(
  values: any[],
  dialect: SqlDialect = 'mysql',
  textThreshold: number = 255
): InferredTypeResult {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  const isNullable = nonNullValues.length < values.length;

  if (nonNullValues.length === 0) {
    // Default fallback if all null
    return {
      dataType: 'VARCHAR',
      lengthOrPrecision: '255',
      isNullable: true,
    };
  }

  // Check if all are booleans
  const allBooleans = nonNullValues.every(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 1 || v === 0
  );
  if (allBooleans && nonNullValues.some((v) => typeof v === 'boolean')) {
    return {
      dataType: 'BOOLEAN',
      isNullable,
    };
  }

  // Check if all are numbers
  const allNumbers = nonNullValues.every(
    (v) => typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean' && String(v).trim() !== '')
  );

  if (allNumbers) {
    const numValues = nonNullValues.map((v) => Number(v));
    const allIntegers = numValues.every((n) => Number.isInteger(n));

    if (allIntegers) {
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);

      if (min >= -32768 && max <= 32767) {
        return { dataType: 'SMALLINT', isNullable };
      }
      if (min >= -2147483648 && max <= 2147483647) {
        return { dataType: 'INT', isNullable };
      }
      return { dataType: 'BIGINT', isNullable };
    } else {
      // Floating point or Decimal
      let maxDecimals = 2;
      numValues.forEach((num) => {
        const parts = String(num).split('.');
        if (parts[1]) {
          maxDecimals = Math.max(maxDecimals, parts[1].length);
        }
      });
      maxDecimals = Math.min(maxDecimals, 6);
      return {
        dataType: 'DECIMAL',
        lengthOrPrecision: `12,${maxDecimals}`,
        isNullable,
      };
    }
  }

  // Check for Objects / Arrays -> JSON
  const hasComplexType = nonNullValues.some(
    (v) => typeof v === 'object' && v !== null
  );
  if (hasComplexType) {
    return {
      dataType: dialect === 'postgres' ? 'JSONB' : 'JSON',
      isNullable,
    };
  }

  // String analysis
  const strValues = nonNullValues.map((v) => String(v));

  // UUID detection
  const allUUIDs = strValues.every((s) => UUID_REGEX.test(s));
  if (allUUIDs) {
    return {
      dataType: dialect === 'postgres' ? 'UUID' : 'VARCHAR',
      lengthOrPrecision: dialect === 'postgres' ? undefined : '36',
      isNullable,
    };
  }

  // DateTime / Timestamp detection
  const allDateTimes = strValues.every((s) => ISO_DATETIME_REGEX.test(s) && !isNaN(Date.parse(s)));
  if (allDateTimes) {
    return {
      dataType: dialect === 'postgres' ? 'TIMESTAMP' : 'DATETIME',
      isNullable,
    };
  }

  // Date detection (YYYY-MM-DD)
  const allDates = strValues.every((s) => ISO_DATE_REGEX.test(s) && !isNaN(Date.parse(s)));
  if (allDates) {
    return {
      dataType: 'DATE',
      isNullable,
    };
  }

  // Time detection (HH:MM:SS)
  const allTimes = strValues.every((s) => TIME_REGEX.test(s));
  if (allTimes) {
    return {
      dataType: 'TIME',
      isNullable,
    };
  }

  // Calculate maximum length of string
  const maxLen = Math.max(...strValues.map((s) => s.length), 0);

  if (maxLen > textThreshold) {
    return {
      dataType: 'TEXT',
      isNullable,
    };
  }

  // Optimize VARCHAR length to clean increments: 50, 100, 150, 255, 500
  let optimalLen = 255;
  if (maxLen <= 20) optimalLen = 50;
  else if (maxLen <= 80) optimalLen = 100;
  else if (maxLen <= 150) optimalLen = 191;
  else if (maxLen <= 255) optimalLen = 255;
  else optimalLen = 500;

  return {
    dataType: 'VARCHAR',
    lengthOrPrecision: String(optimalLen),
    isNullable,
  };
}
