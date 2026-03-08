"""
Helper utilities for extracting parsed birth data into jhora-compatible objects.
"""
import sys
import os

# Add the PyJHora source to path
_pyjhora_src = os.path.join(os.path.dirname(__file__), '..', 'PyJHora', 'src')
if _pyjhora_src not in sys.path:
    sys.path.insert(0, os.path.abspath(_pyjhora_src))

from jhora.panchanga import drik
from jhora import utils, const


def parse_birth_data(data):
    """
    Parse a BirthData model into jhora-compatible objects.
    Returns (dob, tob, place, jd, language).
    """
    # Parse date
    parts = data.date.split('-')
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    dob = drik.Date(year, month, day)

    # Parse time
    time_parts = data.time.strip().replace('AM', '').replace('PM', '').split(':')
    hour = int(time_parts[0])
    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
    second = int(time_parts[2]) if len(time_parts) > 2 else 0
    tob = (hour, minute, second)

    # Set language
    language = data.language or 'en'
    utils.set_language(language)

    # Set ayanamsa if provided
    if data.ayanamsa:
        drik.set_ayanamsa_mode(data.ayanamsa)

    # Set Rahu/Ketu node type (True Nodes vs Mean Nodes)
    drik.set_planet_list(set_rahu_ketu_as_true_nodes=data.true_nodes)

    # Set sunrise calculation mode (disc center vs bottom, refraction)
    from jhora import utils as jhora_utils
    drik.RISE_FLAGS = jhora_utils.set_flags_for_rise_set(
        flags_for_rise=True,
        use_disc_center_for_rising=data.sunrise_disc_center,
        use_refraction=data.sunrise_refraction,
    )
    drik.SET_FLAGS = jhora_utils.set_flags_for_rise_set(
        flags_for_rise=False,
        use_disc_center_for_rising=data.sunrise_disc_center,
        use_refraction=data.sunrise_refraction,
    )

    # Resolve place
    if data.place and (data.latitude is None or data.longitude is None):
        # Try built-in city database first
        from api.cities import lookup_city
        city_coords = lookup_city(data.place)
        if city_coords:
            place_name = data.place
            lat, lon, tz = city_coords
        else:
            # Fall back to Nominatim geocoding
            try:
                loc = utils.get_location_using_nominatim(data.place)
                place_name = data.place
                lat = loc[1]
                lon = loc[2]
                tz = loc[3]
            except Exception:
                raise ValueError(
                    f"Could not resolve place: {data.place}. "
                    f"Please provide latitude, longitude, and timezone_offset, "
                    f"or use a known city name."
                )
    elif data.latitude is not None and data.longitude is not None:
        place_name = data.place or "Custom"
        lat = data.latitude
        lon = data.longitude
        tz = data.timezone_offset
        if tz is None:
            from timezonefinder import TimezoneFinder
            import pytz
            from datetime import datetime
            tf = TimezoneFinder()
            tz_name = tf.timezone_at(lng=lon, lat=lat)
            if tz_name:
                tz_obj = pytz.timezone(tz_name)
                dt = datetime(year, month, day, hour, minute, second)
                tz = tz_obj.utcoffset(dt).total_seconds() / 3600
            else:
                tz = 0.0
    else:
        raise ValueError("Either 'place' or 'latitude'+'longitude' must be provided.")

    place = drik.Place(place_name, lat, lon, tz)

    # Note: PyJHora's internal functions (drik.py, vimsottari.py) expect a JD 
    # constructed from local time directly (without timezone subtraction).
    # They handle timezone offset internally based on the `place` object.
    jd = utils.julian_day_number(dob, tob)

    return dob, tob, place, jd, language
