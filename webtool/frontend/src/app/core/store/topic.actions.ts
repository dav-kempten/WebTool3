import {Action} from '@ngrx/store';
import {Topic} from '../../model/value';

export enum TopicActionTypes {
  AddTopics = '[Topic] Add Topics',
  ClearTopics = '[Topic] Clear Topics'
}

export class AddTopics implements Action {
  readonly type = TopicActionTypes.AddTopics;

  constructor(public payload: { topics: Topic[] }) {}
}

export class ClearTopics implements Action {
  readonly type = TopicActionTypes.ClearTopics;
}

export type TopicActions = AddTopics | ClearTopics;
