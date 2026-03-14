import { COUNTRY_CODE_MAP } from "@/data/countryCodeMap";

/**
 * Reverse lookup: ISO alpha-2 code -> country name.
 * Built once from the existing numeric country code map.
 */
const ALPHA2_TO_NAME: Record<string, string> = {};

for (const entry of Object.values(COUNTRY_CODE_MAP)) {
  ALPHA2_TO_NAME[entry.iso_a2] = entry.name;
}

/**
 * Converts an ISO alpha-2 country code (e.g. "TR") to a full country name
 * (e.g. "Turkey"). Returns the code itself as a fallback if not found.
 */
export function getCountryName(code: string): string {
  return ALPHA2_TO_NAME[code] ?? code;
}
