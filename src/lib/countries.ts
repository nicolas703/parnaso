import type { Team } from "./types";

type CountryDisplay = {
  name: string;
  flag?: string;
  flagUrl?: string | null;
};

const COUNTRY_BY_TLA: Record<string, CountryDisplay> = {
  ALG: { name: "Argelia", flag: "🇩🇿" },
  ARG: { name: "Argentina", flag: "🇦🇷" },
  AUS: { name: "Australia", flag: "🇦🇺" },
  AUT: { name: "Austria", flag: "🇦🇹" },
  BEL: { name: "Bélgica", flag: "🇧🇪" },
  BIH: { name: "Bosnia y Herzegovina", flag: "🇧🇦" },
  BRA: { name: "Brasil", flag: "🇧🇷" },
  CAN: { name: "Canadá", flag: "🇨🇦" },
  CIV: { name: "Costa de Marfil", flag: "🇨🇮" },
  COD: { name: "RD del Congo", flag: "🇨🇩" },
  COL: { name: "Colombia", flag: "🇨🇴" },
  CPV: { name: "Cabo Verde", flag: "🇨🇻" },
  CRO: { name: "Croacia", flag: "🇭🇷" },
  CUW: { name: "Curazao", flag: "🇨🇼" },
  CZE: { name: "Chequia", flag: "🇨🇿" },
  ECU: { name: "Ecuador", flag: "🇪🇨" },
  EGY: { name: "Egipto", flag: "🇪🇬" },
  ENG: { name: "Inglaterra", flag: "🏴" },
  ESP: { name: "España", flag: "🇪🇸" },
  FRA: { name: "Francia", flag: "🇫🇷" },
  GER: { name: "Alemania", flag: "🇩🇪" },
  GHA: { name: "Ghana", flag: "🇬🇭" },
  HAI: { name: "Haití", flag: "🇭🇹" },
  IRN: { name: "Irán", flag: "🇮🇷" },
  IRQ: { name: "Irak", flag: "🇮🇶" },
  JOR: { name: "Jordania", flag: "🇯🇴" },
  JPN: { name: "Japón", flag: "🇯🇵" },
  KOR: { name: "Corea del Sur", flag: "🇰🇷" },
  KSA: { name: "Arabia Saudita", flag: "🇸🇦" },
  MAR: { name: "Marruecos", flag: "🇲🇦" },
  MEX: { name: "México", flag: "🇲🇽" },
  NED: { name: "Países Bajos", flag: "🇳🇱" },
  NOR: { name: "Noruega", flag: "🇳🇴" },
  NZL: { name: "Nueva Zelanda", flag: "🇳🇿" },
  PAN: { name: "Panamá", flag: "🇵🇦" },
  PAR: { name: "Paraguay", flag: "🇵🇾" },
  POR: { name: "Portugal", flag: "🇵🇹" },
  QAT: { name: "Catar", flag: "🇶🇦" },
  RSA: { name: "Sudáfrica", flag: "🇿🇦" },
  SCO: { name: "Escocia", flag: "🏴" },
  SEN: { name: "Senegal", flag: "🇸🇳" },
  SUI: { name: "Suiza", flag: "🇨🇭" },
  SWE: { name: "Suecia", flag: "🇸🇪" },
  TUN: { name: "Túnez", flag: "🇹🇳" },
  TUR: { name: "Turquía", flag: "🇹🇷" },
  URY: { name: "Uruguay", flag: "🇺🇾" },
  USA: { name: "Estados Unidos", flag: "🇺🇸" },
  UZB: { name: "Uzbekistán", flag: "🇺🇿" }
};

export function getCountryDisplay(team: Team): CountryDisplay {
  const country =
    COUNTRY_BY_TLA[team.tla] ?? {
      name: team.name || team.shortName || "Por definir"
    };

  return {
    ...country,
    flagUrl: team.crest
  };
}

export function formatCountryName(team: Team): string {
  return getCountryDisplay(team).name;
}

export function formatCountryWithFlag(team: Team): string {
  const country = getCountryDisplay(team);
  return country.flag ? `${country.flag} ${country.name}` : country.name;
}
