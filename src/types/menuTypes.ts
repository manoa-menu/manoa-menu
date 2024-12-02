export interface PDFData {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  version: string;
  text: string;
}

export interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

export interface MenuResponse {
  weekOne: DayMenu[];
  weekTwo: DayMenu[];
}

export enum Location {
  CAMPUS_CENTER = 'CAMPUS_CENTER',
  GATEWAY = 'GATEWAY',
  HALE_ALOHA = 'HALE_ALOHA',
}

export enum Option {
  CC = 'CAMPUS_CENTER',
  GW = 'GATEWAY',
  HA = 'HALE_ALOHA',
}
