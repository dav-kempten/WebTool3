import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {getGuideById} from './guide.selectors';
import {Guide} from '../../model/guide';
import {AppState} from '../../app.state';
import {of} from 'rxjs';
import {from} from 'rxjs/internal/observable/from';

@Pipe({
  name: 'guide',
})
export class GuidePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(guideId: number): string {

    let guideGuide = '';

    of(guideId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getGuideById(id))),
      take(1),
      filter((guide: Guide): boolean => !!guide && !!Object.keys(guide).length),
      map((guide: Guide) => `${guide.firstName} ${guide.lastName}`)
    ).subscribe(value => {
        guideGuide = value;
    });

    return guideGuide;
  }
}

@Pipe({
  name: 'guides',
})
export class GuidesPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(guideIds: number[]): string[] {

    const guideGuides = [];

    from(guideIds).pipe(
      filter(id => typeof id === 'number'),
      switchMap(guideId => this.store.select(getGuideById(guideId))),
      take(guideIds.length),
      filter((guide: Guide): boolean => !!guide && !!Object.keys(guide).length),
      map((guide: Guide): string => `${guide.firstName} ${guide.lastName}`)
    ).subscribe((value: string): void => {
        guideGuides.push(value);
    });

    return guideGuides;
  }
}
