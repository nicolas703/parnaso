import { get, put } from "@vercel/blob";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import bundledPredictions from "../data/predictions.json";
import type { Player, Prediction, PredictionsFile } from "./types";

const BLOB_PATHNAME = import.meta.env.BLOB_PREDICTIONS_PATHNAME || "predictions.json";
const BLOB_CACHE_SECONDS = 60;
const predictionsPath = path.join(process.cwd(), "src", "data", "predictions.json");

export async function readPredictions(): Promise<PredictionsFile> {
  if (hasBlobToken()) {
    return readBlobPredictions();
  }

  return readLocalPredictions();
}

export async function savePlayerPredictions(name: string, predictions: Prediction[]): Promise<"created" | "updated"> {
  const file = await readPredictions();
  const player: Player = {
    name,
    predictions
  };
  const existingIndex = file.players.findIndex(
    (currentPlayer) => normalizeName(currentPlayer.name) === normalizeName(name)
  );

  if (existingIndex >= 0) {
    file.players[existingIndex] = player;
    await writePredictions(file);
    return "updated";
  }

  file.players.push(player);
  await writePredictions(file);
  return "created";
}

async function readBlobPredictions(): Promise<PredictionsFile> {
  const blob = await get(BLOB_PATHNAME, {
    access: "private",
    token: getBlobToken(),
    useCache: false
  });

  if (!blob?.stream) {
    const seed = await readLocalPredictions();
    await writeBlobPredictions(seed);
    return seed;
  }

  return JSON.parse(await new Response(blob.stream).text()) as PredictionsFile;
}

async function readLocalPredictions(): Promise<PredictionsFile> {
  try {
    const raw = await readFile(predictionsPath, "utf8");
    return JSON.parse(raw) as PredictionsFile;
  } catch {
    return bundledPredictions as PredictionsFile;
  }
}

function writePredictions(file: PredictionsFile) {
  if (hasBlobToken()) {
    return writeBlobPredictions(file);
  }

  return writeFile(predictionsPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

async function writeBlobPredictions(file: PredictionsFile) {
  await put(BLOB_PATHNAME, `${JSON.stringify(file, null, 2)}\n`, {
    access: "private",
    allowOverwrite: true,
    cacheControlMaxAge: BLOB_CACHE_SECONDS,
    contentType: "application/json",
    token: getBlobToken()
  });
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("es-CL");
}

function hasBlobToken(): boolean {
  return Boolean(getBlobToken());
}

function getBlobToken(): string | undefined {
  return import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}
