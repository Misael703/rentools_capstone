import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inventory, Herramienta } from './inventory';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

declare var bootstrap: any;
@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  listaHerramientas: Herramienta[] = [];
  herramientaSeleccionada?: Herramienta;
  listaFiltrada: Herramienta[] = [];
  soloDisponibles = false;
  terminoBusqueda: string = '';

  constructor(
    private inventory: Inventory,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadHerramientas();
  }

  loadHerramientas() {
    this.inventory.getAll().subscribe(lista => {
      this.listaHerramientas = lista;
      this.aplicarFiltro();
    });
  }

  // Activa/desactiva el filtro
  toggleFiltroDisponibles() {
    this.soloDisponibles = !this.soloDisponibles;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    // 1️⃣ empezamos con todos
    let filtradas = [...this.listaHerramientas];

    // 2️⃣ si hay filtro de disponibilidad
    if (this.soloDisponibles) {
      filtradas = filtradas.filter(h => h.stock > 0);
    }

    // 3️⃣ si hay texto de búsqueda
    if (this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(h =>
        h.nombre.toLowerCase().includes(termino) ||
        h.codigo.toString().toLowerCase().includes(termino)
      );
    }

    // 4️⃣ guardamos el resultado final
    this.listaFiltrada = filtradas;
  }

  abrirDetalle(herramienta: Herramienta) {
    this.herramientaSeleccionada = herramienta;
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleHerramienta'));
    modal.show();
  }

  irCrear() {
    this.router.navigate(['/inventario/crear']);
  }

  irEditar(herramienta: Herramienta) {
    this.router.navigate(['/inventario/editar/', herramienta.codigo]);
  }


  exportarExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Encabezados
    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Disponibilidad', key: 'disponibilidad', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Precio Diario', key: 'precioDiario', width: 15 },
      { header: 'Precio Garantía', key: 'precioGarantia', width: 15 },
    ];

    // Datos (de la lista filtrada para respetar filtros y búsquedas)
    this.listaFiltrada.forEach(h => {
      worksheet.addRow({
        codigo: h.codigo,
        nombre: h.nombre,
        descripcion: h.descripcion,
        disponibilidad: h.stock > 0 ? 'Disponible' : 'No disponible',
        stock: h.stock,
        precioDiario: h.precioDiario,
        precioGarantia: h.precioGarantia,
      });
    });

    // Generar buffer y guardar
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'Inventario.xlsx');
    });
  }


}
