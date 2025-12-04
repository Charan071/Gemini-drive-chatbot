from google import genai
import os

from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

def verify():
    print(f"Verifying API Key with model: gemini-2.5-flash")
    try:
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Hello, are you working?"
        )
        print(f"✅ Success! Response: {response.text}")
    except Exception as e:
        print(f"❌ Failed with gemini-2.5-flash: {e}")
        
        print("\nRetrying with gemini-1.5-flash...")
        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents="Hello, are you working?"
            )
            print(f"✅ Success with gemini-1.5-flash! Response: {response.text}")
        except Exception as e2:
            print(f"❌ Failed with gemini-1.5-flash: {e2}")

if __name__ == "__main__":
    verify()
