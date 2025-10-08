// Config tiene la siguiente forma:
/*  
Operadores disponibles para los filters
lte: igual o inferior a un valor (<=)
ste: igual o inferior a un valor (alias de lte)
gte: mayor o igual a un valor (>=)
eq: igual a un valor (=)
noteq: distinto a un valor (!=)
between: igual que o entre dos valores
notbetween: distinto a o entre dos valores
null: valores NULL
notnull: sin valores NULL
*/
// doc: https://docs.aws.amazon.com/es_es/dms/latest/userguide/CHAP_Tasks.CustomizingTasks.TableMapping.SelectionTransformation.Transformations.html
const config = {
  sourceSchema: 'dbo',
  sourceTable: 'Incolmotos Yamaha S_A_$Production BOM Header',
  targetSchema: 'calidad_mp',
  targetTable: 'production_bom_header',
  filters: [
    // 📑 Ejemplo: Múltiples condiciones para la misma columna se agruparán automáticamente
    // {
    //   columnName: 'Resource Group No_',
    //   filterOperator: 'eq',
    //   value: 'INSPECTOR',
    // },
    // {
    //   columnName: 'Resource Group No_',
    //   filterOperator: 'eq',
    //   value: 'ANALISTA',
    // },
    // {
    //   columnName: 'Resource Group No_',
    //   filterOperator: 'eq',
    //   value: 'TEC_DBR',
    // },
    // ☝️ Los filtros anteriores se agruparán en un solo filter con múltiples filter-conditions
    // 📑 Ejemplo: Filtro con operador 'between'
    // {
    //   columnName: 'Item Category Code',
    //   filterOperator: 'between',
    //   'start-value': '17000201',
    //   'end-value': '17000204',
    // },
    // 📑 Ejemplo: Filtro simple
    // {
    //   columnName: 'Blocked',
    //   filterOperator: 'eq',
    //   value: 0,
    // },
  ],
  // Todas las columnas que existen en la tabla origen
  sourceColumnNames: [
    'timestamp',
    'No_',
    'Description',
    'Description 2',
    'Search Name',
    'Unit of Measure Code',
    'Low-Level Code',
    'Creation Date',
    'Last Date Modified',
    'Status',
    'Version Nos_',
    'No_ Series',
  ],
  // Columnas a sincronizar y renombrar(si lo deseas): { targetColumnName: sourceColumnName }
  targetColumnNames: {
    No: 'No_',
    Description: 'Description',
    Status: 'Status',
  },
  // Columnas concatenadas: { targetColumn: { expression: 'CONCAT(...)', sourceColumns: [...], dataType: {...} } }
  // addColumns: {
  //   Is_Employee: {
  //     expression: 'true',
  //     // expression: "$Address || '_' || $Address 2", // Es opcional, normalmente utilizada para concatenar columnas
  //     // sourceColumns: ['Address', 'Address 2'],
  //     dataType: {
  //       // El tipo de dato de la columna a crear. 'string' 'boolean' 'int' 'bigint' 'smallint' 'tinyint' 'decimal' 'float' 'double' 'date' 'time' 'datetime' 'timestamp' 'binary' 'blob' 'clob':
  //       type: 'boolean',
  //       // length: 100, // (Opcional) Longitud máxima para tipos de texto o binarios.
  //       // precision: 6, // (Opcional) Precisión para tipos numéricos o de fecha/hora.
  //       // scale: 2, // (Opcional) Escala para tipos numéricos decimales (número de decimales). La escala indica cuántos dígitos se reservan para la parte fraccionaria. Por ejemplo, con DECIMAL(18,2)
  //       // nullable: true, // (Opcional) Si la columna permite valores nulos (true o false).
  //     },
  //   },
  // },
};

function generateTableMappingsJSON(config) {
  const tableMappings = {
    rules: [],
  };

  // Generar regla de selección
  const selectionRule = {
    'rule-type': 'selection',
    'rule-id': '1',
    'rule-name': `include-${config.targetTable}-${config.targetSchema}`,
    'object-locator': {
      'schema-name': config.sourceSchema,
      'table-name': config.sourceTable,
    },
    'rule-action': 'include',
    filters: [],
  };
  // Agregar filtros si existen en la configuración
  if (config.filters && config.filters.length > 0) {
    // Agrupar filtros por columnName
    const groupedFilters = {};
    
    config.filters.forEach((filter) => {
      const columnName = filter.columnName;
      
      // Inicializar el array de condiciones si no existe
      if (!groupedFilters[columnName]) {
        groupedFilters[columnName] = [];
      }
      
      // Crear la condición del filtro
      const filterCondition = {
        'filter-operator': filter.filterOperator,
      };

      // Solo agregar valor si está definido en el filtro
      if (filter.value !== undefined) {
        filterCondition.value = filter.value;
      }
      
      // Agregar 'start-value' y 'end-value' si existen (para operadores como 'between')
      if (filter['start-value'] !== undefined) {
        filterCondition['start-value'] = filter['start-value'];
      }
      if (filter['end-value'] !== undefined) {
        filterCondition['end-value'] = filter['end-value'];
      }
      
      // Agregar la condición al grupo de la columna
      groupedFilters[columnName].push(filterCondition);
    });
    
    // Convertir los grupos en filtros DMS
    Object.entries(groupedFilters).forEach(([columnName, conditions]) => {
      const dmsFilter = {
        'filter-type': 'source',
        'column-name': columnName,
        'filter-conditions': conditions,
      };
      selectionRule.filters.push(dmsFilter);
    });
  }

  tableMappings.rules.push(selectionRule);

  // Generar regla de transformación para renombrar tabla
  const renameTableRule = {
    'rule-type': 'transformation',
    'rule-id': '2',
    'rule-name': 'rename-table',
    'rule-action': 'rename',
    'rule-target': 'table',
    'object-locator': {
      'schema-name': config.sourceSchema,
      'table-name': config.sourceTable,
    },
    value: config.targetTable,
  };

  tableMappings.rules.push(renameTableRule);

  // Generar regla de transformación para renombrar schema
  const renameSchemaRule = {
    'rule-type': 'transformation',
    'rule-id': '3',
    'rule-name': 'rename-schema',
    'rule-action': 'rename',
    'rule-target': 'schema',
    'object-locator': {
      'schema-name': config.sourceSchema,
    },
    value: config.targetSchema,
  };
  tableMappings.rules.push(renameSchemaRule);

  // Generar reglas de transformación para renombrar columnas
  let columnRuleId = 4;
  Object.entries(config.targetColumnNames).forEach(
    ([targetColumnName, sourceColumnName]) => {
      const renameColumnRule = {
        'rule-type': 'transformation',
        'rule-id': columnRuleId.toString(),
        'rule-name': `rename-${sourceColumnName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')}-to-${targetColumnName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')}`,
        'rule-action': 'rename',
        'rule-target': 'column',
        'object-locator': {
          'schema-name': config.sourceSchema,
          'table-name': config.sourceTable,
          'column-name': sourceColumnName,
        },
        value: targetColumnName,
      };
      tableMappings.rules.push(renameColumnRule);
      columnRuleId++;
    }
  );

  // Generar reglas de transformación para columnas concatenadas
  if (config.addColumns) {
    Object.entries(config.addColumns).forEach(
      ([targetColumnName, addConfig]) => {
        const addColumnRule = {
          'rule-type': 'transformation',
          'rule-id': columnRuleId.toString(),
          'rule-name': `add-column-${targetColumnName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')}`,
          'rule-action': 'add-column',
          'rule-target': 'column',
          'object-locator': {
            'schema-name': config.sourceSchema,
            'table-name': config.sourceTable,
          },
          value: targetColumnName,
          'data-type': addConfig.dataType,
        };
        // Only add expression if present
        if (addConfig.expression) {
          addColumnRule.expression = addConfig.expression;
        }
        tableMappings.rules.push(addColumnRule);
        columnRuleId++;
      }
    );
  }

  // Generar reglas de transformación para remover columnas
  // Obtener las columnas que se están usando en targetColumnNames
  const usedColumns = Object.values(config.targetColumnNames);

  // Obtener las columnas que se están usando en concatenatedColumns
  // const usedInConcatenation = config.concatenatedColumns
  //   ? Object.values(config.concatenatedColumns).flatMap(
  //       (concat) => concat.sourceColumns
  //     )
  //   : [];

  // Combinar todas las columnas utilizadas
  // const allUsedColumns = [...usedColumns, ...usedInConcatenation];
  const allUsedColumns = [...usedColumns];

  // Filtrar sourceColumnNames para obtener solo las columnas que no se están usando
  const columnsToRemove = config.sourceColumnNames.filter(
    (columnName) => !allUsedColumns.includes(columnName)
  );

  // Generar reglas de remoción para cada columna no utilizada
  columnsToRemove.forEach((columnName) => {
    const removeColumnRule = {
      'rule-type': 'transformation',
      'rule-id': columnRuleId.toString(),
      'rule-name': `remove-${columnName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')}`,
      'rule-target': 'column',
      'object-locator': {
        'schema-name': config.sourceSchema,
        'table-name': config.sourceTable,
        'column-name': columnName,
      },
      'rule-action': 'remove-column',
      value: null,
      'old-value': null,
    };

    tableMappings.rules.push(removeColumnRule);
    columnRuleId++;
  });

  return tableMappings;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function saveTableMappingsToFile(config, filename = 'table-mappings.json') {
  const tableMappings = generateTableMappingsJSON(config);

  const filePath = path.join(__dirname, filename);

  try {
    fs.writeFileSync(filePath, JSON.stringify(tableMappings, null, 2), 'utf8');
    console.log(`TableMappings JSON generado exitosamente en: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error al generar el archivo:', error);
    throw error;
  }
}

// Ejemplo de uso
// saveTableMappingsToFile(config);

// Generar el archivo con la configuración actual
saveTableMappingsToFile(config);

// Exportar las funciones para uso externo
export { generateTableMappingsJSON, saveTableMappingsToFile, config };
