from collections import Counter

def generate_medicine_forecast(df):

    medicine_counter = Counter()

    for diagnoses in df["diagnoses"]:

        for diagnosis in diagnoses:

            diagnosis = diagnosis.lower()

            if "hypertension" in diagnosis:
                medicine_counter["Losartan"] += 15
                medicine_counter["Amlodipine"] += 10

            if "asthma" in diagnosis:
                medicine_counter["Salbutamol"] += 10

            if "infection" in diagnosis:
                medicine_counter["Amoxicillin"] += 20

            if "arthritis" in diagnosis:
                medicine_counter["Celecoxib"] += 12

    result = []

    for med, qty in medicine_counter.items():

        risk = "LOW"

        if qty > 40:
            risk = "HIGH"

        elif qty > 20:
            risk = "MEDIUM"

        result.append({
            "medicine": med,
            "estimatedNeed": qty,
            "risk": risk
        })

    return result