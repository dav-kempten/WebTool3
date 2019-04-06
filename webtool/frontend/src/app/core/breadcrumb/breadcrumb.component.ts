import {Observable} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {Component, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState, Breadcrumb, Breadcrumbs, selectRouterBreadcrumbs} from '../../app.state';

@Component({
  selector: 'avk-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {

  @Output() breadcrumb$: Observable<Breadcrumbs>;
  constructor(private store: Store<AppState>, private router: Router) {
    this.breadcrumb$ = this.store.select(selectRouterBreadcrumbs);
  }

  ngOnInit() {
  }

}
