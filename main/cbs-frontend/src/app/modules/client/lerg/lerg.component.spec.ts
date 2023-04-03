import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LergComponent } from './lerg.component';

describe('LergComponent', () => {
  let component: LergComponent;
  let fixture: ComponentFixture<LergComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LergComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LergComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
