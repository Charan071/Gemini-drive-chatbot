from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME

import certifi

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        if not MONGO_URI:
            print("CRITICAL ERROR: MONGO_URI not found in environment variables.")
            return
        
        try:
            print(f"Attempting to connect to MongoDB with URI: {MONGO_URI[:20]}...")
            print(f"Attempting to connect to MongoDB with URI: {MONGO_URI[:20]}...")
            self.client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
            print("Connected to MongoDB client initialized.")
        except Exception as e:
            print(f"Failed to initialize MongoDB client: {e}")

    def get_db(self):
        if not self.client:
            self.connect()
        
        if not self.client:
             raise Exception("Database client is not connected. Check MONGO_URI.")
             
        return self.client[DB_NAME]

    def close(self):
        if self.client:
            self.client.close()

db = Database()


