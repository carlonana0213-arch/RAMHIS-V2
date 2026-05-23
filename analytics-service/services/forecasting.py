import pandas as pd
from prophet import Prophet

def generate_patient_forecast(df):

    grouped = (
        df.groupby("missionDate")
        .size()
        .reset_index(name="y")
    )

    grouped.columns = ["ds", "y"]

    grouped["ds"] = pd.to_datetime(grouped["ds"])

    grouped = grouped.sort_values("ds")

    if len(grouped) < 2:
        return None

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.5
    )

    model.fit(grouped)

    future = model.make_future_dataframe(
        periods=30
    )

    forecast = model.predict(future)

    latest = forecast.iloc[-1]

    return {
        "predictedPatients": max(
            0,
            round(float(latest["yhat"]))
        ),

        "confidenceRange": {
            "min": round(float(latest["yhat_lower"])),
            "max": round(float(latest["yhat_upper"]))
        },

        "forecastTrend": (
            forecast[
                ["ds", "yhat", "yhat_lower", "yhat_upper"]
            ]
            .tail(30)
            .to_dict(orient="records")
        )
    }