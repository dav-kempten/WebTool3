import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproxdropdownComponent } from './approxdropdown.component';

describe('ApproxdropdownComponent', () => {
  let component: ApproxdropdownComponent;
  let fixture: ComponentFixture<ApproxdropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApproxdropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproxdropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
