"""
Marriage compatibility API routes.
Uses the Ashtakoota class from jhora.horoscope.match.compatibility.
"""
from fastapi import APIRouter, HTTPException
from api.models import MatchRequest, MatchBirthRequest

router = APIRouter(prefix="/api/match", tags=["Match"])


def _compute_compatibility(boy_nak, boy_pad, girl_nak, girl_pad, method="north"):
    """Compute compatibility using the Ashtakoota class."""
    from jhora.horoscope.match.compatibility import Ashtakoota

    ak = Ashtakoota(boy_nak, boy_pad, girl_nak, girl_pad, method=method.capitalize())

    result = {
        "method": method,
        "boy_nakshatra": boy_nak,
        "boy_paadha": boy_pad,
        "girl_nakshatra": girl_nak,
        "girl_paadha": girl_pad,
        "scores": {},
        "total_score": 0,
        "max_score": 36 if method.lower() == "north" else 10,
    }

    # North Indian Ashtakoota (8 kottas, max 36 points)
    if method.lower() == "north":
        tests = [
            ("varna", ak.varna_porutham),
            ("vasiya", ak.vasiya_porutham),
            ("tara", ak.tara_porutham),
            ("yoni", ak.yoni_porutham),
            ("maitri", ak.maitri_porutham),
            ("gana", ak.gana_porutham),
            ("rasi_adhipathi", ak.raasi_adhipathi_porutham),
            ("nadi", ak.naadi_porutham),
        ]
    else:
        tests = [
            ("dina", ak.dina_porutham_south),
            ("gana", ak.gana_porutham_south),
            ("yoni", ak.yoni_porutham),
            ("rasi", ak.raasi_porutham_south),
            ("vasiya", ak.vasiya_porutham_south),
        ]

    total = 0
    for name, fn in tests:
        try:
            score = fn()
            if isinstance(score, (list, tuple)):
                score_val = score[0] if score else 0
            else:
                score_val = score
            result["scores"][name] = score_val
            total += float(score_val) if score_val is not None else 0
        except Exception as e:
            result["scores"][name] = f"error: {str(e)}"

    result["total_score"] = total

    return result


@router.post("")
async def get_compatibility(data: MatchRequest):
    """
    Get marriage compatibility based on boy and girl nakshatra/paadha.
    Supports both 'north' (Ashtakoota, max 36) and 'south' (Dasha Koota, max 10) methods.
    """
    try:
        return _compute_compatibility(
            data.boy_nakshatra, data.boy_paadha,
            data.girl_nakshatra, data.girl_paadha,
            data.method,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/birth")
async def get_compatibility_from_birth(data: MatchBirthRequest):
    """
    Get marriage compatibility from birth data of boy and girl.
    Automatically determines nakshatra and paadha from birth details.
    """
    try:
        from api.helpers import parse_birth_data
        from jhora.panchanga import drik

        # Get boy's nakshatra
        dob_b, tob_b, place_b, jd_b, _ = parse_birth_data(data.boy)
        nak_b = drik.nakshatra(jd_b, place_b)
        boy_nak = nak_b[0]
        boy_pad = nak_b[1]

        # Get girl's nakshatra
        dob_g, tob_g, place_g, jd_g, _ = parse_birth_data(data.girl)
        nak_g = drik.nakshatra(jd_g, place_g)
        girl_nak = nak_g[0]
        girl_pad = nak_g[1]

        return _compute_compatibility(boy_nak, boy_pad, girl_nak, girl_pad, data.method)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
