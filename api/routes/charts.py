"""
Chart analysis API routes — Yoga, Dosha, Strength, Ashtakavarga, Raja Yoga, Arudha.
"""
from fastapi import APIRouter, HTTPException
from api.models import BirthData
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/charts", tags=["Charts"])


@router.post("/yoga")
async def get_yogas(data: BirthData):
    """Get all applicable yogas for the given birth data."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import yoga

        yogas = yoga.get_yoga_details(jd, place, divisional_chart_factor=1, language=language)

        return {"yogas": yogas}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/dosha")
async def get_doshas(data: BirthData):
    """Get doshas (Mangal Dosha, Kaala Sarpa, etc.) for the given birth data."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import charts, dosha

        planet_positions = charts.rasi_chart(jd, place)
        result = {}

        try:
            # dosha.manglik returns [Manglik=True/False, Exceptions=True/False, [Exception Indices]]
            mangal = dosha.manglik(planet_positions)
            result["manglik_dosha"] = mangal
        except Exception:
            result["manglik_dosha"] = None

        try:
            from jhora import utils
            house_to_planet_list = utils.get_house_planet_list_from_planet_positions(planet_positions)
            
            # dosha.kala_sarpa returns True/False
            ksd = dosha.kala_sarpa(house_to_planet_list)
            result["kaala_sarpa_dosha"] = ksd
        except Exception:
            result["kaala_sarpa_dosha"] = None

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/strength")
async def get_strength(data: BirthData):
    """Get Shad Bala, Bhava Bala, and other strength measures."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import strength

        result = {}
        try:
            shad_bala = strength.shad_bala(jd, place)
            result["shad_bala"] = shad_bala
        except Exception as e:
            result["shad_bala"] = str(e)

        try:
            bhava_bala = strength.bhava_bala(jd, place)
            result["bhava_bala"] = bhava_bala
        except Exception as e:
            result["bhava_bala"] = str(e)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/ashtakavarga")
async def get_ashtakavarga(data: BirthData):
    """Get Ashtakavarga tables (Binna and Sarva)."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import charts, ashtakavarga
        from jhora import utils

        planet_positions = charts.rasi_chart(jd, place)
        house_to_planet_list = utils.get_house_planet_list_from_planet_positions(planet_positions)
        result = ashtakavarga.get_ashtaka_varga(house_to_planet_list)

        return {"ashtakavarga": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/raja-yoga")
async def get_raja_yogas(data: BirthData):
    """Get Raja Yogas for the given birth data."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import charts, raja_yoga

        planet_positions = charts.rasi_chart(jd, place)
        result = raja_yoga.get_raja_yogas(planet_positions)

        return {"raja_yogas": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/arudha")
async def get_arudha_padhas(data: BirthData):
    """Get Arudha Padhas for the given birth data."""
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.chart import charts, arudhas

        planet_positions = charts.rasi_chart(jd, place)
        result = arudhas.get_arudha_padhas(planet_positions)

        return {"arudha_padhas": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
