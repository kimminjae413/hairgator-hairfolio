export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'error' | 'done';

export type Gender = 'Female' | 'Male';

export type FemaleMajorCategory = 'A length' | 'B length' | 'C length' | 'D length' | 'E length' | 'F length' | 'G length' | 'H length';
export type MaleMajorCategory = 'SIDE FRINGE' | 'SIDE PART' | 'FRINGE UP' | 'PUSHED BACK' | 'BUZZ' | 'CROP' | 'MOHICAN';

export type MinorCategory = 'None' | 'Forehead' | 'Eyebrow' | 'Eye' | 'Cheekbone';

export interface Hairstyle {
  name: string;
  url: string;
  isLocal?: boolean;
  gender?: Gender;
  majorCategory?: FemaleMajorCategory | MaleMajorCategory;
  minorCategory?: MinorCategory;
}

export interface DesignerStats {
  visits: number;
  styleViews: { [styleUrl: string]: number };
  bookings: { [styleUrl: string]: number };
}

export interface DesignerData {
  portfolio: Hairstyle[];
  reservationUrl?: string;
  stats?: DesignerStats;
}