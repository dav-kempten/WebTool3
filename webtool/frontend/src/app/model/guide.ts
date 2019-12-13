export interface Guide {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  emailUser: string;
  profile: string;
  qualifications: string;
  retrainings: string;
  groups: number[];
  userPermissions: number[];
  isStaff: boolean;
  isActive: boolean;
  phone: string;
  mobile: string;
  portrait: string;
  dateJoined: string;
  memberId: string;
  sex: number;
  birthDate: string;
  note: string;
  memberYear: number;
  integralMember: boolean;
  memberHome: string | null;
}
