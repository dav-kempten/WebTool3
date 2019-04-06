// data format for AutoComplete controls
// see: src/app/model/name.ts for data format inside the store

export interface Name {
  name: string;
  id: number;
}

export type NameList = Name[];
