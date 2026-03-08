# PyJHora

A Vedic Astrology API and Web App.

## Setup

### 1. Install dependencies

```bash
uv sync
```

### 2. Download Swiss Ephemeris data (required, ~104 MB)

The ephemeris binary files are **not included in the repo** (too large). Download them manually:

1. Go to https://www.astro.com/swisseph/ephe/
2. Download the files you need into `PyJHora/src/jhora/data/ephe/`:
   - `sepl*.se1` — planetary data
   - `semo*.se1` — moon data
   - `sefstars.txt`, `seasnam.txt`, `seleapsec.txt`, `seorbel.txt`, `fixstars.cat`

Or copy from the pip-installed package (if already present in `.venv`):

```bash
cp .venv/lib/python3.*/site-packages/jhora/data/ephe/* PyJHora/src/jhora/data/ephe/
```



## Running the Application

Both the frontend and backend of the project need to be run separately in different terminal windows or tabs.

### 1. Run the Backend (FastAPI)

From the root directory (`/Users/shreekrishnajamakatel/personal/astro/py-jhora`), run the FastAPI server using `uv`:

```bash
uv run uvicorn api.main:app --reload
```
*This will start the backend server, typically accessible at `http://127.0.0.1:8000`.*

### 2. Run the Frontend (Next.js)

In a new terminal window, navigate to the `frontend` directory and start the development server:

```bash
cd frontend
npm run dev
```
*This will start your React application, usually accessible at `http://localhost:3000`.*

---

## Credits

This project is built upon the [PyJHora](https://github.com/naturalstupid/PyJHora) library (licensed under AGPL-3.0). Special thanks to the original authors for their extensive work on Vedic astrology computations.

Provided by [rtayoga.com](https://rtayoga.com).
