# Solución al Problema de Fechas en Contratos

## 🐛 Problema Reportado

Al crear un contrato con fecha `2025-11-25`, se guardaba como `2025-11-24` (restaba 1 día).

## 🔍 Causa Raíz

El problema se debe a cómo JavaScript maneja las zonas horarias al parsear fechas:

```typescript
// ❌ ANTES (problema)
const fecha = new Date("2025-11-25");
// JavaScript interpreta esto como: 2025-11-25T00:00:00.000Z (UTC medianoche)
```

**¿Qué sucedía?**

1. Frontend envía: `"2025-11-25"`
2. Backend ejecuta: `new Date("2025-11-25")`
3. JavaScript crea: `2025-11-25T00:00:00.000Z` (UTC)
4. Servidor en Chile (UTC-3 o UTC-4):
   - UTC-4: `2025-11-25T00:00:00Z` = `2025-11-24T20:00:00` local
5. PostgreSQL guarda: `2025-11-24 20:00:00` (sin zona horaria)
6. Al recuperar muestra: `2025-11-24` ❌

## ✅ Solución Implementada

Se creó una función helper que parsea fechas como **fecha local** (sin conversión UTC):

### Archivo: `src/common/utils/date.helper.ts`

```typescript
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  // Crear Date con parámetros (mes es 0-indexed)
  // Esto crea la fecha en zona horaria LOCAL, no UTC
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}
```

**¿Cómo funciona ahora?**

```typescript
// ✅ DESPUÉS (correcto)
const fecha = parseLocalDate("2025-11-25");
// Crea: 2025-11-25T00:00:00 en zona horaria LOCAL (sin conversión UTC)
```

1. Frontend envía: `"2025-11-25"`
2. Backend ejecuta: `parseLocalDate("2025-11-25")`
3. JavaScript crea: `2025-11-25T00:00:00` (local)
4. PostgreSQL guarda: `2025-11-25 00:00:00`
5. Al recuperar muestra: `2025-11-25` ✅

## 📝 Cambios Realizados

### 1. Creado helper de fechas
**Archivo:** `src/common/utils/date.helper.ts`

```typescript
export function parseLocalDate(dateString: string): Date;
export function parseLocalDateTime(dateTimeString: string): Date;
export function formatDate(date: Date): string;
export function formatDateES(date: Date): string;
```

### 2. Actualizado servicio de contratos
**Archivo:** `src/modules/contratos/contratos.service.ts`

```typescript
// Importar helper
import { parseLocalDate } from '../../common/utils/date.helper';

// Usar en create()
const fechaInicio = parseLocalDate(createContratoDto.fecha_inicio);
const fechaTermino = parseLocalDate(createContratoDto.fecha_termino_estimada);
```

## 🧪 Prueba

### Antes (problema)
```bash
POST /api/contratos
{
  "fecha_inicio": "2025-11-25",
  "fecha_termino_estimada": "2025-12-10",
  ...
}

# Respuesta (INCORRECTO):
{
  "fecha_inicio": "2025-11-24T20:00:00.000Z",  ❌
  "fecha_termino_estimada": "2025-12-09T20:00:00.000Z"  ❌
}
```

### Después (correcto)
```bash
POST /api/contratos
{
  "fecha_inicio": "2025-11-25",
  "fecha_termino_estimada": "2025-12-10",
  ...
}

# Respuesta (CORRECTO):
{
  "fecha_inicio": "2025-11-25T00:00:00.000Z",  ✅
  "fecha_termino_estimada": "2025-12-10T00:00:00.000Z"  ✅
}
```

## 📋 Buenas Prácticas Aplicadas

### ✅ Para campos de fecha (sin hora)
```typescript
// Enviar desde frontend
const fecha = "2025-11-25";  // YYYY-MM-DD

// Parsear en backend
const fechaObj = parseLocalDate(fecha);
```

### ✅ Para campos de fecha-hora
```typescript
// Enviar desde frontend
const fechaHora = "2025-11-25 14:30:00";  // YYYY-MM-DD HH:mm:ss

// Parsear en backend
const fechaHoraObj = parseLocalDateTime(fechaHora);
```

### ❌ Evitar
```typescript
// NO HACER ESTO:
const fecha = new Date("2025-11-25");  // ❌ Conversión UTC
const fecha = new Date(timestamp);     // ❌ Depende del cliente
```

## 🌍 Consideraciones de Zona Horaria

### Tipos de Campos en PostgreSQL

1. **`timestamp without time zone`** (actual)
   - ✅ Usado en contratos
   - Guarda la fecha/hora sin información de zona horaria
   - Asume zona horaria del servidor
   - Ideal para fechas de negocio locales

2. **`timestamp with time zone`** (alternativa)
   - Guarda fecha/hora + zona horaria
   - Ideal para eventos globales
   - Más complejo de manejar

3. **`date`** (más simple para fechas sin hora)
   - Solo guarda fecha (sin hora)
   - Ideal para fechas de inicio/término
   - Elimina problemas de zona horaria

### Recomendación para Contratos

Los contratos tienen fechas de negocio **locales** (no eventos globales), por lo que:
- ✅ Mantener `timestamp without time zone`
- ✅ Usar `parseLocalDate()` en backend
- ✅ Enviar fechas en formato `YYYY-MM-DD` desde frontend

## 🔧 Uso en Otros Módulos

Si otros módulos tienen el mismo problema, importar el helper:

```typescript
import { parseLocalDate } from 'src/common/utils/date.helper';

// En el servicio
const fecha = parseLocalDate(dto.fecha);
```

## 📚 Referencias

- [MDN: Date constructor](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
- [PostgreSQL: Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Stack Overflow: Date timezone issue](https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off)
