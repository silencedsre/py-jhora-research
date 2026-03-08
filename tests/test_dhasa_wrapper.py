import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath('PyJHora/src'))

from api.routes.dhasa import get_dhasa
from api.models import BirthData, DhasaRequest

birth_data = BirthData(date="1990-11-18", time="11:00", place="Kathmandu,NP")
req = DhasaRequest(birth_data=birth_data, system="vimsottari", divisional_chart_factor=1, depth=3)

async def main():
    res = await get_dhasa("vimsottari", req)
    print("Balance:", res.get("dhasa_bhukthi", {}).get("balance"))
    print("First Period:", res.get("dhasa_bhukthi", {}).get("periods")[0])

if __name__ == "__main__":
    asyncio.run(main())
