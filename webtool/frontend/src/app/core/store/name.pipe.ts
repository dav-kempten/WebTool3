import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {getNameById} from './name.selectors';
import {Name} from '../../model/name';
import {AppState} from '../../app.state';
import {of} from 'rxjs';
import {from} from 'rxjs/internal/observable/from';

@Pipe({
  name: 'name',
})
export class NamePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(nameId: number): string {

    let guideName = '';

    of(nameId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getNameById(id))),
      take(1),
      filter((name: Name): boolean => !!name && !!Object.keys(name).length),
      map((name: Name) => `${name.firstName} ${name.lastName}`)
    ).subscribe(value => {
        guideName = value;
    });

    return guideName;
  }
}

@Pipe({
  name: 'names',
})
export class NamesPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(nameIds: number[]): string[] {

    const guideNames = [];

    from(nameIds).pipe(
      filter(id => typeof id === 'number'),
      switchMap(nameId => this.store.select(getNameById(nameId))),
      take(nameIds.length),
      filter((name: Name): boolean => !!name && !!Object.keys(name).length),
      map((name: Name): string => `${name.firstName} ${name.lastName}`)
    ).subscribe((value: string): void => {
        guideNames.push(value);
    });

    return guideNames;
  }
}
