#!/usr/bin/env python3
"""
CIRA Project Verification Script
Run this to check if your setup is correct before starting the application.
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and print status"""
    if Path(filepath).exists():
        print(f"✅ {description}: Found")
        return True
    else:
        print(f"❌ {description}: Missing")
        return False

def check_env_variable(key, description):
    """Check if environment variable is set"""
    value = os.getenv(key)
    if value and value.strip():
        print(f"✅ {description}: Set")
        return True
    else:
        print(f"❌ {description}: Not set or empty")
        return False

def check_backend_dependencies():
    """Check if required Python packages are installed"""
    print("\n📦 Checking Backend Dependencies...")
    required = [
        'fastapi', 'uvicorn', 'motor', 'google.auth',
        'google_auth_oauthlib', 'googleapiclient', 'google.genai',
        'dotenv', 'requests', 'pydantic'
    ]
    
    all_installed = True
    for package in required:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}: Installed")
        except ImportError:
            print(f"❌ {package}: Not installed")
            all_installed = False
    
    return all_installed

def main():
    print("🔍 CIRA Project Verification")
    print("=" * 50)
    
    # Check backend files
    print("\n📁 Backend Files:")
    backend_ok = all([
        check_file_exists("backend/main.py", "main.py"),
        check_file_exists("backend/config.py", "config.py"),
        check_file_exists("backend/database.py", "database.py"),
        check_file_exists("backend/requirements.txt", "requirements.txt"),
        check_file_exists("backend/.env", ".env file"),
    ])
    
    # Check frontend files
    print("\n📁 Frontend Files:")
    frontend_ok = all([
        check_file_exists("frontend/src/App.jsx", "App.jsx"),
        check_file_exists("frontend/src/config.js", "config.js"),
        check_file_exists("frontend/src/index.css", "index.css"),
        check_file_exists("frontend/package.json", "package.json"),
        check_file_exists("frontend/tailwind.config.cjs", "tailwind.config.cjs"),
    ])
    
    # Check environment variables
    print("\n🔑 Environment Variables (.env):")
    
    # Load .env file manually
    env_path = Path("backend/.env")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    env_ok = all([
        check_env_variable("MONGO_URI", "MongoDB URI"),
        check_env_variable("GOOGLE_CLIENT_ID", "Google Client ID"),
        check_env_variable("GOOGLE_CLIENT_SECRET", "Google Client Secret"),
        check_env_variable("REDIRECT_URI", "Redirect URI"),
        check_env_variable("FRONTEND_URL", "Frontend URL"),
    ])
    
    # Check dependencies
    deps_ok = check_backend_dependencies()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Verification Summary:")
    print(f"   Backend Files: {'✅ OK' if backend_ok else '❌ Issues found'}")
    print(f"   Frontend Files: {'✅ OK' if frontend_ok else '❌ Issues found'}")
    print(f"   Environment: {'✅ OK' if env_ok else '❌ Issues found'}")
    print(f"   Dependencies: {'✅ OK' if deps_ok else '❌ Issues found'}")
    
    if all([backend_ok, frontend_ok, env_ok, deps_ok]):
        print("\n🎉 All checks passed! You're ready to start CIRA.")
        print("\nNext steps:")
        print("  1. Terminal 1: cd backend && python -m uvicorn main:app --reload --port 5678")
        print("  2. Terminal 2: cd frontend && npm run dev")
        print("  3. Open http://localhost:5173")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\nCommon fixes:")
        if not env_ok:
            print("  - Add Google OAuth credentials to backend/.env")
        if not deps_ok:
            print("  - Run: cd backend && pip install -r requirements.txt")
        if not frontend_ok:
            print("  - Run: cd frontend && npm install")
        return 1

if __name__ == "__main__":
    sys.exit(main())
