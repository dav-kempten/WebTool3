import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MembernumberComponent } from './membernumber.component';

describe('MembernumberComponent', () => {
  let component: MembernumberComponent;
  let fixture: ComponentFixture<MembernumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MembernumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MembernumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
