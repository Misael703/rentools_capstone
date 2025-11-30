# Módulo de Contratos - RenTools

Sistema de gestión de contratos de arriendo de herramientas para RenTools.

## Características

- ✅ Creación de contratos con validación de stock
- ✅ Gestión de detalles de contrato (herramientas arrendadas)
- ✅ Snapshots de precios y datos al momento del contrato
- ✅ Control de estados (activo, finalizado, vencido, cancelado)
- ✅ Búsqueda y filtros avanzados
- ✅ Estadísticas y reportes
- ✅ Detección de contratos vencidos
- ✅ Transacciones para garantizar integridad de datos

## Entidades

### Contrato

Entidad principal que representa un contrato de arriendo.

**Campos principales:**
- `id_contrato`: ID único del contrato
- `id_cliente`: Referencia al cliente
- `id_usuario`: Referencia al usuario que creó el contrato
- `fecha_inicio`: Fecha de inicio del arriendo
- `fecha_termino_estimada`: Fecha estimada de devolución
- `fecha_termino_real`: Fecha real de devolución (cuando finaliza)
- `estado`: Estado actual (activo, finalizado, vencido, cancelado)
- `tipo_entrega`: Tipo de entrega (retiro, despacho)
- `monto_estimado`: Monto calculado al crear el contrato
- `monto_final`: Monto real al finalizar (incluye recargos/descuentos)
- `monto_garantia`: Monto de garantía del arriendo

### DetalleContrato

Representa cada herramienta incluida en un contrato.

**Campos principales:**
- `id_detalle`: ID único del detalle
- `id_contrato`: Referencia al contrato
- `id_herramienta`: Referencia a la herramienta
- `nombre_herramienta`: Snapshot del nombre (histórico)
- `sku_herramienta`: Snapshot del SKU (histórico)
- `cantidad`: Cantidad arrendada
- `precio_unitario`: Precio diario al momento del contrato
- `dias_arriendo`: Días de arriendo contratados
- `subtotal`: cantidad × precio_unitario × dias_arriendo

## Endpoints

### POST /contratos

Crea un nuevo contrato de arriendo.

**Permisos:** `admin`, `vendedor`

**Body:**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "observaciones": "Cliente requiere entrega temprano",
  "detalles": [
    {
      "id_herramienta": 5,
      "cantidad": 2,
      "dias_arriendo": 14
    },
    {
      "id_herramienta": 8,
      "cantidad": 1,
      "dias_arriendo": 14
    }
  ]
}
```

**Nota:** El `monto_garantia` se calcula automáticamente sumando las garantías de cada herramienta multiplicadas por su cantidad.

**Validaciones:**
- ✅ Cliente existe y está activo
- ✅ Herramientas existen y están activas
- ✅ Stock suficiente para cada herramienta
- ✅ `dias_arriendo >= herramienta.dias_minimo`
- ✅ `fecha_termino_estimada > fecha_inicio`
- ✅ Al menos 1 detalle en el contrato

**Proceso:**
1. Valida cliente, usuario y herramientas
2. Calcula monto estimado (suma de subtotales)
3. **Calcula monto de garantía automáticamente** (suma de garantías × cantidad)
4. Crea el contrato (transacción)
5. Crea los detalles con snapshots de precios
6. Descuenta el stock de las herramientas
7. Retorna el contrato completo con relaciones

**Respuesta exitosa (201):**
```json
{
  "id_contrato": 15,
  "id_cliente": 1,
  "id_usuario": 2,
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "estado": "activo",
  "tipo_entrega": "retiro",
  "monto_estimado": 280000,
  "monto_garantia": 50000,
  "observaciones": "Cliente requiere entrega temprano",
  "cliente": { ... },
  "usuario": { ... },
  "detalles": [
    {
      "id_detalle": 23,
      "id_herramienta": 5,
      "nombre_herramienta": "Taladro Percutor",
      "sku_herramienta": "TDRL-001",
      "cantidad": 2,
      "precio_unitario": 5000,
      "dias_arriendo": 14,
      "subtotal": 140000
    },
    ...
  ],
  "created_at": "2025-11-26T10:30:00.000Z",
  "updated_at": "2025-11-26T10:30:00.000Z"
}
```

---

### GET /contratos

Lista todos los contratos con filtros y paginación.

**Permisos:** `admin`, `vendedor`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `id_cliente` (opcional): Filtrar por cliente
- `id_usuario` (opcional): Filtrar por usuario
- `estado` (opcional): Filtrar por estado (activo, finalizado, vencido, cancelado)
- `tipo_entrega` (opcional): Filtrar por tipo (retiro, despacho)
- `fecha_inicio` (opcional): Filtrar por fecha de inicio exacta
- `fecha_inicio_desde` (opcional): Filtrar desde esta fecha
- `fecha_inicio_hasta` (opcional): Filtrar hasta esta fecha

**Ejemplo:**
```
GET /contratos?page=1&limit=20&estado=activo&id_cliente=5
```

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id_contrato": 15,
      "estado": "activo",
      "monto_estimado": 280000,
      "cliente": { ... },
      "usuario": { ... },
      "detalles": [ ... ],
      ...
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### GET /contratos/:id

Obtiene un contrato específico con todas sus relaciones.

**Permisos:** `admin`, `vendedor`

**Respuesta exitosa (200):**
```json
{
  "id_contrato": 15,
  "cliente": { ... },
  "usuario": { ... },
  "detalles": [
    {
      "id_detalle": 23,
      "herramienta": { ... },
      "cantidad": 2,
      "precio_unitario": 5000,
      "dias_arriendo": 14,
      "subtotal": 140000
    }
  ],
  ...
}
```

---

### GET /contratos/cliente/:id_cliente

Obtiene todos los contratos de un cliente específico.

**Permisos:** `admin`, `vendedor`

**Query Parameters:** Acepta los mismos filtros que `/contratos`

**Ejemplo:**
```
GET /contratos/cliente/5?estado=activo
```

---

### GET /contratos/usuario/:id_usuario

Obtiene todos los contratos creados por un usuario específico.

**Permisos:** `admin`, `vendedor`

**Query Parameters:** Acepta los mismos filtros que `/contratos`

---

### GET /contratos/stats

Obtiene estadísticas generales de contratos.

**Permisos:** `admin`, `vendedor`

**Respuesta exitosa (200):**
```json
{
  "totalContratos": 150,
  "porEstado": {
    "activos": 25,
    "finalizados": 100,
    "vencidos": 5,
    "cancelados": 20
  },
  "montoTotalEnArriendo": 5600000,
  "contratosPorMes": [
    { "mes": "2024-12", "cantidad": "15" },
    { "mes": "2025-01", "cantidad": "22" },
    { "mes": "2025-11", "cantidad": "18" }
  ]
}
```

---

### GET /contratos/vencidos

Obtiene contratos vencidos (fecha_termino_estimada < HOY y estado = ACTIVO).

**Permisos:** `admin`, `vendedor`

**Respuesta exitosa (200):**
```json
[
  {
    "id_contrato": 12,
    "fecha_termino_estimada": "2025-11-20",
    "estado": "activo",
    "cliente": { ... },
    "detalles": [ ... ]
  }
]
```

---

### PATCH /contratos/:id

Actualiza un contrato (solo campos permitidos).

**Permisos:** `admin`, `vendedor`

**Restricciones:**
- ✅ Solo se puede actualizar si `estado = 'activo'`
- ✅ NO se pueden cambiar: cliente, fechas, detalles

**Campos permitidos:**
- `tipo_entrega`
- `monto_garantia`
- `observaciones`

**Body:**
```json
{
  "tipo_entrega": "despacho",
  "monto_garantia": 60000,
  "observaciones": "Se cambió a despacho por solicitud del cliente"
}
```

**Respuesta exitosa (200):** Contrato actualizado completo

---

### PATCH /contratos/:id/finalizar

Finaliza un contrato y calcula el monto final.

**Permisos:** `admin`, `vendedor`

**Proceso:**
1. Valida que el contrato esté activo
2. Calcula el monto final (actualmente = monto_estimado)
3. Cambia estado a `finalizado`
4. Registra `fecha_termino_real`

**Respuesta exitosa (200):** Contrato finalizado completo

**Nota:** Este endpoint está preparado para integrarse con un futuro módulo de devoluciones que calcule multas, daños, días extras, etc.

---

### DELETE /contratos/:id

Cancela un contrato y devuelve el stock a las herramientas.

**Permisos:** `admin`, `vendedor`

**Restricciones:**
- ✅ Solo se puede cancelar si `estado = 'activo'`

**Proceso:**
1. Valida que el contrato esté activo
2. Devuelve el stock de todas las herramientas (transacción)
3. Cambia estado a `cancelado`

**Respuesta exitosa (200):** Contrato cancelado completo

---

## Estados de Contrato

### ACTIVO
- Contrato vigente
- Las herramientas están en poder del cliente
- El stock fue descontado

### FINALIZADO
- El cliente devolvió todas las herramientas
- Se calculó el monto final
- Se registró la fecha de término real

### VENCIDO
- Contrato que pasó su fecha_termino_estimada
- Aún no se han devuelto las herramientas
- Puede marcarse automáticamente con una tarea programada

### CANCELADO
- Contrato anulado
- El stock fue devuelto a las herramientas
- No procede cobro

## Validaciones de Negocio

### Al crear un contrato:

1. **Cliente activo**: El cliente debe existir y estar activo
2. **Usuario activo**: El usuario debe existir y estar activo
3. **Herramientas activas**: Todas las herramientas deben estar activas
4. **Stock suficiente**: Cada herramienta debe tener stock >= cantidad solicitada
5. **Días mínimos**: `dias_arriendo >= herramienta.dias_minimo`
6. **Fechas válidas**: `fecha_termino_estimada > fecha_inicio`
7. **Al menos 1 detalle**: El contrato debe tener al menos 1 herramienta

### Snapshots:

Al crear el contrato, se guardan "snapshots" de:
- Nombre de la herramienta
- SKU de la herramienta
- Precio unitario (precio_diario)

Esto permite mantener un histórico correcto aunque los datos de la herramienta cambien en el futuro.

## Cálculo de Montos

### Monto Estimado (al crear):
```
subtotal = cantidad × precio_unitario × dias_arriendo
monto_estimado = Σ (subtotales de todos los detalles)
```

### Monto de Garantía (cálculo automático):
```
garantia_por_detalle = herramienta.garantia × cantidad
monto_garantia = Σ (garantias de todos los detalles)
```

**Importante:** El monto de garantía se calcula automáticamente al crear el contrato. No es necesario enviarlo en el request.

### Monto Final (al finalizar):
```
Actualmente: monto_final = monto_estimado

En el futuro (con módulo de devoluciones):
monto_final = monto_estimado + recargos - descuentos
  + días_extra
  + multas_por_daños
  - descuentos_por_devolución_anticipada
```

## Integración con otros módulos

### Herramientas
- Valida disponibilidad de stock
- Descuenta stock al crear contrato
- Devuelve stock al cancelar contrato

### Clientes
- Valida que el cliente exista y esté activo
- Relaciona el contrato con el cliente

### Usuarios
- Obtiene el usuario del token JWT
- Registra quién creó el contrato

## Extensiones Futuras

### Módulo de Devoluciones (recomendado):
- Registrar devoluciones parciales
- Calcular días extras
- Registrar daños y multas
- Calcular monto final automáticamente
- Devolver stock gradualmente

### Tareas Programadas:
```typescript
@Cron('0 0 * * *') // Diario a medianoche
async marcarContratosVencidos() {
  await this.contratosService.marcarVencidos();
}
```

### Notificaciones:
- Alertar contratos próximos a vencer
- Notificar contratos vencidos
- Recordatorios de devolución

## Ejemplos de Uso

### Crear un contrato simple:

```bash
curl -X POST http://localhost:3000/contratos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_cliente": 1,
    "tipo_entrega": "retiro",
    "fecha_inicio": "2025-11-26",
    "fecha_termino_estimada": "2025-12-10",
    "monto_garantia": 50000,
    "detalles": [
      {
        "id_herramienta": 5,
        "cantidad": 2,
        "dias_arriendo": 14
      }
    ]
  }'
```

### Buscar contratos activos de un cliente:

```bash
curl -X GET "http://localhost:3000/contratos/cliente/1?estado=activo" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ver contratos vencidos:

```bash
curl -X GET http://localhost:3000/contratos/vencidos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Finalizar un contrato:

```bash
curl -X PATCH http://localhost:3000/contratos/15/finalizar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cancelar un contrato:

```bash
curl -X DELETE http://localhost:3000/contratos/15 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Manejo de Errores

### 400 Bad Request
- Stock insuficiente
- Días de arriendo menores al mínimo
- Fechas inválidas
- Cliente o usuario inactivo
- Solo se puede actualizar/cancelar contratos activos

### 404 Not Found
- Contrato no encontrado
- Cliente no encontrado
- Usuario no encontrado
- Herramienta no encontrada

### 409 Conflict
- Error de integridad en base de datos
- Violación de constraints

### 500 Internal Server Error
- Error en transacción
- Error de base de datos no manejado

## Notas Técnicas

- **Transacciones**: Se usan transacciones para crear contratos y cancelarlos, garantizando la integridad de datos (contrato + detalles + stock).
- **Soft Delete**: Actualmente no implementado, los contratos se mantienen con estado 'cancelado'.
- **Índices**: Se crearon índices en campos frecuentemente consultados (cliente, usuario, estado, fechas).
- **Eager Loading**: Las relaciones se cargan selectivamente según el endpoint.
- **Montos**: Todos los montos son enteros (pesos chilenos sin decimales).

---

**Versión:** 1.0.0
**Última actualización:** 2025-11-26
