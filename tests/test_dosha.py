import sys
from api.models import BirthData
from api.helpers import parse_birth_data
from jhora.horoscope.chart import charts, dosha

data = BirthData(name="Test", place="Chennai,IN", latitude=13.0827, longitude=80.2707, timezone_offset=5.5, date="1996-12-07", time="10:34", language="en")
dob, tob, place, jd, language = parse_birth_data(data)
planet_positions = charts.rasi_chart(jd, place)

print("\nTesting Kaala Sarpa Dosha...")
try:
    print(dosha.kala_sarpa(planet_positions))
except Exception as e:
    import traceback
    traceback.print_exc()
