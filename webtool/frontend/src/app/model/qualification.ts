export interface Qualification {
  id: string;
  code: string;
  name: string;
  group: number;
}

export interface UserQualification {
  id: number;
  qualification: string;
  aspirant: false;
  year: number;
  note: string;
}
