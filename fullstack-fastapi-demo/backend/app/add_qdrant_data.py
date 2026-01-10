"""Script to add data to Qdrant collections."""
import asyncio
import sys
import os

# Ensure /app is in path
sys.path.append("/app")

from qdrant_client import models
from app.db.qdrant import get_qdrant_client


async def add_example_data():
    """Add example data to Qdrant."""
    print("=" * 60)
    print("Adding Data to Qdrant")
    print("=" * 60)
    
    client = get_qdrant_client()
    collection_name = "example_collection"
    
    try:
        # Check if collection exists
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        if collection_name not in collection_names:
            print(f"❌ Collection '{collection_name}' not found!")
            print("Creating collection...")
            await client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
            )
            print(f"✅ Collection '{collection_name}' created!")
        
        # Add new points
        print(f"\n📝 Adding points to '{collection_name}'...")
        
        await client.upsert(
            collection_name=collection_name,
            points=[
                models.PointStruct(
                    id=3,
                    vector=[0.25, 0.45, 0.65, 0.85],
                    payload={"city": "Paris", "country": "France", "population": 2100000}
                ),
                models.PointStruct(
                    id=4,
                    vector=[0.15, 0.35, 0.55, 0.75],
                    payload={"city": "Tokyo", "country": "Japan", "population": 14000000}
                ),
                models.PointStruct(
                    id=5,
                    vector=[0.30, 0.50, 0.70, 0.90],
                    payload={"city": "New York", "country": "USA", "population": 8000000}
                ),
            ]
        )
        print("✅ Points added successfully!")
        
        # Verify data
        print("\n📊 Verifying data...")
        response = await client.scroll(
            collection_name=collection_name,
            limit=10,
            with_payload=True,
            with_vectors=False
        )
        points = response[0]
        print(f"Total points in collection: {len(points)}")
        print("\nPoints:")
        for point in points:
            print(f"  ID: {point.id}, Payload: {point.payload}")
        
        print("\n" + "=" * 60)
        print("✅ Data addition complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(add_example_data())
