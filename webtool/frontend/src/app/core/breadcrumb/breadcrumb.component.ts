import {Observable} from 'rxjs';
import {Component, OnInit, Output} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState, Breadcrumbs, selectRouterBreadcrumbs} from '../../app.state';
import {filter, first, map, tap} from 'rxjs/operators';
import {getInstructionById} from '../store/instruction.selectors';
import {RequestInstruction} from '../store/instruction.actions';
import {getCategoryById} from '../store/value.selectors';
import {ValuesRequested} from '../store/value.actions';

@Component({
  selector: 'avk-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {

  @Output() breadcrumb$: Observable<Breadcrumbs>;

  constructor(private store: Store<AppState>, private router: Router) {

    this.breadcrumb$ = this.store.pipe(
      select(selectRouterBreadcrumbs),
      filter(breadcrumbs => !!breadcrumbs && breadcrumbs.length > 0),
      map(breadcrumbs => {
        const fragment = breadcrumbs[breadcrumbs.length - 1].fragment;
        const discriminator = breadcrumbs[breadcrumbs.length - 1].label;
        if (!fragment && discriminator.startsWith('#')) {
          const part = breadcrumbs[breadcrumbs.length - 2].label;
          const id = parseInt(discriminator.slice(1), 10);
          if (part === 'Kurse') {
            this.store.pipe(
              select(getInstructionById(id)),
              tap(instruction => {
                if (!instruction) {
                  this.store.dispatch(new RequestInstruction({id}));
                }
              }),
              filter(instruction => !!instruction),
              first()
            ).subscribe(
              instruction => {
                this.store.pipe(
                  select(getCategoryById(instruction.topicId)),
                  tap(category => {
                    if (!category) {
                      this.store.dispatch(new ValuesRequested());
                    }
                  }),
                  filter(category => !!category),
                  first()
                ).subscribe(category => {
                  if (category.summer) {
                    breadcrumbs[breadcrumbs.length - 1].label = 'Sommer Kurse';
                    breadcrumbs[breadcrumbs.length - 1].fragment = 'summer';
                  }
                  if (category.winter) {
                    breadcrumbs[breadcrumbs.length - 1].label = 'Winter Kurse';
                    breadcrumbs[breadcrumbs.length - 1].fragment = 'winter';
                  }
                  if (category.indoor) {
                    breadcrumbs[breadcrumbs.length - 1].label = 'Kletterschule';
                    breadcrumbs[breadcrumbs.length - 1].fragment = 'indoor';
                  }
                  breadcrumbs[breadcrumbs.length - 1].url = '/instructions';
                  breadcrumbs.push({
                    url: `/instructions/${instruction.id}`,
                    label: instruction.reference
                  });
                });
              }
            );
          }
        }
        if (fragment) {
          const part = breadcrumbs[breadcrumbs.length - 1].label;
          if (part === 'Kurse') {
            breadcrumbs[breadcrumbs.length - 1].label = 'Kurse';
            breadcrumbs[breadcrumbs.length - 1].url = '/instructions';
            delete breadcrumbs[breadcrumbs.length - 1].fragment;
            switch (fragment) {
              case 'summer':
                breadcrumbs.push({
                  label: 'Sommer Kurse',
                  url: '/instructions',
                  fragment: 'summer'
                });
                break;
              case 'winter':
                breadcrumbs.push({
                  label: 'Winter Kurse',
                  url: '/instructions',
                  fragment: 'winter'
                });
                break;
              case 'indoor':
                breadcrumbs.push({
                  label: 'Kletterschule',
                  url: '/instructions',
                  fragment: 'indoor'
                });
                break;
            }
          }
        }
        return breadcrumbs;
      }),
    );
  }

  ngOnInit() {
  }

}
