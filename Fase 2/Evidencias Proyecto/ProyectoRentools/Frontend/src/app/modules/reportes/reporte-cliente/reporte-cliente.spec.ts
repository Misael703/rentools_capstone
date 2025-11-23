import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCliente } from './reporte-cliente';

describe('ReporteCliente', () => {
  let component: ReporteCliente;
  let fixture: ComponentFixture<ReporteCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
