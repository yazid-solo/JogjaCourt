import requests

url = "http://localhost:8000/users/me/bank-info"
data = {
    "bank_name": "BCA",
    "bank_account_number": "1234567890",
    "bank_account_name": "Test User"
}
# We need a token, so we must login first
login = requests.post("http://localhost:8000/auth/login", data={"username":"admin@admin.com", "password":"password"})
if login.status_code == 200:
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.put(url, json=data, headers=headers)
    print("PUT RESPONSE:", res.status_code, res.text)
else:
    print("Login failed, assuming backend is up but auth failed.")