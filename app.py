"""
CineVault — Flask Application
Stores movie data as JSON files, media as uploaded files on disk.
"""

import os
import json
import uuid
import hashlib
from datetime import datetime
from functools import wraps
from typing import Optional

from flask import (
    Flask, render_template, request, redirect,
    url_for, send_from_directory, abort, session, flash
)
from werkzeug.utils import secure_filename

# ── Constants ────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
DATA_FILE  = os.path.join(BASE_DIR, 'data.json')
PIN_FILE   = os.path.join(BASE_DIR, 'pin.json')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi'}
VIDEO_EXTENSIONS   = {'mp4', 'webm', 'mov', 'avi'}
MAX_UPLOAD_MB      = 200

GENRES = [
    {'key': 'action',    'label': 'Action',    'emoji': '💥', 'color': '#FF6B35', 'rgb': '255,107,53',  'tagline': 'Explosions, Heroes & High-Octane Thrills'},
    {'key': 'comedy',    'label': 'Comedy',    'emoji': '😂', 'color': '#FFD166', 'rgb': '255,209,102', 'tagline': 'Laughs, Wit & Feel-Good Moments'},
    {'key': 'horror',    'label': 'Horror',    'emoji': '👻', 'color': '#A66CFF', 'rgb': '166,108,255', 'tagline': 'Scares, Suspense & the Unknown'},
    {'key': 'romance',   'label': 'Romance',   'emoji': '💕', 'color': '#FF6B9D', 'rgb': '255,107,157', 'tagline': 'Love Stories & Heartfelt Connections'},
    {'key': 'scifi',     'label': 'Sci-Fi',    'emoji': '🚀', 'color': '#5BA8FF', 'rgb': '91,168,255',  'tagline': 'Galaxies, Tech & the Future'},
    {'key': 'drama',     'label': 'Drama',     'emoji': '🎭', 'color': '#4ECDC4', 'rgb': '78,205,196',  'tagline': 'Deep Stories & Raw Emotion'},
    {'key': 'thriller',  'label': 'Thriller',  'emoji': '🔪', 'color': '#E84545', 'rgb': '232,69,69',   'tagline': 'Twists, Tension & Edge-of-Seat Moments'},
    {'key': 'animation', 'label': 'Animation', 'emoji': '✨', 'color': '#06D6A0', 'rgb': '6,214,160',   'tagline': 'Magical Worlds & Timeless Adventures'},
]
GENRE_MAP = {g['key']: g for g in GENRES}

# Genre-specific hero background images (Unsplash, varied per genre)
GENRE_HERO_IMAGES = {
    'action':    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1600&q=80',
    'comedy':    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1600&q=80',
    'horror':    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=80',
    'romance':   'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1600&q=80',
    'scifi':     'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80',
    'drama':     'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=1600&q=80',
    'thriller':  'https://images.unsplash.com/photo-1599693253660-ec08dbc3e4fc?w=1600&q=80',
    'animation': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80',
}

# ── App setup ────────────────────────────────────────────────
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_MB * 1024 * 1024
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR
app.secret_key = 'cinevault-secret-key-change-this'

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── PIN helpers ──────────────────────────────────────────────
def _hash(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()

def get_pin_hash() -> Optional[str]:
    if not os.path.exists(PIN_FILE):
        return None
    with open(PIN_FILE) as f:
        return json.load(f).get('pin_hash')

def save_pin_hash(pin: str) -> None:
    with open(PIN_FILE, 'w') as f:
        json.dump({'pin_hash': _hash(pin)}, f)

def pin_matches(pin: str) -> bool:
    stored = get_pin_hash()
    return stored is not None and _hash(pin) == stored

# ── Auth decorator ───────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if get_pin_hash() and not session.get('unlocked'):
            return redirect(url_for('lock_page'))
        return f(*args, **kwargs)
    return decorated

# ── Data helpers ─────────────────────────────────────────────
def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {g['key']: [] for g in GENRES}
    with open(DATA_FILE) as f:
        return json.load(f)

def save_data(data: dict) -> None:
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def file_type(filename: str) -> str:
    return 'video' if filename.rsplit('.', 1)[1].lower() in VIDEO_EXTENSIONS else 'image'

def save_uploaded_file(f) -> Optional[dict]:
    """Save one uploaded file; return media dict or None if invalid."""
    if not (f and f.filename and allowed_file(f.filename)):
        return None
    ext   = f.filename.rsplit('.', 1)[1].lower()
    fname = f"{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(UPLOAD_DIR, fname))
    return {
        'id':       str(uuid.uuid4()),
        'filename': fname,
        'name':     os.path.splitext(secure_filename(f.filename))[0],
        'type':     file_type(f.filename),
    }

def delete_media_file(filename: str) -> None:
    path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(path):
        os.remove(path)

# ── Template globals ──────────────────────────────────────────
@app.context_processor
def inject_globals():
    return {
        'genres':    GENRES,
        'now_year':  datetime.now().year,
        'g_info':    None,
        'pin_set':   bool(get_pin_hash()),
    }

# ── Lock / Auth routes ────────────────────────────────────────
@app.route('/lock')
def lock_page():
    return render_template('lock.html', pin_set=bool(get_pin_hash()), error=None)

@app.route('/unlock', methods=['POST'])
def unlock():
    if pin_matches(request.form.get('pin', '')):
        session['unlocked'] = True
        return redirect(url_for('index'))
    return render_template('lock.html', pin_set=True, error='Wrong PIN — try again.')

@app.route('/logout')
def logout():
    session.pop('unlocked', None)
    return redirect(url_for('lock_page'))

@app.route('/setup-pin', methods=['POST'])
def setup_pin():
    pin = request.form.get('pin', '').strip()
    if len(pin) < 4 or not pin.isdigit():
        return render_template('lock.html', pin_set=False, error='PIN must be at least 4 digits.')
    save_pin_hash(pin)
    session['unlocked'] = True
    return redirect(url_for('index'))

@app.route('/change-pin', methods=['POST'])
def change_pin():
    current = request.form.get('current_pin', '')
    new_pin = request.form.get('new_pin', '').strip()
    if not pin_matches(current):
        flash('pin_error:wrong', 'pin')
    elif len(new_pin) < 4 or not new_pin.isdigit():
        flash('pin_error:invalid', 'pin')
    else:
        save_pin_hash(new_pin)
        flash('pin_changed', 'pin')
    return redirect(url_for('index'))

@app.route('/remove-pin', methods=['POST'])
def remove_pin():
    if not pin_matches(request.form.get('current_pin', '')):
        flash('pin_error:wrong', 'pin')
    else:
        if os.path.exists(PIN_FILE):
            os.remove(PIN_FILE)
        session.pop('unlocked', None)
        flash('pin_removed', 'pin')
    return redirect(url_for('index'))

# ── Home ──────────────────────────────────────────────────────
@app.route('/')
@login_required
def index():
    data          = load_data()
    stats         = {}
    recent        = []
    total_movies  = 0
    total_photos  = 0
    total_videos  = 0
    active_genres = 0

    for g in GENRES:
        movies = data.get(g['key'], [])
        stats[g['key']] = len(movies)
        if movies:
            active_genres += 1
            total_movies  += len(movies)
        for movie in movies:
            for m in movie.get('media', []):
                if m['type'] == 'image':
                    total_photos += 1
                else:
                    total_videos += 1
            if len(recent) < 10:
                recent.append({**movie, 'genre_key': g['key'], 'genre_label': g['label'], 'emoji': g['emoji']})

    # Read flash messages for PIN feedback
    pin_messages = {'changed': False, 'removed': False, 'error': None}
    for msg in session.get('_flashes', []):
        if isinstance(msg, tuple) and msg[0] == 'pin':
            val = msg[1]
            if val == 'pin_changed':
                pin_messages['changed'] = True
            elif val == 'pin_removed':
                pin_messages['removed'] = True
            elif val == 'pin_error:wrong':
                pin_messages['error'] = 'Wrong PIN — please try again.'
            elif val == 'pin_error:invalid':
                pin_messages['error'] = 'New PIN must be at least 4 digits.'

    return render_template('index.html',
        stats=stats, recent=recent,
        total_movies=total_movies, total_photos=total_photos,
        total_videos=total_videos, active_genres=active_genres,
        pin_messages=pin_messages,
    )

# ── Genre page ────────────────────────────────────────────────
@app.route('/genre/<genre_key>')
@login_required
def genre_page(genre_key):
    if genre_key not in GENRE_MAP:
        abort(404)
    g      = GENRE_MAP[genre_key]
    movies = load_data().get(genre_key, [])

    all_media  = [m for movie in movies for m in movie.get('media', [])]
    photos     = sum(1 for m in all_media if m['type'] == 'image')
    clips      = sum(1 for m in all_media if m['type'] == 'video')
    ratings    = [movie['rating'] for movie in movies if movie.get('rating')]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
    hero_image = GENRE_HERO_IMAGES.get(genre_key, GENRE_HERO_IMAGES['horror'])

    return render_template('genre.html',
        g=g, g_info=g, movies=movies,
        photo_count=photos, clip_count=clips,
        avg_rating=avg_rating, hero_image=hero_image,
    )

# ── Add movie ─────────────────────────────────────────────────
@app.route('/genre/<genre_key>/add', methods=['POST'])
@login_required
def add_movie(genre_key):
    if genre_key not in GENRE_MAP:
        abort(404)

    title  = request.form.get('title', '').strip()
    rating = request.form.get('rating', '')
    if not title:
        return redirect(url_for('genre_page', genre_key=genre_key))

    movie = {
        'id':           str(uuid.uuid4()),
        'title':        title,
        'director':     request.form.get('director', '').strip(),
        'release_year': request.form.get('release_year', '').strip(),
        'year_watched': request.form.get('year_watched', '').strip() or str(datetime.now().year),
        'rating':       int(rating) if rating.isdigit() and 1 <= int(rating) <= 5 else None,
        'review':       request.form.get('review', '').strip(),
        'media':        [],
        'added_at':     datetime.now().isoformat(),
    }
    movie['media'] = [m for m in (save_uploaded_file(f) for f in request.files.getlist('media')) if m]

    data = load_data()
    data.setdefault(genre_key, []).insert(0, movie)
    save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Add media to existing movie ───────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/add-media', methods=['POST'])
@login_required
def add_media(genre_key, movie_id):
    data   = load_data()
    movies = data.get(genre_key, [])
    movie  = next((m for m in movies if m['id'] == movie_id), None)
    if not movie:
        abort(404)

    new_media = [m for m in (save_uploaded_file(f) for f in request.files.getlist('media')) if m]
    movie['media'].extend(new_media)
    save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Edit movie ────────────────────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/edit', methods=['POST'])
@login_required
def edit_movie(genre_key, movie_id):
    data   = load_data()
    movie  = next((m for m in data.get(genre_key, []) if m['id'] == movie_id), None)
    if not movie:
        abort(404)

    rating = request.form.get('rating', '')
    movie.update({
        'title':        request.form.get('title', movie['title']).strip(),
        'director':     request.form.get('director', '').strip(),
        'release_year': request.form.get('release_year', '').strip(),
        'year_watched': request.form.get('year_watched', '').strip(),
        'rating':       int(rating) if rating.isdigit() and 1 <= int(rating) <= 5 else None,
        'review':       request.form.get('review', '').strip(),
    })
    save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Delete movie ──────────────────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/delete', methods=['POST'])
@login_required
def delete_movie(genre_key, movie_id):
    data   = load_data()
    movies = data.get(genre_key, [])
    movie  = next((m for m in movies if m['id'] == movie_id), None)
    if movie:
        for m in movie.get('media', []):
            delete_media_file(m['filename'])
        data[genre_key] = [m for m in movies if m['id'] != movie_id]
        save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Delete single media item ──────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/media/<media_id>/delete', methods=['POST'])
@login_required
def delete_media(genre_key, movie_id, media_id):
    data   = load_data()
    movie  = next((m for m in data.get(genre_key, []) if m['id'] == movie_id), None)
    if movie:
        item = next((m for m in movie['media'] if m['id'] == media_id), None)
        if item:
            delete_media_file(item['filename'])
            movie['media'] = [m for m in movie['media'] if m['id'] != media_id]
            save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Serve uploads ─────────────────────────────────────────────
@app.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
