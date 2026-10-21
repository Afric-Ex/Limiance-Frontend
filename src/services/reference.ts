import { api } from "../lib/axios";

export interface Country {
  code: string;
  name: string;
  flagUrl?: string;
}

export interface ReferenceDataService {
  getCountries: () => Promise<{ data: Country[] }>;
}

export const referenceKeys = {
  countries: ["reference", "countries"],
} as const;

export const referenceService: ReferenceDataService = {
  getCountries: async () => {
    const response = await api.get("reference/countries");
    return response.data;
  },
};