"""Qdrant integration for user storage."""
import hashlib
import logging
from typing import Optional

from qdrant_client import models
from app.db.qdrant import get_qdrant_client
from app.models.user import User

logger = logging.getLogger(__name__)

# Collection name for users
USER_COLLECTION_NAME = "users_collection"
# Vector size for user embeddings (using 128 dimensions)
USER_VECTOR_SIZE = 128


async def init_users_collection() -> None:
    """Initialize users collection in Qdrant if it doesn't exist."""
    client = get_qdrant_client()
    
    try:
        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        if USER_COLLECTION_NAME not in collection_names:
            await client.create_collection(
                collection_name=USER_COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=USER_VECTOR_SIZE,
                    distance=models.Distance.COSINE
                ),
            )
            logger.info(f"Collection '{USER_COLLECTION_NAME}' created in Qdrant.")
        else:
            logger.info(f"Collection '{USER_COLLECTION_NAME}' already exists in Qdrant.")
    except Exception as e:
        logger.error(f"Error initializing users collection: {e}")
        raise


def generate_user_vector(user: User) -> list[float]:
    """
    Generate a vector representation for a user.
    Uses a hash-based approach to create consistent vectors from user data.
    """
    # Create a hash from user email and ID for consistency
    user_string = f"{user.id}_{user.email}_{user.full_name or ''}"
    
    # Generate hash
    hash_obj = hashlib.sha256(user_string.encode())
    hash_hex = hash_obj.hexdigest()
    
    # Convert hash to vector (128 dimensions)
    vector = []
    for i in range(0, min(len(hash_hex), USER_VECTOR_SIZE * 2), 2):
        # Convert hex pair to float between 0 and 1
        hex_pair = hash_hex[i:i+2]
        value = int(hex_pair, 16) / 255.0
        vector.append(value)
    
    # Pad or truncate to exact size
    while len(vector) < USER_VECTOR_SIZE:
        vector.append(0.0)
    
    return vector[:USER_VECTOR_SIZE]


async def save_user_to_qdrant(user: User) -> bool:
    """
    Save user data to Qdrant.
    
    Args:
        user: User model instance
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        client = get_qdrant_client()
        
        # Ensure collection exists
        await init_users_collection()
        
        # Generate vector for user
        vector = generate_user_vector(user)
        
        # Convert user ID to integer for Qdrant (using hash of ObjectId)
        # Qdrant supports string IDs too, but we'll use a hash-based integer
        user_id_hash = int(hashlib.md5(str(user.id).encode()).hexdigest()[:8], 16)
        
        # Prepare payload (user metadata)
        payload = {
            "user_id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or "",
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "email_validated": user.email_validated,
            "created": user.created.isoformat() if hasattr(user, 'created') and user.created else None,
            "modified": user.modified.isoformat() if hasattr(user, 'modified') and user.modified else None,
        }
        
        # Upsert user to Qdrant
        await client.upsert(
            collection_name=USER_COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=user_id_hash,
                    vector=vector,
                    payload=payload
                )
            ]
        )
        
        logger.info(f"User {user.email} saved to Qdrant successfully.")
        return True
        
    except Exception as e:
        logger.error(f"Error saving user {user.email} to Qdrant: {e}")
        return False


async def update_user_in_qdrant(user: User) -> bool:
    """
    Update user data in Qdrant.
    Uses the same logic as save_user_to_qdrant (upsert updates existing).
    """
    return await save_user_to_qdrant(user)


async def delete_user_from_qdrant(user_id: str) -> bool:
    """
    Delete user from Qdrant.
    
    Args:
        user_id: User ID (MongoDB ObjectId as string)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        client = get_qdrant_client()
        
        # Convert user ID to hash (same as in save_user_to_qdrant)
        user_id_hash = int(hashlib.md5(user_id.encode()).hexdigest()[:8], 16)
        
        # Delete point from Qdrant
        await client.delete(
            collection_name=USER_COLLECTION_NAME,
            points_selector=models.PointIdsList(
                points=[user_id_hash]
            )
        )
        
        logger.info(f"User {user_id} deleted from Qdrant successfully.")
        return True
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id} from Qdrant: {e}")
        return False


async def search_users_in_qdrant(
    query_vector: Optional[list[float]] = None,
    filter_conditions: Optional[dict] = None,
    limit: int = 10
) -> list[dict]:
    """
    Search for users in Qdrant.
    
    Args:
        query_vector: Vector to search for (if None, uses scroll)
        filter_conditions: Filter conditions for payload
        limit: Maximum number of results
        
    Returns:
        List of user payloads
    """
    try:
        client = get_qdrant_client()
        
        if query_vector:
            # Vector search
            results = await client.search(
                collection_name=USER_COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=models.Filter(**filter_conditions) if filter_conditions else None,
                limit=limit,
                with_payload=True
            )
            return [result.payload for result in results]
        else:
            # Scroll through all users
            response = await client.scroll(
                collection_name=USER_COLLECTION_NAME,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            return [point.payload for point in response[0]]
            
    except Exception as e:
        logger.error(f"Error searching users in Qdrant: {e}")
        return []
