import {UserQualification} from './qualification';
import {Retraining} from './retraining';

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
  id: number;
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
  username: string;
  qualifications: UserQualification[];
  retrainings: Retraining[];
  phone: string;
  mobile: string;
  email: string;
  profile: string;
  userProfile: Profile;
}
