import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryselectComponent } from './categoryselect.component';

describe('CategoryselectComponent', () => {
  let component: CategoryselectComponent;
  let fixture: ComponentFixture<CategoryselectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryselectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
