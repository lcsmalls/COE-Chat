import os
import json
import base64
from google import genai

def handler(request):
    try:
        data = request.get_json()
        flag_name = data["flag"]
        drawing_dataurl = data["drawing"]

        # Decode PNG from canvas
        drawing_b64 = drawing_dataurl.split(",")[1]
        drawing_bytes = base64.b64decode(drawing_b64)

        # Load SVG flag from bratai/
        flag_path = os.path.join(os.getcwd(), "..", "bratai", flag_name)
        with open(flag_path, "rb") as f:
            flag_bytes = f.read()

        # Gemini client
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        prompt = """
Compare two images:
1. Official flag (SVG)
2. User drawing (PNG)
Evaluate: colours, layout, symbols, proportions.
Return ONLY a number 0–100.
"""

        result = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                prompt,
                {"mime_type":"image/svg+xml","data":flag_bytes},
                {"mime_type":"image/png","data":drawing_bytes}
            ]
        )

        score = result.text.strip()
        return json.dumps({"score": score})

    except Exception as e:
        return json.dumps({"error": str(e)})
