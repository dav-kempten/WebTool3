import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'date',
})
export class DatePipe implements PipeTransform {

  constructor() {}

  transform(isoDate: string): string {
    return isoDate.split('-').reverse().join('.');
  }
}
