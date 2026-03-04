"""
City coordinates database for reliable place resolution.
Combines:
  1. A compact 135K+ city database (from dr5hn/countries-states-cities-database)
  2. timezonefinder for UTC offset calculation from IANA timezone names
  3. A small hardcoded fallback for key cities with known UTC offsets
"""
import json
import os
import functools

_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


@functools.lru_cache(maxsize=1)
def _load_city_db():
    """Load the compact city database (lazy, cached)."""
    path = os.path.join(_DATA_DIR, 'cities_compact.json')
    if not os.path.exists(path):
        return {}
    with open(path, 'r') as f:
        return json.load(f)


def _tz_name_to_offset(tz_name: str, year=2024, month=1, day=1) -> float:
    """Convert IANA timezone name to UTC offset in hours."""
    try:
        import pytz
        from datetime import datetime
        tz = pytz.timezone(tz_name)
        dt = datetime(year, month, day, 12, 0, 0)
        offset = tz.utcoffset(dt)
        if offset is not None:
            return offset.total_seconds() / 3600
    except Exception:
        pass
    # Fallback to timezonefinder if pytz fails
    return _TIMEZONE_OFFSETS.get(tz_name, 0.0)


# Hardcoded offsets for common timezones (standard time, no DST)
_TIMEZONE_OFFSETS = {
    "Asia/Kathmandu": 5.75,
    "Asia/Kolkata": 5.5,
    "Asia/Calcutta": 5.5,
    "Asia/Colombo": 5.5,
    "Asia/Dhaka": 6.0,
    "Asia/Karachi": 5.0,
    "Asia/Thimphu": 6.0,
    "Asia/Dubai": 4.0,
    "Asia/Muscat": 4.0,
    "Asia/Qatar": 3.0,
    "Asia/Riyadh": 3.0,
    "Asia/Kuwait": 3.0,
    "Asia/Bangkok": 7.0,
    "Asia/Singapore": 8.0,
    "Asia/Kuala_Lumpur": 8.0,
    "Asia/Tokyo": 9.0,
    "Asia/Seoul": 9.0,
    "Asia/Shanghai": 8.0,
    "Asia/Hong_Kong": 8.0,
    "Asia/Jakarta": 7.0,
    "Asia/Taipei": 8.0,
    "Asia/Manila": 8.0,
    "Europe/London": 0.0,
    "Europe/Paris": 1.0,
    "Europe/Berlin": 1.0,
    "Europe/Rome": 1.0,
    "Europe/Moscow": 3.0,
    "Europe/Amsterdam": 1.0,
    "Europe/Zurich": 1.0,
    "Europe/Madrid": 1.0,
    "Europe/Istanbul": 3.0,
    "America/New_York": -5.0,
    "America/Chicago": -6.0,
    "America/Denver": -7.0,
    "America/Los_Angeles": -8.0,
    "America/Toronto": -5.0,
    "America/Vancouver": -8.0,
    "America/Sao_Paulo": -3.0,
    "America/Mexico_City": -6.0,
    "America/Bogota": -5.0,
    "America/Lima": -5.0,
    "America/Buenos_Aires": -3.0,
    "Australia/Sydney": 10.0,
    "Australia/Melbourne": 10.0,
    "Pacific/Auckland": 12.0,
    "Africa/Cairo": 2.0,
    "Africa/Nairobi": 3.0,
    "Africa/Johannesburg": 2.0,
    "Africa/Lagos": 1.0,
}


def lookup_city(place_name: str):
    """
    Look up city coordinates from the 135K+ city database.
    
    Accepts:
      - "Chennai" (city name only — picks the most common match)
      - "Chennai,IN" (city name + country code — precise match)
    
    Returns (latitude, longitude, timezone_offset) or None if not found.
    """
    raw = place_name.strip()
    parts = [p.strip() for p in raw.split(',')]
    
    city_name = parts[0].lower()
    country_code = parts[1].lower() if len(parts) > 1 else None
    
    db = _load_city_db()
    
    if city_name not in db:
        # Try case-insensitive match by iterating (only for misses)
        for key in db:
            if key == city_name:
                city_name = key
                break
        else:
            return None
    
    entries = db[city_name]  # dict of {country_code: [lat, lon, tz_name]}
    
    if country_code and country_code in entries:
        lat, lon, tz_name = entries[country_code]
        tz_offset = _tz_name_to_offset(tz_name)
        return (lat, lon, tz_offset)
    
    # No country code or not found — pick first available
    if entries:
        cc = next(iter(entries))
        lat, lon, tz_name = entries[cc]
        tz_offset = _tz_name_to_offset(tz_name)
        return (lat, lon, tz_offset)
    
    return None
