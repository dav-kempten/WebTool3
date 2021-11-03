import {Pipe, PipeTransform} from '@angular/core';
import {AppState} from '../../app.state';
import {select, Store} from '@ngrx/store';
import {Subject} from 'rxjs';
import {publishReplay, refCount, takeUntil} from 'rxjs/operators';
import {getEventsByIds} from './event.selectors';
import {Event} from '../../model/event';

@Pipe({
  name: 'event',
})
export class EventPipe implements PipeTransform {

  private destroySubject = new Subject<void>();

  constructor(private store: Store<AppState>) { }

  transform(eventIds: number[]): Event[] {
    let events = new Array<Event>(0);

    this.store.pipe(
      takeUntil(this.destroySubject),
      select(getEventsByIds(eventIds)),
      publishReplay(1),
      refCount()
    ).subscribe(values => events = values);

    this.destroySubject.next();
    this.destroySubject.complete();

    return events;
  }

}
