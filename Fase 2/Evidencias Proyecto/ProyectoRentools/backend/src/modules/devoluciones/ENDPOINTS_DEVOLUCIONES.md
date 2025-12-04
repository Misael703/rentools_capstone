# API Endpoints - Módulo de Devoluciones

Base URL: `/devoluciones`

## Autenticación

Todos los endpoints requieren:
- Header: `Authorization: Bearer <token>`
- Roles permitidos: `admin`, `vendedor`

---

## POST /devoluciones

Registra una nueva devolución de herramientas.

### Request

```json
{
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15",
  "estado": "buen_estado",
  "observaciones": "Herramientas en perfecto estado"
}
```

### Validaciones

- `id_detalle`: Requerido, debe existir
- `cantidad_devuelta`: Requerido, mayor a 0, no debe exceder cantidad pendiente
- `fecha_devolucion`: Requerido, debe ser >= fecha_inicio del contrato
- `estado`: Requerido, valores: `buen_estado`, `danada`, `reparacion_menor`
- `observaciones`: Opcional

### Response 201

```json
{
  "id_devolucion": 1,
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15T00:00:00.000Z",
  "dias_reales": 5,
  "monto_cobrado": 50000,
  "estado": "buen_estado",
  "observaciones": "Herramientas en perfecto estado",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "detalle": {
    "id_detalle": 1,
    "nombre_herramienta": "Taladro Bosch",
    "cantidad": 2,
    "precio_unitario": 5000,
    "contrato": {
      "id_contrato": 1,
      "fecha_inicio": "2024-01-10T00:00:00.000Z",
      "estado": "finalizado",
      "cliente": {
        "id_cliente": 5,
        "nombre_completo": "Juan Pérez"
      }
    },
    "herramienta": {
      "id_herramienta": 10,
      "nombre": "Taladro Bosch",
      "stock": 12
    }
  }
}
```

### Errores

- `404 Not Found`: Detalle de contrato no encontrado
- `400 Bad Request`: Contrato no está activo/vencido
- `400 Bad Request`: Cantidad excede lo pendiente de devolver
- `400 Bad Request`: Fecha de devolución anterior a fecha de inicio

---

## GET /devoluciones

Lista todas las devoluciones con filtros y paginación.

### Query Params

- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10, max: 100)
- `id_contrato`: Filtrar por contrato
- `estado`: Filtrar por estado (`buen_estado`, `danada`, `reparacion_menor`)
- `fecha_devolucion`: Filtrar por fecha exacta (YYYY-MM-DD)

### Ejemplos

```
GET /devoluciones?page=1&limit=10
GET /devoluciones?id_contrato=5
GET /devoluciones?estado=buen_estado
GET /devoluciones?fecha_devolucion=2024-01-15
GET /devoluciones?id_contrato=5&estado=danada&page=2&limit=20
```

### Response 200

```json
{
  "data": [
    {
      "id_devolucion": 1,
      "cantidad_devuelta": 2,
      "fecha_devolucion": "2024-01-15T00:00:00.000Z",
      "dias_reales": 5,
      "monto_cobrado": 50000,
      "estado": "buen_estado",
      "detalle": {
        "nombre_herramienta": "Taladro Bosch",
        "contrato": {
          "id_contrato": 1
        }
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## GET /devoluciones/:id

Obtiene una devolución específica con todas sus relaciones.

### Response 200

```json
{
  "id_devolucion": 1,
  "id_detalle": 1,
  "cantidad_devuelta": 2,
  "fecha_devolucion": "2024-01-15T00:00:00.000Z",
  "dias_reales": 5,
  "monto_cobrado": 50000,
  "estado": "buen_estado",
  "observaciones": "Herramientas en perfecto estado",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "detalle": {
    "id_detalle": 1,
    "nombre_herramienta": "Taladro Bosch",
    "cantidad": 2,
    "precio_unitario": 5000,
    "contrato": {
      "id_contrato": 1,
      "fecha_inicio": "2024-01-10T00:00:00.000Z",
      "estado": "finalizado",
      "cliente": {
        "id_cliente": 5,
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

### Errores

- `404 Not Found`: Devolución no encontrada

---

## GET /devoluciones/contrato/:id_contrato

Obtiene todas las devoluciones de un contrato específico.

### Response 200

```json
[
  {
    "id_devolucion": 1,
    "cantidad_devuelta": 2,
    "fecha_devolucion": "2024-01-15T00:00:00.000Z",
    "dias_reales": 5,
    "monto_cobrado": 50000,
    "estado": "buen_estado",
    "detalle": {
      "nombre_herramienta": "Taladro Bosch",
      "herramienta": {
        "id_herramienta": 10
      }
    }
  },
  {
    "id_devolucion": 2,
    "cantidad_devuelta": 1,
    "fecha_devolucion": "2024-01-16T00:00:00.000Z",
    "dias_reales": 6,
    "monto_cobrado": 30000,
    "estado": "reparacion_menor",
    "observaciones": "Requiere cambio de cable",
    "detalle": {
      "nombre_herramienta": "Escalera Aluminio",
      "herramienta": {
        "id_herramienta": 15
      }
    }
  }
]
```

### Errores

- `404 Not Found`: Contrato no encontrado

---

## GET /devoluciones/contrato/:id_contrato/resumen

Obtiene un resumen completo del estado de devoluciones de un contrato.

**Endpoint más útil para ver el progreso de devoluciones**

### Response 200

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
      "nombre_herramienta": "Compresor Industrial",
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

### Estados de devolución

- `pendiente`: No se ha devuelto nada aún
- `parcial`: Se devolvió solo una parte
- `buen_estado`, `danada`, `reparacion_menor`: Se devolvió todo con el estado indicado

### Errores

- `404 Not Found`: Contrato no encontrado

---

## PATCH /devoluciones/:id

Actualiza una devolución (solo estado y observaciones).

**No permite cambiar cantidad, fecha, días ni montos**

### Request

```json
{
  "estado": "reparacion_menor",
  "observaciones": "Se detectó cable en mal estado, requiere reparación"
}
```

### Response 200

```json
{
  "id_devolucion": 1,
  "estado": "reparacion_menor",
  "observaciones": "Se detectó cable en mal estado, requiere reparación",
  ...
}
```

### Errores

- `404 Not Found`: Devolución no encontrada

---

## Lógica Especial: Finalización Automática de Contratos

Cuando se registra una devolución, el sistema verifica si se devolvieron **TODAS** las herramientas del contrato.

Si `total_devuelto == total_contratado`, el sistema automáticamente:

1. Cambia `contrato.estado = 'finalizado'`
2. Establece `contrato.fecha_termino_real` = fecha de la última devolución
3. Calcula `contrato.monto_final` = suma de todos los montos_cobrados

### Ejemplo

```
Contrato #5:
- Detalle 1: 2 Taladros
- Detalle 2: 1 Escalera
Total: 3 herramientas

Primera devolución:
POST /devoluciones
{ "id_detalle": 1, "cantidad_devuelta": 2, ... }
→ Total devuelto: 2/3 → Contrato sigue ACTIVO

Segunda devolución:
POST /devoluciones
{ "id_detalle": 2, "cantidad_devuelta": 1, ... }
→ Total devuelto: 3/3 → Contrato pasa a FINALIZADO automáticamente ✅
```

---

## Estados de Herramientas Devueltas

```typescript
enum EstadoDevolucion {
  BUEN_ESTADO = 'buen_estado',       // Sin daños
  DANADA = 'danada',                  // Daños significativos
  REPARACION_MENOR = 'reparacion_menor' // Requiere reparación menor
}
```

El estado se registra para después poder descontar de la garantía si hay daños.

---

## Códigos de Error

- `200 OK`: Operación exitosa
- `201 Created`: Devolución creada exitosamente
- `400 Bad Request`: Error de validación o regla de negocio
- `401 Unauthorized`: Token inválido o ausente
- `403 Forbidden`: Usuario sin permisos
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor
