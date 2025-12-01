import json
import base64
import os
from urllib.parse import urljoin
from flask import Request

from google import genai

def handler(request: Request):
    if request.method != "POST":
        return ("Only POST allowed", 405)

    data = request.get_json()

    flag_name = data["flag"]
    drawing_dataurl = data["drawing"]

    # remove "data:image/png;base64,"
    drawing_b64 = drawing_dataurl.split(",")[1]
    drawing_bytes = base64.b64decode(drawing_b64)

    # load correct flag file
    flag_path = os.path.join(os.getcwd(), "..", "bratai", flag_name)
    with open(flag_path, "rb") as f:
        flag_bytes = f.read()

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=[
            {
                "role": "system",
                "content": "Score the user's drawing accuracy from 0 to 100."
            },
            {
                "role": "user",
                "content": [
                    {"text": "Here is the correct flag:"},
                    {"image": {"mime_type": "image/svg+xml", "data": flag_bytes}},
                    {"text": "Here is the player's drawing:"},
                    {"image": {"mime_type": "image/png", "data": drawing_bytes}},
                    {"text": "Return ONLY a number 0–100."}
                ]
            }
        ]
    )

    # clean output (model usually returns plain number)
    score_text = response.text.strip()

    return json.dumps({"score": score_text})
