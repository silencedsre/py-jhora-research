"""
Pydantic models for the PyJHora REST API.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class BirthData(BaseModel):
    """Common birth data used across most endpoints."""
    name: Optional[str] = Field(None, description="Name of the person")
    place: Optional[str] = Field(None, description="Place with country code, e.g. 'Chennai,IN'")
    latitude: Optional[float] = Field(None, description="Latitude of birth place")
    longitude: Optional[float] = Field(None, description="Longitude of birth place")
    timezone_offset: Optional[float] = Field(None, description="Timezone offset in hours, e.g. 5.5")
    date: str = Field(..., description="Date of birth in YYYY-MM-DD format, e.g. '1996-12-07'")
    time: str = Field("12:00", description="Time of birth in HH:MM or HH:MM:SS format, e.g. '10:34'")
    language: str = Field("en", description="Language code: en, ta, te, hi, ka")
    ayanamsa: Optional[str] = Field(None, description="Ayanamsa mode, e.g. 'LAHIRI'. See /api/info/ayanamsas")
    true_nodes: bool = Field(True, description="Use True Nodes for Rahu/Ketu (True) or Mean Nodes (False). Default: True (matches JHora)")
    sunrise_disc_center: bool = Field(True, description="Sunrise w.r.t. centre of disc (True, Hindu) or bottom edge (False, Western)")
    sunrise_refraction: bool = Field(False, description="Apply atmospheric refraction to sunrise/sunset (False = geometric/Hindu default)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Test",
                "place": "Chennai,IN",
                "date": "1996-12-07",
                "time": "10:34",
                "language": "en"
            }
        }


class MatchRequest(BaseModel):
    """Request for marriage compatibility."""
    boy_nakshatra: int = Field(..., description="Boy's nakshatra number (1-27)")
    boy_paadha: int = Field(..., description="Boy's nakshatra paadha (1-4)")
    girl_nakshatra: int = Field(..., description="Girl's nakshatra number (1-27)")
    girl_paadha: int = Field(..., description="Girl's nakshatra paadha (1-4)")
    method: str = Field("north", description="Compatibility method: 'north' or 'south'")

    class Config:
        json_schema_extra = {
            "example": {
                "boy_nakshatra": 1,
                "boy_paadha": 1,
                "girl_nakshatra": 14,
                "girl_paadha": 1,
                "method": "north"
            }
        }


class MatchBirthRequest(BaseModel):
    """Request for marriage compatibility using birth data."""
    boy: BirthData
    girl: BirthData
    method: str = Field("north", description="Compatibility method: 'north' or 'south'")


class ChartRequest(BaseModel):
    """Request for a specific divisional chart."""
    birth_data: BirthData
    chart_type: int = Field(1, description="Divisional chart factor: 1=Rasi, 2=Hora, 3=Drekkana, 9=Navamsa, etc.")
    chart_method: int = Field(1, description="Chart calculation method (1-based)")


class DhasaRequest(BaseModel):
    """Request for dhasa-bhukthi computation."""
    birth_data: BirthData
    system: str = Field("vimsottari", description="Dhasa system name, e.g. 'vimsottari', 'ashtottari', 'yogini', 'narayana'")
    divisional_chart_factor: int = Field(1, description="Divisional chart factor")
    depth: int = Field(2, ge=1, le=6, description="Calculation depth: 1=Maha, 2=Bhukti, 3=Pratyantar, 4=Sookshma, 5=Prana, 6=Deha")


class TransitRequest(BaseModel):
    """Request for transit/tajaka data."""
    birth_data: BirthData
    years: int = Field(1, description="Number of years for annual chart")
