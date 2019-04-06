import {Directive, OnInit} from '@angular/core';
import {GuideComponent} from './guide.component';

@Directive({
  selector: 'avk-guide[required]' // tslint:disable-line
})
export class RequiredDirective implements OnInit {

  constructor(private guide: GuideComponent) {}

  ngOnInit(): void {
    this.guide.required = true;
  }
}
