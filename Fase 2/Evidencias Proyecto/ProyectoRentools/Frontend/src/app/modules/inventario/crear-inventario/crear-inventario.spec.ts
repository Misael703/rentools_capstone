import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearInventario } from './crear-inventario';

describe('CrearInventario', () => {
  let component: CrearInventario;
  let fixture: ComponentFixture<CrearInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearInventario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearInventario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
