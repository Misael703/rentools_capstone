import { PaginatedResult } from '../interfaces/paginated-result.interface';

export class PaginationHelper {
  /**
   * Crea una respuesta paginada estructurada
   */
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Crea metadata de paginación sin los datos
   */
  static createMetadata(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}