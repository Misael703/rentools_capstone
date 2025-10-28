export class RutValidator {
  /**
   * Valida un RUT chileno completo (con dígito verificador)
   * @param rut - RUT en formato 12345678-9 o 12.345.678-9
   * @returns true si el RUT es válido
   */
  static validate(rut: string): boolean {
    if (!rut) return false;

    // Limpiar el RUT (quitar puntos y guiones)
    const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();

    // Validar formato básico
    if (!/^\d{7,8}[\dkK]$/.test(cleanRut)) {
      return false;
    }

    // Separar número y dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const providedDV = cleanRut.slice(-1);

    // Calcular dígito verificador
    const calculatedDV = this.calculateDV(rutNumber);

    // Comparar
    return providedDV === calculatedDV;
  }

  /**
   * Calcula el dígito verificador de un RUT
   * @param rut - Número del RUT sin dígito verificador
   * @returns Dígito verificador calculado
   */
  static calculateDV(rut: string): string {
    let sum = 0;
    let multiplier = 2;

    // Recorrer el RUT de derecha a izquierda
    for (let i = rut.length - 1; i >= 0; i--) {
      sum += parseInt(rut[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const dv = 11 - remainder;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
  }

  /**
   * Formatea un RUT al formato estándar chileno: 12.345.678-9
   * @param rut - RUT sin formato
   * @returns RUT formateado
   */
  static format(rut: string): string {
    // Limpiar el RUT
    const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();

    if (!/^\d{7,8}[\dkK]$/.test(cleanRut)) {
      return rut; // Retornar sin cambios si no es válido
    }

    // Separar número y dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    // Agregar puntos de miles
    const formatted = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
  }

  /**
   * Limpia un RUT quitando puntos y guiones
   * @param rut - RUT con formato
   * @returns RUT limpio: 123456789
   */
  static clean(rut: string): string {
    return rut.replace(/[.-]/g, '').toUpperCase();
  }

  /**
   * Formatea un RUT al formato simple: 12345678-9
   * @param rut - RUT sin formato o con formato completo
   * @returns RUT en formato simple
   */
  static formatSimple(rut: string): string {
    const cleanRut = this.clean(rut);

    if (!/^\d{7,8}[\dkK]$/.test(cleanRut)) {
      return rut;
    }

    const rutNumber = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    return `${rutNumber}-${dv}`;
  }

  /**
   * Extrae solo el número del RUT (sin dígito verificador)
   * @param rut - RUT completo
   * @returns Número del RUT
   */
  static getNumber(rut: string): string {
    const cleanRut = this.clean(rut);
    return cleanRut.slice(0, -1);
  }

  /**
   * Extrae solo el dígito verificador
   * @param rut - RUT completo
   * @returns Dígito verificador
   */
  static getDV(rut: string): string {
    const cleanRut = this.clean(rut);
    return cleanRut.slice(-1);
  }
}