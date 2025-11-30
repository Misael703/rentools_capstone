# Ejemplos de Requests para Postman - Módulo Contratos

## Configuración Inicial

### Variables de Entorno (Postman)
```json
{
  "base_url": "http://localhost:3000",
  "jwt_token": "tu_token_jwt_aqui"
}
```

### Headers Comunes
Todos los requests requieren:
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

---

## 1. Crear Contrato

### POST {{base_url}}/contratos

**Descripción:** Crea un nuevo contrato de arriendo

**Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id_cliente": 1,
  "tipo_entrega": "retiro",
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "observaciones": "Cliente requiere las herramientas para proyecto de construcción",
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 2,
      "dias_arriendo": 14
    },
    {
      "id_herramienta": 3,
      "cantidad": 1,
      "dias_arriendo": 14
    }
  ]
}
```

> **Nota Importante:** El campo `monto_garantia` ya NO se envía en el request. Se calcula automáticamente sumando las garantías de cada herramienta multiplicadas por su cantidad:
> ```
> monto_garantia = Σ (herramienta.garantia × cantidad)
> ```

**Respuesta Exitosa (201 Created):**
```json
{
  "id_contrato": 1,
  "id_cliente": 1,
  "id_usuario": 2,
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "fecha_termino_real": null,
  "estado": "activo",
  "tipo_entrega": "retiro",
  "monto_estimado": 280000,
  "monto_final": null,
  "monto_garantia": 50000,
  "observaciones": "Cliente requiere las herramientas para proyecto de construcción",
  "created_at": "2025-11-26T15:30:00.000Z",
  "updated_at": "2025-11-26T15:30:00.000Z",
  "cliente": {
    "id_cliente": 1,
    "rut": "12345678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "+56912345678"
  },
  "usuario": {
    "id_usuario": 2,
    "nombre": "María Vendedor",
    "email": "maria@rentools.cl"
  },
  "detalles": [
    {
      "id_detalle": 1,
      "id_herramienta": 1,
      "nombre_herramienta": "Taladro Percutor Bosch",
      "sku_herramienta": "TDRL-001",
      "cantidad": 2,
      "precio_unitario": 5000,
      "dias_arriendo": 14,
      "subtotal": 140000
    },
    {
      "id_detalle": 2,
      "id_herramienta": 3,
      "nombre_herramienta": "Sierra Circular",
      "sku_herramienta": "SIER-003",
      "cantidad": 1,
      "precio_unitario": 10000,
      "dias_arriendo": 14,
      "subtotal": 140000
    }
  ]
}
```

**Ejemplos de Errores:**

```json
// 400 - Stock insuficiente
{
  "statusCode": 400,
  "message": "Stock insuficiente para Taladro Percutor Bosch. Disponible: 1, Solicitado: 2",
  "error": "Bad Request"
}

// 400 - Días mínimos no cumplidos
{
  "statusCode": 400,
  "message": "La herramienta Taladro Percutor Bosch requiere un mínimo de 7 días de arriendo",
  "error": "Bad Request"
}

// 400 - Cliente inactivo
{
  "statusCode": 400,
  "message": "El cliente no está activo",
  "error": "Bad Request"
}

// 404 - Cliente no encontrado
{
  "statusCode": 404,
  "message": "Cliente con ID 999 no encontrado",
  "error": "Not Found"
}
```

---

## 2. Listar Contratos (con filtros)

### GET {{base_url}}/contratos

**Descripción:** Lista todos los contratos con paginación y filtros opcionales

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

### Ejemplo 2.1: Listar todos (paginado)
```
GET {{base_url}}/contratos?page=1&limit=10
```

### Ejemplo 2.2: Filtrar por estado
```
GET {{base_url}}/contratos?estado=activo&page=1&limit=20
```

### Ejemplo 2.3: Filtrar por cliente
```
GET {{base_url}}/contratos?id_cliente=1&page=1&limit=10
```

### Ejemplo 2.4: Filtrar por usuario
```
GET {{base_url}}/contratos?id_usuario=2
```

### Ejemplo 2.5: Filtrar por tipo de entrega
```
GET {{base_url}}/contratos?tipo_entrega=despacho
```

### Ejemplo 2.6: Filtrar por rango de fechas
```
GET {{base_url}}/contratos?fecha_inicio_desde=2025-11-01&fecha_inicio_hasta=2025-11-30
```

### Ejemplo 2.7: Combinación de filtros
```
GET {{base_url}}/contratos?estado=activo&tipo_entrega=retiro&id_cliente=1&page=1&limit=5
```

**Respuesta Exitosa (200 OK):**
```json
{
  "data": [
    {
      "id_contrato": 1,
      "id_cliente": 1,
      "id_usuario": 2,
      "fecha_inicio": "2025-11-26",
      "fecha_termino_estimada": "2025-12-10",
      "estado": "activo",
      "tipo_entrega": "retiro",
      "monto_estimado": 280000,
      "monto_garantia": 50000,
      "cliente": {
        "id_cliente": 1,
        "rut": "12345678-9",
        "nombre": "Juan",
        "apellido": "Pérez"
      },
      "usuario": {
        "id_usuario": 2,
        "nombre": "María Vendedor"
      },
      "detalles": [...]
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 3. Obtener Contrato por ID

### GET {{base_url}}/contratos/:id

**Descripción:** Obtiene un contrato específico con todas sus relaciones

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplo:**
```
GET {{base_url}}/contratos/1
```

**Respuesta Exitosa (200 OK):**
```json
{
  "id_contrato": 1,
  "id_cliente": 1,
  "id_usuario": 2,
  "fecha_inicio": "2025-11-26",
  "fecha_termino_estimada": "2025-12-10",
  "fecha_termino_real": null,
  "estado": "activo",
  "tipo_entrega": "retiro",
  "monto_estimado": 280000,
  "monto_final": null,
  "monto_garantia": 50000,
  "observaciones": "Cliente requiere las herramientas para proyecto de construcción",
  "created_at": "2025-11-26T15:30:00.000Z",
  "updated_at": "2025-11-26T15:30:00.000Z",
  "cliente": {
    "id_cliente": 1,
    "rut": "12345678-9",
    "tipo_cliente": "persona_natural",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "+56912345678",
    "direccion": "Av. Principal 123",
    "ciudad": "Santiago",
    "comuna": "Providencia"
  },
  "usuario": {
    "id_usuario": 2,
    "nombre": "María Vendedor",
    "email": "maria@rentools.cl",
    "rol": {
      "id_rol": 2,
      "nombre": "vendedor"
    }
  },
  "detalles": [
    {
      "id_detalle": 1,
      "id_herramienta": 1,
      "nombre_herramienta": "Taladro Percutor Bosch",
      "sku_herramienta": "TDRL-001",
      "cantidad": 2,
      "precio_unitario": 5000,
      "dias_arriendo": 14,
      "subtotal": 140000,
      "herramienta": {
        "id_herramienta": 1,
        "sku_bsale": "TDRL-001",
        "nombre": "Taladro Percutor Bosch",
        "precio_diario": 5000,
        "stock": 3,
        "activo": true
      }
    }
  ]
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Contrato con ID 999 no encontrado",
  "error": "Not Found"
}
```

---

## 4. Obtener Contratos por Cliente

### GET {{base_url}}/contratos/cliente/:id_cliente

**Descripción:** Obtiene todos los contratos de un cliente específico

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplos:**

```
GET {{base_url}}/contratos/cliente/1
```

```
GET {{base_url}}/contratos/cliente/1?estado=activo
```

```
GET {{base_url}}/contratos/cliente/1?page=1&limit=5
```

**Respuesta:** Igual formato que GET /contratos (con data y meta)

---

## 5. Obtener Contratos por Usuario

### GET {{base_url}}/contratos/usuario/:id_usuario

**Descripción:** Obtiene todos los contratos creados por un usuario específico

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplos:**

```
GET {{base_url}}/contratos/usuario/2
```

```
GET {{base_url}}/contratos/usuario/2?estado=finalizado
```

**Respuesta:** Igual formato que GET /contratos (con data y meta)

---

## 6. Obtener Estadísticas

### GET {{base_url}}/contratos/stats

**Descripción:** Obtiene estadísticas generales de contratos

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplo:**
```
GET {{base_url}}/contratos/stats
```

**Respuesta Exitosa (200 OK):**
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
    {
      "mes": "2024-12",
      "cantidad": "15"
    },
    {
      "mes": "2025-01",
      "cantidad": "22"
    },
    {
      "mes": "2025-02",
      "cantidad": "18"
    },
    {
      "mes": "2025-11",
      "cantidad": "25"
    }
  ]
}
```

---

## 7. Obtener Contratos Vencidos

### GET {{base_url}}/contratos/vencidos

**Descripción:** Obtiene contratos con fecha_termino_estimada < HOY y estado = ACTIVO

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplo:**
```
GET {{base_url}}/contratos/vencidos
```

**Respuesta Exitosa (200 OK):**
```json
[
  {
    "id_contrato": 12,
    "id_cliente": 5,
    "fecha_inicio": "2025-11-01",
    "fecha_termino_estimada": "2025-11-15",
    "estado": "activo",
    "monto_estimado": 150000,
    "cliente": {
      "id_cliente": 5,
      "nombre": "Pedro",
      "apellido": "González",
      "telefono": "+56987654321"
    },
    "usuario": {
      "id_usuario": 2,
      "nombre": "María Vendedor"
    },
    "detalles": [
      {
        "id_detalle": 18,
        "nombre_herramienta": "Lijadora Orbital",
        "cantidad": 1,
        "dias_arriendo": 14
      }
    ]
  }
]
```

---

## 8. Actualizar Contrato

### PATCH {{base_url}}/contratos/:id

**Descripción:** Actualiza un contrato (solo campos permitidos). Solo funciona si estado = 'activo'

**Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Campos permitidos:**
- `tipo_entrega`
- `monto_garantia`
- `observaciones`

**Ejemplo 8.1: Cambiar tipo de entrega**
```
PATCH {{base_url}}/contratos/1
```

**Body:**
```json
{
  "tipo_entrega": "despacho",
  "observaciones": "Cliente solicitó cambio a despacho. Dirección: Av. Libertador 456"
}
```

**Ejemplo 8.2: Actualizar monto de garantía**
```
PATCH {{base_url}}/contratos/1
```

**Body:**
```json
{
  "monto_garantia": 75000,
  "observaciones": "Se aumentó garantía por solicitud del supervisor"
}
```

**Ejemplo 8.3: Solo observaciones**
```
PATCH {{base_url}}/contratos/1
```

**Body:**
```json
{
  "observaciones": "Cliente confirmó recepción de las herramientas en perfecto estado"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "id_contrato": 1,
  "tipo_entrega": "despacho",
  "monto_garantia": 75000,
  "observaciones": "Cliente solicitó cambio a despacho. Dirección: Av. Libertador 456",
  "estado": "activo",
  ...resto del contrato completo
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Solo se pueden actualizar contratos activos",
  "error": "Bad Request"
}
```

---

## 9. Finalizar Contrato

### PATCH {{base_url}}/contratos/:id/finalizar

**Descripción:** Finaliza un contrato, calcula el monto final y cambia estado a 'finalizado'

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplo:**
```
PATCH {{base_url}}/contratos/1/finalizar
```

**No requiere body**

**Respuesta Exitosa (200 OK):**
```json
{
  "id_contrato": 1,
  "estado": "finalizado",
  "monto_estimado": 280000,
  "monto_final": 280000,
  "fecha_termino_real": "2025-12-10T10:30:00.000Z",
  ...resto del contrato
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Solo se puede finalizar un contrato activo",
  "error": "Bad Request"
}
```

---

## 10. Cancelar Contrato

### DELETE {{base_url}}/contratos/:id

**Descripción:** Cancela un contrato y devuelve el stock de las herramientas. Solo funciona si estado = 'activo'

**Headers:**
```
Authorization: Bearer {{jwt_token}}
```

**Ejemplo:**
```
DELETE {{base_url}}/contratos/1
```

**No requiere body**

**Respuesta Exitosa (200 OK):**
```json
{
  "id_contrato": 1,
  "estado": "cancelado",
  "monto_estimado": 280000,
  "monto_final": null,
  ...resto del contrato
}
```

**Nota:** El stock de todas las herramientas del contrato se devuelve automáticamente.

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Solo se pueden cancelar contratos activos",
  "error": "Bad Request"
}
```

---

## Collection de Postman

### Orden sugerido para probar:

1. **Obtener Token JWT** (endpoint de auth/login)
2. **Crear Contrato** → POST /contratos
3. **Listar Contratos** → GET /contratos
4. **Ver Contrato Específico** → GET /contratos/1
5. **Ver Estadísticas** → GET /contratos/stats
6. **Actualizar Contrato** → PATCH /contratos/1
7. **Ver por Cliente** → GET /contratos/cliente/1
8. **Ver Vencidos** → GET /contratos/vencidos
9. **Finalizar Contrato** → PATCH /contratos/1/finalizar
10. **Cancelar Contrato** → DELETE /contratos/2 (crear otro primero)

---

## Scripts Pre-request (Postman)

### Obtener token automáticamente:

```javascript
// Pre-request Script para la Collection
pm.sendRequest({
    url: pm.environment.get('base_url') + '/auth/login',
    method: 'POST',
    header: {
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: 'admin@rentools.cl',
            password: 'tu_password'
        })
    }
}, function (err, res) {
    if (!err) {
        const token = res.json().access_token;
        pm.environment.set('jwt_token', token);
    }
});
```

---

## Tests Automatizados (Postman)

### Test para crear contrato:

```javascript
// Tests tab
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Contrato creado correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id_contrato');
    pm.expect(jsonData.estado).to.eql('activo');
    pm.expect(jsonData.detalles).to.be.an('array');
    pm.expect(jsonData.detalles.length).to.be.above(0);
});

// Guardar ID para siguientes requests
pm.environment.set('contrato_id', pm.response.json().id_contrato);
```

### Test para listar contratos:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta tiene estructura correcta", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData).to.have.property('meta');
    pm.expect(jsonData.meta).to.have.property('total');
    pm.expect(jsonData.meta).to.have.property('page');
    pm.expect(jsonData.meta).to.have.property('limit');
    pm.expect(jsonData.meta).to.have.property('totalPages');
});
```

---

## Errores Comunes y Soluciones

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solución:** Verificar que el token JWT sea válido y esté en el header `Authorization: Bearer {token}`

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
**Solución:** El usuario no tiene el rol adecuado (se requiere 'admin' o 'vendedor')

### 400 Bad Request - Validación
```json
{
  "statusCode": 400,
  "message": [
    "id_cliente must be a positive number",
    "detalles should not be empty"
  ],
  "error": "Bad Request"
}
```
**Solución:** Revisar que todos los campos requeridos estén presentes y con formato correcto

---

## Notas Importantes

1. **Todos los endpoints requieren autenticación JWT**
2. **Solo usuarios con rol 'admin' o 'vendedor' pueden acceder**
3. **Las fechas deben estar en formato ISO: YYYY-MM-DD**
4. **Los montos son enteros (pesos chilenos sin decimales)**
5. **El id_usuario se obtiene automáticamente del token JWT**
6. **Los contratos solo se pueden actualizar/cancelar si están en estado 'activo'**

---

**¡Listo para probar! 🚀**
