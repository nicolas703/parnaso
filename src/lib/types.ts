export type ScoreLine = {
  home: number | null;
  away: number | null;
};

export type Team = {
  id: number | null;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
};

export type Match = {
  id: number;
  key: string;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    fullTime: ScoreLine;
    regularTime?: ScoreLine;
  };
};

export type Competition = {
  name: string;
  code: string;
  emblem: string | null;
};

export type MatchesPayload = {
  competition: Competition;
  matches: Match[];
  fetchedAt: string;
  season: string;
  source: "api" | "sample";
  warning?: string;
};

export type Prediction = {
  matchId?: number;
  matchKey?: string;
  homeScore: number;
  awayScore: number;
};

export type Player = {
  name: string;
  predictions: Prediction[];
};

export type PredictionsFile = {
  players: Player[];
};
