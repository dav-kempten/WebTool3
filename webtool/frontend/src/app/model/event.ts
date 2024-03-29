export interface Event {
  id: number;
  title: string;
  name: string;
  description: string;
  startDate: string; // date
  startTime: string | null; // time
  approximateId: number | null;
  endDate: string | null; // date
  endTime: string | null; // time
  rendezvous: string;
  location: string;
  reservationService: boolean;
  lea: boolean;
  source: string;
  link: string;
  map: string;
  distal: boolean;
  distance: number;
  publicTransport: boolean;
  shuttleService: boolean;
  deprecated?: boolean;
}

export interface EventTypeTour {
  tour: boolean;
  deadline: boolean;
  preliminary: boolean;
}
