# Guía de Testing - Módulo de Pagos

Esta guía te explica paso a paso cómo probar el módulo de Pagos y entender su funcionamiento.

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Flujo Completo: De Arriendo a Pago](#flujo-completo)
3. [Casos de Prueba Específicos](#casos-de-prueba-específicos)
4. [Errores Comunes](#errores-comunes)

---

## Configuración Inicial

### 1. Importar Colección de Postman

1. Abre Postman
2. Click en "Import"
3. Selecciona el archivo `Pagos.postman_collection.json`
4. La colección aparecerá con todos los endpoints

### 2. Configurar Variables

En Postman, configura estas variables de colección:

- `baseUrl`: `http://localhost:3000`
- `authToken`: Tu token JWT (obtenido del login)

### 3. Obtener Token de Autenticación

```bash
# Login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "correo": "admin@rentools.cl",
  "password": "tu_password"
}

# Respuesta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Copia el `access_token` y pégalo en la variable `authToken` de Postman.

---

## Flujo Completo

Este es el flujo completo desde que un cliente arrienda hasta que paga:

### Paso 1: Crear un Contrato (módulo Contratos)

```bash
POST /contratos
{
  "id_cliente": 1,
  "id_usuario": 1,
  "fecha_inicio": "2024-12-01",
  "fecha_termino_estimada": "2024-12-10",
  "tipo_entrega": "retiro_tienda",
  "monto_garantia": 50000,
  "detalles": [
    {
      "id_herramienta": 1,
      "cantidad": 3,
      "precio_unitario": 5000
    }
  ]
}

# Respuesta:
{
  "id_contrato": 1,
  "estado": "activo",
  "monto_estimado": 135000,  // 3 × 5000 × 9 días
  "monto_final": null
}
```

---

### Paso 2: Devolver Herramientas (módulo Devoluciones)

**IMPORTANTE:** Debes devolver herramientas ANTES de poder pagar.

```bash
POST /devoluciones/masiva
{
  "devoluciones": [
    {
      "id_detalle": 1,
      "cantidad_devuelta": 3,
      "fecha_devolucion": "2024-12-04",
      "estado": "buen_estado",
      "observaciones": "Herramientas en perfecto estado"
    }
  ]
}

# Respuesta:
{
  "devoluciones": [...],
  "resumen": {
    "total_devoluciones": 1,
    "total_herramientas_devueltas": 3,
    "monto_total_cobrado": 45000,  // 3 × 5000 × 3 días reales
    "contratos_finalizados": [1]
  }
}
```

**Nota:** El sistema calculó el monto real: 3 días × 3 herramientas × $5,000 = $45,000

---

### Paso 3: Verificar el Resumen ANTES de Pagar

```bash
GET /pagos/contrato/1/resumen

# Respuesta:
{
  "contrato": {
    "id_contrato": 1,
    "estado": "finalizado",
    "monto_final": 45000,
    "monto_estimado": 135000
  },
  "pagos": [],
  "resumen": {
    "monto_total_a_pagar": 45000,
    "monto_total_pagado": 0,
    "saldo_pendiente": 45000,
    "estado_pago": "sin_pagos",
    "cantidad_pagos": 0
  }
}
```

---

### Paso 4: Registrar el Pago

#### Opción A: Pago Total

```bash
POST /pagos
{
  "id_contrato": 1,
  "fecha_pago": "2024-12-04",
  "monto": 45000,
  "metodo_pago": "efectivo",
  "referencia": null
}

# Respuesta:
{
  "id_pago": 1,
  "id_contrato": 1,
  "fecha_pago": "2024-12-04",
  "monto": 45000,
  "metodo_pago": "efectivo",
  "referencia": null,
  "contrato": {
    "id_contrato": 1,
    "estado": "finalizado",
    "monto_final": 45000
  }
}
```

#### Opción B: Pago Parcial

```bash
# Primer pago: $30,000
POST /pagos
{
  "id_contrato": 1,
  "fecha_pago": "2024-12-04",
  "monto": 30000,
  "metodo_pago": "tarjeta_credito",
  "referencia": "TRANS-TC-123"
}

# Segundo pago: $15,000
POST /pagos
{
  "id_contrato": 1,
  "fecha_pago": "2024-12-05",
  "monto": 15000,
  "metodo_pago": "efectivo"
}
```

---

### Paso 5: Verificar el Resumen DESPUÉS de Pagar

```bash
GET /pagos/contrato/1/resumen

# Respuesta:
{
  "contrato": {
    "id_contrato": 1,
    "estado": "finalizado",
    "monto_final": 45000
  },
  "pagos": [
    {
      "id_pago": 1,
      "fecha_pago": "2024-12-04",
      "monto": 45000,
      "metodo_pago": "efectivo"
    }
  ],
  "resumen": {
    "monto_total_a_pagar": 45000,
    "monto_total_pagado": 45000,
    "saldo_pendiente": 0,
    "estado_pago": "pagado_completo",  // ✅ CAMBIÓ!
    "cantidad_pagos": 1
  }
}
```

---

## Casos de Prueba Específicos

### Caso 1: Devolución Parcial → Pago Parcial

```bash
# 1. Devolver solo 2 de 3 herramientas
POST /devoluciones/masiva
{
  "devoluciones": [
    {
      "id_detalle": 1,
      "cantidad_devuelta": 2,  # Solo 2
      "fecha_devolucion": "2024-12-04",
      "estado": "buen_estado"
    }
  ]
}
# → monto_cobrado: $30,000 (2 × 5000 × 3 días)

# 2. Pagar lo devuelto
POST /pagos
{
  "id_contrato": 1,
  "monto": 30000,
  "metodo_pago": "efectivo"
}
# ✅ Éxito

# 3. Devolver la última herramienta
POST /devoluciones/masiva
{
  "devoluciones": [
    {
      "id_detalle": 1,
      "cantidad_devuelta": 1,  # La última
      "fecha_devolucion": "2024-12-05",
      "estado": "buen_estado"
    }
  ]
}
# → monto_cobrado total: $45,000
# → Contrato FINALIZADO ✅
# → WARNING: Saldo pendiente $15,000

# 4. Pagar el saldo
POST /pagos
{
  "id_contrato": 1,
  "monto": 15000,
  "metodo_pago": "tarjeta_debito"
}
# ✅ Ahora sí está todo pagado
```

---

### Caso 2: Devolver TODO → Pagar TODO al Final

```bash
# 1. Devolver todas las herramientas SIN PAGAR
POST /devoluciones/masiva
{
  "devoluciones": [
    {
      "id_detalle": 1,
      "cantidad_devuelta": 3,  # Todas
      "fecha_devolucion": "2024-12-04",
      "estado": "buen_estado"
    }
  ]
}
# → Contrato FINALIZADO ✅
# → WARNING en logs: Saldo pendiente $45,000
# → PERO NO HAY ERROR, la devolución se completa

# 2. Ver resumen
GET /pagos/contrato/1/resumen
# → saldo_pendiente: 45000
# → estado_pago: "sin_pagos"

# 3. Pagar todo junto
POST /pagos
{
  "id_contrato": 1,
  "monto": 45000,
  "metodo_pago": "transferencia",
  "referencia": "REF-BANCO-001"
}
# ✅ Pago completado
```

---

### Caso 3: Múltiples Pagos (Cuotas)

```bash
# Cliente devolvió todo: $100,000 a pagar
# Pagará en 4 cuotas de $25,000

POST /pagos
{ "id_contrato": 1, "monto": 25000, "metodo_pago": "efectivo" }

POST /pagos
{ "id_contrato": 1, "monto": 25000, "metodo_pago": "efectivo" }

POST /pagos
{ "id_contrato": 1, "monto": 25000, "metodo_pago": "efectivo" }

POST /pagos
{ "id_contrato": 1, "monto": 25000, "metodo_pago": "efectivo" }

# Ver todos los pagos del contrato
GET /pagos/contrato/1
{
  "pagos": [
    { "id_pago": 1, "monto": 25000 },
    { "id_pago": 2, "monto": 25000 },
    { "id_pago": 3, "monto": 25000 },
    { "id_pago": 4, "monto": 25000 }
  ],
  "total_pagado": 100000
}
```

---

## Errores Comunes

### ❌ Error 1: Intentar Pagar sin Devolver

```bash
POST /pagos
{
  "id_contrato": 1,
  "monto": 50000,
  "metodo_pago": "efectivo"
}

# ERROR 400:
{
  "statusCode": 400,
  "message": "No se puede registrar un pago sin haber devuelto ninguna herramienta. Primero debe devolver las herramientas para calcular el monto a pagar."
}
```

**Solución:** Devolver al menos una herramienta primero usando `/devoluciones/masiva`

---

### ❌ Error 2: Intentar Pagar Más de lo Devuelto

```bash
# Devolviste herramientas por $30,000
# Intentas pagar $50,000

POST /pagos
{
  "id_contrato": 1,
  "monto": 50000,
  "metodo_pago": "efectivo"
}

# ERROR 400:
{
  "statusCode": 400,
  "message": "El monto del pago ($50000) excede el saldo disponible para pagar. Monto cobrado por devoluciones: $30000, Ya pagado: $0, Saldo disponible: $30000"
}
```

**Solución:** Pagar máximo el saldo disponible ($30,000 en este caso)

---

### ❌ Error 3: Intentar Pagar Dos Veces el Mismo Monto

```bash
# Primera vez
POST /pagos
{ "id_contrato": 1, "monto": 30000 }
# ✅ Éxito

# Segunda vez (sin devolver más)
POST /pagos
{ "id_contrato": 1, "monto": 30000 }

# ERROR 400:
{
  "message": "El monto del pago ($30000) excede el saldo disponible para pagar. Monto cobrado por devoluciones: $30000, Ya pagado: $30000, Saldo disponible: $0"
}
```

**Solución:** Verificar el saldo disponible con `GET /pagos/contrato/:id/resumen` antes de pagar

---

## Estadísticas

### Ver Estadísticas Generales

```bash
GET /pagos/stats

# Respuesta:
{
  "total_recaudado": 1500000,
  "cantidad_pagos": 25,
  "por_metodo_pago": [
    {
      "metodo": "efectivo",
      "total": 600000,
      "cantidad": 15
    },
    {
      "metodo": "tarjeta_credito",
      "total": 500000,
      "cantidad": 8
    },
    {
      "metodo": "transferencia",
      "total": 400000,
      "cantidad": 2
    }
  ],
  "por_mes": [
    {
      "mes": "2024-12",
      "total": 800000,
      "cantidad": 15
    },
    {
      "mes": "2024-11",
      "total": 700000,
      "cantidad": 10
    }
  ]
}
```

---

## Búsquedas Avanzadas

### Buscar Pagos por Fecha

```bash
# Pagos de diciembre 2024
GET /pagos?fecha_desde=2024-12-01&fecha_hasta=2024-12-31
```

### Buscar Pagos por Método

```bash
# Solo pagos en efectivo
GET /pagos?metodo_pago=efectivo
```

### Buscar Pagos de un Cliente Específico

```bash
# Todos los pagos del contrato del cliente
GET /pagos?id_contrato=1
```

---

## Flujo Visual Completo

```
┌──────────────────────────────────────────────────────────┐
│                    FLUJO RENTOOLS                        │
└──────────────────────────────────────────────────────────┘

1. POST /contratos
   → Cliente arrienda 3 herramientas × $5,000 × 9 días
   → monto_estimado: $135,000
   → Garantía: $50,000

2. POST /devoluciones/masiva
   → Cliente devuelve las 3 herramientas en 3 días
   → monto_cobrado: $45,000 (días reales)
   → Contrato FINALIZADO
   → WARNING: Saldo pendiente

3. GET /pagos/contrato/1/resumen
   → monto_total_a_pagar: $45,000
   → monto_total_pagado: $0
   → saldo_pendiente: $45,000
   → estado_pago: "sin_pagos"

4. POST /pagos
   → Cliente paga $45,000
   → Pago registrado ✅

5. GET /pagos/contrato/1/resumen
   → saldo_pendiente: $0
   → estado_pago: "pagado_completo" ✅

6. Futuro: POST /dtes/generar
   → Validará que está pagado completamente
   → Emitirá factura ✅
   → Devolverá garantía ($50,000) ✅
```

---

## Tips de Testing

1. **Siempre verifica el resumen antes y después de pagar**
   ```bash
   GET /pagos/contrato/:id/resumen
   ```

2. **Usa referencias claras para identificar pagos**
   ```json
   { "referencia": "PAGO-CLIENTE-123-CUOTA-1" }
   ```

3. **Aprovecha los filtros para encontrar pagos específicos**
   ```bash
   GET /pagos?id_contrato=1&metodo_pago=efectivo
   ```

4. **Revisa los logs del servidor para ver los warnings**
   ```
   ⚠️ Contrato #1 finalizado con saldo pendiente.
   ```

5. **Prueba todos los métodos de pago**
   - efectivo
   - tarjeta_debito
   - tarjeta_credito
   - transferencia

---

## Próximos Pasos

Una vez que entiendas cómo funcionan los pagos, podrás:

1. **Integrar con el módulo de DTEs** (futuro)
   - Emitir facturas cuando el pago esté completo
   - Vincular pagos con documentos tributarios

2. **Devolver garantías**
   - Solo si el pago está completo
   - Solo si no hay herramientas dañadas

3. **Generar reportes**
   - Usar las estadísticas para análisis de negocio
   - Identificar métodos de pago más usados

---

¡Listo! Ahora tienes todo lo necesario para probar el módulo de Pagos de RenTools 🚀
