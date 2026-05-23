import pandas as pd
from utils.mongo import (
    patients_collection,
    prescriptions_collection,
    medicines_collection
)

def prepare_mission_dataframe(location=None):

    query = {}

    if location:
        query["location"] = location

    patients = list(
        patients_collection.find(query)
    )

    mission_rows = []

    for patient in patients:

        mission_date = patient.get("missionDate")

        if not mission_date:
            continue

        doctor_sheets = patient.get("doctorSheets", [])

        diagnoses = []
        departments = []

        for sheet in doctor_sheets:

            diagnosis = sheet.get("diagnosis")

            department = sheet.get("department")

            if diagnosis:
                diagnoses.append(diagnosis)

            if department:
                departments.append(department)

        mission_rows.append({
            "patient_id": str(patient["_id"]),
            "location": patient.get("location", "Unknown"),
            "missionDate": pd.to_datetime(mission_date),
            "department": patient.get("department", "General"),
            "diagnoses": diagnoses,
            "doctorDepartments": departments,
        })

    df = pd.DataFrame(mission_rows)

    return df