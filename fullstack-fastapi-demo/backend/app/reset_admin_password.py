#!/usr/bin/env python3
"""
Script to reset admin password
Usage: docker exec -it <backend_container> python /app/reset_admin_password.py <email> <new_password>
Or: docker exec -it <backend_container> python /app/reset_admin_password.py
"""

import asyncio
import sys
from app.core.security import get_password_hash
from app.db.session import get_engine
from app.models.user import User
from app.core.config import settings


async def reset_admin_password(email: str = None, new_password: str = None):
    """Reset password for admin user"""
    try:
        engine = get_engine()
        
        # Use provided email or fallback to FIRST_SUPERUSER
        admin_email = email or settings.FIRST_SUPERUSER
        
        # Use provided password or fallback to FIRST_SUPERUSER_PASSWORD
        if not new_password:
            print("ERROR: New password is required!")
            print("Usage: python reset_admin_password.py <email> <new_password>")
            print(f"Or set FIRST_SUPERUSER_PASSWORD in .env")
            return False
        
        print(f"🔍 Looking for user: {admin_email}")
        
        # Find user by email
        user = await engine.find_one(User, User.email == admin_email)
        
        if not user:
            print(f"❌ ERROR: User '{admin_email}' not found!")
            print("\n📋 Available users:")
            all_users = await engine.find(User)
            for u in all_users:
                print(f"  - {u.email} (superuser: {u.is_superuser}, active: {u.is_active})")
            return False
        
        print(f"✅ Found user: {user.email}")
        print(f"   - ID: {user.id}")
        print(f"   - Superuser: {user.is_superuser}")
        print(f"   - Active: {user.is_active}")
        
        # Hash the new password
        hashed = get_password_hash(new_password)
        user.hashed_password = hashed
        
        # Save to database
        await engine.save(user)
        
        print(f"\n✅ SUCCESS: Password updated for {admin_email}")
        print(f"   New password: {new_password}")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main entry point"""
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
    elif len(sys.argv) == 2:
        # Only password provided, use FIRST_SUPERUSER
        email = None
        password = sys.argv[1]
    else:
        # Try to use env vars
        email = None
        password = getattr(settings, 'FIRST_SUPERUSER_PASSWORD', None)
    
    await reset_admin_password(email, password)


if __name__ == "__main__":
    asyncio.run(main())


