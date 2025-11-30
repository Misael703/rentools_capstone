# Casos de Prueba - Módulo Contratos

## Casos de Prueba por Funcionalidad

### 1. CREAR CONTRATO (POST /contratos)

#### ✅ Casos Exitosos

**TC-001: Crear contrato básico con 1 herramienta**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "monto_garantia": 30000,
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 1,
      "dias_arriendo": 14
    }
  ]
}
```
**Resultado esperado:** Status 201, contrato creado con monto_estimado calculado

---

**TC-002: Crear contrato con múltiples herramientas**
```json
{
  "id_cliente": 2,
  "tipo_entrega": "despacho",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-20",
  "monto_garantia": 100000,
  "observaciones": "Proyecto grande - múltiples herramientas",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 2,
      "dias_arriendo": 24
    },
    {
      "id_herramienta": 2,
      "cantidad": 1,
      "dias_arriendo": 24
    },
    {
      "id_herramienta": 3,
      "cantidad": 3,
      "dias_arriendo": 24
    }
  ]
}
```
**Resultado esperado:** Status 201, monto_estimado = suma de todos los subtotales

---

**TC-003: Crear contrato sin garantía (opcional)**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-27",
  "fecha_termino_estimada": "2025-11-30",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 1,
      "dias_arriendo": 3
    }
  ]
}
```
**Resultado esperado:** Status 201, monto_garantia = 0 (default)

---

**TC-004: Crear contrato sin observaciones (opcional)**
```json
{
  "id_cliente": 3,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-05",
  "monto_garantia": 25000,
  "detalles": [
    {
      "id_herramienta": 2,
      "cantidad": 1,
      "dias_arriendo": 9
    }
  ]
}
```
**Resultado esperado:** Status 201, observaciones = null

---

#### ❌ Casos de Error

**TC-E001: Cliente no existe**
```json
{
  "id_cliente": 9999,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [...]
}
```
**Resultado esperado:** Status 404, "Cliente con ID 9999 no encontrado"

---

**TC-E002: Cliente inactivo**
```json
{
  "id_cliente": 5,  // Asume que cliente 5 está inactivo
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, "El cliente no está activo"

---

**TC-E003: Herramienta no existe**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [
    {
      "id_herramienta": 9999,
      "cantidad": 1,
      "dias_arriendo": 7
    }
  ]
}
```
**Resultado esperado:** Status 404, "Herramienta con ID 9999 no encontrado"

---

**TC-E004: Herramienta inactiva**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [
    {
      "id_herramienta": 10,  // Asume que herramienta 10 está inactiva
      "cantidad": 1,
      "dias_arriendo": 7
    }
  ]
}
```
**Resultado esperado:** Status 400, "La herramienta [nombre] no está activa"

---

**TC-E005: Stock insuficiente**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 100,  // Más de lo disponible
      "dias_arriendo": 7
    }
  ]
}
```
**Resultado esperado:** Status 400, "Stock insuficiente para [nombre]. Disponible: X, Solicitado: 100"

---

**TC-E006: Días arriendo menor al mínimo**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 1,
      "dias_arriendo": 1  // Si dias_minimo = 7
    }
  ]
}
```
**Resultado esperado:** Status 400, "La herramienta [nombre] requiere un mínimo de 7 días de arriendo"

---

**TC-E007: Fecha término anterior a fecha inicio**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-12-10",
  "fecha_termino_estimada": "2025-11-26",  // Antes de inicio
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, "La fecha de término debe ser posterior a la fecha de inicio"

---

**TC-E008: Sin detalles (array vacío)**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": []
}
```
**Resultado esperado:** Status 400, "Debe haber al menos un detalle en el contrato"

---

**TC-E009: Validación - id_cliente no es número**
```json
{
  "id_cliente": "abc",
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, ValidationError

---

**TC-E010: Validación - tipo_entrega inválido**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "envio",  // Solo acepta "retiro" o "despacho"
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, "El tipo de entrega debe ser 'retiro' o 'despacho'"

---

**TC-E011: Validación - fecha formato inválido**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "26-11-2025",  // Formato incorrecto
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, "La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)"

---

**TC-E012: Validación - cantidad negativa**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": -1,
      "dias_arriendo": 7
    }
  ]
}
```
**Resultado esperado:** Status 400, ValidationError

---

**TC-E013: Validación - monto_garantia negativo**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "monto_garantia": -5000,
  "detalles": [...]
}
```
**Resultado esperado:** Status 400, "El monto de garantía no puede ser negativo"

---

### 2. LISTAR CONTRATOS (GET /contratos)

**TC-L001: Listar sin filtros (paginación default)**
```
GET /contratos
```
**Resultado esperado:** Status 200, page=1, limit=10

---

**TC-L002: Paginación personalizada**
```
GET /contratos?page=2&limit=20
```
**Resultado esperado:** Status 200, muestra página 2 con 20 items

---

**TC-L003: Filtrar por estado activo**
```
GET /contratos?estado=activo
```
**Resultado esperado:** Status 200, solo contratos con estado='activo'

---

**TC-L004: Filtrar por cliente**
```
GET /contratos?id_cliente=1
```
**Resultado esperado:** Status 200, solo contratos del cliente 1

---

**TC-L005: Filtrar por rango de fechas**
```
GET /contratos?fecha_inicio_desde=2025-11-01&fecha_inicio_hasta=2025-11-30
```
**Resultado esperado:** Status 200, solo contratos iniciados en noviembre

---

**TC-L006: Combinación de filtros**
```
GET /contratos?estado=activo&tipo_entrega=retiro&id_cliente=1
```
**Resultado esperado:** Status 200, contratos activos de cliente 1 tipo retiro

---

**TC-L007: Límite máximo de paginación**
```
GET /contratos?limit=101
```
**Resultado esperado:** Status 400, "El límite no puede ser mayor a 100"

---

**TC-L008: Página 0 o negativa**
```
GET /contratos?page=0
```
**Resultado esperado:** Status 400, "La página debe ser mayor o igual a 1"

---

### 3. OBTENER CONTRATO POR ID (GET /contratos/:id)

**TC-G001: Obtener contrato existente**
```
GET /contratos/1
```
**Resultado esperado:** Status 200, contrato completo con relaciones

---

**TC-G002: Obtener contrato inexistente**
```
GET /contratos/9999
```
**Resultado esperado:** Status 404, "Contrato con ID 9999 no encontrado"

---

**TC-G003: ID inválido (no numérico)**
```
GET /contratos/abc
```
**Resultado esperado:** Status 400, ValidationError

---

### 4. ACTUALIZAR CONTRATO (PATCH /contratos/:id)

**TC-U001: Actualizar tipo de entrega**
```json
{
  "tipo_entrega": "despacho"
}
```
**Resultado esperado:** Status 200, tipo_entrega actualizado

---

**TC-U002: Actualizar monto garantía**
```json
{
  "monto_garantia": 80000
}
```
**Resultado esperado:** Status 200, monto_garantia actualizado

---

**TC-U003: Actualizar observaciones**
```json
{
  "observaciones": "Nueva observación agregada"
}
```
**Resultado esperado:** Status 200, observaciones actualizadas

---

**TC-U004: Actualizar múltiples campos**
```json
{
  "tipo_entrega": "despacho",
  "monto_garantia": 60000,
  "observaciones": "Cambios múltiples"
}
```
**Resultado esperado:** Status 200, todos los campos actualizados

---

**TC-U005: Intentar actualizar contrato finalizado**
```
PATCH /contratos/5  (donde contrato 5 tiene estado='finalizado')
```
**Resultado esperado:** Status 400, "Solo se pueden actualizar contratos activos"

---

**TC-U006: Intentar actualizar contrato cancelado**
```
PATCH /contratos/6  (donde contrato 6 tiene estado='cancelado')
```
**Resultado esperado:** Status 400, "Solo se pueden actualizar contratos activos"

---

**TC-U007: Body vacío**
```json
{}
```
**Resultado esperado:** Status 200, ningún cambio (es válido con PartialType)

---

### 5. FINALIZAR CONTRATO (PATCH /contratos/:id/finalizar)

**TC-F001: Finalizar contrato activo**
```
PATCH /contratos/1/finalizar
```
**Resultado esperado:**
- Status 200
- estado = 'finalizado'
- monto_final = monto_estimado
- fecha_termino_real registrada

---

**TC-F002: Intentar finalizar contrato ya finalizado**
```
PATCH /contratos/5/finalizar  (ya finalizado)
```
**Resultado esperado:** Status 400, "Solo se puede finalizar un contrato activo"

---

**TC-F003: Intentar finalizar contrato cancelado**
```
PATCH /contratos/6/finalizar  (cancelado)
```
**Resultado esperado:** Status 400, "Solo se puede finalizar un contrato activo"

---

### 6. CANCELAR CONTRATO (DELETE /contratos/:id)

**TC-C001: Cancelar contrato activo**
```
DELETE /contratos/1
```
**Resultado esperado:**
- Status 200
- estado = 'cancelado'
- Stock de herramientas devuelto

---

**TC-C002: Verificar devolución de stock**
```
1. Crear contrato con 2 unidades de herramienta X (stock = 5)
2. Verificar stock = 3
3. Cancelar contrato
4. Verificar stock = 5 (devuelto)
```
**Resultado esperado:** Stock correctamente devuelto

---

**TC-C003: Intentar cancelar contrato finalizado**
```
DELETE /contratos/5  (finalizado)
```
**Resultado esperado:** Status 400, "Solo se pueden cancelar contratos activos"

---

**TC-C004: Intentar cancelar contrato ya cancelado**
```
DELETE /contratos/6  (ya cancelado)
```
**Resultado esperado:** Status 400, "Solo se pueden cancelar contratos activos"

---

### 7. ESTADÍSTICAS (GET /contratos/stats)

**TC-S001: Obtener estadísticas**
```
GET /contratos/stats
```
**Resultado esperado:**
- Status 200
- totalContratos (número)
- porEstado (objeto con activos, finalizados, vencidos, cancelados)
- montoTotalEnArriendo (número)
- contratosPorMes (array)

---

### 8. CONTRATOS VENCIDOS (GET /contratos/vencidos)

**TC-V001: Obtener contratos vencidos**
```
GET /contratos/vencidos
```
**Resultado esperado:** Status 200, array de contratos con fecha_termino_estimada < HOY y estado='activo'

---

**TC-V002: Sin contratos vencidos**
```
GET /contratos/vencidos
```
**Resultado esperado:** Status 200, array vacío []

---

### 9. CONTRATOS POR CLIENTE (GET /contratos/cliente/:id)

**TC-CL001: Cliente con contratos**
```
GET /contratos/cliente/1
```
**Resultado esperado:** Status 200, lista de contratos del cliente

---

**TC-CL002: Cliente sin contratos**
```
GET /contratos/cliente/999
```
**Resultado esperado:** Status 200, data=[], total=0

---

**TC-CL003: Con filtros adicionales**
```
GET /contratos/cliente/1?estado=activo
```
**Resultado esperado:** Status 200, solo contratos activos del cliente

---

### 10. CONTRATOS POR USUARIO (GET /contratos/usuario/:id)

**TC-US001: Usuario con contratos**
```
GET /contratos/usuario/2
```
**Resultado esperado:** Status 200, lista de contratos creados por el usuario

---

**TC-US002: Usuario sin contratos**
```
GET /contratos/usuario/999
```
**Resultado esperado:** Status 200, data=[], total=0

---

## Casos de Prueba de Integración

### INT-001: Flujo completo de contrato exitoso
```
1. Crear contrato
2. Verificar stock descontado
3. Obtener contrato por ID
4. Actualizar observaciones
5. Finalizar contrato
6. Verificar estado = 'finalizado'
```

---

### INT-002: Flujo de cancelación
```
1. Crear contrato
2. Verificar stock descontado
3. Cancelar contrato
4. Verificar stock devuelto
5. Verificar estado = 'cancelado'
6. Intentar actualizar (debe fallar)
```

---

### INT-003: Múltiples contratos del mismo cliente
```
1. Crear contrato 1 para cliente X
2. Crear contrato 2 para cliente X
3. Obtener contratos del cliente X
4. Verificar que muestra ambos
```

---

### INT-004: Descuento de stock con múltiples contratos
```
1. Herramienta tiene stock = 5
2. Crear contrato A con 2 unidades
3. Verificar stock = 3
4. Crear contrato B con 2 unidades
5. Verificar stock = 1
6. Intentar crear contrato C con 2 unidades (debe fallar)
```

---

## Casos de Prueba de Seguridad

### SEC-001: Sin token JWT
```
Request sin header Authorization
```
**Resultado esperado:** Status 401 Unauthorized

---

### SEC-002: Token inválido
```
Authorization: Bearer token_invalido
```
**Resultado esperado:** Status 401 Unauthorized

---

### SEC-003: Token expirado
```
Authorization: Bearer token_expirado
```
**Resultado esperado:** Status 401 Unauthorized

---

### SEC-004: Usuario sin rol adecuado
```
Usuario con rol 'cliente' intenta crear contrato
```
**Resultado esperado:** Status 403 Forbidden

---

### SEC-005: SQL Injection en filtros
```
GET /contratos?estado=activo' OR '1'='1
```
**Resultado esperado:** No debe ejecutar código malicioso

---

## Casos de Prueba de Rendimiento

### PERF-001: Listar 1000 contratos
```
GET /contratos?limit=100
(repetir 10 veces)
```
**Resultado esperado:** Respuesta < 500ms

---

### PERF-002: Crear contrato con 50 detalles
```json
{
  "detalles": [ ...50 herramientas diferentes ]
}
```
**Resultado esperado:** Creación exitosa en transacción

---

## Matriz de Pruebas

| ID | Funcionalidad | Prioridad | Estado |
|----|---------------|-----------|--------|
| TC-001 | Crear contrato básico | Alta | ⬜ |
| TC-002 | Crear contrato múltiple | Alta | ⬜ |
| TC-E001 | Cliente no existe | Alta | ⬜ |
| TC-E005 | Stock insuficiente | Alta | ⬜ |
| TC-E006 | Días < mínimo | Alta | ⬜ |
| TC-L001 | Listar sin filtros | Media | ⬜ |
| TC-U001 | Actualizar contrato | Media | ⬜ |
| TC-F001 | Finalizar contrato | Alta | ⬜ |
| TC-C001 | Cancelar contrato | Alta | ⬜ |
| TC-C002 | Verificar stock | Alta | ⬜ |
| INT-001 | Flujo completo | Alta | ⬜ |
| INT-004 | Stock múltiple | Alta | ⬜ |
| SEC-001 | Sin autenticación | Alta | ⬜ |

---

**Total de casos de prueba:** 60+
**Prioridad Alta:** 25
**Prioridad Media:** 20
**Prioridad Baja:** 15
