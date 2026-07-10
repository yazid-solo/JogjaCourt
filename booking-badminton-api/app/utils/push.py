import json
import os
from pywebpush import webpush, WebPushException
from typing import Dict, Any

# Get keys from environment variables
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL")

def send_web_push(subscription_info: Dict[str, Any], message: str):
    """
    Sends a web push notification to a specific subscription endpoint.
    `subscription_info` must be a dict with 'endpoint' and 'keys' (p256dh, auth).
    """
    if not VAPID_PRIVATE_KEY or not VAPID_CLAIM_EMAIL:
        print("VAPID keys not configured, skipping push.")
        return False

    try:
        webpush(
            subscription_info=subscription_info,
            data=message,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": VAPID_CLAIM_EMAIL
            }
        )
        return True
    except WebPushException as ex:
        print(f"Web Push Error: {ex}")
        if ex.response and ex.response.json():
            print(ex.response.json())
        return False
