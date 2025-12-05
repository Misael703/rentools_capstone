import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPago } from './crear-pago';

describe('CrearPago', () => {
  let component: CrearPago;
  let fixture: ComponentFixture<CrearPago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPago]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearPago);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
