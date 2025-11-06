export interface BsaleCliente {
  id: number;
  code: string; // RUT
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  municipality: string;
  activity: string; // Giro para empresas
  companyOrPerson: number; // 0 = persona natural, 1 = empresa
  company: string; // Nombre de la empresa (si aplica)
}

export interface BsaleApiResponse<T> {
  href: string;
  count: number;
  limit: number;
  offset: number;
  items: T[];
}