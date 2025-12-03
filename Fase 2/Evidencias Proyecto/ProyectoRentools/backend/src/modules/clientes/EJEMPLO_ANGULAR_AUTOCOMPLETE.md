# Autocompletado de Clientes - Angular

Ejemplo de implementación del autocompletado de clientes en Angular.

## 📦 Paso 1: Crear el Servicio

```typescript
// services/cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ClienteAutocomplete {
  id_cliente: number;
  tipo_cliente: 'persona_natural' | 'empresa';
  label: string;
  nombre: string;
  apellido: string | null;
  razon_social: string | null;
  rut: string;
  email: string | null;
  telefono: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  /**
   * Busca clientes para autocompletado
   * @param query - Término de búsqueda (mínimo 3 caracteres)
   * @param limit - Cantidad máxima de resultados (default: 10)
   */
  autocomplete(query: string, limit: number = 10): Observable<ClienteAutocomplete[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());

    return this.http.get<ClienteAutocomplete[]>(`${this.apiUrl}/search`, { params });
  }
}
```

---

## 🎨 Paso 2: Crear el Componente

```typescript
// components/cliente-autocomplete/cliente-autocomplete.component.ts
import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, filter } from 'rxjs/operators';
import { ClienteService, ClienteAutocomplete } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-cliente-autocomplete',
  templateUrl: './cliente-autocomplete.component.html',
  styleUrls: ['./cliente-autocomplete.component.css']
})
export class ClienteAutocompleteComponent implements OnDestroy {
  @Input() placeholder = 'Buscar cliente por nombre, RUT o razón social...';
  @Output() clienteSelected = new EventEmitter<ClienteAutocomplete>();

  searchControl = new FormControl('');
  clientes: ClienteAutocomplete[] = [];
  loading = false;
  showDropdown = false;
  selectedIndex = -1;

  private destroy$ = new Subject<void>();

  constructor(private clienteService: ClienteService) {
    this.initAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initAutocomplete(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(query => query && query.length >= 3),
        switchMap(query => {
          this.loading = true;
          return this.clienteService.autocomplete(query);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
          this.showDropdown = true;
          this.loading = false;
          this.selectedIndex = -1;
        },
        error: (error) => {
          console.error('Error en autocomplete:', error);
          this.loading = false;
          this.clientes = [];
        }
      });

    // Ocultar dropdown si el query es muy corto
    this.searchControl.valueChanges
      .pipe(
        filter(query => !query || query.length < 3),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.showDropdown = false;
        this.clientes = [];
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showDropdown || this.clientes.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.clientes.length - 1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.clientes.length) {
          this.selectCliente(this.clientes[this.selectedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showDropdown = false;
        break;
    }
  }

  selectCliente(cliente: ClienteAutocomplete): void {
    this.searchControl.setValue(cliente.label, { emitEvent: false });
    this.showDropdown = false;
    this.clienteSelected.emit(cliente);
  }

  onClickOutside(): void {
    this.showDropdown = false;
  }
}
```

---

## 🎨 Template HTML

```html
<!-- cliente-autocomplete.component.html -->
<div class="autocomplete-container" (clickOutside)="onClickOutside()">
  <!-- Input de búsqueda -->
  <div class="input-wrapper">
    <input
      type="text"
      [formControl]="searchControl"
      [placeholder]="placeholder"
      (keydown)="onKeyDown($event)"
      class="autocomplete-input"
      autocomplete="off"
    />

    <!-- Indicador de carga -->
    <div *ngIf="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>
  </div>

  <!-- Dropdown de resultados -->
  <div *ngIf="showDropdown" class="autocomplete-dropdown">
    <!-- Mensaje de búsqueda mínima -->
    <div *ngIf="searchControl.value && searchControl.value.length < 3" class="dropdown-message">
      Escribe al menos 3 caracteres para buscar...
    </div>

    <!-- Sin resultados -->
    <div *ngIf="!loading && searchControl.value && searchControl.value.length >= 3 && clientes.length === 0"
         class="dropdown-message">
      No se encontraron clientes
    </div>

    <!-- Lista de resultados -->
    <button
      *ngFor="let cliente of clientes; let i = index"
      type="button"
      class="dropdown-item"
      [class.selected]="i === selectedIndex"
      (click)="selectCliente(cliente)"
    >
      <div class="cliente-info">
        <div class="cliente-label">{{ cliente.label }}</div>
        <div *ngIf="cliente.email" class="cliente-email">{{ cliente.email }}</div>
      </div>
      <span class="cliente-badge" [class.persona]="cliente.tipo_cliente === 'persona_natural'"
                                   [class.empresa]="cliente.tipo_cliente === 'empresa'">
        {{ cliente.tipo_cliente === 'persona_natural' ? 'Persona' : 'Empresa' }}
      </span>
    </button>
  </div>
</div>
```

---

## 🎨 Estilos CSS

```css
/* cliente-autocomplete.component.css */
.autocomplete-container {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.loading-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.autocomplete-dropdown {
  position: absolute;
  z-index: 50;
  width: 100%;
  margin-top: 4px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-message {
  padding: 12px 16px;
  font-size: 14px;
  color: #6b7280;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  border: none;
  background: white;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover,
.dropdown-item.selected {
  background-color: #eff6ff;
}

.cliente-info {
  flex: 1;
}

.cliente-label {
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.cliente-email {
  font-size: 12px;
  color: #6b7280;
}

.cliente-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 12px;
}

.cliente-badge.persona {
  background-color: #d1fae5;
  color: #065f46;
}

.cliente-badge.empresa {
  background-color: #dbeafe;
  color: #1e40af;
}
```

---

## 📦 Paso 3: Registrar el Módulo

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { ClienteAutocompleteComponent } from './components/cliente-autocomplete/cliente-autocomplete.component';
import { ClienteService } from './services/cliente.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Directiva clickOutside (opcional, ver abajo)
import { ClickOutsideDirective } from './directives/click-outside.directive';

@NgModule({
  declarations: [
    ClienteAutocompleteComponent,
    ClickOutsideDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    ClienteService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  exports: [ClienteAutocompleteComponent]
})
export class AppModule { }
```

---

## 🚀 Paso 4: Usar el Componente

```typescript
// pages/crear-contrato/crear-contrato.component.ts
import { Component } from '@angular/core';
import { ClienteAutocomplete } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-crear-contrato',
  templateUrl: './crear-contrato.component.html'
})
export class CrearContratoComponent {
  clienteSeleccionado: ClienteAutocomplete | null = null;

  onClienteSelected(cliente: ClienteAutocomplete): void {
    console.log('Cliente seleccionado:', cliente);
    this.clienteSeleccionado = cliente;
  }
}
```

```html
<!-- crear-contrato.component.html -->
<div class="container">
  <h1>Crear Nuevo Contrato</h1>

  <div class="card">
    <div class="form-group">
      <label>Buscar Cliente *</label>
      <app-cliente-autocomplete
        (clienteSelected)="onClienteSelected($event)"
        placeholder="Buscar por nombre, RUT o razón social..."
      ></app-cliente-autocomplete>
    </div>

    <!-- Información del cliente seleccionado -->
    <div *ngIf="clienteSeleccionado" class="selected-cliente">
      <h3>Cliente Seleccionado</h3>
      <div class="info-grid">
        <div><strong>Nombre:</strong> {{ clienteSeleccionado.label }}</div>
        <div><strong>RUT:</strong> {{ clienteSeleccionado.rut }}</div>
        <div *ngIf="clienteSeleccionado.email">
          <strong>Email:</strong> {{ clienteSeleccionado.email }}
        </div>
        <div *ngIf="clienteSeleccionado.telefono">
          <strong>Teléfono:</strong> {{ clienteSeleccionado.telefono }}
        </div>
      </div>
    </div>

    <!-- Resto del formulario -->
  </div>
</div>
```

---

## 🔧 Directiva Click Outside (Opcional)

```typescript
// directives/click-outside.directive.ts
import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(target: HTMLElement): void {
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
```

---

## 🔐 Interceptor para JWT

```typescript
// interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('jwt_token');

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
```

---

## 🌍 Configurar Environment

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.rentools.cl/api'
};
```

---

## ✅ Resultado

El componente:
- ✅ Se activa después de 3 caracteres
- ✅ Tiene debounce de 300ms
- ✅ Muestra loading spinner
- ✅ Maneja navegación con teclado
- ✅ Cierra al hacer click fuera
- ✅ Busca en múltiples campos
- ✅ Muestra resultados formateados
