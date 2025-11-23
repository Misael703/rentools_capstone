import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ReportesService } from '../Services/servicesReporte';

@Component({
  selector: 'app-reporte-ingreso-herramienta',
  imports: [CommonModule, NgChartsModule],
  templateUrl: './reporte-ingreso-herramienta.html',
  styleUrl: './reporte-ingreso-herramienta.css',
})
export class ReporteIngresoHerramienta implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // VARIABLES PARA LAS 6 TARJETAS
  total: number = 0;
  activas: number = 0;
  inactivas: number = 0;
  conStock: number = 0;
  sinStock: number = 0;
  valorInventario: number = 0;

  // PIE CHART (Gráfico de Torta)
  public pieStockData: ChartData<'pie'> = {
    labels: ['Con Stock', 'Sin Stock'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#0d6efd', '#dc3545'],
        hoverOffset: 10
      }
    ]
  };

  public pieStockOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  };

  constructor(private reportesService: ReportesService) { }

  ngOnInit(): void {
    this.cargarEstadisticasHerramientas();
  }

  cargarEstadisticasHerramientas(): void {
    this.reportesService.getEstadisticasHerramientas().subscribe({
      next: (data) => {
        // GUARDAR LOS VALORES PARA LAS TARJETAS
        this.total = data.total;
        this.activas = data.activas;
        this.inactivas = data.inactivas;
        this.conStock = data.conStock;
        this.sinStock = data.sinStock;
        this.valorInventario = data.valorInventario;

        // ACTUALIZAR DONA
        this.pieStockData.datasets[0].data = [
          this.conStock,
          this.sinStock
        ];

        setTimeout(() => this.chart?.update(), 0);
      },
      error: err => console.error('Error al obtener estadísticas de herramientas:', err)
    });
  }

}
