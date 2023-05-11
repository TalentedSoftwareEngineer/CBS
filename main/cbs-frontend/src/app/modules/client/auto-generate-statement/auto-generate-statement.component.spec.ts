import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoGenerateStatementComponent } from './auto-generate-statement.component';

describe('AutoGenerateStatementComponent', () => {
  let component: AutoGenerateStatementComponent;
  let fixture: ComponentFixture<AutoGenerateStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoGenerateStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoGenerateStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
