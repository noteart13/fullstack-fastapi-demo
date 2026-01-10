from qdrant_client import AsyncQdrantClient
from app.core.config import settings

class _QdrantClientSingleton:
    async_client: AsyncQdrantClient | None = None

    def __new__(cls):
        if not hasattr(cls, "instance"):
            cls.instance = super(_QdrantClientSingleton, cls).__new__(cls)
            cls.instance.async_client = AsyncQdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY,
                https=settings.QDRANT_HTTPS,
            )
        return cls.instance

def get_qdrant_client() -> AsyncQdrantClient:
    return _QdrantClientSingleton().async_client

async def ping_qdrant():
    client = get_qdrant_client()
    # Simple check to see if we can connect
    await client.get_collections()
