import srpLogo from "@/assets/SRPLogo.png.asset.json";
import sspLogo from "@/assets/SSPLogo.png.asset.json";
import stpLogo from "@/assets/STPLogo.png.asset.json";

export type CompanySlug = "shiva-sai-polymers" | "sr-polymers" | "suryateja-poly-films";

export interface BankDetails {
  bank: string;
  account: string;
  ifsc: string;
  branch: string;
  city?: string;
}

export interface CompanyProfile {
  slug: CompanySlug;
  name: string;
  logoUrl?: string;
  gstin: string;
  pan?: string;
  udyam?: string;
  cell: string[];
  // "twoLine" = Factory + Office (Shiva Sai, S R). "single" = one address (Suryateja)
  addressLayout: "twoLine" | "single";
  factory?: string;
  office?: string;
  address?: string;
  bank: BankDetails;
}

export const COMPANY_LOGOS: Record<CompanySlug, string> = {
  "sr-polymers": srpLogo.url,
  "shiva-sai-polymers": sspLogo.url,
  "suryateja-poly-films": stpLogo.url,
};

export const COMPANY_PROFILES: Record<CompanySlug, CompanyProfile> = {
  "shiva-sai-polymers": {
    slug: "shiva-sai-polymers",
    name: "SHIVA SAI POLYMERS",
    logoUrl: sspLogo.url,
    gstin: "37ABZPP5102A1ZN",
    pan: "ABZPP5102A",
    udyam: "UDYAM-AP-10-0055233",
    cell: ["98498 55566", "98663 68228"],
    addressLayout: "twoLine",
    factory: "PARADESI PALEM, S.NO:9, DOOR NO:2-85, (PART-A), VISAKHAPATNAM-531163",
    office: "C-2, NAVADEEP APARTMENTS, NEAR SBI, SEETHAMMADHARA, VISAKHAPATNAM-530013 A.P.",
    bank: {
      bank: "INDIAN BANK",
      account: "7716753383",
      ifsc: "IDIB000G117",
      branch: "GAMBHEERAM",
      city: "Visakhapatnam-531 163",
    },
  },
  "sr-polymers": {
    slug: "sr-polymers",
    name: "S R POLYMERS",
    gstin: "37ABZPP5103B1ZK",
    pan: "ABZPP5103B",
    udyam: "UDYAM-AP-10-0003858",
    cell: ["98498 55566", "98663 68228"],
    addressLayout: "twoLine",
    factory: "PARADESI PALEM, S.NO:9, DOOR NO:2-85, (PART-B), VISAKHAPATNAM-531163",
    office: "C-2 (EAST PART) NAVADEEP APARTMENTS, NEAR SBI, SEETHAMMADHARA, VISAKHAPATNAM-530013 A.P.",
    bank: {
      bank: "INDIAN BANK",
      account: "7712523818",
      ifsc: "IDIB000G117",
      branch: "GAMBHEERAM",
      city: "Visakhapatnam-531 163",
    },
  },
  "suryateja-poly-films": {
    slug: "suryateja-poly-films",
    name: "SURYATEJA POLY FILMS",
    gstin: "37BLCPS1764F1ZZ",
    pan: "BLCPS1764F",
    udyam: "UDYAM-AP-10-0059145",
    cell: ["9866368228"],
    addressLayout: "single",
    address: "D.NO.1-91, KAPULUPPADA MAIN ROAD, BHEEMILI, VISAKHAPATNAM-531 163",
    bank: {
      bank: "INDIAN BANK",
      account: "8179659427",
      ifsc: "IDIB000G117",
      branch: "GAMBHEERAM",
      city: "VISAKHAPATNAM",
    },
  },
};

export function getProfile(slug: string): CompanyProfile | null {
  return (COMPANY_PROFILES as Record<string, CompanyProfile>)[slug] ?? null;
}
