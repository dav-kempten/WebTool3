export interface GuideSummary {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface Guide {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  profile: string;
}

export interface Profile {
  city: string;
  name: string;
  qualification: string;
  job: string;
  reason: string;
  hobby: string;
  tip: string;
}
