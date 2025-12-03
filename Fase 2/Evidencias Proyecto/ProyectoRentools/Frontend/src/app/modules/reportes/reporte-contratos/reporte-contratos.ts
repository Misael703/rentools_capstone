import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../Services/servicesReporte';
import { EstadisticasContratos } from '../Interfaces/interfaceReporte';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
@Component({
  selector: 'app-reporte-contratos',
  imports: [CommonModule, NgChartsModule],
  templateUrl: './reporte-contratos.html',
  styleUrl: './reporte-contratos.css',
})
export class ReporteContratos implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  estadisticas: EstadisticasContratos | null = null;

  // Gráfico de dona para contratos por estado
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Activos', 'Finalizados', 'Vencidos', 'Cancelados'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#198754', '#0d6efd', '#dc3545', '#ffc107'],
        hoverOffset: 10
      }
    ]
  };

  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        enabled: true
      }
    }
  };

  constructor(private reportesService: ReportesService) { }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.reportesService.getEstadisticasContratos().subscribe({
      next: (data) => {
        this.estadisticas = data;

        // Actualizar datos del gráfico
        const porEstado = data.porEstado;
        this.doughnutChartData.datasets[0].data = [
          porEstado.activos,
          porEstado.finalizados,
          porEstado.vencidos,
          porEstado.cancelados
        ];

        // Forzar actualización del chart
        setTimeout(() => this.chart?.update(), 0);
      },
      error: (err) => console.error('Error al obtener estadísticas de contratos', err)
    });
  }
}
