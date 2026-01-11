#!/usr/bin/env python3
"""Resync users from MongoDB to Qdrant."""
import asyncio
import sys
sys.path.append("/app")

from app.db.session import MongoDatabase
from app import crud
from app.db.qdrant_users import save_user_to_qdrant


async def resync():
    """Resync all users from MongoDB to Qdrant."""
    print("🔄 Starting user resync from MongoDB to Qdrant...")
    
    db = MongoDatabase()
    users = await crud.user.get_multi(db)
    print(f"📊 Found {len(users)} users in MongoDB")
    
    success_count = 0
    for user in users:
        try:
            result = await save_user_to_qdrant(user)
            if result:
                print(f"✅ Synced: {user.email}")
                success_count += 1
            else:
                print(f"❌ Failed: {user.email}")
        except Exception as e:
            print(f"❌ Error syncing {user.email}: {e}")
    
    print(f"\n🎉 Resync complete: {success_count}/{len(users)} users synced successfully")


if __name__ == "__main__":
    asyncio.run(resync())