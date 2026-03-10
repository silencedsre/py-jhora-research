"""
Panchanga API routes.
"""
from fastapi import APIRouter, HTTPException
from api.models import BirthData
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/panchanga", tags=["Panchanga"])


@router.post("")
async def get_panchanga(data: BirthData):
    """
    Get full Panchanga information for a given date, time, and location.
    
    Returns tithi, nakshatra, yoga, karana, sunrise/sunset, rahu kalam,
    yamagandam, gulikai, abhijit muhurta, durmuhurtam, and more.
    """
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.panchanga import drik
        from jhora import utils

        jd_utc = utils.gregorian_to_jd(dob)
        tob_hrs = tob[0] + tob[1] / 60 + tob[2] / 3600

        result = {}

        # Vaara (day of week)
        vaaram = drik.vaara(jd, place)
        result["vaara"] = {"index": vaaram, "name": utils.DAYS_LIST[vaaram]}

        # Tithi
        _tithi = drik.tithi(jd, place)
        paksha = 0 if _tithi[0] <= 15 else 1
        frac_left = 100 * utils.get_fraction(_tithi[1], _tithi[2], tob_hrs)
        result["tithi"] = {
            "index": _tithi[0],
            "name": utils.TITHI_LIST[_tithi[0] - 1],
            "paksha": utils.PAKSHA_LIST[paksha],
            "start": str(utils.to_dms(_tithi[1])),
            "end": str(utils.to_dms(_tithi[2])),
            "balance_percent": round(frac_left, 2),
        }

        # Nakshatra
        nak = drik.nakshatra(jd, place)
        frac_left = 100 * utils.get_fraction(nak[2], nak[3], tob_hrs)
        from api.helpers import get_standard_nakshatra_name
        result["nakshatra"] = {
            "index": nak[0],
            "name": get_standard_nakshatra_name(nak[0]),
            "pada": nak[1],
            "start": str(utils.to_dms(nak[2])),
            "end": str(utils.to_dms(nak[3])),
            "balance_percent": round(frac_left, 2),
        }

        # Yoga
        yogam = drik.yogam(jd, place)
        frac_left = 100 * utils.get_fraction(yogam[1], yogam[2], tob_hrs)
        result["yoga"] = {
            "index": yogam[0],
            "name": utils.YOGAM_LIST[yogam[0] - 1],
            "start": str(utils.to_dms(yogam[1])),
            "end": str(utils.to_dms(yogam[2])),
            "balance_percent": round(frac_left, 2),
        }

        # Karana
        karanam = drik.karana(jd, place)
        frac_left = 100 * utils.get_fraction(karanam[1], karanam[2], tob_hrs)
        result["karana"] = {
            "index": karanam[0],
            "name": utils.KARANA_LIST[karanam[0] - 1],
            "start": str(utils.to_dms(karanam[1])),
            "end": str(utils.to_dms(karanam[2])),
            "balance_percent": round(frac_left, 2),
        }

        # Raasi
        rasi = drik.raasi(jd, place)
        result["raasi"] = {
            "index": rasi[0],
            "name": utils.RAASI_LIST[rasi[0] - 1],
            "balance_percent": round(rasi[2] * 100, 2),
        }

        # Sunrise / Sunset
        try:
            sun_rise = drik.sunrise(jd_utc, place)
            result["sunrise"] = str(sun_rise[1])
        except Exception:
            result["sunrise"] = None
        try:
            sun_set = drik.sunset(jd_utc, place)
            result["sunset"] = str(sun_set[1])
        except Exception:
            result["sunset"] = None

        # Moonrise / Moonset
        try:
            result["moonrise"] = str(drik.moonrise(jd_utc, place)[1])
        except Exception:
            result["moonrise"] = None
        try:
            result["moonset"] = str(drik.moonset(jd_utc, place)[1])
        except Exception:
            result["moonset"] = None

        # Rahu Kalam
        try:
            rk = drik.raahu_kaalam(jd, place)
            result["rahu_kalam"] = {"start": str(rk[0]), "end": str(rk[1])}
        except Exception:
            result["rahu_kalam"] = None

        # Yamagandam
        try:
            yg = drik.yamaganda_kaalam(jd, place)
            result["yamagandam"] = {"start": str(yg[0]), "end": str(yg[1])}
        except Exception:
            result["yamagandam"] = None

        # Gulikai Kalam
        try:
            gk = drik.gulikai_kaalam(jd, place)
            result["gulikai_kalam"] = {"start": str(gk[0]), "end": str(gk[1])}
        except Exception:
            result["gulikai_kalam"] = None

        # Abhijit Muhurta
        try:
            abhijit = drik.abhijit_muhurta(jd, place)
            result["abhijit_muhurta"] = {"start": str(abhijit[0]), "end": str(abhijit[1])}
        except Exception:
            result["abhijit_muhurta"] = None

        # Durmuhurtam
        try:
            dur = drik.durmuhurtam(jd, place)
            result["durmuhurtam"] = {"start": str(dur[0]), "end": str(dur[1])}
        except Exception:
            result["durmuhurtam"] = None

        # Lunar month
        try:
            maasam_no, adhik_maasa, nija_maasa = drik.lunar_month(jd, place)
            result["lunar_month"] = {
                "index": maasam_no,
                "name": utils.MONTH_LIST[maasam_no - 1],
                "is_adhika": adhik_maasa,
                "is_nija": nija_maasa,
            }
        except Exception:
            result["lunar_month"] = None

        # Samvatsara
        try:
            samvatsara = drik.samvatsara(dob, place, zodiac=0)
            result["samvatsara"] = {"index": samvatsara, "name": utils.YEAR_LIST[samvatsara]}
        except Exception:
            result["samvatsara"] = None

        result["place"] = {
            "name": place.Place,
            "latitude": place.latitude,
            "longitude": place.longitude,
            "timezone": place.timezone,
        }

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
