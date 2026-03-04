"""
Horoscope API routes.
"""
from fastapi import APIRouter, HTTPException
from api.models import BirthData, ChartRequest
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/horoscope", tags=["Horoscope"])


@router.post("")
async def get_horoscope(data: BirthData):
    """
    Get complete horoscope information including calendar info and planet positions
    for the Rasi chart.
    """
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.main import Horoscope

        h = Horoscope(
            place_with_country_code=data.place,
            latitude=place.latitude,
            longitude=place.longitude,
            timezone_offset=place.timezone,
            date_in=dob,
            birth_time=data.time,
            language=language,
        )

        calendar_info = h.calendar_info
        horoscope_info, horoscope_charts, ascendant_house = h.get_horoscope_information_for_chart(
            chart_index=0, chart_method=1, divisional_chart_factor=1
        )

        return {
            "calendar": calendar_info,
            "horoscope": horoscope_info,
            "charts": horoscope_charts,
            "ascendant_house": ascendant_house,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/chart")
async def get_divisional_chart(data: ChartRequest):
    """
    Get a specific divisional chart (D1, D2, D3, D9, etc.).
    
    - chart_type: 1=Rasi, 2=Hora, 3=Drekkana, 4=Chaturthamsa, 9=Navamsa, etc.
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
        )

        horoscope_info, horoscope_charts, ascendant_house = h.get_horoscope_information_for_chart(
            chart_index=0, chart_method=data.chart_method,
            divisional_chart_factor=data.chart_type,
        )

        return {
            "chart_type": f"D{data.chart_type}",
            "horoscope": horoscope_info,
            "charts": horoscope_charts,
            "ascendant_house": ascendant_house,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/planets")
async def get_planet_positions(data: BirthData):
    """
    Get planet positions with retrograde status, Chara Karakas, and Arudha Padas for the Rasi chart.
    """
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.horoscope.main import Horoscope
        
        # Initialize Horoscope instance which pre-computes Arudhas natively
        h = Horoscope(
            place_with_country_code=data.place,
            latitude=place.latitude,
            longitude=place.longitude,
            timezone_offset=place.timezone,
            date_in=dob,
            birth_time=data.time,
            language=language,
        )
        horoscope_info, horoscope_charts, _ = h.get_horoscope_information_for_chart(
            chart_index=0, chart_method=1, divisional_chart_factor=1
        )

        from jhora.panchanga import drik
        from jhora.horoscope.chart import charts, house
        from jhora import utils

        planet_positions = charts.rasi_chart(jd, place)
        retrograde_planets = drik.planets_in_retrograde(jd, place)
        
        # Calculate Chara Karakas (returns list of planet IDs, highest degree to lowest)
        ck_list = house.chara_karakas(planet_positions)
        chara_karaka_labels = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"]

        # Parse Arudha Padhas from Horoscope Info
        ap_list = []
        for key, value in horoscope_info.items():
            if "Arudha Lagna (AL)" in key or "Pada (A" in key or "Lagna (UL)" in key or "Dhanarudha (A2)" in key or "Bhatrarudha (A3)" in key:
                abbr = key.split('(')[-1].replace(')','') if '(' in key else key.split('-')[-1].strip()
                # value is e.g. "Taurus 12° 34' 56\"" -> we want the sign name/index
                sign_name = value.split(' ')[0]
                sign_name_clean = ''.join([c for c in sign_name if c.isalpha()])
                try:
                    rasi_index = utils.RAASI_LIST.index(sign_name_clean)
                except ValueError:
                    # sometimes the first word includes emojis/symbols, try to match by substring
                    rasi_index = 0
                    for i, r in enumerate(utils.RAASI_LIST):
                        if r in sign_name:
                            rasi_index = i
                            break
                            
                ap_list.append({
                    "id": abbr,
                    "name": key.replace("D-1-", "").strip(),
                    "rasi": rasi_index,
                    "sign": utils.RAASI_LIST[rasi_index]
                })

        result = {}
        # Ascendant
        asc = planet_positions[0][1]
        asc_sign = asc[0]  # zodiac sign index (0=Aries, 1=Taurus, ... 11=Pisces)
        result["ascendant"] = {
            "house": 1,  # Ascendant is always House 1
            "rasi": asc_sign,
            "sign": utils.RAASI_LIST[asc_sign],
            "longitude": round(asc[1], 4),
        }

        # Planets
        planets = []
        for p, (sign_idx, lon) in planet_positions[1:]:
            is_retro = p in retrograde_planets
            nak_index, pada, _ = drik.nakshatra_pada(sign_idx * 30 + lon)
            house_num = ((sign_idx - asc_sign) % 12) + 1
            
            # Determine Chara Karaka
            ck = ""
            if p in ck_list:
               ck_index = ck_list.index(p)
               if ck_index < len(chara_karaka_labels):
                   ck = chara_karaka_labels[ck_index]

            planets.append({
                "id": p,
                "name": utils.PLANET_NAMES[p],
                "house": house_num,
                "rasi": sign_idx,
                "sign": utils.RAASI_LIST[sign_idx],
                "longitude": round(lon, 4),
                "retrograde": is_retro,
                "nakshatra": utils.NAKSHATRA_LIST[nak_index - 1],
                "pada": pada,
                "chara_karaka": ck
            })
            
        result["planets"] = planets
        result["arudhas"] = ap_list

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
