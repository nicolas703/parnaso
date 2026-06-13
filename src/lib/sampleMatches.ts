import type { Match } from "./types";

export const sampleCompetition = {
  name: "FIFA World Cup",
  code: "WC",
  emblem: null
};

export const sampleMatches: Match[] = [
  {
    id: 9001,
    key: "MEX-RSA",
    utcDate: "2026-06-11T19:00:00Z",
    status: "FINISHED",
    stage: "GROUP_STAGE",
    group: "GROUP_A",
    matchday: 1,
    homeTeam: {
      id: 769,
      name: "Mexico",
      shortName: "Mexico",
      tla: "MEX",
      crest: null
    },
    awayTeam: {
      id: 766,
      name: "South Africa",
      shortName: "South Africa",
      tla: "RSA",
      crest: null
    },
    score: {
      fullTime: { home: 2, away: 1 },
      regularTime: { home: 2, away: 1 }
    }
  },
  {
    id: 9002,
    key: "USA-WAL",
    utcDate: "2026-06-12T01:00:00Z",
    status: "FINISHED",
    stage: "GROUP_STAGE",
    group: "GROUP_B",
    matchday: 1,
    homeTeam: {
      id: 768,
      name: "United States",
      shortName: "United States",
      tla: "USA",
      crest: null
    },
    awayTeam: {
      id: 833,
      name: "Wales",
      shortName: "Wales",
      tla: "WAL",
      crest: null
    },
    score: {
      fullTime: { home: 1, away: 1 },
      regularTime: { home: 1, away: 1 }
    }
  },
  {
    id: 9003,
    key: "ARG-KSA",
    utcDate: "2026-06-12T17:00:00Z",
    status: "FINISHED",
    stage: "GROUP_STAGE",
    group: "GROUP_C",
    matchday: 1,
    homeTeam: {
      id: 762,
      name: "Argentina",
      shortName: "Argentina",
      tla: "ARG",
      crest: null
    },
    awayTeam: {
      id: 801,
      name: "Saudi Arabia",
      shortName: "Saudi Arabia",
      tla: "KSA",
      crest: null
    },
    score: {
      fullTime: { home: 1, away: 2 },
      regularTime: { home: 1, away: 2 }
    }
  },
  {
    id: 9004,
    key: "BRA-SRB",
    utcDate: "2026-06-13T19:00:00Z",
    status: "TIMED",
    stage: "GROUP_STAGE",
    group: "GROUP_G",
    matchday: 1,
    homeTeam: {
      id: 764,
      name: "Brazil",
      shortName: "Brazil",
      tla: "BRA",
      crest: null
    },
    awayTeam: {
      id: 780,
      name: "Serbia",
      shortName: "Serbia",
      tla: "SRB",
      crest: null
    },
    score: {
      fullTime: { home: null, away: null },
      regularTime: { home: null, away: null }
    }
  },
  {
    id: 9005,
    key: "FRA-AUS",
    utcDate: "2026-06-14T01:00:00Z",
    status: "SCHEDULED",
    stage: "GROUP_STAGE",
    group: "GROUP_D",
    matchday: 1,
    homeTeam: {
      id: 773,
      name: "France",
      shortName: "France",
      tla: "FRA",
      crest: null
    },
    awayTeam: {
      id: 779,
      name: "Australia",
      shortName: "Australia",
      tla: "AUS",
      crest: null
    },
    score: {
      fullTime: { home: null, away: null },
      regularTime: { home: null, away: null }
    }
  }
];
