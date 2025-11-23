import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../Services/servicesReporte';
import { ClienteReporte, EstadisticasClientes } from '../Interfaces/interfaceReporte';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-reporte-cliente',
  imports: [CommonModule, NgChartsModule],
  providers: [DecimalPipe],
  templateUrl: './reporte-cliente.html',
  styleUrl: './reporte-cliente.css',
})
export class ReporteCliente implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  clientes: ClienteReporte[] = [];
  estadisticas: EstadisticasClientes | null = null;

  porcentajePersona: number = 0;
  porcentajeEmpresa: number = 0;

  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#198754', '#dc3545'],
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
    this.cargarClientes();
    this.cargarEstadisticas();
  }

  cargarClientes(): void {
    this.reportesService.getClientes().subscribe({
      next: (res: ClienteReporte[] | { data: ClienteReporte[] }) => {
        const clientesArray: ClienteReporte[] = Array.isArray(res) ? res : res.data;

        if (!clientesArray || clientesArray.length === 0) return;

        const personas = clientesArray.filter(c => c.tipo_cliente?.trim() === 'persona_natural').length;
        const empresas = clientesArray.filter(c => c.tipo_cliente?.trim() === 'empresa').length;

        this.porcentajePersona = (personas / clientesArray.length) * 100;
        this.porcentajeEmpresa = (empresas / clientesArray.length) * 100;
      },
      error: err => console.error('Error al obtener clientes:', err)
    });
  }

  cargarEstadisticas(): void {
    this.reportesService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;

        const activos = data.activos;
        const inactivos = data.total - data.activos;

        this.doughnutChartData.datasets[0].data = [activos, inactivos];

        // 🔹 FORZAR actualización del chart
        setTimeout(() => this.chart?.update(), 0);
      },
      error: (err) => console.error('Error al obtener estadísticas:', err)
    });
  }
}
