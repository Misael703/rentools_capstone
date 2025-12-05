# Módulo de Pagos

Módulo para gestionar los pagos de contratos en RenTools.

## Descripción

El módulo de Pagos permite registrar, consultar y administrar los pagos realizados por los clientes para sus contratos de arriendo de herramientas. Incluye funcionalidades para:

- ✅ Registrar pagos (efectivo, tarjeta débito, tarjeta crédito, transferencia)
- ✅ Consultar pagos por contrato
- ✅ Obtener resumen de pagos de un contrato (total pagado, saldo pendiente)
- ✅ Estadísticas de recaudación
- ✅ Filtros y paginación
- ✅ Validaciones de negocio

## Tabla de Base de Datos

```sql
CREATE TABLE pagos (
  id_pago SERIAL PRIMARY KEY,
  id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
  fecha_pago DATE NOT NULL,
  monto INT NOT NULL,
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia')),
  referencia VARCHAR(255),
  id_dte INT REFERENCES dte(id_documento),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagos_id_contrato ON pagos(id_contrato);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);
CREATE INDEX idx_pagos_metodo_pago ON pagos(metodo_pago);
```

## Endpoints

### POST /pagos
Registra un nuevo pago.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Request Body:**
```json
{
  "id_contrato": 1,
  "fecha_pago": "2024-11-28",
  "monto": 150000,
  "metodo_pago": "tarjeta_credito",
  "referencia": "TRANS-12345"
}
```

**Response:** `201 Created`
```json
{
  "id_pago": 1,
  "id_contrato": 1,
  "fecha_pago": "2024-11-28",
  "monto": 150000,
  "metodo_pago": "tarjeta_credito",
  "referencia": "TRANS-12345",
  "id_dte": null,
  "created_at": "2024-11-28T10:00:00.000Z",
  "updated_at": "2024-11-28T10:00:00.000Z",
  "contrato": {
    "id_contrato": 1,
    "estado": "activo",
    "monto_final": 200000,
    "cliente": {
      "id_cliente": 1,
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
}
```

---

### GET /pagos
Lista todos los pagos con filtros y paginación.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Cantidad de resultados por página (default: 10, max: 100)
- `id_contrato` (opcional): Filtrar por contrato
- `metodo_pago` (opcional): Filtrar por método de pago
- `fecha_pago` (opcional): Filtrar por fecha específica (formato: YYYY-MM-DD)
- `fecha_desde` (opcional): Filtrar desde una fecha (formato: YYYY-MM-DD)
- `fecha_hasta` (opcional): Filtrar hasta una fecha (formato: YYYY-MM-DD)

**Ejemplo:**
```
GET /pagos?id_contrato=1&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id_pago": 1,
      "id_contrato": 1,
      "fecha_pago": "2024-11-28",
      "monto": 150000,
      "metodo_pago": "tarjeta_credito",
      "referencia": "TRANS-12345",
      "contrato": {
        "id_contrato": 1,
        "estado": "activo",
        "cliente": {
          "nombre": "Juan",
          "apellido": "Pérez"
        }
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /pagos/:id
Obtiene un pago específico por ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Response:** `200 OK`
```json
{
  "id_pago": 1,
  "id_contrato": 1,
  "fecha_pago": "2024-11-28",
  "monto": 150000,
  "metodo_pago": "tarjeta_credito",
  "referencia": "TRANS-12345",
  "id_dte": null,
  "created_at": "2024-11-28T10:00:00.000Z",
  "updated_at": "2024-11-28T10:00:00.000Z",
  "contrato": {
    "id_contrato": 1,
    "estado": "activo",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
}
```

---

### GET /pagos/contrato/:id_contrato
Obtiene todos los pagos de un contrato específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Response:** `200 OK`
```json
{
  "pagos": [
    {
      "id_pago": 1,
      "fecha_pago": "2024-11-28",
      "monto": 150000,
      "metodo_pago": "tarjeta_credito",
      "referencia": "TRANS-12345"
    },
    {
      "id_pago": 2,
      "fecha_pago": "2024-11-29",
      "monto": 50000,
      "metodo_pago": "efectivo",
      "referencia": null
    }
  ],
  "total_pagado": 200000
}
```

---

### GET /pagos/contrato/:id_contrato/resumen
Obtiene un resumen completo de pagos de un contrato.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Response:** `200 OK`
```json
{
  "contrato": {
    "id_contrato": 1,
    "estado": "finalizado",
    "monto_final": 200000,
    "monto_estimado": 180000,
    "cliente": {
      "id_cliente": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "rut": "12345678-9"
    }
  },
  "pagos": [
    {
      "id_pago": 1,
      "fecha_pago": "2024-11-28",
      "monto": 150000,
      "metodo_pago": "tarjeta_credito",
      "referencia": "TRANS-12345"
    },
    {
      "id_pago": 2,
      "fecha_pago": "2024-11-28",
      "monto": 50000,
      "metodo_pago": "efectivo",
      "referencia": null
    }
  ],
  "resumen": {
    "monto_total_a_pagar": 200000,
    "monto_total_pagado": 200000,
    "saldo_pendiente": 0,
    "estado_pago": "pagado_completo",
    "cantidad_pagos": 2
  }
}
```

**Estados de pago posibles:**
- `sin_pagos`: No hay pagos registrados
- `pago_parcial`: Hay pagos pero queda saldo pendiente
- `pagado_completo`: El monto total está pagado

---

### PATCH /pagos/:id
Actualiza un pago (solo referencia).

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`, `vendedor`

**Request Body:**
```json
{
  "referencia": "TRANS-UPDATED-12345"
}
```

**Response:** `200 OK`
```json
{
  "id_pago": 1,
  "referencia": "TRANS-UPDATED-12345",
  ...
}
```

**Nota:** Solo se puede actualizar el campo `referencia`. NO se permite cambiar monto, fecha ni método de pago.

---

### DELETE /pagos/:id
Elimina un pago.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`

**Response:** `204 No Content`

**Validaciones:**
- ❌ No se puede eliminar un pago que tiene un DTE asociado

---

### GET /pagos/stats
Obtiene estadísticas de pagos.

**Headers:**
```
Authorization: Bearer {token}
```

**Roles permitidos:** `admin`

**Response:** `200 OK`
```json
{
  "total_recaudado": 1500000,
  "cantidad_pagos": 25,
  "por_metodo_pago": [
    {
      "metodo": "tarjeta_credito",
      "total": 800000,
      "cantidad": 10
    },
    {
      "metodo": "efectivo",
      "total": 500000,
      "cantidad": 12
    },
    {
      "metodo": "transferencia",
      "total": 200000,
      "cantidad": 3
    }
  ],
  "por_mes": [
    {
      "mes": "2024-11",
      "total": 900000,
      "cantidad": 15
    },
    {
      "mes": "2024-10",
      "total": 600000,
      "cantidad": 10
    }
  ]
}
```

---

## Flujo de Negocio

### 🔄 Relación con Devoluciones

El módulo de Pagos trabaja en conjunto con el módulo de Devoluciones:

1. **Cliente devuelve herramientas** → Devoluciones calcula el `monto_cobrado` basado en días reales
2. **Cliente puede pagar lo devuelto** → Pagos permite registrar pagos hasta el monto ya devuelto
3. **Cliente puede seguir devolviendo** → No es obligatorio pagar para seguir devolviendo
4. **Cliente puede devolver TODO sin pagar** → La devolución NO bloquea por falta de pago
5. **Pago completo se exige en DTEs** → Para emitir factura y devolver garantía se requiere pago total

### ✅ Reglas de Negocio

**Permitido:**
- ✅ Devolver herramientas sin haber pagado nada
- ✅ Pagar parcialmente a medida que se devuelve
- ✅ Acumular devoluciones y pagar todo al final
- ✅ Devolver TODO sin haber pagado (el pago se exige después para DTEs)

**NO Permitido:**
- ❌ Pagar sin haber devuelto ninguna herramienta
- ❌ Pagar más de lo que se ha devuelto (monto cobrado hasta ahora)

---

## Validaciones

### Al crear un pago:
- ✅ El contrato debe existir
- ✅ El monto debe ser mayor a 0
- ✅ La fecha de pago no puede ser anterior a la fecha de inicio del contrato
- ✅ El método de pago debe ser válido
- ✅ **Debe haber al menos una devolución registrada** (no se puede pagar sin devolver)
- ✅ **El monto no puede exceder el saldo disponible** (monto_cobrado - total_pagado)

### Al actualizar un pago:
- ✅ Solo se puede actualizar el campo `referencia`
- ✅ No se puede cambiar monto, fecha ni método de pago

### Al eliminar un pago:
- ✅ No se puede eliminar si tiene un DTE asociado

---

## Métodos de Pago

```typescript
enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA_DEBITO = 'tarjeta_debito',
  TARJETA_CREDITO = 'tarjeta_credito',
  TRANSFERENCIA = 'transferencia',
}
```

---

## Relaciones

- **Contrato**: Un pago pertenece a un contrato (`ManyToOne`)
- **DTE**: Un pago puede tener un DTE asociado (campo `id_dte` para futuro uso)

---

## Logs del Sistema

El servicio registra logs informativos:

```
💰 Procesando pago de $150000 para contrato #1
✅ Pago #1 registrado. Monto: $150000, Método: tarjeta_credito
🎉 Contrato #1 pagado completamente. Total pagado: $200000 / $200000
📊 Contrato #1: $150000 pagado de $200000. Saldo pendiente: $50000
✅ Pago #1 actualizado exitosamente
✅ Pago #1 eliminado exitosamente
```

---

## Casos de Uso

### 1. Registrar un pago parcial
```bash
POST /pagos
{
  "id_contrato": 1,
  "fecha_pago": "2024-11-28",
  "monto": 100000,
  "metodo_pago": "efectivo"
}
```

### 2. Ver todos los pagos de un contrato
```bash
GET /pagos/contrato/1
```

### 3. Ver resumen de pagos (para saber cuánto falta por pagar)
```bash
GET /pagos/contrato/1/resumen
```

### 4. Ver pagos por método de pago
```bash
GET /pagos?metodo_pago=efectivo&page=1&limit=20
```

### 5. Ver pagos de un rango de fechas
```bash
GET /pagos?fecha_desde=2024-11-01&fecha_hasta=2024-11-30
```

### 6. Ver estadísticas de recaudación
```bash
GET /pagos/stats
```

---

## Integración con DTEs

El campo `id_dte` está preparado para cuando implementes el módulo de DTEs (Documentos Tributarios Electrónicos).

**Validación en módulo DTEs:**
- Para emitir un DTE (factura), el contrato **DEBE estar pagado completamente**
- Para devolver la garantía, el contrato **DEBE estar pagado completamente**
- El módulo de Pagos solo registra los pagos, la validación de pago completo se hace en DTEs

---

## Notas Importantes

### Flujo de Trabajo
1. **Devolver herramientas** → Se calcula el monto real basado en días de arriendo
2. **Pagar (opcional)** → Cliente puede pagar al momento de devolver o esperar
3. **Finalizar devoluciones** → Se puede devolver TODO sin haber pagado
4. **Emitir DTE y devolver garantía** → AQUÍ se exige pago completo (módulo DTEs)

### Características
- Los montos son en pesos chilenos (enteros, sin decimales)
- Solo se puede pagar lo que ya se ha devuelto (monto_cobrado)
- Se pueden registrar múltiples pagos para un mismo contrato (pagos parciales)
- El sistema calcula automáticamente si un contrato está pagado completamente
- Si se devuelve todo sin pagar, el sistema emite un **warning** (no error)
- Los pagos se ordenan por fecha descendente por defecto

### Validaciones Importantes
- ❌ **NO** se puede pagar sin haber devuelto al menos una herramienta
- ❌ **NO** se puede pagar más de lo que se ha cobrado por devoluciones
- ✅ **SÍ** se puede devolver todo sin pagar (el pago se exige después)
- ✅ **SÍ** se puede pagar parcialmente a medida que se devuelve

---

## Testing

### Crear un pago
```bash
curl -X POST http://localhost:3000/pagos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_contrato": 1,
    "fecha_pago": "2024-11-28",
    "monto": 150000,
    "metodo_pago": "tarjeta_credito",
    "referencia": "TRANS-12345"
  }'
```

### Obtener resumen de pagos
```bash
curl -X GET http://localhost:3000/pagos/contrato/1/resumen \
  -H "Authorization: Bearer {token}"
```

### Obtener estadísticas
```bash
curl -X GET http://localhost:3000/pagos/stats \
  -H "Authorization: Bearer {token}"
```
