import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.db.init_qdrant import init_qdrant
from qdrant_client import models

@pytest.mark.asyncio
async def test_init_qdrant_creates_collection_if_not_exists():
    # Mock the client
    mock_client = AsyncMock()
    
    # Mock get_collections response
    mock_collections_response = MagicMock()
    mock_collections_response.collections = []
    mock_client.get_collections.return_value = mock_collections_response

    # Mock get_qdrant_client to return our mock_client
    with patch("app.db.init_qdrant.get_qdrant_client", return_value=mock_client):
        await init_qdrant()

    # Verify create_collection was called
    mock_client.create_collection.assert_called_once()
    
    # Verify arguments
    call_args = mock_client.create_collection.call_args
    assert call_args.kwargs['collection_name'] == "example_collection"
    assert isinstance(call_args.kwargs['vectors_config'], models.VectorParams)

    # Verify upsert was called
    mock_client.upsert.assert_called_once()

@pytest.mark.asyncio
async def test_init_qdrant_skips_if_exists():
    mock_client = AsyncMock()
    
    # Mock existing collection
    mock_collection = MagicMock()
    mock_collection.name = "example_collection"
    
    mock_collections_response = MagicMock()
    mock_collections_response.collections = [mock_collection]
    mock_client.get_collections.return_value = mock_collections_response

    with patch("app.db.init_qdrant.get_qdrant_client", return_value=mock_client):
        await init_qdrant()

    # Verify create_collection was NOT called
    mock_client.create_collection.assert_not_called()
    mock_client.upsert.assert_not_called()

@pytest.mark.asyncio
async def test_init_qdrant_raises_exception_on_error():
    mock_client = AsyncMock()
    
    # Simulate an error (e.g., connection error)
    mock_client.get_collections.side_effect = Exception("Connection refused")

    with patch("app.db.init_qdrant.get_qdrant_client", return_value=mock_client):
        with pytest.raises(Exception, match="Connection refused"):
            await init_qdrant()