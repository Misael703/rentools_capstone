import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
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

export const routes: Routes = [
  // Ruta vacía → redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Ruta del login (sin header/footer)
  { path: 'login', component: Login },

  // Rutas internas con layout (header + footer)
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'home', component: Home },
      { path: 'inventario', component: Inventario },
      {
        path: 'inventario/crear',
        loadComponent: () =>
          import('./modules/inventario/crear-inventario/crear-inventario').then(m => m.CrearInventario)
      },
      {
        path: 'inventario/editar/:codigo',
        loadComponent: () =>
          import('./modules/inventario/editar-inventario/editar-inventario')
            .then(m => m.EditarInventario)
      },
      { path: 'contratos', component: Contratos },
      { path: 'devoluciones', component: Devoluciones },
      { path: 'clientes', component: Clientes },
      {
        path: 'reportes', component: Reportes, children: [
          { path: '', redirectTo: 'contratos', pathMatch: 'full' },
          { path: 'contratos', loadComponent: () => import('./modules/reportes/reporte-contratos/reporte-contratos').then(m => m.ReporteContratos) },
          { path: 'devoluciones', loadComponent: () => import('./modules/reportes/reporte-devoluciones/reporte-devoluciones').then(m => m.ReporteDevoluciones) },
          { path: 'ingreso-herramienta', loadComponent: () => import('./modules/reportes/reporte-ingreso-herramienta/reporte-ingreso-herramienta').then(m => m.ReporteIngresoHerramienta) },
          { path: 'ranking-herramientas', loadComponent: () => import('./modules/reportes/reporte-ranking-herramientas/reporte-ranking-herramientas').then(m => m.ReporteRankingHerramientas) }
        ]
      },
      { path: 'pagos', component: Pagos },
      { path: 'usuarios', component: Usuarios },
      {
        path: 'usuarios/crear',
        loadComponent: () =>
          import('./modules/usuarios/crear-usuario/crear-usuario').then(m => m.CrearUsuario)
      },
      {
        path: 'usuarios/editar/:id_usuario',
        loadComponent: () =>
          import('./modules/usuarios/editar-usuario/editar-usuario').then(m => m.EditarUsuario)
      }
    ]
  },

  // Ruta comodín → cualquier URL desconocida
  { path: '**', redirectTo: 'login' }
];