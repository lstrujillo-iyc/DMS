// Config tiene la siguiente forma:
/*  
Operadores disponibles
'eq' - Igual (=)
'ne' - No igual (!=)
'gt' - Mayor que (>)
'lt' - Menor que (<)
'gte' - Mayor o igual (>=)
'lte' - Menor o igual (<=)
'like' - LIKE (para patrones)
'not-like' - NOT LIKE
*/
// doc: https://docs.aws.amazon.com/es_es/dms/latest/userguide/CHAP_Tasks.CustomizingTasks.TableMapping.SelectionTransformation.Transformations.html
const config = {
  sourceSchema: 'dbo',
  sourceTable: 'Incolmotos Yamaha S_A_$Vendor',
  targetSchema: 'segurosprueba',
  targetTable: 'person',
  filters: [
    {
      columnName: 'Tax Area Code',
      filterOperator: 'eq',
      value: 'PNEMPLEADO',
    },
    {
      columnName: 'Blocked',
      filterOperator: 'eq',
      value: 0,
    },
  ],
  sourceColumnNames: [
    'timestamp',
    'No_',
    'Name',
    'Search Name',
    'Name 2',
    'Address',
    'Address 2',
    'City',
    'Contact',
    'Phone No_',
    'Telex No_',
    'Our Account No_',
    'Territory Code',
    'Global Dimension 1 Code',
    'Global Dimension 2 Code',
    'Budgeted Amount',
    'Vendor Posting Group',
    'Currency Code',
    'Language Code',
    'Statistics Group',
    'Payment Terms Code',
    'Fin_ Charge Terms Code',
    'Purchaser Code',
    'Shipment Method Code',
    'Shipping Agent Code',
    'Invoice Disc_ Code',
    'Country_Region Code',
    'Blocked',
    'Pay-to Vendor No_',
    'Priority',
    'Payment Method Code',
    'Last Date Modified',
    'Application Method',
    'Prices Including VAT',
    'Fax No_',
    'Telex Answer Back',
    'VAT Registration No_',
    'Gen_ Bus_ Posting Group',
    'Picture',
    'GLN',
    'Post Code',
    'County',
    'E-Mail',
    'Home Page',
    'No_ Series',
    'Tax Area Code',
    'Tax Liable',
    'VAT Bus_ Posting Group',
    'Block Payment Tolerance',
    'IC Partner Code',
    'Prepayment _',
    'Partner Type',
    'Image',
    'Creditor No_',
    'Preferred Bank Account Code',
    'Cash Flow Payment Terms Code',
    'Primary Contact No_',
    'Responsibility Center',
    'Location Code',
    'Lead Time Calculation',
    'Base Calendar Code',
    'Document Sending Profile',
    'Id',
    'VAT Registration Type',
    'Check Digit',
    'Ext_ VAT Registration No_',
    'Tax Department',
    'Inv_ Resolution Check',
    'RUT Activation Date',
    'RUT Date Check',
    'Prepmt_ Vendor Posting Group',
    'Type Person',
    'State',
    'Code CIIU',
    'Exceeds Income UVT Last year',
    'Cel Phone No_',
    'DIAN',
    'Simplified Tax Area',
    'Name FE',
    'No Exempt Rent 25',
  ],
  targetColumnNames: {
    Nav_Code: 'No_',
    First_Name: 'Name',
    Last_Name: 'Name 2',
    Phone: 'Phone No_',
    Email: 'E-Mail',
    Document_Number: 'VAT Registration No_',
    Type_Of_Document: 'VAT Registration Type',
  },
  // Columnas concatenadas: { targetColumn: { expression: 'CONCAT(...)', sourceColumns: [...], dataType: {...} } }
  addColumns: {
    Address: {
      expression: "$Address || '_' || $Address 2",
      // expression: "$Address || '_' || $Address 2", // Es opcional, normalmente utilizada para concatenar columnas
      sourceColumns: ['Address', 'Address 2'],
      dataType: {
        type: 'string', // El tipo de dato de la columna a crear. 'string' 'boolean' 'int' 'bigint' 'smallint' 'tinyint' 'decimal' 'float' 'double' 'date' 'time' 'datetime' 'timestamp' 'binary' 'blob' 'clob'
        length: 100, // (Opcional) Longitud máxima para tipos de texto o binarios.
        // precision: 6, // (Opcional) Precisión para tipos numéricos o de fecha/hora.
        // scale: 2, // (Opcional) Escala para tipos numéricos decimales (número de decimales). La escala indica cuántos dígitos se reservan para la parte fraccionaria. Por ejemplo, con DECIMAL(18,2)
        // nullable: true, // (Opcional) Si la columna permite valores nulos (true o false).
      },
    },
  },
};

function generateTableMappingsJSON(config) {
  const tableMappings = {
    rules: [],
  };

  // Generar regla de selección
  const selectionRule = {
    'rule-type': 'selection',
    'rule-id': '1',
    'rule-name': 'include-vendor-insurance',
    'object-locator': {
      'schema-name': config.sourceSchema,
      'table-name': config.sourceTable,
    },
    'rule-action': 'include',
    filters: [],
  };
  // Agregar filtros si existen en la configuración
  if (config.filters && config.filters.length > 0) {
    config.filters.forEach((filter) => {
      const filterCondition = {
        'filter-operator': filter.filterOperator,
      };

      // Solo agregar valor si está definido en el filtro
      if (filter.value !== undefined) {
        filterCondition.value = filter.value;
      }

      const dmsFilter = {
        'filter-type': 'source',
        'column-name': filter.columnName,
        'filter-conditions': [filterCondition],
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
