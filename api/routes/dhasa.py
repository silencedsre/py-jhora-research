"""
Dhasa-Bhukthi API routes.
Supports 22+ dhasa systems via a single generic endpoint.
"""
from fastapi import APIRouter, HTTPException
from api.models import DhasaRequest
from api.helpers import parse_birth_data

router = APIRouter(prefix="/api/dhasa", tags=["Dhasa"])

# Map of dhasa system names to their module paths
GRAHA_DHASAS = {
    "vimsottari": "jhora.horoscope.dhasa.graha.vimsottari",
    "ashtottari": "jhora.horoscope.dhasa.graha.ashtottari",
    "yogini": "jhora.horoscope.dhasa.graha.yogini",
    "kaala": "jhora.horoscope.dhasa.graha.kaala",
    "karaka": "jhora.horoscope.dhasa.graha.karaka",
    "naisargika": "jhora.horoscope.dhasa.graha.naisargika",
    "tara": "jhora.horoscope.dhasa.graha.tara",
    "panchottari": "jhora.horoscope.dhasa.graha.panchottari",
    "shodasottari": "jhora.horoscope.dhasa.graha.shodasottari",
    "dwadasottari": "jhora.horoscope.dhasa.graha.dwadasottari",
    "shattrimsa_sama": "jhora.horoscope.dhasa.graha.shattrimsa_sama",
    "chathuraseethi_sama": "jhora.horoscope.dhasa.graha.chathuraaseethi_sama",
    "shastihayani": "jhora.horoscope.dhasa.graha.shastihayani",
    "sataatbika": "jhora.horoscope.dhasa.graha.sataatbika",
    "dwisapathi": "jhora.horoscope.dhasa.graha.dwisatpathi",
    "buddhi_gathi": "jhora.horoscope.dhasa.graha.buddhi_gathi",
    "tithi_ashtottari": "jhora.horoscope.dhasa.graha.tithi_ashtottari",
    "tithi_yogini": "jhora.horoscope.dhasa.graha.tithi_yogini",
    "yoga_vimsottari": "jhora.horoscope.dhasa.graha.yoga_vimsottari",
    "saptharishi_nakshathra": "jhora.horoscope.dhasa.graha.saptharishi_nakshathra",
    "aayu": "jhora.horoscope.dhasa.graha.aayu",
    "karana_chathuraseethi_sama": "jhora.horoscope.dhasa.graha.karana_chathuraaseethi_sama",
}

RAASI_DHASAS = {
    "narayana": "jhora.horoscope.dhasa.raasi.narayana",
    "chara": "jhora.horoscope.dhasa.raasi.chara",
    "moola": "jhora.horoscope.dhasa.raasi.moola",
    "kalachakra": "jhora.horoscope.dhasa.raasi.kalachakra",
    "navamsa": "jhora.horoscope.dhasa.raasi.navamsa",
    "nirayana": "jhora.horoscope.dhasa.raasi.nirayana",
    "drig": "jhora.horoscope.dhasa.raasi.drig",
    "shoola": "jhora.horoscope.dhasa.raasi.shoola",
    "sudasa": "jhora.horoscope.dhasa.raasi.sudasa",
    "brahma": "jhora.horoscope.dhasa.raasi.brahma",
    "varnada": "jhora.horoscope.dhasa.raasi.varnada",
    "yogardha": "jhora.horoscope.dhasa.raasi.yogardha",
    "mandooka": "jhora.horoscope.dhasa.raasi.mandooka",
    "sthira": "jhora.horoscope.dhasa.raasi.sthira",
    "trikona": "jhora.horoscope.dhasa.raasi.trikona",
    "paryaaya": "jhora.horoscope.dhasa.raasi.paryaaya",
    "kendradhi_rasi": "jhora.horoscope.dhasa.raasi.kendradhi_rasi",
    "lagnamsaka": "jhora.horoscope.dhasa.raasi.lagnamsaka",
    "padhanadhamsa": "jhora.horoscope.dhasa.raasi.padhanadhamsa",
    "tara_lagna": "jhora.horoscope.dhasa.raasi.tara_lagna",
    "chakra": "jhora.horoscope.dhasa.raasi.chakra",
}

ANNUAL_DHASAS = {
    "mudda": "jhora.horoscope.dhasa.annual.mudda",
    "patyayini": "jhora.horoscope.dhasa.annual.patyayini",
}

ALL_DHASAS = {**GRAHA_DHASAS, **RAASI_DHASAS, **ANNUAL_DHASAS}


@router.get("/systems")
async def list_dhasa_systems():
    """List all available dhasa systems."""
    return {
        "graha_dhasas": list(GRAHA_DHASAS.keys()),
        "raasi_dhasas": list(RAASI_DHASAS.keys()),
        "annual_dhasas": list(ANNUAL_DHASAS.keys()),
    }


@router.post("/{system}")
async def get_dhasa(system: str, data: DhasaRequest):
    """
    Compute dhasa-bhukthi for any supported dhasa system.
    
    Use GET /api/dhasa/systems to see all available systems.
    """
    system = system.lower()
    if system not in ALL_DHASAS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown dhasa system: '{system}'. Available: {list(ALL_DHASAS.keys())}",
        )

    try:
        bd = data.birth_data
        dob, tob, place, jd, language = parse_birth_data(bd)
        import importlib

        mod = importlib.import_module(ALL_DHASAS[system])

        # Build candidate function names — modules use various naming conventions
        candidate_names = [
            f"get_{system}_dhasa_bhukthi",        # e.g., get_vimsottari_dhasa_bhukthi
            f"{system}_dhasa_bhukthi",             # e.g., vimsottari_dhasa_bhukthi
            f"{system}_dhasa_for_rasi_chart",      # e.g., narayana_dhasa_for_rasi_chart
            f"{system}_dhasa_for_divisional_chart", # e.g., narayana_dhasa_for_divisional_chart
            "get_dhasa_bhukthi",
            "get_dhasa_antardhasa",
            "dhasa_bhukthi",
        ]
        
        # Also discover any function containing "dhasa" in the module
        available_funcs = [f for f in dir(mod) if not f.startswith('_') and callable(getattr(mod, f))]
        for fname in available_funcs:
            if "dhasa" in fname.lower() and fname not in candidate_names:
                candidate_names.append(fname)

        result = None
        last_error = None
        for func_name in candidate_names:
            fn = getattr(mod, func_name, None)
            if fn is None:
                continue
            # Try multiple calling conventions
            # Compute years since birth for annual dhasas
            from datetime import date as dt_date
            birth_date_parts = bd.date.split('-')
            years_since = dt_date.today().year - int(birth_date_parts[0])

            def _has_data(r):
                """Check if result actually contains dhasa data."""
                if r is None:
                    return False
                if isinstance(r, tuple) and len(r) == 2:
                    _, periods = r
                    return isinstance(periods, (list, tuple)) and len(periods) > 0
                if isinstance(r, (list, tuple)):
                    return len(r) > 0
                return True

            # Try (dob,tob,place) first — many functions need all 3 positional args
            # Some modules expect dob as a plain tuple (year, month, day), not a drik.Date
            dob_tuple = (dob.year, dob.month, dob.day)
            for call_args in [
                lambda: fn(dob, tob, place, divisional_chart_factor=data.divisional_chart_factor, dhasa_level_index=data.depth),
                lambda: fn(dob, tob, place, divisional_chart_factor=data.divisional_chart_factor),
                lambda: fn(dob, tob, place, dhasa_level_index=data.depth),
                lambda: fn(dob, tob, place),
                lambda: fn(dob_tuple, tob, place, divisional_chart_factor=data.divisional_chart_factor, dhasa_level_index=data.depth),
                lambda: fn(dob_tuple, tob, place, divisional_chart_factor=data.divisional_chart_factor),
                lambda: fn(dob_tuple, tob, place, dhasa_level_index=data.depth),
                lambda: fn(dob_tuple, tob, place),
                lambda: fn(jd, place, divisional_chart_factor=data.divisional_chart_factor, dhasa_level_index=data.depth),
                lambda: fn(jd, place, divisional_chart_factor=data.divisional_chart_factor),
                lambda: fn(jd, place, dhasa_level_index=data.depth),
                lambda: fn(jd, place),
                lambda: fn(jd, place, years_since, dhasa_level_index=data.depth),
                lambda: fn(jd, place, years_since),
                lambda: fn(jd, place, years_since, divisional_chart_factor=data.divisional_chart_factor, dhasa_level_index=data.depth),
                lambda: fn(jd, place, years_since, divisional_chart_factor=data.divisional_chart_factor),
            ]:
                try:
                    result = call_args()
                    if _has_data(result):
                        break
                    result = None  # Reset if empty
                except Exception as e:
                    last_error = e
                    continue
            if result is not None:
                break

        if result is None:
            raise HTTPException(
                status_code=500,
                detail=f"Could not find a compatible function in '{system}'. "
                       f"Available: {available_funcs}. Last error: {str(last_error)}",
            )

        # Convert result to serializable format
        is_raasi_dhasa = system in RAASI_DHASAS
        if isinstance(result, (list, tuple)):
            serialized = _serialize_dhasa_result(result, is_raasi_dhasa=is_raasi_dhasa)
        else:
            serialized = str(result)

        return {"system": system, "dhasa_bhukthi": serialized}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


def _serialize_dhasa_result(result, is_raasi_dhasa=False):
    """Convert dhasa results into properly formatted dasha-bhukthi periods."""
    from jhora import utils

    PLANET_NAMES = {
        0: "Sun", 1: "Moon", 2: "Mars", 3: "Mercury", 4: "Jupiter",
        5: "Venus", 6: "Saturn", 7: "Rahu", 8: "Ketu",
    }
    RAASI_NAMES = {
        0: "Aries", 1: "Taurus", 2: "Gemini", 3: "Cancer",
        4: "Leo", 5: "Virgo", 6: "Libra", 7: "Scorpio",
        8: "Sagittarius", 9: "Capricorn", 10: "Aquarius", 11: "Pisces",
    }

    def _name(idx):
        """Map an index to planet or rasi name."""
        if isinstance(idx, str):
            if idx == "L": return "Lagna"
            return idx
        if isinstance(idx, (int, float)):
            idx = int(idx)
            if is_raasi_dhasa:
                if 0 <= idx < 12:
                    return RAASI_NAMES[idx]
            else:
                if idx in PLANET_NAMES:
                    return PLANET_NAMES[idx]
                if 0 <= idx < 12:
                    return RAASI_NAMES[idx] # Fallback for raasi-based variations of graha dashas
        return str(idx)

    # Handle tuple format: (balance_info, periods_list)
    if isinstance(result, tuple) and len(result) == 2:
        balance_info, periods_raw = result
        # Balance info
        balance = {}
        if isinstance(balance_info, (list, tuple)):
            if len(balance_info) >= 3:
                balance = {
                    "years_remaining": balance_info[0],
                    "months_remaining": balance_info[1],
                    "days_remaining": balance_info[2],
                }

        # Parse periods: each is [dasha_lord, bhukti_lord, ..., [maybe date], [maybe duration]]
        periods = []
        if isinstance(periods_raw, (list, tuple)):
            for entry in periods_raw:
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    # Identify where the date string is. Usually last or second to last.
                    # Date strings in JHora usually look like "YYYY-MM-DD" or "DD-MMM-YYYY"
                    date_idx = -1
                    duration = None
                    
                    # Check if the last element is likely a duration (float/int that isn't a date string)
                    if len(entry) >= 3:
                        last_val = entry[-1]
                        if isinstance(last_val, (int, float)) or (isinstance(last_val, str) and not (":" in last_val or "-" in last_val)):
                            duration = last_val
                            date_idx = -2
                    
                    start_date = str(entry[date_idx]).strip()
                    lords = entry[:date_idx] if date_idx != -1 else entry[:-1]
                    
                    if not lords: # Fallback if list structure is unexpected
                        lords = [entry[0]]
                    
                    depth_keys = ["dasha", "bhukti", "pratyantar", "sookshma", "prana", "deha"]
                    period_dict = {}
                    for i, lord in enumerate(lords):
                        if i < len(depth_keys):
                            period_dict[depth_keys[i]] = _name(lord)
                        else:
                            period_dict[f"level_{i+1}"] = _name(lord)
                    
                    period_dict["start_date"] = start_date
                    if duration is not None:
                        period_dict["duration"] = duration
                        
                    periods.append(period_dict)
                else:
                    periods.append({"raw": str(entry)})

        # Group by dasha lord for easy reading
        by_dasha = {}
        for p in periods:
            lord = p.get("dasha", "Unknown")
            if lord not in by_dasha:
                by_dasha[lord] = []
            by_dasha[lord].append(p)

        return {
            "balance": balance,
            "periods": periods,
            "by_dasha": by_dasha,
            "total_periods": len(periods),
        }

    # Handle flat list format (some dhasas return a simple list)
    if isinstance(result, (list, tuple)):
        periods = []
        for item in result:
            if isinstance(item, (list, tuple)):
                # Annual dhasa format: [lord, [[sub_lord, date], ...], duration_days]
                if (len(item) >= 2 and isinstance(item[1], list)
                        and len(item[1]) > 0 and isinstance(item[1][0], list)):
                    lord_name = _name(item[0])
                    duration = round(item[2], 2) if len(item) > 2 and isinstance(item[2], (int, float)) else None
                    for sub in item[1]:
                        if isinstance(sub, (list, tuple)) and len(sub) >= 2:
                            bhukti_name = _name(sub[0])
                            periods.append({
                                "dasha": lord_name,
                                "bhukti": bhukti_name,
                                "start_date": str(sub[1]).strip(),
                                "duration": duration,
                            })
                # Standard format: [lord1, lord2, ..., [maybe date], [maybe duration]]
                elif len(item) >= 2:
                    date_idx = -1
                    duration = None
                    if len(item) >= 3:
                        last_val = item[-1]
                        if isinstance(last_val, (int, float)) or (isinstance(last_val, str) and not (":" in last_val or "-" in last_val)):
                            duration = last_val
                            date_idx = -2
                    
                    start_date = str(item[date_idx]).strip()
                    lords = item[:date_idx] if date_idx != -1 else item[:-1]
                    if not lords: lords = [item[0]]
                    
                    depth_keys = ["dasha", "bhukti", "pratyantar", "sookshma", "prana", "deha"]
                    period_dict = {}
                    for i, lord in enumerate(lords):
                        if i < len(depth_keys):
                            period_dict[depth_keys[i]] = _name(lord)
                        else:
                            period_dict[f"level_{i+1}"] = _name(lord)
                    
                    period_dict["start_date"] = start_date
                    if duration is not None:
                        period_dict["duration"] = duration
                    periods.append(period_dict)
                else:
                    periods.append({"raw": str(item)})
            else:
                periods.append({"raw": str(item)})

        # Group by dasha lord
        by_dasha = {}
        for p in periods:
            lord = p.get("dasha", "Unknown")
            if lord not in by_dasha:
                by_dasha[lord] = []
            by_dasha[lord].append(p)

        return {"periods": periods, "by_dasha": by_dasha, "total_periods": len(periods)}

    return str(result)

