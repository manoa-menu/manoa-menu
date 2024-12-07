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

export interface FilteredSodexoMenuItem {
  course: string | null;
  meal: string;
  formalName: string;
  description: string;
  price: number;
  allergens: { allergen: number; name: string }[];
  sizes: [];
  addons: [];
  isVegan: boolean;
  isVegetarian: boolean;
}

export interface FilteredSodexoGroup {
  name: string | null;
  items: FilteredSodexoMenuItem[];
}

export interface FilteredSodexoMeal {
  name: string;
  groups: FilteredSodexoGroup[];
}

export interface FilteredSodexoRootObject {
  meals: FilteredSodexoMeal[];
}

export interface SodexoMenuRow {
  name: string;
  groups: FilteredSodexoMeal[];
}

export interface SodexoMenuItem {
  course: string | null;
  courseSortOrder: number;
  meal: string;
  menuItemId: number;
  formalName: string;
  description: string;
  price: number;
  allergens: { allergen: number; name: string }[];
  sizes: [];
  addons: [];
  isVegan: boolean;
  isVegetarian: boolean;
  isMindful: boolean;
  isSwell: boolean;
  calories: string;
  caloriesFromFat: string;
  fat: string;
  saturatedFat: string;
  transFat: string;
  polyunsaturatedFat: string;
  cholesterol: string;
  sodium: string;
  carbohydrates: string;
  dietaryFiber: string;
  sugar: string;
  protein: string;
  potassium: string;
  iron: string;
  calcium: string;
  vitaminA: string;
  vitaminC: string;
}

export interface SodexoGroup {
  name: string | null;
  sortOrder: number;
  items: SodexoMenuItem[];
}

export interface SodexoMeal {
  name: string;
  groups: SodexoGroup[];
}

export interface SodexoRootObject {
  meals: SodexoMeal[];
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
