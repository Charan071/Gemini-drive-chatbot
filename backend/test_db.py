import asyncio
from database import db
from services.session_service import save_session_data, get_session_data
from config import MONGO_URI

async def main():
    print(f"Testing MongoDB connection...")
    db.connect()
    
    try:
        # Try a simple write and read
        await save_session_data("verify-connection", {"status": "ok"})
        data = await get_session_data("verify-connection")
        
        if data and data.get("status") == "ok":
            print("✅ MongoDB Connection Successful!")
        else:
            print("❌ MongoDB Connection Failed (Read mismatch)")
            
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
