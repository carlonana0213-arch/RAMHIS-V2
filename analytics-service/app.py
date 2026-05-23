from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.preprocessing import (
    prepare_mission_dataframe
)

from services.forecasting import (
    generate_patient_forecast
)

from services.medicineForecast import (
    generate_medicine_forecast
)

from services.insights import (
    generate_insights
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-forecast")
def generate_forecast(payload: dict):

    location = payload.get("location")

    nextMissionDate = payload.get("nextMissionDate")

    missionDays = payload.get("missionDays")

    df = prepare_mission_dataframe(location)

    if df.empty:

        return {
            "message": "No data found"
        }

    forecast = generate_patient_forecast(df)

    medicineForecast = generate_medicine_forecast(df)

    insights = generate_insights(df)

    return {

        "location": location,

        "nextMissionDate": nextMissionDate,

        "missionDays": missionDays,

        **forecast,

        **insights,

        "medicineForecast": medicineForecast
    }