export interface GuideSummary {
  id: number;
  firstName: string;
  lastName: string;
  emailUser: string;
  memberId: string;
  birthDate: string;
  url: string;
}

export interface Profile {
  memberId: string;
  sex: number;
  birthDate: string;
  note: string;
  memberYear: number;
  integralMember: boolean;
  memberHome: string | null;
  portrait: string;
}

export interface User {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: Profile;
  groups: any[];
  permissions: any[];
  isStaff: boolean;
  isActive: boolean;
  dateJoined: string;
}

export interface Guide {
  id: number;
  qualifications: string;
  retrainings: string;
  phone: string;
  mobile: string;
  user: User;
  profile: string;
}
