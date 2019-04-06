import {Directive, OnInit} from '@angular/core';
import {DateComponent} from './date.component';

@Directive({
  selector: 'avk-date[required]' // tslint:disable-line
})
export class RequiredDirective implements OnInit {

  constructor(private date: DateComponent) {}

  ngOnInit(): void {
    this.date.required = true;
  }
}
