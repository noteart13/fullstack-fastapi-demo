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
    print("Connecting to Qdrant...")
    client = get_qdrant_client()
    collection_name = "example_collection"
    
    try:
        # verify connection by listing collections
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        print(f"Available collections: {collection_names}")

        if collection_name in collection_names:
            response = await client.scroll(
                collection_name=collection_name,
                limit=10,
                with_payload=True,
                with_vectors=False 
            )
            points = response[0]
            print(f"Found {len(points)} points in '{collection_name}':")
            for point in points:
                print(f" - ID: {point.id}, Payload: {point.payload}")
        else:
            print(f"Collection '{collection_name}' not found.")
            
    except Exception as e:
        print(f"Error interacting with Qdrant: {e}")

if __name__ == "__main__":
    asyncio.run(main())
