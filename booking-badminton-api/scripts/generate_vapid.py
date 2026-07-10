import json
import base64
from ecdsa import SigningKey, NIST256p
import os

# Generate new key pair
sk = SigningKey.generate(curve=NIST256p)
vk = sk.get_verifying_key()

# Get private key in base64url format
private_key = base64.urlsafe_b64encode(sk.to_string()).decode('utf-8').rstrip('=')

# Get public key in base64url format (uncompressed format starting with 0x04)
public_key_bytes = b'\x04' + vk.to_string()
public_key = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')

print("\n--- VAPID KEYS ---")
print(f"VAPID_PRIVATE_KEY={private_key}")
print(f"VAPID_PUBLIC_KEY={public_key}")
print(f"VAPID_CLAIM_EMAIL=mailto:admin@jogjacourt.com")
print("------------------\n")

# Append to .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
with open(env_path, 'a') as f:
    f.write(f"\n# VAPID KEYS FOR PUSH NOTIFICATIONS\n")
    f.write(f"VAPID_PRIVATE_KEY={private_key}\n")
    f.write(f"VAPID_PUBLIC_KEY={public_key}\n")
    f.write(f"VAPID_CLAIM_EMAIL=mailto:admin@jogjacourt.com\n")
