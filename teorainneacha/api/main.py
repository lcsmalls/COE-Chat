import base64
import json
from google import genai

# Vercel runs functions by calling `handler(request, response)`
client = genai.Client(api_key="AIzaSyAvw91TEXOGreKvAUPbjV87IoGURQJNcxE") # Go ahead and use my key. See if i care.

def handler(request, response):
    try:
        # parse incoming JSON
        body = request.json()
        drawing_b64 = body["drawing"]
        flag_name = body["flag_name"]

        # Decode the user's drawing PNG
        if "," in drawing_b64:
            _, encoded = drawing_b64.split(",", 1)
        else:
            encoded = drawing_b64
        drawing_bytes = base64.b64decode(encoded)

  
        # Load the official SVG file
        flag_path = f"bratai/{flag_name}.svg"
        with open(flag_path, "rb") as f:
            flag_bytes = f.read()
        # Gemini comparison prompt
        prompt = """
Compare the two images:
1. The official flag (SVG)
2. The user's drawing (PNG)

Judge:
- colour accuracy
- symbol accuracy
- proportions
- layout

Respond ONLY with strict JSON:
{"score": number, "feedback": "string"}
"""

        # -----------------------------
        # Call Gemini
        # -----------------------------
        result = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                prompt,
                {"mime_type": "image/svg+xml", "data": flag_bytes},
                {"mime_type": "image/png", "data": drawing_bytes},
            ]
        )

        # Send output back to browser
        return response.json({
            "result": result.text   # Gemini already returns JSON text
        })

    except Exception as e:
        return response.json({"error": str(e)}, status=500)
