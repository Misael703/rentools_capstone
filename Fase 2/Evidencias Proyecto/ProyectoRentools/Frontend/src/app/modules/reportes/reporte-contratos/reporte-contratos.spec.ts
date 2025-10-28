import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteContratos } from './reporte-contratos';

describe('ReporteContratos', () => {
  let component: ReporteContratos;
  let fixture: ComponentFixture<ReporteContratos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteContratos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteContratos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
