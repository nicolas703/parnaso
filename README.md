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
BLOB_READ_WRITE_TOKEN=...
BLOB_PREDICTIONS_PATHNAME=predictions.json
BLOB_MATCHES_CACHE_PATHNAME=football-data/wc-group-stage.json
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

Tambien puedes abrir `/add` para agregar o actualizar un jugador desde un formulario.

Si existe `BLOB_READ_WRITE_TOKEN`, las predicciones se leen y escriben en Vercel Blob usando el archivo `predictions.json`. Si el blob esta vacio, la primera lectura lo inicializa con `src/data/predictions.json`. Sin `BLOB_READ_WRITE_TOKEN`, la app usa el JSON local como fallback de desarrollo.

El nombre del store, por ejemplo `parnaso-blob`, no se escribe en codigo: queda asociado al token de Vercel. Opcionalmente puedes cambiar los pathnames con `BLOB_PREDICTIONS_PATHNAME` y `BLOB_MATCHES_CACHE_PATHNAME`.

## Actualizacion

La pagina se renderiza en servidor con el adapter de Vercel. Con Blob activo, los resultados de football-data se cachean en Blob por una hora para respetar la cuota de la API, y la portada no usa cache CDN para que las predicciones nuevas aparezcan rapido. Sin Blob, se usa `Cache-Control: s-maxage=3600` y cache en memoria por una hora. La key nunca se manda al navegador.
