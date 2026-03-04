import traceback
from datetime import datetime
from api.helpers import parse_birth_data
from api.models import BirthData
from jhora.panchanga import eclipse

data = BirthData(date="2024-04-08", time="12:00", latitude=28.6139, longitude=77.2090, timezone_offset=5.5)
dob, tob, place, jd, language = parse_birth_data(data)

try:
    print("Solar Eclipse...")
    solar = eclipse.next_solar_eclipse(jd, place)
    print("Result:", solar)
except Exception as e:
    print("Exception Solar Eclipse:")
    traceback.print_exc()

try:
    print("Lunar Eclipse...")
    lunar = eclipse.next_lunar_eclipse(jd, place)
    print("Result:", lunar)
except Exception as e:
    print("Exception Lunar Eclipse:")
    traceback.print_exc()
