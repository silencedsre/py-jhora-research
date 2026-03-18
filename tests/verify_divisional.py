import sys
import os
import swisseph as swe

# Add PyJHora/src to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../PyJHora/src')))

from jhora.horoscope.chart import charts
from jhora.panchanga import drik

def verify_logic():
    # Test coordinates for Chennai
    jd = swe.julday(1996, 12, 7, 10.5666) # 10:34 AM
    place = drik.Place("Chennai", 13.0827, 80.2707, 5.5)
    
    print("--- D1 Rasi Chart (First 3 entries) ---")
    p1 = charts.divisional_chart(jd, place, divisional_chart_factor=1)
    for p in p1[:3]:
        print(p)
    
    print("\n--- D9 Navamsa Chart (First 3 entries) ---")
    p9 = charts.divisional_chart(jd, place, divisional_chart_factor=9)
    for p in p9[:3]:
        print(p)

if __name__ == "__main__":
    try:
        verify_logic()
    except Exception as e:
        print(f"Error during verification: {e}")
