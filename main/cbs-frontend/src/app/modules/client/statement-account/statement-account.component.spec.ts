import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementAccountComponent } from './statement-account.component';

describe('StatementAccountComponent', () => {
  let component: StatementAccountComponent;
  let fixture: ComponentFixture<StatementAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatementAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatementAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
