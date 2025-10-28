import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteDevoluciones } from './reporte-devoluciones';

describe('ReporteDevoluciones', () => {
  let component: ReporteDevoluciones;
  let fixture: ComponentFixture<ReporteDevoluciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteDevoluciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteDevoluciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
