"""Check what users are actually stored in Qdrant."""
import asyncio
import sys

sys.path.append("/app")

from app.db.qdrant import get_qdrant_client


async def check_users():
    """Check users collection data."""
    print("=" * 60)
    print("Checking Qdrant Users Collection")
    print("=" * 60)
    
    client = get_qdrant_client()
    collection_name = "users_collection"
    
    try:
        # Get collection info
        info = await client.get_collection(collection_name)
        print(f"\nCollection: {collection_name}")
        print(f"Points count: {info.points_count}")
        print(f"Vector size: {info.config.params.vectors.size}")
        print(f"Distance: {info.config.params.vectors.distance}")
        
        # Get all points
        response = await client.scroll(
            collection_name=collection_name,
            limit=100,
            with_payload=True,
            with_vectors=True
        )
        points = response[0]
        
        print(f"\nFound {len(points)} point(s):")
        print("-" * 60)
        
        for point in points:
            print(f"\nPoint ID: {point.id}")
            print(f"Vector length: {len(point.vector)}")
            print(f"Payload:")
            for key, value in point.payload.items():
                print(f"  {key}: {value}")
            print("-" * 60)
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(check_users())
