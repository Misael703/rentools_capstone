import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearContrato } from './crear-contrato';

describe('CrearContrato', () => {
  let component: CrearContrato;
  let fixture: ComponentFixture<CrearContrato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearContrato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearContrato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
