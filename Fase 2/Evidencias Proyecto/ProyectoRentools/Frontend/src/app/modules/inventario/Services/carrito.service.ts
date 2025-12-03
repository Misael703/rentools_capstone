import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CarritoService {

    private herramientasCarrito: any[] = [];

    constructor() { }

    agregarHerramienta(herramienta: any, cantidad: number, dias_arriendo: number) {

        const existe = this.herramientasCarrito.find(h => h.id_herramienta === herramienta.id_herramienta);

        if (!existe) {

            const precio_unitario =
                herramienta.precio_diario ??
                herramienta.precio_arriendo ??
                herramienta.precio ??
                0;

            this.herramientasCarrito.push({
                id_herramienta: herramienta.id_herramienta,
                nombre: herramienta.nombre,
                sku: herramienta.sku,

                cantidad,
                dias_arriendo,
                precio_unitario,

                subtotal: Math.round(cantidad * dias_arriendo * precio_unitario),

                // esto sirve para cálculo de totales en la pantalla
                garantia: herramienta.garantia ?? herramienta.deposito ?? 0,

                // por si la vista del contrato necesita mostrar la herramienta completa
                herramienta
            });
        }
    }

    obtenerHerramientas() {
        return this.herramientasCarrito;
    }

    obtenerItems() {
        return this.herramientasCarrito;
    }

    eliminarHerramienta(id_herramienta: number) {
        this.herramientasCarrito = this.herramientasCarrito.filter(h => h.id_herramienta !== id_herramienta);
    }

    limpiarCarrito() {
        this.herramientasCarrito = [];
    }
}