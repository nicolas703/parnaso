# Quiniela Mundial

Web Astro de una pagina para una quiniela del Mundial. Lee los partidos de fase de grupos desde football-data y cruza esos resultados con las predicciones en `src/data/predictions.json`.

## Desarrollo

```bash
npm install
npm run dev
```

La API key queda en `.env`, que esta git-ignorado. Para Vercel configura estas variables de entorno:

```bash
FOOTBALL_DATA_API_KEY=...
FOOTBALL_DATA_SEASON=2026
FOOTBALL_DATA_CACHE_SECONDS=3600
```

## Predicciones

Edita `src/data/predictions.json`. Cada prediccion puede apuntar al partido por `matchKey` con formato `LOCAL-VISITA` usando los TLA de football-data, por ejemplo `MEX-RSA`, o por `matchId` si prefieres usar el id de la API.

```json
{
  "name": "Nico",
  "predictions": [
    { "matchKey": "MEX-RSA", "homeScore": 2, "awayScore": 1 }
  ]
}
```

Puntaje:

- Resultado exacto: 3 puntos.
- Ganador correcto o empate correcto: 1 punto.
- Ninguna de las anteriores: 0 puntos.

## Actualizacion

La pagina se renderiza en servidor con el adapter de Vercel y usa `Cache-Control: s-maxage=3600`, ademas de un cache en memoria por una hora. La key nunca se manda al navegador.
