# 🎬 CineVault

A personal movie collection web app built with Flask. Log movies you've watched, upload photos/posters/clips, organize by genre, rate and review — all stored locally on your machine.

---

## 📸 Features

- **8 Genre Categories** — Action, Comedy, Horror, Romance, Sci-Fi, Drama, Thriller, Animation
- **Log Movies** — Add title, director, release year, year watched, star rating (1–5), and a personal review
- **Upload Media** — Attach photos, posters, and video clips to each movie entry
- **Edit & Delete** — Update movie details or remove individual media items anytime
- **Dark / Light Theme** — Toggle between dark and light mode, preference is saved across sessions
- **Home Button** — Quick navigation back to the main genre grid from any page
- **Stats Dashboard** — See total movies logged, photos, clips, and active genres at a glance
- **Recently Added** — Horizontal scrollable strip showing your latest entries
- **Lightbox Viewer** — Click any image or video to view it fullscreen

---

## 🗂️ Project Structure

```
cinevault/
├── app.py                  # Flask application & all routes
├── data.json               # Movie data stored as JSON
├── requirements.txt        # Python dependencies
│
├── templates/
│   ├── base.html           # Base layout (nav, footer, lightbox, theme toggle)
│   ├── index.html          # Home page with genre grid
│   └── genre.html          # Genre page with movie cards and log form
│
└── static/
    ├── css/
    │   └── style.css       # Global stylesheet with dark/light theme
    ├── js/
    │   └── main.js         # Theme toggle, nav scroll, animations
    └── uploads/            # Uploaded images and videos (auto-created)
```

---

## ⚙️ Setup & Installation

### 1. Clone or download the project

```bash
cd your-projects-folder
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the app

```bash
python app.py
```

### 6. Open in browser

Go to: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python 3, Flask 3.x                 |
| Frontend  | HTML5, CSS3, Vanilla JavaScript     |
| Templating| Jinja2                              |
| Storage   | JSON file (data.json) + local files |
| Fonts     | Cormorant Garamond, Syne, DM Sans   |

---

## 📦 Dependencies

```
flask>=3.0.0
werkzeug>=3.0.0
```

Install with:
```bash
pip install -r requirements.txt
```

---

## 📁 Supported File Types

| Type   | Formats                        |
|--------|--------------------------------|
| Images | PNG, JPG, JPEG, GIF, WebP      |
| Videos | MP4, WebM, MOV, AVI            |

Maximum upload size: **200 MB** per request

---

## 🔧 Configuration

All config is at the top of `app.py`:

```python
MAX_MB  = 200          # Max upload size in megabytes
ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi'}
```

To add a new genre, add an entry to the `GENRES` list in `app.py`:
```python
{'key': 'documentary', 'label': 'Documentary', 'emoji': '🎥',
 'color': '#FF9F1C', 'rgb': '255,159,28',
 'tagline': 'Real Stories & True Events'},
```

---

## ⚠️ Notes

- This is a **development server** — not intended for production deployment
- All data is stored locally in `data.json` and `static/uploads/`
- Deleting a movie also deletes its uploaded media files from disk
- Theme preference is saved in the browser's `localStorage`

---

## 📄 License

Personal use project. Free to modify and build upon.
