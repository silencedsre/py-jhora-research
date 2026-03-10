"""
PyJHora REST API — Main Application
"""
import sys
import os
import datetime

# Add PyJHora source to path before anything else
_pyjhora_src = os.path.join(os.path.dirname(__file__), 'PyJHora', 'src')
sys.path.insert(0, os.path.abspath(_pyjhora_src))

from fastapi import FastAPI, Request, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from mangum import Mangum

from api.routes import panchanga, horoscope, charts, dhasa, match, transit, eclipse

app = FastAPI(
    title="PyJHora Vedic Astrology API",
    description="REST API for Vedic Astrology computations powered by PyJHora — "
                "Panchanga, Horoscope Charts, Dhasas, Compatibility, Transits, and more.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security Configuration
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
API_KEY = os.environ.get("API_KEY")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(header_value: str = Security(api_key_header)):
    if API_KEY and header_value != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return header_value

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Daily Request Cap ───────────────────────────────────────────────────
# Protects against exceeding AWS Lambda free-tier (1M req/month ≈ 33K/day).
# Override via env var: DAILY_REQUEST_LIMIT=500
# Paths listed in _RATE_LIMIT_EXCLUDE are never counted.
DAILY_REQUEST_LIMIT = int(os.environ.get("DAILY_REQUEST_LIMIT", "1000"))
_RATE_LIMIT_EXCLUDE = {"/", "/docs", "/redoc", "/openapi.json", "/health", "/api/info/usage"}
_rate_window: dict = {"date": None, "count": 0}

@app.middleware("http")
async def global_daily_cap(request: Request, call_next):
    # Do not limit or count CORS preflight (OPTIONS) requests
    if request.method == "OPTIONS" or request.url.path in _RATE_LIMIT_EXCLUDE:
        return await call_next(request)

    today = datetime.date.today()
    if _rate_window["date"] != today:
        _rate_window["date"] = today
        _rate_window["count"] = 0
    _rate_window["count"] += 1
    if _rate_window["count"] > DAILY_REQUEST_LIMIT:
        from fastapi.responses import JSONResponse
        origin = request.headers.get("origin", "*")
        response = JSONResponse(
            status_code=429,
            content={
                "error": "Daily request limit reached. Please try again tomorrow.",
                "limit": DAILY_REQUEST_LIMIT,
                "resets": "midnight UTC",
            },
        )
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
    return await call_next(request)
# ──────────────────────────────────────────────────────────────────────────────

# Register routers (protected by API Key if configured)
protection = [Depends(get_api_key)]

@app.get("/api/info/usage", dependencies=protection)
async def get_usage():
    """Current daily API usage — not counted against the limit."""
    import datetime
    today = datetime.date.today()
    count = _rate_window["count"] if _rate_window["date"] == today else 0
    return {
        "requests_today": count,
        "daily_limit": DAILY_REQUEST_LIMIT,
        "remaining": max(0, DAILY_REQUEST_LIMIT - count),
        "resets": "midnight UTC",
    }


app.include_router(panchanga.router, dependencies=protection)
app.include_router(horoscope.router, dependencies=protection)
app.include_router(charts.router, dependencies=protection)
app.include_router(dhasa.router, dependencies=protection)
app.include_router(match.router, dependencies=protection)
app.include_router(transit.router, dependencies=protection)
app.include_router(eclipse.router, dependencies=protection)

handler = Mangum(app)

@app.get("/")
async def root():
    return {
        "name": "PyJHora Vedic Astrology API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "panchanga": "/api/panchanga",
            "horoscope": "/api/horoscope",
            "horoscope_chart": "/api/horoscope/chart",
            "horoscope_planets": "/api/horoscope/planets",
            "charts_yoga": "/api/charts/yoga",
            "charts_dosha": "/api/charts/dosha",
            "charts_strength": "/api/charts/strength",
            "charts_ashtakavarga": "/api/charts/ashtakavarga",
            "charts_raja_yoga": "/api/charts/raja-yoga",
            "charts_arudha": "/api/charts/arudha",
            "dhasa_systems": "/api/dhasa/systems",
            "dhasa": "/api/dhasa/{system}",
            "match": "/api/match",
            "match_birth": "/api/match/birth",
            "transit_tajaka": "/api/transit/tajaka",
            "transit_saham": "/api/transit/saham",
            "eclipse": "/api/eclipse",
        },
    }


@app.get("/api/info/ayanamsas", dependencies=protection)
async def list_ayanamsas():
    """List all available ayanamsa modes."""
    from jhora import const
    return {"ayanamsas": list(const.available_ayanamsa_modes.keys())}


@app.get("/api/info/nakshatras", dependencies=protection)
async def list_nakshatras():
    """List all 27 nakshatras."""
    from jhora import utils
    utils.set_language('en')
    return {"nakshatras": [{"index": i + 1, "name": utils.NAKSHATRA_LIST[i]} for i in range(27)]}


@app.get("/api/info/raasis", dependencies=protection)
async def list_raasis():
    """List all 12 zodiac signs (raasis)."""
    from jhora import utils
    utils.set_language('en')
    return {"raasis": [{"index": i, "name": utils.RAASI_LIST[i]} for i in range(12)]}


@app.get("/api/info/cities", dependencies=protection)
async def list_cities(q: str = ""):
    """
    Search the 135K+ city database. Pass ?q=search_term to filter.
    Returns up to 50 results.
    """
    from api.cities import _load_city_db, _tz_name_to_offset
    db = _load_city_db()
    results = []
    query = q.strip().lower()
    for name, entries in db.items():
        if query and query not in name:
            continue
        for cc, (lat, lon, tz_name) in entries.items():
            results.append({
                "name": name.title(),
                "country_code": cc.upper(),
                "latitude": lat,
                "longitude": lon,
                "timezone": tz_name,
                "timezone_offset": _tz_name_to_offset(tz_name),
            })
            if len(results) >= 50:
                return {"count": f"50+ (showing first 50, use ?q= to filter)", "cities": results}
    return {"count": len(results), "cities": results}
