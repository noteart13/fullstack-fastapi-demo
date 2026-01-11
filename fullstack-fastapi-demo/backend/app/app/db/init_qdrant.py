from qdrant_client import models
from app.db.qdrant import get_qdrant_client
from app.db.qdrant_users import init_users_collection
import logging

logger = logging.getLogger(__name__)

async def init_qdrant() -> None:
    client = get_qdrant_client()
    collection_name = "example_collection"
    
    # Check if collection exists
    collections = await client.get_collections()
    if collection_name not in [c.name for c in collections.collections]:
        # Create collection
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
        )
        logger.info(f"Collection '{collection_name}' created.")
        
        # Insert dummy data
        await client.upsert(
            collection_name=collection_name,
            points=[
                models.PointStruct(
                    id=1,
                    vector=[0.05, 0.61, 0.76, 0.74],
                    payload={"city": "Berlin"}
                ),
                models.PointStruct(
                    id=2,
                    vector=[0.19, 0.81, 0.75, 0.11],
                    payload={"city": "London"}
                )
            ]
        )
        logger.info(f"Dummy data inserted into '{collection_name}'.")
    else:
        logger.info(f"Collection '{collection_name}' already exists.")
    
    # Initialize users collection
    try:
        await init_users_collection()
    except Exception as e:
        logger.error(f"Failed to initialize users collection: {e}")