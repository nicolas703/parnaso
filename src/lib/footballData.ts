import { get, put } from "@vercel/blob";
import { sampleCompetition, sampleMatches } from "./sampleMatches";
import bundledMatchResults from "../data/matchResults.json";
import type {
  Competition,
  Match,
  MatchesPayload,
  ScoreLine,
  StoredMatchResult,
  StoredMatchResultsFile,
  Team
} from "./types";

const API_BASE = "https://api.football-data.org/v4";
const DEFAULT_SEASON = "2026";
const DEFAULT_CACHE_SECONDS = 3600;
const BLOB_CACHE_SECONDS = 60;
const BLOB_MATCHES_PATHNAME =
  import.meta.env.BLOB_MATCHES_CACHE_PATHNAME || "football-data/wc-group-stage.json";
const BLOB_MATCH_RESULTS_PATHNAME =
  import.meta.env.BLOB_MATCH_RESULTS_PATHNAME || "football-data/wc-results.json";
const FINAL_STATUSES = new Set(["FINISHED", "AWARDED"]);

let cachedPayload: {
  expiresAt: number;
  payload: MatchesPayload;
} | null = null;

type FootballDataTeam = {
  id?: number | null;
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string | null;
  group?: string | null;
  matchday?: number | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: ScoreLine;
    regularTime?: ScoreLine;
  };
};

type FootballDataResponse = {
  competition?: Competition;
  matches?: FootballDataMatch[];
};

export async function getGroupStageMatches(): Promise<MatchesPayload> {
  const now = Date.now();

  if (cachedPayload && cachedPayload.expiresAt > now) {
    return cachedPayload.payload;
  }

  const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY;
  const season = import.meta.env.FOOTBALL_DATA_SEASON || DEFAULT_SEASON;
  const cacheSeconds = Number(import.meta.env.FOOTBALL_DATA_CACHE_SECONDS || DEFAULT_CACHE_SECONDS);
  const blobPayload = hasBlobToken() ? await readBlobMatches().catch(() => null) : null;

  if (blobPayload && isFresh(blobPayload, cacheSeconds, now)) {
    const payload = {
      ...blobPayload,
      matches: await mergeStoredResults(blobPayload.matches, new Date(now).toISOString(), {
        learnFromApi: false,
        writeBack: true
      })
    };

    cachedPayload = {
      expiresAt: now + cacheSeconds * 1000,
      payload
    };

    return payload;
  }

  if (!apiKey) {
    if (blobPayload) {
      return {
        ...blobPayload,
        matches: await mergeStoredResults(blobPayload.matches, new Date(now).toISOString(), {
          learnFromApi: false,
          writeBack: true
        }),
        warning: "Falta FOOTBALL_DATA_API_KEY; se muestran los ultimos datos cacheados."
      };
    }

    return buildSamplePayload(season, "Falta FOOTBALL_DATA_API_KEY; se muestran datos de ejemplo.");
  }

  try {
    const url = new URL(`${API_BASE}/competitions/WC/matches`);
    url.searchParams.set("season", season);
    url.searchParams.set("stage", "GROUP_STAGE");

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`football-data respondio ${response.status}`);
    }

    const data = (await response.json()) as FootballDataResponse;
    const matchesFromApi = (data.matches ?? [])
      .filter((match) => match.stage === "GROUP_STAGE")
      .map(normalizeMatch)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    const fetchedAt = new Date(now).toISOString();
    const matches = await mergeStoredResults(matchesFromApi, fetchedAt, {
      learnFromApi: true,
      writeBack: true
    });

    const payload: MatchesPayload = {
      competition: normalizeCompetition(data.competition),
      matches,
      fetchedAt,
      season,
      source: "api"
    };

    cachedPayload = {
      expiresAt: now + cacheSeconds * 1000,
      payload
    };

    if (hasBlobToken()) {
      await writeBlobMatches(payload).catch(() => undefined);
    }

    return payload;
  } catch (error) {
    if (cachedPayload?.payload.source === "api") {
      return {
        ...cachedPayload.payload,
        warning: "No se pudo actualizar football-data; se mantiene la ultima respuesta cacheada."
      };
    }

    if (blobPayload) {
      return {
        ...blobPayload,
        matches: await mergeStoredResults(blobPayload.matches, new Date(now).toISOString(), {
          learnFromApi: false,
          writeBack: true
        }),
        warning: "No se pudo actualizar football-data; se mantienen los ultimos datos cacheados."
      };
    }

    const message = error instanceof Error ? error.message : "error desconocido";
    return buildSamplePayload(season, `No se pudo leer football-data (${message}); se muestran datos de ejemplo.`);
  }
}

async function readBlobMatches(): Promise<MatchesPayload | null> {
  const blob = await get(BLOB_MATCHES_PATHNAME, {
    access: "private",
    token: getBlobToken(),
    useCache: false
  });

  if (!blob?.stream) {
    return null;
  }

  return JSON.parse(await new Response(blob.stream).text()) as MatchesPayload;
}

async function writeBlobMatches(payload: MatchesPayload) {
  await put(BLOB_MATCHES_PATHNAME, `${JSON.stringify(payload, null, 2)}\n`, {
    access: "private",
    allowOverwrite: true,
    cacheControlMaxAge: BLOB_CACHE_SECONDS,
    contentType: "application/json",
    token: getBlobToken()
  });
}

async function mergeStoredResults(
  matches: Match[],
  updatedAt: string,
  options: { learnFromApi: boolean; writeBack: boolean }
): Promise<Match[]> {
  const storedResults = createStoredResultsLookup();
  let changed = false;

  if (hasBlobToken()) {
    const blobResults = await readBlobMatchResults().catch(() => null);
    addStoredResults(storedResults, blobResults?.results ?? []);
  }

  changed = seedStoredResults(storedResults, getBundledMatchResults());

  const mergedMatches = matches.map((match) => {
    const apiScore = options.learnFromApi && FINAL_STATUSES.has(match.status) ? getCompleteScore(match) : null;

    if (apiScore) {
      const result: StoredMatchResult = {
        matchId: match.id,
        matchKey: match.key,
        homeScore: apiScore.home,
        awayScore: apiScore.away,
        status: match.status,
        updatedAt
      };

      if (!sameStoredResult(findStoredResult(storedResults, match), result)) {
        changed = true;
      }

      addStoredResult(storedResults, result);
      return match;
    }

    const storedResult = findStoredResult(storedResults, match);
    return storedResult ? applyStoredResult(match, storedResult) : match;
  });

  if (changed && options.writeBack && hasBlobToken()) {
    await writeBlobMatchResults(buildStoredResultsFile(storedResults, updatedAt)).catch(() => undefined);
  }

  return mergedMatches;
}

async function readBlobMatchResults(): Promise<StoredMatchResultsFile | null> {
  const blob = await get(BLOB_MATCH_RESULTS_PATHNAME, {
    access: "private",
    token: getBlobToken(),
    useCache: false
  });

  if (!blob?.stream) {
    return null;
  }

  return JSON.parse(await new Response(blob.stream).text()) as StoredMatchResultsFile;
}

async function writeBlobMatchResults(file: StoredMatchResultsFile) {
  await put(BLOB_MATCH_RESULTS_PATHNAME, `${JSON.stringify(file, null, 2)}\n`, {
    access: "private",
    allowOverwrite: true,
    cacheControlMaxAge: BLOB_CACHE_SECONDS,
    contentType: "application/json",
    token: getBlobToken()
  });
}

function isFresh(payload: MatchesPayload, cacheSeconds: number, now: number): boolean {
  return new Date(payload.fetchedAt).getTime() + cacheSeconds * 1000 > now;
}

function normalizeCompetition(competition?: Competition): Competition {
  return {
    name: competition?.name ?? "FIFA World Cup",
    code: competition?.code ?? "WC",
    emblem: competition?.emblem ?? null
  };
}

function normalizeMatch(match: FootballDataMatch): Match {
  const homeTeam = normalizeTeam(match.homeTeam);
  const awayTeam = normalizeTeam(match.awayTeam);

  return {
    id: match.id,
    key: `${homeTeam.tla}-${awayTeam.tla}`,
    utcDate: match.utcDate,
    status: match.status,
    stage: match.stage ?? "GROUP_STAGE",
    group: match.group ?? null,
    matchday: match.matchday ?? null,
    homeTeam,
    awayTeam,
    score: {
      fullTime: normalizeScore(match.score?.fullTime),
      regularTime: normalizeScore(match.score?.regularTime)
    }
  };
}

function normalizeTeam(team: FootballDataTeam): Team {
  const fallbackName = team.name ?? "TBD";
  const tla = team.tla ?? fallbackName.slice(0, 3).toUpperCase();

  return {
    id: team.id ?? null,
    name: fallbackName,
    shortName: team.shortName ?? fallbackName,
    tla,
    crest: team.crest ?? null
  };
}

function normalizeScore(score?: ScoreLine): ScoreLine {
  return {
    home: typeof score?.home === "number" ? score.home : null,
    away: typeof score?.away === "number" ? score.away : null
  };
}

function getCompleteScore(match: Match): { home: number; away: number } | null {
  const fullTime = match.score.fullTime;

  if (typeof fullTime.home === "number" && typeof fullTime.away === "number") {
    return {
      home: fullTime.home,
      away: fullTime.away
    };
  }

  const regularTime = match.score.regularTime;

  if (typeof regularTime?.home === "number" && typeof regularTime.away === "number") {
    return {
      home: regularTime.home,
      away: regularTime.away
    };
  }

  return null;
}

function applyStoredResult(match: Match, result: StoredMatchResult): Match {
  const score = {
    home: result.homeScore,
    away: result.awayScore
  };

  return {
    ...match,
    status: result.status ?? "FINISHED",
    score: {
      ...match.score,
      fullTime: score,
      regularTime: score
    }
  };
}

function getBundledMatchResults(): StoredMatchResult[] {
  return normalizeStoredResults((bundledMatchResults as StoredMatchResultsFile).results);
}

function createStoredResultsLookup(): Map<string, StoredMatchResult> {
  return new Map<string, StoredMatchResult>();
}

function seedStoredResults(
  lookup: Map<string, StoredMatchResult>,
  results: StoredMatchResult[]
): boolean {
  let changed = false;

  for (const result of results) {
    if (!findStoredResultByValue(lookup, result)) {
      addStoredResult(lookup, result);
      changed = true;
    }
  }

  return changed;
}

function addStoredResults(lookup: Map<string, StoredMatchResult>, results: StoredMatchResult[]) {
  for (const result of normalizeStoredResults(results)) {
    addStoredResult(lookup, result);
  }
}

function addStoredResult(lookup: Map<string, StoredMatchResult>, result: StoredMatchResult) {
  lookup.set(storedIdKey(result.matchId), result);
  lookup.set(storedMatchKey(result.matchKey), result);
}

function findStoredResult(
  lookup: Map<string, StoredMatchResult>,
  match: Match
): StoredMatchResult | undefined {
  return lookup.get(storedIdKey(match.id)) ?? lookup.get(storedMatchKey(match.key));
}

function findStoredResultByValue(
  lookup: Map<string, StoredMatchResult>,
  result: StoredMatchResult
): StoredMatchResult | undefined {
  return lookup.get(storedIdKey(result.matchId)) ?? lookup.get(storedMatchKey(result.matchKey));
}

function buildStoredResultsFile(
  lookup: Map<string, StoredMatchResult>,
  updatedAt: string
): StoredMatchResultsFile {
  const uniqueResults = new Map<number, StoredMatchResult>();

  for (const result of lookup.values()) {
    uniqueResults.set(result.matchId, result);
  }

  return {
    updatedAt,
    results: [...uniqueResults.values()].sort((a, b) => a.matchId - b.matchId)
  };
}

function normalizeStoredResults(results: StoredMatchResult[] | undefined): StoredMatchResult[] {
  return (results ?? []).filter(
    (result) =>
      typeof result.matchId === "number" &&
      typeof result.matchKey === "string" &&
      Number.isFinite(result.homeScore) &&
      Number.isFinite(result.awayScore)
  );
}

function sameStoredResult(
  current: StoredMatchResult | undefined,
  next: StoredMatchResult
): boolean {
  return (
    current?.homeScore === next.homeScore &&
    current.awayScore === next.awayScore &&
    current.status === next.status
  );
}

function storedIdKey(matchId: number): string {
  return `id:${matchId}`;
}

function storedMatchKey(matchKey: string): string {
  return `key:${matchKey.trim().toUpperCase().replace(/\s+/g, "")}`;
}

function buildSamplePayload(season: string, warning: string): MatchesPayload {
  return {
    competition: sampleCompetition,
    matches: sampleMatches,
    fetchedAt: new Date().toISOString(),
    season,
    source: "sample",
    warning
  };
}

function hasBlobToken(): boolean {
  return Boolean(getBlobToken());
}

function getBlobToken(): string | undefined {
  return import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}
