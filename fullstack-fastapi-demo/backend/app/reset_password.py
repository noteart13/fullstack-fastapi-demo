#!/usr/bin/env python3
"""
Script to reset a user's password in the database.
Usage:
    python reset_password.py <user_email_or_id> <new_password>
    
Example:
    python reset_password.py admin@mongoatlasfts.io.vn newpassword123
    python reset_password.py 694cc42edfeacf98167e5346 newpassword123
"""
import asyncio
import sys
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import MongoDatabase


async def reset_user_password(user_identifier: str, new_password: str):
    """Reset password for a user by email or ObjectId."""
    try:
        # Connect to database
        db = MongoDatabase()
        users_collection = db.users
        
        # Determine if identifier is ObjectId or email
        try:
            user_id = ObjectId(user_identifier)
            query = {"_id": user_id}
        except:
            query = {"email": user_identifier}
        
        # Find user
        user = await users_collection.find_one(query)
        
        if not user:
            print(f"❌ User not found: {user_identifier}")
            return False
        
        # Hash new password
        hashed_password = get_password_hash(new_password)
        
        # Update password
        result = await users_collection.update_one(
            query,
            {"$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Password reset successfully for user: {user.get('email', user_identifier)}")
            print(f"   User ID: {user['_id']}")
            print(f"   New password: {new_password}")
            return True
        else:
            print(f"❌ Failed to update password")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def main():
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <user_email_or_id> <new_password>")
        print("\nExample:")
        print("  python reset_password.py admin@mongoatlasfts.io.vn newpassword123")
        print("  python reset_password.py 694cc42edfeacf98167e5346 newpassword123")
        sys.exit(1)
    
    user_identifier = sys.argv[1]
    new_password = sys.argv[2]
    
    if len(new_password) < 8:
        print("⚠️  Warning: Password is shorter than 8 characters (weak password)")
        print("⚠️  Continuing anyway...")
    
    success = await reset_user_password(user_identifier, new_password)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())

