import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface Herramienta {
  codigo: string;
  nombre: string;
  descripcion?: string;
  stock: number;
  precioDiario: number;
  precioGarantia: number;
}

@Injectable({
  providedIn: 'root'
})
export class Inventory {
  //Datos Iniciales Simulados
  private initial: Herramienta[] = [
    { codigo: 'H001', nombre: 'Taladro', descripcion: 'Taladro percutro 800w', stock: 10, precioDiario: 5000, precioGarantia: 2000 },
    { codigo: 'H002', nombre: 'Sierra Circular', descripcion: 'Sierra 7 pulgadas', stock: 5, precioDiario: 7000, precioGarantia: 25000 }
  ];

  private data$ = new BehaviorSubject<Herramienta[]>(this.initial); 

  //Obtener todas las herramientas
  getAll(): Observable<Herramienta[]>{
    return this.data$.asObservable();
  }

  //Obtener herramienta por código
  getByCodigo(codigo:string):Observable<Herramienta | undefined> {
    const item = this.data$.getValue().find( h => h.codigo === codigo );
    return of(item); 
  } 

  //Actualizar herramienta
  update(herramientaActualizada:Herramienta): Observable<boolean>{
    const arr = this.data$.getValue().map(h=>h.codigo === herramientaActualizada.codigo ? herramientaActualizada: h);
    this.data$.next(arr);
    return of(true); 
  }

  //Crear nueva Herramienta
  create(nueva: Herramienta): Observable<boolean>{
    const arr = this.data$.getValue(); 

    //Verificamos que no ecitse el código
    if (arr.find(h => h.codigo === nueva.codigo)){
      return of(false); //Ya existe, no se puede crear
    }

    arr.push(nueva); //Agregamos la nueva herramienta
    this.data$.next(arr); 
    return of(true); 
  }

}
