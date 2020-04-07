import {Profile} from '../../model/guide';

export interface Guide {
  id: number;
  username: string;
  qualifications: string;
  retrainings: string;
  phone: string;
  mobile: string;
  email: string;
  profileCity: string;
  profileHobby: string;
  profileJob: string;
  profileName: string;
  profileQualification: string;
  profileReason: string;
  profileTip: string;
  userProfile: Profile;
}
