import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Skill} from '../../model/value';
import {getSkillByCategoryAndLevel} from '../store/value.selectors';

@Pipe({
  name: 'skillselect',
})
export class SkillPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(skillId: any | Skill | null): number | Skill {
    let skill: Skill = null;

    of(skillId).pipe(
      filter(id => typeof id.categoryId === 'number' && typeof id.levelId === 'number'),
      switchMap(id => this.store.select(getSkillByCategoryAndLevel(id.categoryId, id.levelId))),
      take(1),
    ).subscribe(value => skill = value);

    return skill ? skill : skillId;
  }
}
