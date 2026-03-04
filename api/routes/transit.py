"""
Transit / Tajaka API routes.
"""
from fastapi import APIRouter, HTTPException
from api.models import TransitRequest, BirthData
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/transit", tags=["Transit"])


@router.post("/tajaka")
async def get_tajaka(data: TransitRequest):
    """
    Get Tajaka (annual) chart information.
    """
    try:
        bd = data.birth_data
        dob, tob, place, jd, language = parse_birth_data(bd)
        from jhora.horoscope.main import Horoscope

        h = Horoscope(
            place_with_country_code=bd.place,
            latitude=place.latitude,
            longitude=place.longitude,
            timezone_offset=place.timezone,
            date_in=dob,
            birth_time=bd.time,
            language=language,
            years=data.years,
        )

        horoscope_info, horoscope_charts, ascendant_house = h.get_horoscope_information_for_chart(
            chart_index=0, chart_method=1, divisional_chart_factor=1
        )

        return {
            "years": data.years,
            "horoscope": horoscope_info,
            "charts": horoscope_charts,
            "ascendant_house": ascendant_house,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/saham")
async def get_sahams(data: BirthData):
    """
    Get all 36 Sahams (Arabic Parts) for the given birth data.
    """
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.transit import saham
        from jhora.horoscope.chart import charts
        from jhora import utils

        planet_positions = charts.rasi_chart(jd, place)
        results = {}

        for i in range(36):
            try:
                s = saham.saham(dob, tob, place, saham_index=i)
                results[f"saham_{i}"] = s
            except Exception:
                results[f"saham_{i}"] = None

        return {"sahams": results}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
