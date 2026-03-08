import zipfile
import os
import sys

def extract():
    zip_file = 'ephemeris_data.zip'
    dest_path = 'PyJHora/src/jhora/data/ephe'
    
    if not os.path.exists(zip_file):
        print(f"No {zip_file} found, skipping extraction.")
        return

    print(f"Extracting {zip_file} to {dest_path}...")
    os.makedirs(dest_path, exist_ok=True)
    try:
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(dest_path)
        os.remove(zip_file)
        print("Extraction complete.")
    except Exception as e:
        print(f"Error extracting zip: {e}")
        sys.exit(1)

if __name__ == "__main__":
    extract()
