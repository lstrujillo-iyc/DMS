# Generador de TableMappings JSON para AWS DMS

## 📋 Descripción

Este proyecto genera automáticamente archivos de configuración **TableMappings JSON** para AWS Database Migration Service (DMS) a partir de un objeto de configuración JavaScript. 

El generador crea todas las reglas necesarias para:
- **Selección de tablas** con filtros
- **Renombrado de schemas y tablas**
- **Renombrado de columnas específicas**
- **Remoción de columnas no utilizadas**

## 🚀 Características

- ✅ **Generación dinámica** de reglas basada en configuración
- ✅ **Filtros automáticos** en reglas de selección con **agrupación inteligente**
- ✅ **Múltiples condiciones** por columna (agrupadas automáticamente)
- ✅ **Todos los operadores DMS**: eq, noteq, gte, lte, between, null, notnull
- ✅ **Mapeo de columnas** flexible
- ✅ **Remoción inteligente** de columnas no necesarias
- ✅ **IDs secuenciales** automáticos para las reglas
- ✅ **Nombres descriptivos** generados automáticamente
- ✅ **Formato JSON** listo para AWS DMS

## 📁 Estructura del Proyecto

```
├── index.js                 # Generador principal
├── table-mappings.json      # Archivo JSON generado
├── package.json             # Configuración del proyecto
├── README.md                # Documentación principal (este archivo)
```

## ⚙️ Configuración

El generador utiliza un objeto de configuración con la siguiente estructura:

```javascript
const config = {
  // Tabla fuente
  sourceSchema: 'dbo',
  sourceTable: 'Incolmotos Yamaha S_A_$Vendor',
  
  // Tabla destino
  targetSchema: 'segurosprueba',
  targetTable: 'insurance_agent',
  
  // Filtros para la selección
  filters: [
    {
      columnName: 'Vendor Posting Group',
      filterOperator: 'eq',
      value: 'SEGUROS',
    },
  ],
  
  /* 
  // Ejemplo con MÚLTIPLES CONDICIONES para la misma columna (se agrupan automáticamente):
  filters: [
    {
      columnName: 'Vendor Posting Group',
      filterOperator: 'eq',
      value: 'SEGUROS',
    },
    {
      columnName: 'Vendor Posting Group',
      filterOperator: 'eq',
      value: 'TRANSPORTE',
    },
    {
      columnName: 'Vendor Posting Group',
      filterOperator: 'eq',
      value: 'LOGISTICA',
    },
  ],
  // Esto generará UN SOLO filter con 3 filter-conditions agrupadas
  
  // Ejemplo con BETWEEN y múltiples columnas:
  filters: [
    {
      columnName: 'VAT Registration No_',
      filterOperator: 'between',
      'start-value': '1000000000',
      'end-value': '9999999999',
    },
    {
      columnName: 'Blocked',
      filterOperator: 'eq',
      value: 0,
    },
    {
      columnName: 'Privacy Blocked',
      filterOperator: 'eq',
      value: 0,
    },
  ],
  */
  
  // Todas las columnas de la tabla fuente
  sourceColumnNames: [
    'timestamp', 'No_', 'Name', 'Search Name', 
    // ... más columnas
  ],
  
  // Mapeo de columnas (destino: fuente)
  targetColumnNames: {
    Nav_Code: 'No_',
    First_Name: 'Name',
    Last_Name: 'Name 2',
    Phone: 'Phone No_',
    Email: 'E-Mail',
    Document_Number: 'VAT Registration No_',
    Type_Of_Document: 'VAT Registration Type',
  },
};
```

## 🎯 Ejemplos de Filtros

### Operadores Disponibles

| Operador | Descripción | Uso |
|----------|-------------|-----|
| `eq` | Igual a un valor | Comparación exacta |
| `noteq` | Distinto a un valor | Exclusión |
| `gte` | Mayor o igual a | Rangos numéricos |
| `lte` | Menor o igual a | Rangos numéricos |
| `between` | Entre dos valores | Rangos inclusivos |
| `notbetween` | No entre dos valores | Exclusión de rangos |
| `null` | Valores NULL | Sin valor |
| `notnull` | Sin valores NULL | Con valor |

### Ejemplo 1: Múltiples Condiciones para una Misma Columna

```javascript
filters: [
  {
    columnName: 'Resource Group No_',
    filterOperator: 'eq',
    value: 'INSPECTOR',
  },
  {
    columnName: 'Resource Group No_',
    filterOperator: 'eq',
    value: 'ANALISTA',
  },
  {
    columnName: 'Resource Group No_',
    filterOperator: 'eq',
    value: 'TEC_DBR',
  },
]
```

**Resultado generado:**
```json
{
  "filter-type": "source",
  "column-name": "Resource Group No_",
  "filter-conditions": [
    { "filter-operator": "eq", "value": "INSPECTOR" },
    { "filter-operator": "eq", "value": "ANALISTA" },
    { "filter-operator": "eq", "value": "TEC_DBR" }
  ]
}
```

✨ **Nota:** Los filtros con el mismo `columnName` se agrupan automáticamente en un solo filter con múltiples `filter-conditions`.

### Ejemplo 2: Operador Between

```javascript
filters: [
  {
    columnName: 'Item Category Code',
    filterOperator: 'between',
    'start-value': '17000201',
    'end-value': '17000299',
  },
]
```

**Resultado generado:**
```json
{
  "filter-type": "source",
  "column-name": "Item Category Code",
  "filter-conditions": [
    {
      "filter-operator": "between",
      "start-value": "17000201",
      "end-value": "17000299"
    }
  ]
}
```

### Ejemplo 3: Múltiples Columnas con Diferentes Condiciones

```javascript
filters: [
  // Filtros para VAT Registration No_ (rango numérico)
  {
    columnName: 'VAT Registration No_',
    filterOperator: 'between',
    'start-value': '1000000000',
    'end-value': '9999999999',
  },
  // Filtros para Status (múltiples valores)
  {
    columnName: 'Status',
    filterOperator: 'eq',
    value: 'Active',
  },
  {
    columnName: 'Status',
    filterOperator: 'eq',
    value: 'Pending',
  },
  // Filtro para Blocked
  {
    columnName: 'Blocked',
    filterOperator: 'eq',
    value: 0,
  },
]
```

**Resultado generado:**
```json
"filters": [
  {
    "filter-type": "source",
    "column-name": "VAT Registration No_",
    "filter-conditions": [
      {
        "filter-operator": "between",
        "start-value": "1000000000",
        "end-value": "9999999999"
      }
    ]
  },
  {
    "filter-type": "source",
    "column-name": "Status",
    "filter-conditions": [
      { "filter-operator": "eq", "value": "Active" },
      { "filter-operator": "eq", "value": "Pending" }
    ]
  },
  {
    "filter-type": "source",
    "column-name": "Blocked",
    "filter-conditions": [
      { "filter-operator": "eq", "value": 0 }
    ]
  }
]
```

### Ejemplo 4: Combinación de Operadores

```javascript
filters: [
  // Precio mayor o igual a 100
  {
    columnName: 'Unit Price',
    filterOperator: 'gte',
    value: 100,
  },
  // Precio menor o igual a 10000
  {
    columnName: 'Unit Price',
    filterOperator: 'lte',
    value: 10000,
  },
  // Tipo de Item
  {
    columnName: 'Type',
    filterOperator: 'eq',
    value: 'Inventory',
  },
  // No bloqueado
  {
    columnName: 'Blocked',
    filterOperator: 'noteq',
    value: 1,
  },
]
```

## 🔧 Uso

### Generar TableMappings JSON

```javascript
import { generateTableMappingsJSON, saveTableMappingsToFile, config } from './index.js';

// Generar y guardar archivo
saveTableMappingsToFile(config);

// Solo generar objeto JSON
const tableMappings = generateTableMappingsJSON(config);
console.log(JSON.stringify(tableMappings, null, 2));
```

### Ejecución directa

```bash
node index.js
```

## 📝 Reglas Generadas

El generador crea automáticamente las siguientes reglas:

### 1. Regla de Selección (Rule ID: 1)
- Incluye la tabla fuente
- Aplica filtros definidos en la configuración

### 2. Regla de Renombrado de Tabla (Rule ID: 2)
- Cambia el nombre de la tabla fuente al nombre destino

### 3. Regla de Renombrado de Schema (Rule ID: 3)
- Cambia el schema fuente al schema destino

### 4. Reglas de Renombrado de Columnas (Rule ID: 4+)
- Una regla por cada mapeo en `targetColumnNames`
- Renombra columnas según el mapeo definido

### 5. Reglas de Remoción de Columnas (Rule ID: Variable)
- Remueve todas las columnas que no están en `targetColumnNames`
- Mantiene solo las columnas necesarias

## 📊 Ejemplo de Salida

El archivo `table-mappings.json` generado tiene la siguiente estructura:

```json
{
  "rules": [
    {
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "include-vendor-insurance",
      "object-locator": {
        "schema-name": "dbo",
        "table-name": "Incolmotos Yamaha S_A_$Vendor"
      },
      "rule-action": "include",
      "filters": [...]
    },
    {
      "rule-type": "transformation",
      "rule-id": "2",
      "rule-name": "rename-table",
      "rule-action": "rename",
      "rule-target": "table",
      "object-locator": {...},
      "value": "insurance_agent"
    },
    // ... más reglas
  ]
}
```

## 🛠️ Funciones Principales

### `generateTableMappingsJSON(config)`
Genera el objeto TableMappings completo basado en la configuración.

**Parámetros:**
- `config`: Objeto de configuración con las propiedades descritas arriba

**Retorna:**
- Objeto JSON con la estructura TableMappings para AWS DMS

### `saveTableMappingsToFile(config, filename)`
Genera y guarda el TableMappings JSON en un archivo.

**Parámetros:**
- `config`: Objeto de configuración
- `filename`: Nombre del archivo (opcional, por defecto: 'table-mappings.json')

**Retorna:**
- Ruta del archivo generado

## 📋 Requisitos

- Node.js 14+ (recomendado 16+)
- Proyecto configurado con ES Modules

## 🚀 AWS DMS

El archivo `table-mappings.json` generado está listo para ser utilizado directamente en:
- AWS DMS Task Configuration
- Migración de datos entre bases de datos
- Transformación de esquemas y columnas

## 🔄 Personalización

Para personalizar la generación:

1. Modifica el objeto `config` con tus datos
2. Ajusta los filtros según tus necesidades
3. Define el mapeo de columnas apropiado
4. Ejecuta el generador

El sistema generará automáticamente todas las reglas necesarias para tu caso de uso específico.
