import urllib.request
import zipfile
import io
import os

def download_and_extract():
    url = 'https://github.com/silencedsre/py-jhora-research/releases/download/v1.0.0/ephemeris_data.zip'
    dest_path = 'PyJHora/src/jhora/data/ephe'
    os.makedirs(dest_path, exist_ok=True)
    
    print(f"Downloading ephemeris data from {url}...")
    req = urllib.request.Request(url)
    
    # Add authentication header if GITHUB_TOKEN is available
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        print("Using GITHUB_TOKEN for authentication.")
        req.add_header('Authorization', f'Bearer {token}')
    
    req.add_header('Accept', 'application/octet-stream')
    
    try:
        with urllib.request.urlopen(req) as response:
            with zipfile.ZipFile(io.BytesIO(response.read())) as zip_ref:
                zip_ref.extractall(dest_path)
        print(f"Successfully extracted ephemeris data to {dest_path}")
    except Exception as e:
        print(f"Error downloading or extracting data: {e}")
        exit(1)

if __name__ == "__main__":
    download_and_extract()
