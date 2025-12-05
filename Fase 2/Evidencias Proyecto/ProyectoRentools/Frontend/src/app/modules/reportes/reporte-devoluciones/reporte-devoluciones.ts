import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ReportesService } from '../Services/servicesReporte';
import { EstadisticasPagos, PorMetodoPago, PorMes } from '../Interfaces/interfaceReporte';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';


@Component({
  selector: 'app-reporte-devoluciones',
  imports: [CommonModule, NgChartsModule],
  providers: [DecimalPipe],
  templateUrl: './reporte-devoluciones.html',
  styleUrl: './reporte-devoluciones.css',
})
export class ReporteDevoluciones implements OnInit {
  estadisticas: EstadisticasPagos | null = null;

  // Doughnut por método de pago
  public doughnutMetodoData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545'], hoverOffset: 10 }] };
  public doughnutMetodoOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } } };

  // Bar por mes
  public barMesData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Monto recaudado', data: [], backgroundColor: '#0d6efd' }] };
  public barMesOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { x: { title: { display: true, text: 'Mes' } }, y: { title: { display: true, text: 'Monto ($)' } } }
  };

  constructor(private reportesService: ReportesService) { }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.reportesService.getEstadisticasPagos().subscribe({
      next: (res: EstadisticasPagos) => {
        this.estadisticas = res;

        // 🔹 Creamos nuevas referencias para los datasets (esto dispara el cambio)
        this.doughnutMetodoData = {
          labels: res.por_metodo_pago.map(m => this.formatearMetodo(m.metodo)),
          datasets: [{
            data: res.por_metodo_pago.map(m => m.total),
            backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545'],
            hoverOffset: 10
          }]
        };

        this.barMesData = {
          labels: res.por_mes.map(m => m.mes),
          datasets: [{
            label: 'Monto recaudado',
            data: res.por_mes.map(m => m.total),
            backgroundColor: '#0d6efd'
          }]
        };
      },
      error: err => console.error('Error al cargar estadísticas de pagos:', err)
    });
  }

  formatearMetodo(metodo: string): string {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta_debito': return 'Tarjeta Débito';
      case 'tarjeta_credito': return 'Tarjeta Crédito';
      case 'transferencia': return 'Transferencia';
      default: return metodo;
    }
  }
}
