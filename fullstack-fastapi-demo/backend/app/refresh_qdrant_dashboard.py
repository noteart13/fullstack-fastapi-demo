"""Script to verify Qdrant collections and help refresh dashboard."""
import asyncio
import sys

sys.path.append("/app")

from app.db.qdrant import get_qdrant_client


async def verify_collections():
    """Verify all collections exist and show their details."""
    print("=" * 60)
    print("Qdrant Collections Verification")
    print("=" * 60)
    
    client = get_qdrant_client()
    
    try:
        # Get all collections
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        print(f"\n✅ Found {len(collection_names)} collection(s):")
        print("-" * 60)
        
        for col_name in collection_names:
            try:
                info = await client.get_collection(col_name)
                print(f"\n📦 Collection: {col_name}")
                print(f"   Points count: {info.points_count}")
                print(f"   Vector size: {info.config.params.vectors.size}")
                print(f"   Distance: {info.config.params.vectors.distance}")
                
                # Show sample points if any
                if info.points_count > 0:
                    response = await client.scroll(
                        collection_name=col_name,
                        limit=3,
                        with_payload=True,
                        with_vectors=False
                    )
                    points = response[0]
                    print(f"   Sample points:")
                    for point in points[:3]:
                        payload_preview = str(point.payload)[:80] + "..." if len(str(point.payload)) > 80 else str(point.payload)
                        print(f"     - ID: {point.id}, Payload: {payload_preview}")
            except Exception as e:
                print(f"\n❌ Error getting info for {col_name}: {e}")
        
        print("\n" + "=" * 60)
        print("Verification complete!")
        print("=" * 60)
        print("\n💡 Dashboard Refresh Tips:")
        print("   1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)")
        print("   2. Clear browser cache")
        print("   3. Try incognito/private mode")
        print("   4. Close and reopen the dashboard tab")
        print("   5. Check browser console (F12) for errors")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(verify_collections())
