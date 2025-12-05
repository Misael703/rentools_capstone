import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearDevolucion } from './crear-devolucion';

describe('CrearDevolucion', () => {
  let component: CrearDevolucion;
  let fixture: ComponentFixture<CrearDevolucion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearDevolucion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearDevolucion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
