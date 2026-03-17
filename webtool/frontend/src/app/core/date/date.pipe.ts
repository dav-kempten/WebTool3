import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'date',
})
export class DatePipe implements PipeTransform {

  constructor() {}

  transform(isoDate: string | null): string {
    if (!isoDate) {
      return '';
    }

    return isoDate.split('-').reverse().join('.');
  }
}
