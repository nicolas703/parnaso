import { formatCountryName } from "./countries";
import type { Match, Player, Prediction, ScoreLine } from "./types";

export type Verdict = "exact" | "winner" | "miss" | "pending" | "missing" | "unreported";

export type PredictionResult = {
  verdict: Verdict;
  points: number;
};

export type MatchRow = {
  match: Match;
  prediction: Prediction | null;
  result: PredictionResult;
};

export type PlayerStanding = {
  player: Player;
  points: number;
  previous: MatchRow | null;
  next: MatchRow | null;
  rows: MatchRow[];
};

export type Leaderboard = {
  previousMatch: Match | null;
  nextMatch: Match | null;
  entries: PlayerStanding[];
};

const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);

export function buildLeaderboard(players: Player[], matches: Match[]): Leaderboard {
  const orderedMatches = [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  const finishedMatches = orderedMatches.filter(isFinished);
  const previousMatch = finishedMatches.at(-1) ?? null;
  const nextMatch = orderedMatches.find((match) => !isFinished(match)) ?? null;

  const entries = players
    .map((player) => {
      const rows = orderedMatches.map((match) => buildMatchRow(player, match));
      const points = rows.reduce((total, row) => total + row.result.points, 0);

      return {
        player,
        points,
        previous: previousMatch ? buildMatchRow(player, previousMatch) : null,
        next: nextMatch ? buildMatchRow(player, nextMatch) : null,
        rows
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      return a.player.name.localeCompare(b.player.name, "es");
    });

  return {
    previousMatch,
    nextMatch,
    entries
  };
}

export function isFinished(match: Match): boolean {
  return FINISHED_STATUSES.has(match.status);
}

export function getActualScore(match: Match): ScoreLine | null {
  const fullTime = match.score.fullTime;

  if (typeof fullTime.home === "number" && typeof fullTime.away === "number") {
    return fullTime;
  }

  const regularTime = match.score.regularTime;

  if (typeof regularTime?.home === "number" && typeof regularTime.away === "number") {
    return regularTime;
  }

  return null;
}

export function formatPrediction(prediction: Prediction | null | undefined): string {
  return prediction ? `${prediction.homeScore}-${prediction.awayScore}` : "Sin prediccion";
}

export function formatScore(score: ScoreLine | null | undefined): string {
  if (!score) {
    return "Pendiente";
  }

  if (typeof score.home === "number" && typeof score.away === "number") {
    return `${score.home}-${score.away}`;
  }

  return "Pendiente";
}

export function formatMatchResult(match: Match): string {
  const score = getActualScore(match);

  if (score) {
    return formatScore(score);
  }

  return isFinished(match) ? "Sin marcador" : "Pendiente";
}

export function formatMatchName(match: Match): string {
  return `${formatCountryName(match.homeTeam)} vs ${formatCountryName(match.awayTeam)}`;
}

export function formatRound(match: Match): string {
  const group = match.group ? match.group.replace("GROUP_", "Grupo ") : "Grupo";
  const matchday = match.matchday ? `Fecha ${match.matchday}` : "Fecha";
  return `${group} - ${matchday}`;
}

export function formatMatchDate(match: Match): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(match.utcDate));
}

export function verdictLabel(verdict: Verdict): string {
  const labels: Record<Verdict, string> = {
    exact: "Exacto",
    winner: "Ganador",
    miss: "Fallido",
    pending: "Pendiente",
    missing: "Sin prediccion",
    unreported: "Sin marcador"
  };

  return labels[verdict];
}

function buildMatchRow(player: Player, match: Match): MatchRow {
  const prediction = findPrediction(player, match);

  return {
    match,
    prediction,
    result: scorePrediction(prediction, match)
  };
}

function findPrediction(player: Player, match: Match): Prediction | null {
  return (
    player.predictions.find((prediction) => {
      if (typeof prediction.matchId === "number" && prediction.matchId === match.id) {
        return true;
      }

      return normalizeMatchKey(prediction.matchKey) === match.key;
    }) ?? null
  );
}

function normalizeMatchKey(matchKey: string | undefined): string | undefined {
  return matchKey?.trim().toUpperCase().replace(/\s+/g, "");
}

function scorePrediction(prediction: Prediction | null, match: Match): PredictionResult {
  if (!isFinished(match)) {
    return {
      verdict: "pending",
      points: 0
    };
  }

  if (!prediction) {
    return {
      verdict: "missing",
      points: 0
    };
  }

  const actualScore = getActualScore(match);

  if (!actualScore) {
    return {
      verdict: "unreported",
      points: 0
    };
  }

  if (prediction.homeScore === actualScore.home && prediction.awayScore === actualScore.away) {
    return {
      verdict: "exact",
      points: 3
    };
  }

  if (outcome(prediction.homeScore, prediction.awayScore) === outcome(actualScore.home, actualScore.away)) {
    return {
      verdict: "winner",
      points: 1
    };
  }

  return {
    verdict: "miss",
    points: 0
  };
}

function outcome(homeScore: number, awayScore: number): "home" | "away" | "draw" {
  if (homeScore > awayScore) {
    return "home";
  }

  if (awayScore > homeScore) {
    return "away";
  }

  return "draw";
}
