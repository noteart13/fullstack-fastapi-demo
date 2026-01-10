import asyncio
import sys
import os

# Ensure /app is in path if not already (it should be)
sys.path.append("/app")

try:
    from app.db.qdrant import get_qdrant_client
    from qdrant_client import models
except ImportError as e:
    print(f"ImportError: {e}")
    sys.exit(1)

async def main():
    print("=" * 60)
    print("Qdrant Data Check")
    print("=" * 60)
    print("\nConnecting to Qdrant...")
    client = get_qdrant_client()
    collection_name = "example_collection"
    
    try:
        # verify connection by listing collections
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        print(f"✓ Connection successful!")
        print(f"\nAvailable collections: {collection_names}")

        if collection_name in collection_names:
            # Get collection info
            collection_info = await client.get_collection(collection_name)
            print(f"\n{'=' * 60}")
            print(f"Collection: {collection_name}")
            print(f"{'=' * 60}")
            print(f"Points count: {collection_info.points_count}")
            print(f"Vector size: {collection_info.config.params.vectors.size}")
            print(f"Distance metric: {collection_info.config.params.vectors.distance}")
            
            # Scroll through points
            response = await client.scroll(
                collection_name=collection_name,
                limit=100,  # Increased limit to show more data
                with_payload=True,
                with_vectors=False 
            )
            points = response[0]
            print(f"\nFound {len(points)} point(s) in '{collection_name}':")
            print("-" * 60)
            for point in points:
                print(f"  ID: {point.id}")
                print(f"  Payload: {point.payload}")
                print("-" * 60)
        else:
            print(f"\n⚠ Collection '{collection_name}' not found.")
            print("  It will be created automatically on next backend initialization.")
            
    except Exception as e:
        print(f"\n✗ Error interacting with Qdrant: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("Check complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
