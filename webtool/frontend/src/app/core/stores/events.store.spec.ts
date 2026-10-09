import { TestBed } from '@angular/core/testing';
import { Event } from '../../models/event';
import { EventsStore, withoutEmptyTimes } from './events.store';

const EVENT = {
  id: 1,
  title: 'Test',
  startDate: '2026-10-09',
  startTime: '08:00',
  endTime: '17:00',
} as Event;

describe('EventsStore', () => {
  it('stores a cleared start or end time as null, which the backend accepts', () => {
    const store = TestBed.inject(EventsStore);
    store.addEvent(EVENT);

    store.updateEvent(1, { startTime: '', endTime: '   ' });

    const [event] = store.eventsByIds([1]);
    expect(event.startTime).toBeNull();
    expect(event.endTime).toBeNull();
  });

  it('keeps real times and leaves fields alone that were not changed', () => {
    expect(withoutEmptyTimes({ startTime: '09:30' })).toEqual({ startTime: '09:30' });
    expect(withoutEmptyTimes({ title: '' })).toEqual({ title: '' });
    expect('endTime' in withoutEmptyTimes({ startTime: '' })).toBe(false);
  });
});
