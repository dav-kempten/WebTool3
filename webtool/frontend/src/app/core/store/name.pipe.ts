import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter, map, skipWhile, tap, delay, switchMap} from 'rxjs/operators';
import {getNameById} from './name.selectors';
import {Name as APIName} from '../../model/name';
import {AppState} from '../../app.state';
import {of} from 'rxjs';
import {pipe} from 'rxjs/internal/util/pipe';
import {from} from "rxjs/internal/observable/from";

@Pipe({
  name: 'name',
})
export class NamePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(nameId: number): string {

    let name = '';

    of(nameId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getNameById, {nameId: id})),
      filter((apiName: APIName): boolean => !!apiName && !!Object.keys(apiName).length),
      map((apiName: APIName) => `${apiName.firstName} ${apiName.lastName}`)
    ).subscribe(value => {
        name = value;
    }).unsubscribe();

    return name;
  }
}

@Pipe({
  name: 'names',
})
export class NamesPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(nameIds: number[]): string[] {

    const names = [];

    from(nameIds).pipe(
      filter(id => typeof id === 'number'),
      switchMap(nameId => this.store.select(getNameById, {nameId})),
      filter((apiName: APIName): boolean => !!apiName && !!Object.keys(apiName).length),
      map((apiName: APIName): string => `${apiName.firstName} ${apiName.lastName}`)
    ).subscribe((value: string): void => {
        names.push(value);
    }).unsubscribe();

    return names;
  }
}
