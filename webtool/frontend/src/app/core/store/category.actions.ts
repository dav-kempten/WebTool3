import {Action} from '@ngrx/store';
import {Category} from '../../model/value';

export enum CategoryActionTypes {
  AddCategories = '[Category] Add Categories',
  ClearCategories = '[Category] Clear Categories'
}

export class AddCategories implements Action {
  readonly type = CategoryActionTypes.AddCategories;

  constructor(public payload: { categories: Category[] }) {}
}

export class ClearCategories implements Action {
  readonly type = CategoryActionTypes.ClearCategories;
}

export type CategoryActions = AddCategories | ClearCategories;
