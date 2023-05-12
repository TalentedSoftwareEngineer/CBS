import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdrLogComponent } from './cdr-log.component';

describe('CdrLogComponent', () => {
  let component: CdrLogComponent;
  let fixture: ComponentFixture<CdrLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CdrLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdrLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
