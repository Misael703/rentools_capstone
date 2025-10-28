import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarInventario } from './editar-inventario';

describe('EditarInventario', () => {
  let component: EditarInventario;
  let fixture: ComponentFixture<EditarInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarInventario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarInventario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
