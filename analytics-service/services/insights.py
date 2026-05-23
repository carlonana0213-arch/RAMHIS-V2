from collections import Counter

def generate_insights(df):

    diagnosis_counter = Counter()

    for diagnoses in df["diagnoses"]:

        for diagnosis in diagnoses:

            diagnosis_counter[diagnosis] += 1

    top_diagnoses = dict(
        diagnosis_counter.most_common(10)
    )

    recommendations = []

    if "Hypertension" in top_diagnoses:
        recommendations.append(
            "Increase cardiovascular medicines"
        )

    if "Asthma" in top_diagnoses:
        recommendations.append(
            "Prepare nebulizers and inhalers"
        )

    return {
        "topDiagnoses": top_diagnoses,
        "recommendations": recommendations
    }