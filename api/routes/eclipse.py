"""
Eclipse API routes.
"""
from fastapi import APIRouter, HTTPException
from api.models import BirthData
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/eclipse", tags=["Eclipse"])


@router.post("")
async def get_eclipse_info(data: BirthData):
    """
    Get next solar and lunar eclipse (from the given date) and location.
    """
    try:
        dob, tob, place, jd, language = parse_birth_data(data)
        from jhora.panchanga import eclipse

        def jd_to_time(jd_val):
            """
            Convert a local Julian Day decimal fraction to (year, month, day, HH:MM) string.
            The jhora functions return LOCAL JD tuples: (year, month, day, decimal_hour)
            """
            year, month, day, decimal_hour = jd_val
            h = int(decimal_hour)
            m = int(round((decimal_hour - h) * 60))
            return {
                "date": f"{year}-{month:02d}-{day:02d}",
                "time": f"{h:02d}:{m:02d}",
            }

        result = {}

        try:
            solar_raw = eclipse.next_solar_eclipse(jd, place)
            if solar_raw:
                e_type, times = solar_raw
                # solar: times = [start_jd, max_jd, end_jd]
                formatted = {
                    "type": e_type.capitalize(),
                    "note": "Times are in local timezone",
                }
                if len(times) >= 1:
                    formatted.update({"start": jd_to_time(times[0])})
                if len(times) >= 2:
                    formatted.update({"peak": jd_to_time(times[1])})
                if len(times) >= 3:
                    formatted.update({"end": jd_to_time(times[2])})
                result["solar_eclipse"] = formatted
            else:
                result["solar_eclipse"] = None
        except Exception as e:
            result["solar_eclipse"] = None

        try:
            lunar_raw = eclipse.next_lunar_eclipse(jd, place)
            if lunar_raw:
                e_type, times = lunar_raw
                # lunar: times = [penumbral_start, partial_start, total_start?, total_end?, partial_end, penumbral_end]
                # Sort by time to be safe
                formatted = {
                    "type": e_type.capitalize(),
                    "note": "Times are in local timezone",
                }
                times_sorted = sorted(times, key=lambda t: t[3])
                labels = {
                    3: ["partial_start", "peak", "partial_end"],
                    4: ["penumbral_start", "partial_start", "partial_end", "penumbral_end"],
                    5: ["penumbral_start", "partial_start", "peak", "partial_end", "penumbral_end"],
                    6: ["penumbral_start", "partial_start", "total_start", "peak", "total_end", "partial_end"],
                }
                lbls = labels.get(len(times_sorted), [f"t{i}" for i in range(len(times_sorted))])
                for lbl, t in zip(lbls, times_sorted):
                    formatted[lbl] = jd_to_time(t)
                result["lunar_eclipse"] = formatted
            else:
                result["lunar_eclipse"] = None
        except Exception as e:
            result["lunar_eclipse"] = None

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
