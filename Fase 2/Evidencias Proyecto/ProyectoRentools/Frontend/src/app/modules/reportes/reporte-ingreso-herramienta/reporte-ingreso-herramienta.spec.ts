import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteIngresoHerramienta } from './reporte-ingreso-herramienta';

describe('ReporteIngresoHerramienta', () => {
  let component: ReporteIngresoHerramienta;
  let fixture: ComponentFixture<ReporteIngresoHerramienta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteIngresoHerramienta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteIngresoHerramienta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
