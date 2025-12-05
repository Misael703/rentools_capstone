import { Routes } from '@angular/router';
import { Login } from './auth/login/login';

import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './modules/dashboard/home/home';

import { Inventario } from './modules/inventario/inventario';
import { Contratos } from './modules/contratos/contratos';
import { Devoluciones } from './modules/devoluciones/devoluciones';
import { Clientes } from './modules/clientes/clientes';
import { Pagos } from './modules/pagos/pagos';

import { Usuarios } from './modules/usuarios/usuarios';

import { Reportes } from './modules/reportes/reportes';
import { ReporteContratos } from './modules/reportes/reporte-contratos/reporte-contratos';
import { ReporteDevoluciones } from './modules/reportes/reporte-devoluciones/reporte-devoluciones';
import { ReporteIngresoHerramienta } from './modules/reportes/reporte-ingreso-herramienta/reporte-ingreso-herramienta';
import { ReporteRankingHerramientas } from './modules/reportes/reporte-ranking-herramientas/reporte-ranking-herramientas';

import { ConfiguracionBsale } from './modules/configuracion-bsale/configuracion-bsale';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },

  // Rutas internas con layout (header + footer)
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'inventario', component: Inventario },
      {
        path: 'inventario/crear',
        loadComponent: () =>
          import('./modules/inventario/crear-inventario/crear-inventario').then(m => m.CrearInventario)
      },
      {
        path: 'inventario/editar/:id',
        loadComponent: () =>
          import('./modules/inventario/editar-inventario/editar-inventario')
            .then(m => m.EditarInventario)
      },
      { path: 'contratos', component: Contratos },
      { path: 'contratos/crear', loadComponent: () => import('./modules/contratos/crear-contrato/crear-contrato').then(m => m.CrearContrato) },
      { path: 'devoluciones', component: Devoluciones },
      {
        path: 'devoluciones/crear/:id_contrato',
        loadComponent: () =>
          import('./modules/devoluciones/crear-devolucion/crear-devolucion')
            .then(m => m.CrearDevolucion)
      },
      { path: 'clientes', component: Clientes },
      { path: 'clientes/crear', loadComponent: () => import('./modules/clientes/crear-cliente/crear-cliente').then(m => m.CrearCliente) },
      { path: 'clientes/editar/:id', loadComponent: () => import('./modules/clientes/editar-cliente/editar-cliente').then(m => m.EditarCliente) },
      {
        path: 'reportes', component: Reportes, children: [
          { path: '', redirectTo: 'contratos', pathMatch: 'full' },
          { path: 'contratos', loadComponent: () => import('./modules/reportes/reporte-contratos/reporte-contratos').then(m => m.ReporteContratos) },
          { path: 'devoluciones', loadComponent: () => import('./modules/reportes/reporte-devoluciones/reporte-devoluciones').then(m => m.ReporteDevoluciones) },
          { path: 'ingreso-herramienta', loadComponent: () => import('./modules/reportes/reporte-ingreso-herramienta/reporte-ingreso-herramienta').then(m => m.ReporteIngresoHerramienta) },
          { path: 'reporte-cliente', loadComponent: () => import('./modules/reportes/reporte-cliente/reporte-cliente').then(m => m.ReporteCliente) }
        ]
      },
      { path: 'configuracion-bsale', component: ConfiguracionBsale, canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'pagos', component: Pagos },
      {
        path: 'usuarios', component: Usuarios, canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'usuarios/crear',
        loadComponent: () =>
          import('./modules/usuarios/crear-usuario/crear-usuario').then(m => m.CrearUsuario),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'usuarios/editar/:id_usuario',
        loadComponent: () =>
          import('./modules/usuarios/editar-usuario/editar-usuario').then(m => m.EditarUsuario),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      }
    ]
  },

  // Ruta comodín → cualquier URL desconocida
  { path: '**', redirectTo: 'login' }
];