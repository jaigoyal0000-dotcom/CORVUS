import requests
import io
from PIL import Image

# Create simple test image
img = Image.new('RGB', (256, 256), color=(40, 120, 80))
buf = io.BytesIO()
img.save(buf, format='PNG')
buf.seek(0)

# Test 1: Upload with Delhi in filename
files = {'file': ('delhi_subcity_pass.png', buf.getvalue(), 'image/png')}
data = {'modality': 'optical', 'project_id': 'proj_0001'}

res = requests.post('http://localhost:8000/api/v1/upload/direct', files=files, data=data)
print("Status:", res.status_code)
if res.ok:
    meta = res.json().get('geospatial_metadata', {})
    print("Location recognized:", meta.get('location_name'))
    print("Centroid:", meta.get('centroid'))
    print("Source:", meta.get('detection_source'))
    print("Preview URL:", meta.get('preview_url'))
else:
    print("Error:", res.text)
