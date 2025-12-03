# Documentación de Endpoints - Módulo Clientes

API RESTful para gestión de clientes en RenTools.

**Base URL:** `http://localhost:3000/api/clientes`

---

## 📑 Índice de Endpoints

1. [POST /clientes](#1-post-clientes) - Crear cliente
2. [GET /clientes](#2-get-clientes) - Listar clientes con filtros
3. [GET /clientes/activos](#3-get-clientesactivos) - Listar solo activos
4. [GET /clientes/recientes](#4-get-clientesrecientes) - Últimos clientes
5. [GET /clientes/stats](#5-get-clientesstats) - Estadísticas
6. [GET /clientes/search](#6-get-clientessearch) - **Autocompletado** ⭐
7. [POST /clientes/sync-from-bsale](#7-post-clientessync-from-bsale) - Sincronizar desde Bsale
8. [GET /clientes/buscar-bsale/:rut](#8-get-clientesbuscar-bsalerut) - Buscar en Bsale
9. [GET /clientes/rut/:rut](#9-get-clientesrutrut) - Buscar por RUT
10. [GET /clientes/email/:email](#10-get-clientesemailemail) - Buscar por email
11. [GET /clientes/existe/:rut](#11-get-clientesexisterut) - Verificar existencia
12. [GET /clientes/:id](#12-get-clientesid) - Obtener por ID
13. [PATCH /clientes/:id](#13-patch-clientesid) - Actualizar cliente
14. [PATCH /clientes/activar/:id](#14-patch-clientesactivarid) - Activar cliente
15. [DELETE /clientes/:id](#15-delete-clientesid) - Desactivar cliente

---

## 1. POST /clientes

Crea un nuevo cliente. Primero busca en Bsale, si no existe lo crea en ambos sistemas.

**Permisos:** `admin`, `vendedor`

### Request

```http
POST /api/clientes
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

```json
{
  "tipo_cliente": "persona_natural",
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez González",
  "email": "juan.perez@example.com",
  "telefono": "+56912345678",
  "direccion": "Av. Principal 123",
  "ciudad": "Santiago",
  "comuna": "Providencia"
}
```

#### Campos Requeridos
- `tipo_cliente`: `"persona_natural"` | `"empresa"`
- `rut`: String (validado con dígito verificador)
- `nombre`: String

#### Campos Opcionales (Persona Natural)
- `apellido`: String
- `email`: String (validado)
- `telefono`: String
- `direccion`: String
- `ciudad`: String
- `comuna`: String

#### Campos Adicionales (Empresa)
- `razon_social`: String (requerido para empresas)
- `nombre_fantasia`: String
- `giro`: String

### Response Exitosa (201 Created)

```json
{
  "id_cliente": 15,
  "id_bsale": 12345,
  "tipo_cliente": "persona_natural",
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez González",
  "razon_social": null,
  "nombre_fantasia": null,
  "giro": null,
  "email": "juan.perez@example.com",
  "telefono": "+56912345678",
  "direccion": "Av. Principal 123",
  "ciudad": "Santiago",
  "comuna": "Providencia",
  "activo": true,
  "created_at": "2025-12-02T10:00:00.000Z",
  "updated_at": "2025-12-02T10:00:00.000Z"
}
```

### Errores

```json
// 400 Bad Request - RUT inválido
{
  "statusCode": 400,
  "message": "El RUT '12.345.678-8' no es válido. Verifica el dígito verificador.",
  "error": "Bad Request"
}
```

```json
// 409 Conflict - Cliente ya existe
{
  "statusCode": 409,
  "message": "El cliente con RUT 12.345.678-9 ya existe en el sistema",
  "error": "Conflict"
}
```

---

## 2. GET /clientes

Lista todos los clientes con paginación y filtros opcionales.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes?page=1&limit=10&nombre=juan&activo=true
Authorization: Bearer {jwt_token}
```

#### Query Params (todos opcionales)
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `nombre`: string - Busca en nombre
- `rut`: string - Busca en RUT
- `email`: string - Busca en email
- `telefono`: string - Busca en teléfono
- `activo`: boolean - Filtrar por estado

### Response (200 OK)

```json
{
  "data": [
    {
      "id_cliente": 15,
      "tipo_cliente": "persona_natural",
      "rut": "12.345.678-9",
      "nombre": "Juan",
      "apellido": "Pérez González",
      "email": "juan.perez@example.com",
      "telefono": "+56912345678",
      "activo": true,
      "created_at": "2025-12-02T10:00:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

## 3. GET /clientes/activos

Lista solo clientes activos (sin paginación).

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/activos
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
[
  {
    "id_cliente": 15,
    "tipo_cliente": "persona_natural",
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez González",
    "activo": true
  },
  ...
]
```

---

## 4. GET /clientes/recientes

Lista los últimos clientes creados.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/recientes?limit=5
Authorization: Bearer {jwt_token}
```

#### Query Params
- `limit`: number (default: 10) - Cantidad de resultados

### Response (200 OK)

```json
[
  {
    "id_cliente": 50,
    "nombre": "María",
    "apellido": "González",
    "rut": "11.222.333-4",
    "created_at": "2025-12-02T15:30:00.000Z"
  },
  ...
]
```

---

## 5. GET /clientes/stats

Estadísticas generales de clientes.

**Permisos:** `admin`

### Request

```http
GET /api/clientes/stats
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "total": 120,
  "activos": 95,
  "inactivos": 25,
  "porcentajeActivos": "79.17"
}
```

---

## 6. GET /clientes/search ⭐

**Búsqueda optimizada para autocompletado.**

Busca en: nombre, apellido, nombre completo, razón social y RUT.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/search?query=juan&limit=10
Authorization: Bearer {jwt_token}
```

#### Query Params
- `query`: string (mínimo 3 caracteres) **REQUERIDO**
- `limit`: number (máximo 20, default 10)

### Response (200 OK)

```json
[
  {
    "id_cliente": 15,
    "tipo_cliente": "persona_natural",
    "label": "Juan Pérez González (12.345.678-9)",
    "nombre": "Juan",
    "apellido": "Pérez González",
    "razon_social": null,
    "rut": "12.345.678-9",
    "email": "juan.perez@example.com",
    "telefono": "+56912345678"
  },
  {
    "id_cliente": 23,
    "tipo_cliente": "persona_natural",
    "label": "Juana Martínez Silva (11.222.333-4)",
    "nombre": "Juana",
    "apellido": "Martínez Silva",
    "razon_social": null,
    "rut": "11.222.333-4",
    "email": "juana.martinez@example.com",
    "telefono": "+56987654321"
  }
]
```

### Ejemplos de Búsqueda

```http
# Buscar por nombre
GET /api/clientes/search?query=juan

# Buscar por apellido
GET /api/clientes/search?query=pérez

# Buscar por nombre completo
GET /api/clientes/search?query=juan pérez

# Buscar por RUT (con o sin puntos/guión)
GET /api/clientes/search?query=12345678
GET /api/clientes/search?query=12.345.678-9

# Buscar por razón social
GET /api/clientes/search?query=constructora

# Limitar resultados
GET /api/clientes/search?query=juan&limit=5
```

### Características

- ✅ Mínimo 3 caracteres
- ✅ Solo devuelve clientes activos
- ✅ Resultados ordenados: personas primero, empresas después
- ✅ Campo `label` formateado listo para mostrar
- ✅ Búsqueda insensible a mayúsculas/minúsculas
- ✅ Limpia y formatea RUT automáticamente

---

## 7. POST /clientes/sync-from-bsale

Sincroniza manualmente todos los clientes desde Bsale.

**Permisos:** `admin`

### Request

```http
POST /api/clientes/sync-from-bsale
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "message": "Sincronización completada",
  "success": true,
  "data": {
    "total": 25,
    "nuevos": 15,
    "sincronizados": 10,
    "errores": 0
  },
  "detalles": [
    "✅ Sincronizados 10 clientes existentes",
    "✅ Creados 15 clientes nuevos"
  ]
}
```

---

## 8. GET /clientes/buscar-bsale/:rut

Busca un cliente en Bsale y lo sincroniza si no existe localmente.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/buscar-bsale/12.345.678-9
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "message": "Cliente encontrado o sincronizado desde Bsale",
  "data": {
    "id_cliente": 15,
    "id_bsale": 12345,
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez González",
    ...
  }
}
```

### Error (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Cliente con RUT 12.345.678-9 no encontrado en Bsale",
  "error": "Not Found"
}
```

---

## 9. GET /clientes/rut/:rut

Busca un cliente por RUT (solo local, no busca en Bsale).

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/rut/12.345.678-9
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "id_cliente": 15,
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez González",
  ...
}
```

### Error (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Cliente con RUT 12.345.678-9 no encontrado",
  "error": "Not Found"
}
```

---

## 10. GET /clientes/email/:email

Busca un cliente por email.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/email/juan.perez@example.com
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "id_cliente": 15,
  "email": "juan.perez@example.com",
  "nombre": "Juan",
  ...
}
```

---

## 11. GET /clientes/existe/:rut

Verifica si existe un cliente con ese RUT.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/existe/12.345.678-9
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "existe": true,
  "rut": "12.345.678-9",
  "message": "El cliente ya existe"
}
```

```json
{
  "existe": false,
  "rut": "12.345.678-9",
  "message": "El cliente no existe"
}
```

---

## 12. GET /clientes/:id

Obtiene un cliente por ID.

**Permisos:** `admin`, `vendedor`

### Request

```http
GET /api/clientes/15
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "id_cliente": 15,
  "id_bsale": 12345,
  "tipo_cliente": "persona_natural",
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez González",
  "razon_social": null,
  "nombre_fantasia": null,
  "giro": null,
  "email": "juan.perez@example.com",
  "telefono": "+56912345678",
  "direccion": "Av. Principal 123",
  "ciudad": "Santiago",
  "comuna": "Providencia",
  "activo": true,
  "created_at": "2025-12-02T10:00:00.000Z",
  "updated_at": "2025-12-02T10:00:00.000Z"
}
```

---

## 13. PATCH /clientes/:id

Actualiza un cliente (actualiza en RenTools y sincroniza con Bsale).

**Permisos:** `admin`, `vendedor`

### Request

```http
PATCH /api/clientes/15
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

```json
{
  "email": "nuevo.email@example.com",
  "telefono": "+56911111111",
  "direccion": "Nueva Dirección 456"
}
```

**Nota:** No se puede cambiar `rut`, `id_cliente`, ni `tipo_cliente`.

### Response (200 OK)

```json
{
  "id_cliente": 15,
  "email": "nuevo.email@example.com",
  "telefono": "+56911111111",
  "direccion": "Nueva Dirección 456",
  ...
}
```

---

## 14. PATCH /clientes/activar/:id

Activa un cliente desactivado (marca `activo = true`).

**Permisos:** `admin`

### Request

```http
PATCH /api/clientes/activar/15
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "message": "Cliente activado correctamente",
  "success": true,
  "data": {
    "id_cliente": 15,
    "activo": true,
    ...
  }
}
```

---

## 15. DELETE /clientes/:id

Desactiva un cliente (soft delete - marca `activo = false`).

**Permisos:** `admin`

### Request

```http
DELETE /api/clientes/15
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "message": "Cliente desactivado correctamente",
  "success": true,
  "data": {
    "id_cliente": 15,
    "activo": false,
    ...
  }
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtener Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@rentools.cl",
  "password": "password123"
}
```

---

## 📝 Validaciones

### RUT
- Formato: `12.345.678-9` o `12345678-9` o `123456789`
- Validación de dígito verificador
- Se limpia y formatea automáticamente

### Email
- Formato válido de email
- Ejemplo: `usuario@dominio.cl`

### Teléfono
- Recomendado: formato internacional `+56912345678`
- Acepta cualquier formato numérico

### Tipo Cliente
- `"persona_natural"` - Persona natural (requiere nombre y apellido)
- `"empresa"` - Empresa (requiere razón social)

---

## 🎯 Casos de Uso Comunes

### 1. Autocompletado en Formulario de Contrato

```http
GET /api/clientes/search?query=juan
```

### 2. Listar Todos los Clientes Activos

```http
GET /api/clientes/activos
```

### 3. Crear Cliente Nuevo

```http
POST /api/clientes
{
  "tipo_cliente": "persona_natural",
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com"
}
```

### 4. Buscar Cliente por RUT

```http
GET /api/clientes/rut/12.345.678-9
```

### 5. Verificar si Cliente Existe

```http
GET /api/clientes/existe/12.345.678-9
```

---

## 🚀 Ejemplos con cURL

```bash
# Listar clientes
curl -X GET "http://localhost:3000/api/clientes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Autocompletado
curl -X GET "http://localhost:3000/api/clientes/search?query=juan" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Crear cliente
curl -X POST "http://localhost:3000/api/clientes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_cliente": "persona_natural",
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com"
  }'

# Buscar por RUT
curl -X GET "http://localhost:3000/api/clientes/rut/12.345.678-9" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Códigos de Estado HTTP

- `200 OK` - Petición exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - Token JWT inválido o ausente
- `403 Forbidden` - Sin permisos para esta operación
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Cliente ya existe
- `500 Internal Server Error` - Error del servidor
