# Guía de Postman - Módulo Garantías

## 📥 Importar Colección

1. **Abrir Postman**

2. **Importar colección:**
   - Click en `Import` (arriba izquierda)
   - Seleccionar archivo: `Garantias.postman_collection.json`
   - Click en `Import`

3. **Importar environment:**
   - Click en `Import`
   - Seleccionar archivo: `RenTools.postman_environment.json`
   - Click en `Import`

4. **Activar environment:**
   - En el dropdown de arriba a la derecha
   - Seleccionar `RenTools - Local`

## 🔐 Autenticación

### Obtener Token

Primero necesitas autenticarte para obtener un token JWT:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@rentools.com",
  "password": "tu_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Configurar Token

1. **Copiar el `access_token`** del response

2. **Ir a Environment:**
   - Click en el ícono del ojo (arriba derecha)
   - Click en `RenTools - Local`
   - Editar la variable `auth_token`
   - Pegar el token
   - Click en `Save`

**O bien:**

La colección ya tiene configurada la autenticación Bearer Token automática.
Solo necesitas configurar la variable `{{auth_token}}` en el environment.

## 🚀 Flujo de Prueba Completo

### Prerrequisitos

Antes de probar garantías, necesitas:

1. **Tener un contrato creado** (módulo contratos)
2. **Conocer el `id_contrato`**
3. **El contrato debe tener `monto_garantia` configurado**

### Flujo Paso a Paso

#### PASO 1: Pagar Garantía

**Carpeta:** `Garantía Pago > 1. Crear Pago de Garantía`

```json
{
  "id_contrato": 1,
  "fecha_pago": "2024-12-05",
  "monto": 100000,
  "metodo_pago": "efectivo",
  "referencia": "REF-001"
}
```

**Importante:**
- `monto` debe coincidir con `contrato.monto_garantia`
- El contrato debe estar activo

---

#### PASO 2: Verificar Pago

**Carpeta:** `Garantía Pago > 5. Verificar Garantía Pagada`

```
GET /garantias/pago/contrato/1/verificar
```

**Response esperado:**
```json
{
  "id_contrato": 1,
  "garantia_pagada": true
}
```

---

#### PASO 3: Simular Uso del Contrato

Antes de devolver la garantía, debes:

1. **Registrar devoluciones de herramientas** (módulo devoluciones)
   ```
   POST /devoluciones
   ```

2. **Finalizar el contrato** (módulo contratos)
   ```
   POST /contratos/1/finalizar
   ```

---

#### PASO 4: Calcular Monto de Devolución

**Carpeta:** `Garantía Devolución > 1. Calcular Monto de Devolución`

```
GET /garantias/devolucion/calcular/1
```

**Response ejemplo:**
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

Este endpoint te dice:
- ✅ Cuánto devolver
- ✅ Por qué ese monto
- ✅ Estado de cada herramienta

---

#### PASO 5: Devolver Garantía (Automático)

**Carpeta:** `Garantía Devolución > 3. Crear Devolución (Monto Automático)`

```json
{
  "id_contrato": 1,
  "fecha_devolucion": "2024-12-05",
  "metodo_devolucion": "efectivo",
  "observaciones": "Devolución automática"
}
```

**Nota:** No envías `monto_devuelto`, se calcula automático.

**O Devolver con Monto Manual:**

**Carpeta:** `Garantía Devolución > 4. Crear Devolución (Monto Manual)`

```json
{
  "id_contrato": 1,
  "fecha_devolucion": "2024-12-05",
  "monto_devuelto": 50000,
  "metodo_devolucion": "efectivo",
  "referencia": "DEV-001",
  "observaciones": "Descuento por taladro dañado"
}
```

---

#### PASO 6: Ver Resumen Completo

**Carpeta:** `Resumen y Reportes > 1. Resumen de Contrato`

```
GET /garantias/resumen/1
```

**Response esperado:**
```json
{
  "garantia_pagada": {
    "id": 1,
    "monto": 100000,
    "fecha_pago": "2024-12-05",
    "metodo_pago": "efectivo",
    "referencia": "REF-001"
  },
  "garantia_devuelta": {
    "id": 1,
    "monto_devuelto": 50000,
    "fecha_devolucion": "2024-12-05",
    "metodo_devolucion": "efectivo",
    "observaciones": "...",
    "referencia": "DEV-001"
  },
  "estado_herramientas": [ ... ],
  "monto_sugerido": 0,
  "retenido": 50000,
  "pendiente_devolucion": false
}
```

---

## 📋 Estructura de la Colección

```
RenTools - Garantías/
├── Garantía Pago/
│   ├── 1. Crear Pago de Garantía
│   ├── 2. Listar Pagos de Garantía
│   ├── 3. Obtener Pago por ID
│   ├── 4. Obtener Pago por Contrato
│   ├── 5. Verificar Garantía Pagada
│   ├── 6. Actualizar Pago de Garantía
│   └── 7. Eliminar Pago de Garantía
│
├── Garantía Devolución/
│   ├── 1. Calcular Monto de Devolución ⭐
│   ├── 2. Obtener Info para Devolución ⭐
│   ├── 3. Crear Devolución (Monto Automático) ⭐
│   ├── 4. Crear Devolución (Monto Manual)
│   ├── 5. Listar Devoluciones
│   ├── 6. Obtener Devolución por ID
│   ├── 7. Obtener Devolución por Contrato
│   ├── 8. Actualizar Devolución
│   └── 9. Eliminar Devolución
│
├── Resumen y Reportes/
│   ├── 1. Resumen de Contrato ⭐
│   └── 2. Estadísticas Generales (Admin) ⭐
│
└── Flujo Completo - Ejemplo/ ⭐⭐⭐
    ├── Paso 1 - Pagar Garantía
    ├── Paso 2 - Verificar Pago
    ├── Paso 3 - Calcular Monto a Devolver
    ├── Paso 4 - Devolver Garantía (Automático)
    └── Paso 5 - Ver Resumen Final
```

**⭐ = Endpoints más importantes**

---

## 🔍 Filtros Disponibles

### Listar Pagos

```
GET /garantias/pago?page=1&limit=10&id_contrato=1&metodo_pago=efectivo&fecha_desde=2024-12-01&fecha_hasta=2024-12-31
```

**Parámetros:**
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 10, max: 100)
- `id_contrato`: Filtrar por contrato
- `metodo_pago`: efectivo, tarjeta_debito, tarjeta_credito, transferencia
- `fecha_desde`: YYYY-MM-DD
- `fecha_hasta`: YYYY-MM-DD

### Listar Devoluciones

Mismos filtros que listar pagos, pero con:
- `metodo_devolucion` en lugar de `metodo_pago`

---

## ⚠️ Errores Comunes

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solución:**
- Verificar que el token esté configurado en el environment
- Verificar que el token no haya expirado
- Volver a hacer login

---

### 404 Not Found - Contrato

```json
{
  "statusCode": 404,
  "message": "Contrato #1 no encontrado"
}
```

**Solución:**
- Verificar que el contrato existe
- Usar un `id_contrato` válido

---

### 409 Conflict - Garantía ya existe

```json
{
  "statusCode": 409,
  "message": "Ya existe una garantía pagada para el contrato #1"
}
```

**Solución:**
- Un contrato solo puede tener UNA garantía
- Verificar con: `GET /garantias/pago/contrato/1`
- Usar otro contrato o eliminar la garantía existente

---

### 400 Bad Request - Monto no coincide

```json
{
  "statusCode": 400,
  "message": "El monto de la garantía (80000) debe coincidir con el monto del contrato (100000)"
}
```

**Solución:**
- El monto debe ser exactamente igual a `contrato.monto_garantia`
- Obtener el contrato: `GET /contratos/1`
- Usar el monto correcto

---

### 400 Bad Request - Contrato no finalizado

```json
{
  "statusCode": 400,
  "message": "El contrato #1 debe estar finalizado para devolver la garantía"
}
```

**Solución:**
- Finalizar el contrato primero: `POST /contratos/1/finalizar`
- Solo se puede devolver garantía cuando `contrato.estado === 'finalizado'`

---

### 404 Not Found - No existe garantía pagada

```json
{
  "statusCode": 404,
  "message": "No existe garantía pagada para el contrato #1"
}
```

**Solución:**
- Crear la garantía pago primero: `POST /garantias/pago`
- Verificar que existe: `GET /garantias/pago/contrato/1/verificar`

---

## 💡 Tips

### 1. Usar Variables

En Postman, usa `{{variable}}` para reutilizar valores:

```json
{
  "id_contrato": {{id_contrato}},
  "monto": {{monto_garantia}}
}
```

Configura en Environment:
- `id_contrato`: 1
- `monto_garantia`: 100000

### 2. Carpeta "Flujo Completo"

Usa la carpeta `Flujo Completo - Ejemplo` para ejecutar todos los pasos en orden.

### 3. Collection Runner

Para probar múltiples requests:
1. Click derecho en la carpeta
2. Seleccionar `Run folder`
3. Ejecutar en orden

### 4. Tests Automáticos

Puedes agregar tests en la pestaña `Tests` de cada request:

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has garantia_pago", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id_garantia_pago');
});
```

---

## 📊 Datos de Prueba

### Métodos de Pago/Devolución Válidos

```json
"efectivo"
"tarjeta_debito"
"tarjeta_credito"
"transferencia"
```

### Formato de Fechas

```json
"2024-12-05"  // YYYY-MM-DD
```

### Montos de Ejemplo

```json
{
  "monto_garantia": 100000,  // $100.000 CLP
  "monto_garantia": 50000,   // $50.000 CLP
  "monto_garantia": 200000   // $200.000 CLP
}
```

---

## 🎯 Escenarios de Prueba

### Escenario 1: Devolución 100% (Todo OK)

1. Crear garantía de $100.000
2. Devolver herramientas en `buen_estado`
3. Finalizar contrato
4. Calcular → `monto_sugerido: 100000` (100%)
5. Devolver → $100.000

---

### Escenario 2: Devolución 50% (Herramienta Dañada)

1. Crear garantía de $100.000
2. Devolver herramientas:
   - Escalera: `buen_estado`
   - Taladro: `danada`
3. Finalizar contrato
4. Calcular → `monto_sugerido: 50000` (50%)
5. Devolver → $50.000

---

### Escenario 3: Devolución 75% (Reparación Menor)

1. Crear garantía de $100.000
2. Devolver herramientas:
   - Escalera: `buen_estado`
   - Taladro: `reparacion_menor`
3. Finalizar contrato
4. Calcular → `monto_sugerido: 75000` (75%)
5. Devolver → $75.000

---

### Escenario 4: Devolución 0% (No devolvió todo)

1. Crear garantía de $100.000
2. Devolver SOLO algunas herramientas
3. Finalizar contrato
4. Calcular → `monto_sugerido: 0` (0%)
5. Devolver → $0

---

## 🆘 Soporte

Si encuentras errores:

1. **Verificar logs del servidor:**
   ```bash
   npm run start:dev
   ```

2. **Revisar la consola de Postman**

3. **Verificar el README del módulo:**
   - `/backend/src/modules/garantias/README.md`

---

**¡Listo para probar!** 🚀
