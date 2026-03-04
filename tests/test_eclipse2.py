from api.helpers import parse_birth_data
from api.models import BirthData
from jhora.panchanga import eclipse

data = BirthData(date="2024-04-08", time="12:00", latitude=28.6139, longitude=77.2090, timezone_offset=5.5)
dob, tob, place, jd, language = parse_birth_data(data)

solar = eclipse.next_solar_eclipse(jd, place)
print("Solar raw:", solar)
lunar = eclipse.next_lunar_eclipse(jd, place)
print("Lunar raw:", lunar)
print("Solar help:", eclipse.next_solar_eclipse.__doc__)
