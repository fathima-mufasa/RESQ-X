from fastapi import APIRouter
import requests

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"],
)


@router.get("/{latitude}/{longitude}")
def get_weather(latitude: float, longitude: float):

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "weather_code,"
            "wind_speed_10m"
        ),
        "hourly": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation_probability,"
            "precipitation,"
            "wind_speed_10m"
        ),
        "timezone": "auto",
        "forecast_days": 3,
    }

    response = requests.get(url, params=params, timeout=10)

    response.raise_for_status()

    return response.json()