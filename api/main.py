"""
PyJHora REST API — Main Application
"""
import sys
import os

# Add PyJHora source to path before anything else
_pyjhora_src = os.path.join(os.path.dirname(__file__), 'PyJHora', 'src')
sys.path.insert(0, os.path.abspath(_pyjhora_src))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(panchanga.router)
app.include_router(horoscope.router)
app.include_router(charts.router)
app.include_router(dhasa.router)
app.include_router(match.router)
app.include_router(transit.router)
app.include_router(eclipse.router)

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


@app.get("/api/info/ayanamsas")
async def list_ayanamsas():
    """List all available ayanamsa modes."""
    from jhora import const
    return {"ayanamsas": list(const.available_ayanamsa_modes.keys())}


@app.get("/api/info/nakshatras")
async def list_nakshatras():
    """List all 27 nakshatras."""
    from jhora import utils
    utils.set_language('en')
    return {"nakshatras": [{"index": i + 1, "name": utils.NAKSHATRA_LIST[i]} for i in range(27)]}


@app.get("/api/info/raasis")
async def list_raasis():
    """List all 12 zodiac signs (raasis)."""
    from jhora import utils
    utils.set_language('en')
    return {"raasis": [{"index": i, "name": utils.RAASI_LIST[i]} for i in range(12)]}


@app.get("/api/info/cities")
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
