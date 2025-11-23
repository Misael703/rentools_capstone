import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionBsale } from './configuracion-bsale';

describe('ConfiguracionBsale', () => {
  let component: ConfiguracionBsale;
  let fixture: ComponentFixture<ConfiguracionBsale>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionBsale]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionBsale);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
