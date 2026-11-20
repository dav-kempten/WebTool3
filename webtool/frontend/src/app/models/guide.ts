export interface GuideSummary {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  job: string;
  hasProfile: boolean;
}

export interface GuideProfile {
  name: string;
  city: string;
  job: string;
  hobby: string;
  reason: string;
  tip: string;
}

export const EMPTY_GUIDE_PROFILE: GuideProfile = {
  name: '',
  city: '',
  job: '',
  hobby: '',
  reason: '',
  tip: '',
};

export interface Guide {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  profile: GuideProfile;
}
