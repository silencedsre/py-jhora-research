# PyJHora Vedic Astrology REST API

A comprehensive REST API exposing the full power of the [PyJHora](https://github.com/naturalstupid/PyJHora) Vedic Astrology library. Compute Panchanga, horoscope charts, 40+ dhasa systems, compatibility, transits, and more — all as JSON.

## Quick Start

```bash
# Install dependencies
uv add fastapi uvicorn

# Start the server
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Project Structure

```
py-jhora/
├── PyJHora/                  # Cloned source repository
│   └── src/jhora/            # Core computation library
├── api/
│   ├── main.py               # FastAPI app, CORS, router registration
│   ├── models.py             # Pydantic request/response models
│   ├── helpers.py            # Birth data parsing & place resolution
│   └── routes/
│       ├── panchanga.py      # Daily panchanga computations
│       ├── horoscope.py      # Horoscope charts & planet positions
│       ├── charts.py         # Yoga, Dosha, Strength, Ashtakavarga
│       ├── dhasa.py          # 40+ dhasa-bhukthi systems
│       ├── match.py          # Marriage compatibility
│       ├── transit.py        # Tajaka & Sahams
│       └── eclipse.py        # Solar/Lunar eclipses
└── pyproject.toml
```

---

## Common Request Format

Most POST endpoints accept a `BirthData` JSON body:

```json
{
  "place": "Chennai,IN",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "timezone_offset": 5.5,
  "date": "1996-12-07",
  "time": "10:34",
  "language": "en",
  "ayanamsa": "LAHIRI"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `place` | string | No | Place name with country code |
| `latitude` | float | Yes* | Latitude of the location |
| `longitude` | float | Yes* | Longitude of the location |
| `timezone_offset` | float | Yes* | UTC offset in hours (e.g., `5.5` for IST) |
| `date` | string | **Yes** | Date in `YYYY-MM-DD` format |
| `time` | string | No | Time in `HH:MM` or `HH:MM:SS` (default: `12:00`) |
| `language` | string | No | Language code: `en`, `ta`, `te`, `hi`, `ka` (default: `en`) |
| `ayanamsa` | string | No | Ayanamsa mode (default: `LAHIRI`). See `/api/info/ayanamsas` |

> **Note**: Either provide `latitude` + `longitude` + `timezone_offset`, or `place` (geocoding may have rate limits).

---

## API Reference

### Info Endpoints

#### `GET /api/info/ayanamsas`
List all available ayanamsa modes.

```bash
curl http://localhost:8000/api/info/ayanamsas
```

```json
{
  "ayanamsas": ["FAGAN", "KP", "LAHIRI", "RAMAN", "USHASHASHI", "YUKTESHWAR", "SURYASIDDHANTA", "..."]
}
```

#### `GET /api/info/nakshatras`
List all 27 nakshatras with index numbers.

```bash
curl http://localhost:8000/api/info/nakshatras
```

#### `GET /api/info/raasis`
List all 12 zodiac signs (raasis) with index numbers.

```bash
curl http://localhost:8000/api/info/raasis
```

```json
{
  "raasis": [
    {"index": 0, "name": "♈Aries"},
    {"index": 1, "name": "♉︎Taurus"},
    {"index": 2, "name": "♊︎Gemini"},
    {"index": 3, "name": "♋︎Cancer"},
    {"index": 4, "name": "♌︎Leo"},
    {"index": 5, "name": "♍︎Virgo"},
    {"index": 6, "name": "♎︎Libra"},
    {"index": 7, "name": "♏︎Scorpio"},
    {"index": 8, "name": "♐︎Sagittarius"},
    {"index": 9, "name": "♑︎Capricorn"},
    {"index": 10, "name": "♒︎Aquarius"},
    {"index": 11, "name": "♓︎Pisces"}
  ]
}
```

---

### Panchanga

#### `POST /api/panchanga`
Get full daily panchanga — tithi, nakshatra, yoga, karana, sunrise/sunset, rahu kalam, and more.

```bash
curl -X POST http://localhost:8000/api/panchanga \
  -H 'Content-Type: application/json' \
  -d '{
    "latitude": 13.0827,
    "longitude": 80.2707,
    "timezone_offset": 5.5,
    "date": "1996-12-07",
    "time": "10:34"
  }'
```

<details>
<summary>Response</summary>

```json
{
  "vaara": {"index": 6, "name": "Saturday"},
  "tithi": {
    "index": 27,
    "name": "Dhuvadhasi",
    "paksha": "Krishna Paksha",
    "start": "03:47:39",
    "end": "03:44:16 (+1)",
    "balance_percent": 71.71
  },
  "nakshatra": {
    "index": 15,
    "name": "Swaathi",
    "pada": 1,
    "start": "07:56:09",
    "end": "08:08:43 (+1)",
    "balance_percent": 89.13
  },
  "yoga": {
    "index": 5,
    "name": "Sobhana",
    "start": "02:09:57 (-1)",
    "end": "20:35:09",
    "balance_percent": 23.62
  },
  "karana": {
    "index": 53,
    "name": "kaulava",
    "start": "03:47:39",
    "end": "15:45:57",
    "balance_percent": 43.43
  },
  "raasi": {
    "index": 7,
    "name": "♎︎Libra",
    "balance_percent": 63.01
  },
  "sunrise": "06:22:33",
  "sunset": "17:38:16",
  "moonrise": "02:53:37",
  "moonset": "14:55:03",
  "rahu_kalam": {"start": "09:11:29", "end": "10:35:56"},
  "yamagandam": {"start": "13:24:52", "end": "14:49:20"},
  "gulikai_kalam": {"start": "06:22:33", "end": "07:47:01"},
  "abhijit_muhurta": {"start": "11:37:53", "end": "12:22:56"},
  "durmuhurtam": {"start": "07:52:39", "end": "08:37:41"},
  "lunar_month": {"index": 8, "name": "Kaarthigai", "is_adhika": false, "is_nija": false},
  "samvatsara": {"index": 9, "name": "Dhatri"},
  "place": {"name": "Custom", "latitude": 13.08, "longitude": 80.27, "timezone": 5.5}
}
```

</details>

---

### Horoscope

#### `POST /api/horoscope`
Get full horoscope with calendar information and planet positions for the Rasi chart.

```bash
curl -X POST http://localhost:8000/api/horoscope \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"}'
```

#### `POST /api/horoscope/chart`
Get a specific divisional chart.

```bash
curl -X POST http://localhost:8000/api/horoscope/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "birth_data": {
      "latitude": 13.08, "longitude": 80.27,
      "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"
    },
    "chart_type": 9,
    "chart_method": 1
  }'
```

| `chart_type` | Chart |
|--------------|-------|
| 1 | Rasi (D1) |
| 2 | Hora (D2) |
| 3 | Drekkana (D3) |
| 4 | Chaturthamsa (D4) |
| 9 | Navamsa (D9) |
| 10 | Dasamsa (D10) |
| 12 | Dwadasamsa (D12) |
| 16 | Shodasamsa (D16) |
| 20 | Vimsamsa (D20) |
| 24 | Chaturvimsamsa (D24) |
| 27 | Nakshatramsa (D27) |
| 30 | Trimsamsa (D30) |
| 40 | Khavedamsa (D40) |
| 45 | Akshavedamsa (D45) |
| 60 | Shastiamsa (D60) |
| 81 | Nava-Navamsa (D81) |
| 108 | Ashtottaramsa (D108) |
| 144 | Dwadas-Dwadasamsa (D144) |

#### `POST /api/horoscope/planets`
Get planet positions with retrograde status, sign, nakshatra, and pada.

```bash
curl -X POST http://localhost:8000/api/horoscope/planets \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"}'
```

<details>
<summary>Response</summary>

```json
{
  "ascendant": {"house": 9, "sign": "♑︎Capricorn", "longitude": 23.5741},
  "planets": [
    {"id": 0, "name": "Sun☉", "house": 7, "sign": "♏︎Scorpio", "longitude": 22.7004, "retrograde": false, "nakshatra": "Kaettai", "pada": 2},
    {"id": 1, "name": "Moon☾", "house": 6, "sign": "♎︎Libra", "longitude": 8.0946, "retrograde": false, "nakshatra": "Swaathi", "pada": 1},
    {"id": 2, "name": "Mars♂", "house": 4, "sign": "♌︎Leo", "longitude": 26.6749, "retrograde": false, "nakshatra": "Uthiram", "pada": 1},
    {"id": 3, "name": "Mercury☿", "house": 8, "sign": "♐︎Sagittarius", "longitude": 11.0716, "retrograde": false, "nakshatra": "Moolam", "pada": 4},
    {"id": 4, "name": "Jupiter♃", "house": 8, "sign": "♐︎Sagittarius", "longitude": 26.9632, "retrograde": false, "nakshatra": "Uthiraadam", "pada": 1},
    {"id": 5, "name": "Venus♀", "house": 6, "sign": "♎︎Libra", "longitude": 24.8523, "retrograde": false, "nakshatra": "Visaakam", "pada": 2},
    {"id": 6, "name": "Saturn♄", "house": 11, "sign": "♓︎Pisces", "longitude": 7.9424, "retrograde": false, "nakshatra": "Uthirattathi", "pada": 2},
    {"id": 7, "name": "Raagu☊", "house": 5, "sign": "♍︎Virgo", "longitude": 12.8372, "retrograde": false, "nakshatra": "Hastham", "pada": 1},
    {"id": 8, "name": "Kethu☋", "house": 11, "sign": "♓︎Pisces", "longitude": 12.8372, "retrograde": false, "nakshatra": "Uthirattathi", "pada": 3}
  ]
}
```

</details>

---

### Chart Analysis

#### `POST /api/charts/yoga`
Get all applicable yogas.

#### `POST /api/charts/dosha`
Get doshas (Manglik Dosha, Kaala Sarpa Dosha).

#### `POST /api/charts/strength`
Get Shad Bala and Bhava Bala.

#### `POST /api/charts/ashtakavarga`
Get Ashtakavarga tables.

#### `POST /api/charts/raja-yoga`
Get Raja Yogas.

#### `POST /api/charts/arudha`
Get Arudha Padhas.

All accept `BirthData` as the request body.

```bash
curl -X POST http://localhost:8000/api/charts/yoga \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"}'
```

---

### Dhasa-Bhukthi

#### `GET /api/dhasa/systems`
List all available dhasa systems.

```json
{
  "graha_dhasas": [
    "vimsottari", "ashtottari", "yogini", "kaala", "karaka",
    "naisargika", "tara", "panchottari", "shodasottari", "dwadasottari",
    "shattrimsa_sama", "chathuraseethi_sama", "shastihayani", "sataatbika",
    "dwisapathi", "buddhi_gathi", "tithi_ashtottari", "tithi_yogini",
    "yoga_vimsottari", "saptharishi_nakshathra", "aayu",
    "karana_chathuraseethi_sama"
  ],
  "raasi_dhasas": [
    "narayana", "chara", "moola", "kalachakra", "navamsa", "nirayana",
    "drig", "shoola", "sudasa", "brahma", "varnada", "yogardha",
    "mandooka", "sthira", "trikona", "paryaaya", "kendradhi_rasi",
    "lagnamsaka", "padhanadhamsa", "tara_lagna", "chakra"
  ],
  "annual_dhasas": ["mudda", "patyayini"]
}
```

#### `POST /api/dhasa/{system}`
Compute dhasa-bhukthi for any system.

```bash
curl -X POST http://localhost:8000/api/dhasa/vimsottari \
  -H 'Content-Type: application/json' \
  -d '{
    "birth_data": {
      "latitude": 13.08, "longitude": 80.27,
      "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"
    },
    "system": "vimsottari",
    "divisional_chart_factor": 1
  }'
```

---

### Marriage Compatibility

#### `POST /api/match`
Compatibility using nakshatra and paadha directly.

```bash
curl -X POST http://localhost:8000/api/match \
  -H 'Content-Type: application/json' \
  -d '{
    "boy_nakshatra": 1, "boy_paadha": 1,
    "girl_nakshatra": 14, "girl_paadha": 1,
    "method": "north"
  }'
```

#### `POST /api/match/birth`
Compatibility from birth data (auto-detects nakshatra/paadha).

```bash
curl -X POST http://localhost:8000/api/match/birth \
  -H 'Content-Type: application/json' \
  -d '{
    "boy": {"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "1990-05-15", "time": "08:30"},
    "girl": {"latitude": 28.61, "longitude": 77.23, "timezone_offset": 5.5, "date": "1992-11-20", "time": "14:15"},
    "method": "north"
  }'
```

---

### Transit

#### `POST /api/transit/tajaka`
Get annual (Tajaka) chart.

```bash
curl -X POST http://localhost:8000/api/transit/tajaka \
  -H 'Content-Type: application/json' \
  -d '{
    "birth_data": {
      "latitude": 13.08, "longitude": 80.27,
      "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"
    },
    "years": 28
  }'
```

#### `POST /api/transit/saham`
Get all 36 Sahams (Arabic Parts).

```bash
curl -X POST http://localhost:8000/api/transit/saham \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "1996-12-07", "time": "10:34"}'
```

---

### Eclipse

#### `POST /api/eclipse`
Get solar and lunar eclipse information.

```bash
curl -X POST http://localhost:8000/api/eclipse \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 13.08, "longitude": 80.27, "timezone_offset": 5.5, "date": "2024-04-08", "time": "12:00"}'
```

---

## Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `ta` | Tamil |
| `te` | Telugu |
| `hi` | Hindi |
| `ka` | Kannada |

---

## Supported Ayanamsa Modes

Use `GET /api/info/ayanamsas` for the full list. Common ones:

| Mode | Description |
|------|-------------|
| `LAHIRI` | Lahiri (Chitrapaksha) — most widely used |
| `KP` | Krishnamurti Paddhati |
| `RAMAN` | B.V. Raman |
| `TRUE_CITRA` | True Chitra |
| `TRUE_PUSHYA` | True Pushya |
| `SURYASIDDHANTA` | Surya Siddhanta |
| `FAGAN` | Fagan-Bradley (Western sidereal) |

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `400` | Bad request (missing/invalid parameters) |
| `422` | Validation error (Pydantic) |
| `500` | Computation error (internal library error) |

---

## Development

```bash
# Run with auto-reload for development
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Run in production
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## License

The API layer is built on top of PyJHora which is licensed under the GNU Affero General Public License v3.0.
