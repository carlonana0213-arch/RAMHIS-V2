from pymongo import MongoClient

MONGO_URI = "mongodb+srv://carlonana0213_db_user:LikhaNU2026@cluster0.jucnt4q.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)

db = client["ramhis"]

patients_collection = db["patients"]
prescriptions_collection = db["prescriptions"]
medicines_collection = db["medicines"]