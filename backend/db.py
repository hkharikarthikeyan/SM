import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', '')

def get_db():
    if not MONGO_URI or '<db_password>' in MONGO_URI:
        raise ValueError(
            "❌ MONGO_URI contains unreplaced '<db_password>'. "
            "Please open d:\\personal\\FGM-Supermarket\\backend\\.env and replace <db_password> with your actual MongoDB Atlas password."
        )

    try:
        client = MongoClient(MONGO_URI)
        return client.get_default_database()
    except Exception as e:
        print("Error connecting to MongoDB Atlas:", e)
        raise e
