import os
from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    """Get Supabase client for storage"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase credentials not configured in .env")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def upload_image_to_supabase(file_bytes: bytes, filename: str, bucket_name: str = "payments") -> str:
    """Upload an image to Supabase Storage and return the public URL"""
    try:
        supabase = get_supabase_client()
        
        # Check if bucket exists, if not this might fail but it's handled by Supabase REST
        res = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": "image/jpeg", "x-upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        # Return none or raise, but we don't want to crash the whole request usually
        raise Exception(f"Failed to upload image: {str(e)}")
