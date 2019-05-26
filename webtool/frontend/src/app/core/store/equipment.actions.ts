import {Action} from '@ngrx/store';
import {Equipment} from '../../model/value';

export enum EquipmentActionTypes {
  AddEquipments = '[Equipment] Add Equipments',
  ClearEquipments = '[Equipment] Clear Equipments'
}

export class AddEquipments implements Action {
  readonly type = EquipmentActionTypes.AddEquipments;

  constructor(public payload: { equipments: Equipment[] }) {}
}

export class ClearEquipments implements Action {
  readonly type = EquipmentActionTypes.ClearEquipments;
}

export type EquipmentActions = AddEquipments | ClearEquipments;
