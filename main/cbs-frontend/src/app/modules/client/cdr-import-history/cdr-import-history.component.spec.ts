import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdrImportHistoryComponent } from './cdr-import-history.component';

describe('CdrImportHistoryComponent', () => {
  let component: CdrImportHistoryComponent;
  let fixture: ComponentFixture<CdrImportHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CdrImportHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdrImportHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
