# Módulo de Devoluciones

Sistema de gestión de devoluciones de herramientas para RenTools.

## Descripción

Este módulo maneja el proceso completo de devolución de herramientas arrendadas, incluyendo:

- Registro de devoluciones parciales o totales
- Cálculo automático de días reales y montos cobrados
- Devolución automática de stock a las herramientas
- Finalización automática de contratos cuando se devuelve todo
- Registro del estado de las herramientas devueltas (buen estado, dañadas, etc.)
- Resúmenes y reportes de devoluciones por contrato

## Entidad Principal

### DevolucionHerramienta

```typescript
{
  id_devolucion: number;
  id_detalle: number;
  cantidad_devuelta: number;
  fecha_devolucion: Date;
  dias_reales: number;        // Calculado automáticamente
  monto_cobrado: number;      // Calculado automáticamente
  estado: 'buen_estado' | 'danada' | 'reparacion_menor';
  observaciones?: string;
  created_at: Date;
  updated_at: Date;
}
```

## Endpoints

### POST /devoluciones

Registra una nueva devolución de herramientas.

**Permisos:** `admin`, `vendedor`

**Body:**

```json
{
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15",
  "estado": "buen_estado",
  "observaciones": "Herramientas en perfecto estado"
}
```

**Proceso:**

1. Valida que el detalle existe y el contrato está activo
2. Verifica que la cantidad no exceda lo pendiente de devolver
3. Calcula `dias_reales` = fecha_devolucion - contrato.fecha_inicio
4. Calcula `monto_cobrado` = cantidad × precio_unitario × dias_reales
5. Devuelve stock a la herramienta
6. Guarda la devolución
7. Verifica si se devolvió TODO el contrato:
   - Si total_devuelto = total_contratado → Finaliza el contrato automáticamente

**Response:**

```json
{
  "id_devolucion": 1,
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15",
  "dias_reales": 5,
  "monto_cobrado": 50000,
  "estado": "buen_estado",
  "observaciones": "Herramientas en perfecto estado",
  "detalle": {
    "id_detalle": 1,
    "nombre_herramienta": "Taladro Bosch",
    "cantidad": 2,
    "precio_unitario": 5000,
    "contrato": {
      "id_contrato": 1,
      "fecha_inicio": "2024-01-10",
      "estado": "finalizado"
    }
  }
}
```

### GET /devoluciones

Lista todas las devoluciones con filtros y paginación.

**Permisos:** `admin`, `vendedor`

**Query Params:**

- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10, max: 100)
- `id_contrato`: Filtrar por contrato
- `estado`: Filtrar por estado (buen_estado, danada, reparacion_menor)
- `fecha_devolucion`: Filtrar por fecha exacta (YYYY-MM-DD)

**Ejemplo:**

```
GET /devoluciones?id_contrato=5&estado=buen_estado&page=1&limit=10
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### GET /devoluciones/:id

Obtiene una devolución específica con todas sus relaciones.

**Permisos:** `admin`, `vendedor`

**Response:**

```json
{
  "id_devolucion": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15",
  "dias_reales": 5,
  "monto_cobrado": 50000,
  "estado": "buen_estado",
  "detalle": {
    "nombre_herramienta": "Taladro Bosch",
    "contrato": {
      "id_contrato": 1,
      "cliente": {
        "nombre_completo": "Juan Pérez"
      }
    },
    "herramienta": {
      "id_herramienta": 10,
      "nombre": "Taladro Bosch"
    }
  }
}
```

### GET /devoluciones/contrato/:id_contrato

Obtiene todas las devoluciones de un contrato específico.

**Permisos:** `admin`, `vendedor`

**Response:**

```json
[
  {
    "id_devolucion": 1,
    "cantidad_devuelta": 2,
    "fecha_devolucion": "2024-01-15",
    "dias_reales": 5,
    "monto_cobrado": 50000,
    "estado": "buen_estado",
    "detalle": {
      "nombre_herramienta": "Taladro Bosch"
    }
  },
  {
    "id_devolucion": 2,
    "cantidad_devuelta": 1,
    "fecha_devolucion": "2024-01-16",
    "dias_reales": 6,
    "monto_cobrado": 30000,
    "estado": "reparacion_menor",
    "observaciones": "Requiere cambio de cable",
    "detalle": {
      "nombre_herramienta": "Escalera Aluminio"
    }
  }
]
```

### GET /devoluciones/contrato/:id_contrato/resumen

Obtiene un resumen completo del estado de devoluciones de un contrato.

**Permisos:** `admin`, `vendedor`

**Response:**

```json
{
  "contrato": {
    "id_contrato": 1,
    "estado": "activo",
    "monto_estimado": 250000,
    "monto_cobrado_hasta_ahora": 120000
  },
  "herramientas": [
    {
      "id_detalle": 1,
      "nombre_herramienta": "Taladro Bosch",
      "cantidad_contratada": 2,
      "cantidad_devuelta": 0,
      "cantidad_pendiente": 2,
      "estado_devolucion": "pendiente"
    },
    {
      "id_detalle": 2,
      "nombre_herramienta": "Escalera Aluminio",
      "cantidad_contratada": 3,
      "cantidad_devuelta": 2,
      "cantidad_pendiente": 1,
      "estado_devolucion": "parcial",
      "monto_cobrado": 80000
    },
    {
      "id_detalle": 3,
      "nombre_herramienta": "Compresor",
      "cantidad_contratada": 1,
      "cantidad_devuelta": 1,
      "cantidad_pendiente": 0,
      "estado_devolucion": "buen_estado",
      "monto_cobrado": 40000
    }
  ],
  "resumen": {
    "total_herramientas": 6,
    "total_devueltas": 3,
    "total_pendientes": 3,
    "porcentaje_devuelto": 50.0
  }
}
```

### PATCH /devoluciones/:id

Actualiza una devolución (solo estado y observaciones).

**Permisos:** `admin`, `vendedor`

**Body:**

```json
{
  "estado": "reparacion_menor",
  "observaciones": "Se detectó cable en mal estado, requiere reparación"
}
```

**Nota:** NO se permite cambiar `cantidad_devuelta`, `fecha_devolucion`, `dias_reales` ni `monto_cobrado`.

## Validaciones Implementadas

### Al crear una devolución:

1. ✅ El detalle del contrato debe existir
2. ✅ El contrato debe estar en estado `activo` o `vencido`
3. ✅ `cantidad_devuelta` debe ser mayor a 0
4. ✅ `cantidad_devuelta` no puede exceder la cantidad pendiente de devolver
5. ✅ `fecha_devolucion` debe ser >= `contrato.fecha_inicio`
6. ✅ Se usa transacción para garantizar atomicidad
7. ✅ El stock se devuelve automáticamente a la herramienta

### Finalización automática de contratos:

Cuando la suma de `cantidad_devuelta` de todas las devoluciones de un contrato es igual al total de herramientas contratadas, el sistema automáticamente:

1. Actualiza `contrato.estado = 'finalizado'`
2. Establece `contrato.fecha_termino_real` = fecha de la última devolución
3. Calcula `contrato.monto_final` = suma de todos los `montos_cobrados`

## Estados de Devolución

```typescript
enum EstadoDevolucion {
  BUEN_ESTADO = 'buen_estado',
  DANADA = 'danada',
  REPARACION_MENOR = 'reparacion_menor',
}
```

- **buen_estado:** Herramienta devuelta sin problemas
- **danada:** Herramienta con daños significativos
- **reparacion_menor:** Herramienta con daños menores que requieren reparación

El estado se registra para después poder descontar de la garantía si hay daños.

## Cálculos Automáticos

### Días Reales

```typescript
dias_reales = Math.ceil(
  (fecha_devolucion - contrato.fecha_inicio) / (1000 * 60 * 60 * 24),
);
```

### Monto Cobrado

```typescript
monto_cobrado = cantidad_devuelta * precio_unitario * dias_reales;
```

## Ejemplos de Uso

### Caso 1: Devolución completa (una sola vez)

Cliente arrienda 2 taladros por 5 días estimados, pero los devuelve al día 7.

```bash
# Registrar devolución
POST /devoluciones
{
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-17",
  "estado": "buen_estado"
}

# Sistema calcula:
# - dias_reales: 7 (no 5)
# - monto_cobrado: 2 × 5000 × 7 = 70000 (no 50000)
# - Stock devuelto: +2 taladros
# - Contrato finalizado automáticamente ✅
```

### Caso 2: Devolución parcial (múltiples veces)

Cliente arrienda 5 escaleras. Devuelve 2 el día 3, luego 3 el día 5.

```bash
# Primera devolución
POST /devoluciones
{
  "id_detalle": 2,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-13",
  "estado": "buen_estado"
}
# Sistema: dias_reales = 3, monto = 2 × 3000 × 3 = 18000
# Contrato sigue ACTIVO (faltan 3 por devolver)

# Segunda devolución
POST /devoluciones
{
  "id_detalle": 2,
  "cantidad_devuelta": 3,
  "fecha_devolucion": "2024-01-15",
  "estado": "reparacion_menor",
  "observaciones": "Una escalera tiene peldaños flojos"
}
# Sistema: dias_reales = 5, monto = 3 × 3000 × 5 = 45000
# Total devuelto: 5 → Contrato FINALIZADO automáticamente ✅
# Monto final del contrato: 18000 + 45000 = 63000
```

### Caso 3: Consultar resumen de un contrato

```bash
GET /devoluciones/contrato/5/resumen

# Respuesta muestra:
# - Qué se ha devuelto
# - Qué falta por devolver
# - Montos cobrados
# - Estado de cada herramienta
```

## Integración con otros módulos

### Contratos

- Lee el contrato para validar estado
- Finaliza el contrato automáticamente cuando se devuelve todo
- Calcula `monto_final` basado en las devoluciones

### Herramientas

- Devuelve el stock automáticamente con cada devolución

### DetalleContrato

- Lee la información del arriendo (cantidad, precio, días)
- Valida cantidad disponible para devolver

## Manejo de Errores

El módulo usa `DatabaseErrorHandler` para manejar errores de base de datos y lanza excepciones apropiadas:

- `NotFoundException`: Cuando no se encuentra el detalle o contrato
- `BadRequestException`: Cuando hay validaciones de negocio que fallan

## Logging

Todos los métodos importantes generan logs descriptivos:

- 📦 Procesando devolución
- ✅ Devolución registrada exitosamente
- 📊 Estado de devoluciones del contrato
- 🏁 Contrato finalizado automáticamente
- ❌ Errores detallados

## Transacciones

El método `create` usa transacciones de base de datos para garantizar que:

1. Se guarda la devolución
2. Se devuelve el stock
3. Se finaliza el contrato si corresponde

Todo esto ocurre de forma atómica. Si algo falla, se hace rollback completo.

## Notas Importantes

1. Los campos `dias_reales` y `monto_cobrado` son calculados automáticamente, NO se reciben en el DTO
2. El stock se devuelve INMEDIATAMENTE al registrar la devolución
3. El contrato se finaliza AUTOMÁTICAMENTE cuando se devuelve todo
4. Solo se permite actualizar `estado` y `observaciones` después de crear la devolución
5. El sistema permite devoluciones parciales múltiples del mismo detalle
6. Los daños se registran en el campo `estado` para después descontar de la garantía
