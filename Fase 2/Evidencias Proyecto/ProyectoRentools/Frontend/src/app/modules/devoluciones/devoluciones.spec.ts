import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Devoluciones } from './devoluciones';

describe('Devoluciones', () => {
  let component: Devoluciones;
  let fixture: ComponentFixture<Devoluciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Devoluciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Devoluciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
