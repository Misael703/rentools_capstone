import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteRankingHerramientas } from './reporte-ranking-herramientas';

describe('ReporteRankingHerramientas', () => {
  let component: ReporteRankingHerramientas;
  let fixture: ComponentFixture<ReporteRankingHerramientas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteRankingHerramientas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteRankingHerramientas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
