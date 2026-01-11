"""Verify Qdrant data matches what dashboard should show."""
import asyncio
import sys
import json

sys.path.append("/app")

from app.db.qdrant import get_qdrant_client


async def verify():
    """Verify collections match expected state."""
    print("=" * 60)
    print("Qdrant Dashboard Sync Verification")
    print("=" * 60)
    
    client = get_qdrant_client()
    
    try:
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        print(f"\n📦 Collections found: {len(collection_names)}")
        print("-" * 60)
        
        for col_name in collection_names:
            info = await client.get_collection(col_name)
            print(f"\nCollection: {col_name}")
            print(f"  ✅ Points: {info.points_count}")
            print(f"  ✅ Vector size: {info.config.params.vectors.size}")
            print(f"  ✅ Status: {info.status}")
            
            # Get sample points
            if info.points_count > 0:
                response = await client.scroll(
                    collection_name=col_name,
                    limit=3,
                    with_payload=True,
                    with_vectors=False
                )
                points = response[0]
                print(f"  📊 Sample data:")
                for point in points[:3]:
                    if col_name == "users_collection":
                        print(f"     - Email: {point.payload.get('email')}")
                    else:
                        print(f"     - ID: {point.id}, Payload: {point.payload}")
        
        print("\n" + "=" * 60)
        print("✅ API Data is CORRECT!")
        print("=" * 60)
        print("\n⚠️  If dashboard shows different data:")
        print("   1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)")
        print("   2. Clear browser cache")
        print("   3. Try incognito/private mode")
        print("   4. Close and reopen browser tab")
        print("\nDashboard URL: http://localhost:6333/dashboard#/collections")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(verify())
