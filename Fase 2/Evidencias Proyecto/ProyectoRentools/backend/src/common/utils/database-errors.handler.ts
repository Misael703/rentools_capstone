import { 
  ConflictException, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';

/**
 * Códigos de error comunes de PostgreSQL
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
  CHECK_VIOLATION = '23514',
}

/**
 * Maneja errores de base de datos PostgreSQL y los convierte en excepciones HTTP apropiadas
 */
export class DatabaseErrorHandler {
  /**
   * Maneja errores de PostgreSQL
   * @param error - Error de la base de datos
   * @param context - Contexto adicional (ej: 'usuario', 'contrato')
   */
  static handle(error: any, context?: string): never {
    // Si no es un error de base de datos, relanzar
    if (!error.code) {
      throw error;
    }

    const contextMsg = context ? ` en ${context}` : '';

    switch (error.code) {
      case PostgresErrorCode.UNIQUE_VIOLATION:
        throw this.handleUniqueViolation(error, contextMsg);

      case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
        throw this.handleForeignKeyViolation(error, contextMsg);

      case PostgresErrorCode.NOT_NULL_VIOLATION:
        throw this.handleNotNullViolation(error, contextMsg);

      case PostgresErrorCode.CHECK_VIOLATION:
        throw this.handleCheckViolation(error, contextMsg);

      default:
        console.error('Error de base de datos no manejado:', error);
        throw new InternalServerErrorException(
          `Error de base de datos${contextMsg}. Por favor contacta al administrador.`
        );
    }
  }

  /**
   * Maneja violaciones de constraint UNIQUE (duplicados)
   */
  private static handleUniqueViolation(error: any, context: string): never {
    // Extraer el campo del mensaje de error
    const match = error.detail?.match(/Key \(([^)]+)\)=/);
    const field = match ? match[1] : 'campo';

    // Formatear el nombre del campo
    const fieldName = this.formatFieldName(field);

    throw new ConflictException(
      `El ${fieldName} ya está en uso${context}. Por favor elige otro valor.`
    );
  }

  /**
   * Maneja violaciones de FOREIGN KEY (relación no existe)
   */
  private static handleForeignKeyViolation(error: any, context: string): never {
    // Extraer información del error
    const match = error.detail?.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
    const field = match ? match[1] : 'relación';
    const value = match ? match[2] : '';

    const fieldName = this.formatFieldName(field);

    // Si es un DELETE con foreign key
    if (error.message.includes('still referenced')) {
      throw new ConflictException(
        `No se puede eliminar el registro${context} porque tiene registros relacionados. ` +
        `Considera desactivarlo en lugar de eliminarlo.`
      );
    }

    // Si es un INSERT/UPDATE con foreign key inválida
    throw new NotFoundException(
      `El ${fieldName} con ID '${value}' no existe${context}. ` +
      `Por favor verifica que el valor sea correcto.`
    );
  }

  /**
   * Maneja violaciones de NOT NULL (campo requerido)
   */
  private static handleNotNullViolation(error: any, context: string): never {
    const match = error.message?.match(/column "([^"]+)"/);
    const field = match ? match[1] : 'campo';
    const fieldName = this.formatFieldName(field);

    throw new BadRequestException(
      `El campo '${fieldName}' es obligatorio${context}.`
    );
  }

  /**
   * Maneja violaciones de CHECK constraints
   */
  private static handleCheckViolation(error: any, context: string): never {
    throw new BadRequestException(
      `Los datos no cumplen con las validaciones${context}. ${error.detail || ''}`
    );
  }

  /**
   * Formatea nombres de campos de snake_case a texto legible
   */
  private static formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/^id /, '')
      .trim();
  }
}