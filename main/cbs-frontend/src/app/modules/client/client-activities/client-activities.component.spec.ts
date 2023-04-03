import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientActivitiesComponent } from './client-activities.component';

describe('ClientActivitiesComponent', () => {
  let component: ClientActivitiesComponent;
  let fixture: ComponentFixture<ClientActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientActivitiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
