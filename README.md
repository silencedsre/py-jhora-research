# PyJHora-Research

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

## Acknowledgements & Credits

This project stands on the shoulders of exceptional work in Vedic Astrology. We are deeply grateful to:

### 📖 PVR Narasimha Rao

- **Book:** *Vedic Astrology – An Integrated Approach* — a comprehensive treatise that forms the conceptual foundation of the PyJHora library. Almost all computed results have been verified against the examples and exercises in this book.
- **Software:** *[Jagannatha Hora V8.0](http://www.vedicastrologer.org/jh/)* — the free Vedic astrology software that served as the reference implementation. Features beyond the book were collected from various sources and verified against JHora's output.

### 🔭 PyJHora Library

- **Library:** [PyJHora](https://github.com/naturalstupid/PyJHora) — the open-source Python package that powers all astrology computations in this project. This research version is built on top of PyJHora and extends it with a modern API and web interface.

We extend our sincere thanks to all original authors and contributors for their immense dedication to preserving and computing Vedic Astrology with scientific rigour.

---

This research version is maintained by [rtayoga.com](https://rtayoga.com).

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** - see the [LICENSE](LICENSE) file for details.
