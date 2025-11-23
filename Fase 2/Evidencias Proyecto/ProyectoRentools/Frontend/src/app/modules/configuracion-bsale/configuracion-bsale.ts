import { Component, OnInit } from '@angular/core';
import { BsaleProductsService } from './Services/configuracionServices';
import { BsaleProductCached, BsaleProductConfig } from './interfaces/configuracionInterface';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-configuracion-bsale',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-bsale.html',
  styleUrl: './configuracion-bsale.css',
})
export class ConfiguracionBsale implements OnInit {
  cachedProducts: BsaleProductCached[] = [];
  configuredProducts: BsaleProductConfig[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  // Para modales
  selectedProductToAdd: BsaleProductCached | null = null;
  selectedConfigToRemove: BsaleProductConfig | null = null;
  showAddModal: boolean = false;
  showDeleteModal: boolean = false;

  filteredProducts: BsaleProductCached[] = [];

  constructor(private bsaleService: BsaleProductsService) { }

  ngOnInit() {
    this.loadCachedProducts();
    this.loadConfiguredProducts();
  }

  loadCachedProducts(page: number = 1) {
    this.loading = true;
    this.bsaleService.getAllCachedProducts(this.pageSize, (page - 1) * this.pageSize).subscribe({
      next: (res) => {
        this.cachedProducts = res.items;

        // Aquí en lugar de usar items.length, usar total real o un valor fijo
        this.totalItems = res.total || 30000; // si res.total no existe, poner 30000

        this.markConfiguredProducts();
        this.loading = false;
        this.currentPage = page;
      },
      error: () => (this.loading = false),
    });
  }
  loadConfiguredProducts() {
    this.bsaleService.getConfiguredProducts().subscribe({
      next: (res) => {
        this.configuredProducts = res;
        this.markConfiguredProducts();
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  searchProducts(page: number = 1) {
    if (!this.searchQuery) {
      this.resetSearch();
      return;
    }

    this.loading = true;
    this.bsaleService.searchCachedProducts(this.searchQuery, 1000, 0) // traer todos los que coincidan
      .subscribe({
        next: (res: BsaleProductCached[]) => {
          this.filteredProducts = res; // guardamos todo
          this.totalItems = res.length; // total para paginar

          // extraer solo la página actual
          const start = (page - 1) * this.pageSize;
          const end = start + this.pageSize;
          this.cachedProducts = this.filteredProducts.slice(start, end);

          this.markConfiguredProducts();
          this.loading = false;
          this.currentPage = page;
        },
        error: () => this.loading = false,
      });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    if (this.searchQuery) {
      const start = (page - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.cachedProducts = this.filteredProducts.slice(start, end);
    } else {
      this.loadCachedProducts(page);
    }
  }

  resetSearch() {
    this.searchQuery = '';
    this.filteredProducts = [];
    this.loadCachedProducts();
  }

  // Modales y agregar/eliminar siguen igual
  confirmAdd(product: BsaleProductCached) {
    this.selectedProductToAdd = product;
    this.showAddModal = true;
  }

  addToConfig() {
    if (!this.selectedProductToAdd) return;
    this.bsaleService.addProductToConfig(this.selectedProductToAdd.product_id_bsale).subscribe({
      next: () => {
        this.selectedProductToAdd!.en_configuracion = true;
        this.loadConfiguredProducts();
        this.showAddModal = false;
      },
    });
  }

  confirmDelete(config: BsaleProductConfig) {
    this.selectedConfigToRemove = config;
    this.showDeleteModal = true;
  }

  removeFromConfig() {
    if (!this.selectedConfigToRemove) return;
    this.bsaleService.removeProductFromConfig(this.selectedConfigToRemove.id).subscribe({
      next: () => {
        this.configuredProducts = this.configuredProducts.filter(
          (p) => p.id !== this.selectedConfigToRemove!.id
        );
        this.markConfiguredProducts();
        this.showDeleteModal = false;
      },
    });
  }

  markConfiguredProducts() {
    if (!this.cachedProducts || !this.configuredProducts) return;

    const configIds = this.configuredProducts.map(p => p.product_id_bsale);
    this.cachedProducts.forEach(p => {
      p.en_configuracion = configIds.includes(p.product_id_bsale);
    });
  }

  // Cancelar modal
  cancelModal() {
    this.showAddModal = false;
    this.showDeleteModal = false;
    this.selectedProductToAdd = null;
    this.selectedConfigToRemove = null;
  }

}
