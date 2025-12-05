# Módulo de Garantías - RenTools

Sistema completo de gestión de garantías para contratos de arriendo de herramientas.

## 📋 Descripción

El módulo de garantías maneja el ciclo completo de las garantías:

1. **Pago de Garantía** (inicio del contrato)
   - Se cobra una garantía al cliente cuando inicia el contrato
   - Solo puede haber UNA garantía por contrato
   - El monto debe coincidir con `contrato.monto_garantia`

2. **Devolución de Garantía** (fin del contrato)
   - Se devuelve cuando el contrato está finalizado
   - El monto depende del estado de las herramientas devueltas
   - Solo puede haber UNA devolución por contrato
   - NUNCA se devuelve parcialmente durante el contrato

## 🗂️ Estructura de Archivos

```
garantias/
├── dto/
│   ├── create-garantia-pago.dto.ts
│   ├── update-garantia-pago.dto.ts
│   ├── search-garantia-pago.dto.ts
│   ├── create-garantia-devolucion.dto.ts
│   ├── update-garantia-devolucion.dto.ts
│   ├── search-garantia-devolucion.dto.ts
│   └── index.ts
├── entities/
│   ├── garantia-pago.entity.ts
│   └── garantia-devolucion.entity.ts
├── garantias.constants.ts
├── garantias.controller.ts
├── garantias.module.ts
├── garantias.service.ts
└── README.md
```

## 🔐 Autenticación y Roles

Todos los endpoints requieren autenticación JWT.

**Roles disponibles:**
- `admin`: Acceso total (CRUD completo + estadísticas)
- `vendedor`: Operaciones de pago y devolución

## 📊 Entidades

### GarantiaPago

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_garantia_pago` | `number` | ID único (PK) |
| `id_contrato` | `number` | ID del contrato (FK, unique) |
| `fecha_pago` | `Date` | Fecha del pago |
| `monto` | `number` | Monto pagado (pesos CLP) |
| `metodo_pago` | `MetodoPago` | efectivo, tarjeta_debito, tarjeta_credito, transferencia |
| `referencia` | `string` | Número de referencia (opcional) |
| `created_at` | `Date` | Fecha de creación |
| `updated_at` | `Date` | Fecha de actualización |

**Constraints:**
- Solo UNA garantía pago por contrato (`UNIQUE INDEX` en `id_contrato`)

### GarantiaDevolucion

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_devolucion_garantia` | `number` | ID único (PK) |
| `id_contrato` | `number` | ID del contrato (FK, unique) |
| `fecha_devolucion` | `Date` | Fecha de devolución |
| `monto_devuelto` | `number` | Monto devuelto (pesos CLP) |
| `metodo_devolucion` | `MetodoPago` | Método de devolución |
| `referencia` | `string` | Número de referencia (opcional) |
| `observaciones` | `string` | Observaciones (opcional) |
| `created_at` | `Date` | Fecha de creación |
| `updated_at` | `Date` | Fecha de actualización |

**Constraints:**
- Solo UNA devolución por contrato (`UNIQUE INDEX` en `id_contrato`)

## 📐 Lógica de Cálculo Automático

El monto de devolución se calcula automáticamente basándose en:

### Porcentajes Configurables (garantias.constants.ts)

```typescript
PORCENTAJE_DEVOLUCION = {
  BUEN_ESTADO: 1.0,        // 100% - Todas las herramientas OK
  REPARACION_MENOR: 0.75,  // 75%  - Daños menores
  DANADA: 0.5,             // 50%  - Herramientas dañadas
  NO_DEVUELTA: 0.0         // 0%   - No devolvió todas
}
```

### Reglas de Cálculo

1. **Si NO devolvió todas las herramientas**: `0%`
2. **Si hay herramientas DAÑADAS**: `50%`
3. **Si hay REPARACIÓN MENOR** (sin dañadas): `75%`
4. **Si todas en BUEN ESTADO**: `100%`

## 🔌 API Endpoints

### Garantía Pago

#### 1. Crear Pago de Garantía

```http
POST /garantias/pago
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "id_contrato": 1,
  "fecha_pago": "2024-11-20",
  "monto": 100000,
  "metodo_pago": "efectivo",
  "referencia": "REF-12345"
}
```

**Validaciones:**
- Contrato existe y está activo
- NO existe otra garantía para ese contrato
- `monto > 0`
- `monto === contrato.monto_garantia`

**Response 201:**
```json
{
  "id_garantia_pago": 1,
  "id_contrato": 1,
  "fecha_pago": "2024-11-20",
  "monto": 100000,
  "metodo_pago": "efectivo",
  "referencia": "REF-12345",
  "contrato": {
    "id_contrato": 1,
    "cliente": { ... }
  },
  "created_at": "2024-11-20T10:30:00.000Z",
  "updated_at": "2024-11-20T10:30:00.000Z"
}
```

---

#### 2. Listar Pagos de Garantía

```http
GET /garantias/pago?page=1&limit=10&id_contrato=1&metodo_pago=efectivo
```

**Query Params:**
- `page` (opcional, default: 1)
- `limit` (opcional, default: 10, max: 100)
- `id_contrato` (opcional)
- `metodo_pago` (opcional)
- `fecha_desde` (opcional, formato: YYYY-MM-DD)
- `fecha_hasta` (opcional, formato: YYYY-MM-DD)

**Response 200:**
```json
{
  "data": [
    {
      "id_garantia_pago": 1,
      "id_contrato": 1,
      "monto": 100000,
      "fecha_pago": "2024-11-20",
      "metodo_pago": "efectivo",
      "contrato": { ... }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

#### 3. Obtener Pago por Contrato

```http
GET /garantias/pago/contrato/:id_contrato
```

**Response 200:**
```json
{
  "id_garantia_pago": 1,
  "id_contrato": 1,
  "monto": 100000,
  "fecha_pago": "2024-11-20",
  "metodo_pago": "efectivo",
  "referencia": "REF-12345"
}
```

**Response 404:** Si no existe garantía para ese contrato

---

#### 4. Verificar si tiene Garantía Pagada

```http
GET /garantias/pago/contrato/:id_contrato/verificar
```

**Response 200:**
```json
{
  "id_contrato": 1,
  "garantia_pagada": true
}
```

---

#### 5. Obtener Pago por ID

```http
GET /garantias/pago/:id
```

---

#### 6. Actualizar Pago

```http
PATCH /garantias/pago/:id
```

**Body:**
```json
{
  "referencia": "REF-ACTUALIZADO"
}
```

**Nota:** Solo se puede actualizar `referencia` (campos seguros)

---

#### 7. Eliminar Pago

```http
DELETE /garantias/pago/:id
```

**Validaciones:**
- NO debe tener devolución asociada

**Response 204:** Sin contenido

---

### Garantía Devolución

#### 1. Crear Devolución de Garantía

```http
POST /garantias/devolucion
```

**Body (monto manual):**
```json
{
  "id_contrato": 1,
  "fecha_devolucion": "2024-11-28",
  "monto_devuelto": 50000,
  "metodo_devolucion": "efectivo",
  "referencia": "DEV-12345",
  "observaciones": "Descuento por taladro dañado"
}
```

**Body (monto automático):**
```json
{
  "id_contrato": 1,
  "fecha_devolucion": "2024-11-28",
  "metodo_devolucion": "efectivo",
  "observaciones": "Devolución completa"
}
```

**Validaciones:**
- Contrato existe y está `finalizado`
- Existe garantía pago previa
- NO existe otra devolución
- `monto_devuelto >= 0`
- `monto_devuelto <= garantia_pago.monto`
- Si no se envía `monto_devuelto`, se calcula automático

**Response 201:**
```json
{
  "id_devolucion_garantia": 1,
  "id_contrato": 1,
  "fecha_devolucion": "2024-11-28",
  "monto_devuelto": 50000,
  "metodo_devolucion": "efectivo",
  "referencia": "DEV-12345",
  "observaciones": "Descuento por taladro dañado",
  "contrato": { ... }
}
```

---

#### 2. Calcular Monto de Devolución

```http
GET /garantias/devolucion/calcular/:id_contrato
```

**Response 200:**
```json
{
  "monto_sugerido": 50000,
  "razon": "Se encontraron herramientas dañadas",
  "detalle": [
    {
      "herramienta": "Escalera 5m",
      "cantidad_devuelta": 1,
      "estado": "buen_estado",
      "observaciones": null
    },
    {
      "herramienta": "Taladro Bosch",
      "cantidad_devuelta": 1,
      "estado": "danada",
      "observaciones": "Motor quemado"
    }
  ]
}
```

---

#### 3. Obtener Info para Devolución

```http
GET /garantias/devolucion/info/:id_contrato
```

**Response 200:**
```json
{
  "garantia_pagada": {
    "id_garantia_pago": 1,
    "monto": 100000,
    "fecha_pago": "2024-11-20",
    "metodo_pago": "efectivo"
  },
  "ya_devuelta": false,
  "devolucion": null,
  "calculo_automatico": {
    "monto_sugerido": 50000,
    "razon": "Se encontraron herramientas dañadas",
    "detalle": [ ... ]
  },
  "puede_devolver": true
}
```

---

#### 4. Listar Devoluciones

```http
GET /garantias/devolucion?page=1&limit=10
```

Similar a listar pagos.

---

#### 5. Obtener Devolución por Contrato

```http
GET /garantias/devolucion/contrato/:id_contrato
```

---

#### 6. Obtener Devolución por ID

```http
GET /garantias/devolucion/:id
```

---

#### 7. Actualizar Devolución

```http
PATCH /garantias/devolucion/:id
```

**Body:**
```json
{
  "referencia": "DEV-ACTUALIZADO",
  "observaciones": "Observaciones actualizadas"
}
```

---

#### 8. Eliminar Devolución

```http
DELETE /garantias/devolucion/:id
```

**Response 204:** Sin contenido

---

### Resumen y Reportes

#### 1. Obtener Resumen de Contrato

```http
GET /garantias/resumen/:id_contrato
```

**Response 200:**
```json
{
  "garantia_pagada": {
    "id": 1,
    "monto": 100000,
    "fecha_pago": "2024-11-20",
    "metodo_pago": "efectivo",
    "referencia": "REF-12345"
  },
  "garantia_devuelta": {
    "id": 1,
    "monto_devuelto": 50000,
    "fecha_devolucion": "2024-11-28",
    "metodo_devolucion": "efectivo",
    "observaciones": "Descuento por taladro dañado",
    "referencia": "DEV-12345"
  },
  "estado_herramientas": [
    {
      "herramienta": "Escalera 5m",
      "cantidad_devuelta": 1,
      "estado": "buen_estado",
      "observaciones": null
    },
    {
      "herramienta": "Taladro Bosch",
      "cantidad_devuelta": 1,
      "estado": "danada",
      "observaciones": "Motor quemado"
    }
  ],
  "monto_sugerido": 0,
  "retenido": 50000,
  "pendiente_devolucion": false
}
```

---

#### 2. Obtener Estadísticas

```http
GET /garantias/stats
```

**Headers:**
```
Authorization: Bearer <token>
```

**Roles:** Solo `admin`

**Response 200:**
```json
{
  "total_pagos": 150,
  "total_devoluciones": 120,
  "pendientes_devolucion": 30,
  "suma_pagos": 15000000,
  "suma_devoluciones": 11250000,
  "suma_retenida": 3750000
}
```

---

## 🔄 Flujo de Uso Completo

### 1. Crear Contrato y Pagar Garantía

```bash
# Paso 1: Crear contrato
POST /contratos
{
  "id_cliente": 1,
  "fecha_inicio": "2024-11-20",
  "fecha_termino_estimada": "2024-11-27",
  "monto_garantia": 100000,
  ...
}
# Response: { id_contrato: 1, ... }

# Paso 2: Pagar garantía
POST /garantias/pago
{
  "id_contrato": 1,
  "fecha_pago": "2024-11-20",
  "monto": 100000,
  "metodo_pago": "efectivo"
}
```

---

### 2. Durante el Contrato (Devoluciones de Herramientas)

```bash
# Cliente devuelve herramientas
POST /devoluciones
{
  "id_detalle": 1,
  "cantidad_devuelta": 1,
  "fecha_devolucion": "2024-11-25",
  "estado": "buen_estado"
}

POST /devoluciones
{
  "id_detalle": 2,
  "cantidad_devuelta": 1,
  "fecha_devolucion": "2024-11-25",
  "estado": "danada",
  "observaciones": "Motor quemado"
}
```

---

### 3. Finalizar Contrato y Calcular Devolución

```bash
# Paso 1: Finalizar contrato
POST /contratos/1/finalizar

# Paso 2: Calcular cuánto devolver
GET /garantias/devolucion/calcular/1
# Response: { monto_sugerido: 50000, razon: "...", detalle: [...] }

# Paso 3: Devolver garantía
POST /garantias/devolucion
{
  "id_contrato": 1,
  "fecha_devolucion": "2024-11-28",
  "metodo_devolucion": "efectivo",
  "observaciones": "Descuento del 50% por taladro dañado"
}
# El monto se calcula automáticamente si no se envía
```

---

### 4. Ver Resumen Completo

```bash
GET /garantias/resumen/1
```

---

## ⚠️ Errores Comunes

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe una garantía pagada para el contrato #1"
}
```
**Solución:** Un contrato solo puede tener UNA garantía.

---

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "El monto de la garantía (80000) debe coincidir con el monto del contrato (100000)"
}
```
**Solución:** El monto debe ser exacto al `contrato.monto_garantia`.

---

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "El contrato #1 debe estar finalizado para devolver la garantía"
}
```
**Solución:** Finalizar el contrato primero con `POST /contratos/1/finalizar`.

---

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "No existe garantía pagada para el contrato #1"
}
```
**Solución:** Crear primero la garantía pago con `POST /garantias/pago`.

---

## 🔧 Migraciones SQL

```sql
-- Tabla garantia_pago
CREATE TABLE garantia_pago (
  id_garantia_pago SERIAL PRIMARY KEY,
  id_contrato INT NOT NULL,
  fecha_pago DATE NOT NULL,
  monto INT NOT NULL,
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia')),
  referencia VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato)
);

CREATE UNIQUE INDEX idx_garantia_pago_contrato ON garantia_pago(id_contrato);
CREATE INDEX idx_garantia_pago_fecha ON garantia_pago(fecha_pago);

-- Tabla garantia_devolucion
CREATE TABLE garantia_devolucion (
  id_devolucion_garantia SERIAL PRIMARY KEY,
  id_contrato INT NOT NULL,
  fecha_devolucion DATE NOT NULL,
  monto_devuelto INT NOT NULL,
  metodo_devolucion VARCHAR(20) NOT NULL CHECK (metodo_devolucion IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia')),
  referencia VARCHAR(255),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato)
);

CREATE UNIQUE INDEX idx_garantia_devolucion_contrato ON garantia_devolucion(id_contrato);
CREATE INDEX idx_garantia_devolucion_fecha ON garantia_devolucion(fecha_devolucion);
```

---

## 📝 Notas Importantes

1. **Única garantía por contrato**: Los constraints `UNIQUE` en `id_contrato` aseguran que solo pueda haber una garantía pago y una devolución por contrato.

2. **Validación de estado**: Solo se puede devolver garantía cuando `contrato.estado === 'finalizado'`.

3. **Cálculo automático**: Si no se envía `monto_devuelto` en la devolución, se calcula automáticamente basándose en el estado de las herramientas.

4. **Porcentajes configurables**: Los porcentajes de devolución están en `garantias.constants.ts` y se pueden ajustar fácilmente.

5. **Sin devoluciones parciales**: La garantía se devuelve COMPLETA al final, NUNCA parcialmente durante el contrato.

6. **Logging completo**: Todos los métodos tienen logs informativos con emojis para facilitar el debugging.

7. **Error handling robusto**: Usa `DatabaseErrorHandler` para convertir errores de PostgreSQL en excepciones HTTP apropiadas.

---

## 🧪 Testing con Postman

Importa la colección de Postman (si existe) o crea requests siguiendo los ejemplos de este README.

### Flujo de Prueba Completo

1. Crear contrato con `monto_garantia: 100000`
2. Pagar garantía de 100000
3. Verificar que se pagó
4. Devolver herramientas (algunas dañadas)
5. Calcular monto de devolución
6. Crear devolución (automática o manual)
7. Ver resumen del contrato
8. Ver estadísticas generales

---

## 📚 Referencias

- **Entidades relacionadas:**
  - `Contrato` (`contratos.entity.ts`)
  - `DetalleContrato` (`detalle-contrato.entity.ts`)
  - `DevolucionHerramienta` (`devolucion-herramienta.entity.ts`)

- **Enums:**
  - `MetodoPago` (`pagos/enums/metodo-pago.enum.ts`)
  - `EstadoContrato` (`contratos/enums/estado-contrato.enum.ts`)
  - `EstadoDevolucion` (`devoluciones/enums/estado-devolucion.enum.ts`)

- **Utilities:**
  - `DatabaseErrorHandler` (`common/utils/database-errors.handler.ts`)
  - `parseLocalDate` (`common/utils/date.helper.ts`)
  - `PaginationDto` (`common/utils/dtos/pagination.dto.ts`)

---

**Desarrollado para RenTools** - Sistema de gestión de arriendos de herramientas
