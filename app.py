"""
CineVault — Flask Application
Stores movie data as JSON files, media as uploaded files on disk.
"""

import os
import json
import uuid
from datetime import datetime
from flask import (
    Flask, render_template, request, redirect, url_for,
    jsonify, send_from_directory, abort
)
from werkzeug.utils import secure_filename

# ── App setup ────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
DATA_FILE  = os.path.join(BASE_DIR, 'data.json')
ALLOWED    = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi'}
MAX_MB     = 200

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_MB * 1024 * 1024
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR

os.makedirs(UPLOAD_DIR, exist_ok=True)

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

# ── Template globals ──────────────────────────────────────────
@app.context_processor
def inject_globals():
    return {
        'genres': GENRES,
        'now_year': datetime.now().year,
        'g_info': None,
    }

# ── Data helpers ─────────────────────────────────────────────
def load_data():
    if not os.path.exists(DATA_FILE):
        return {g['key']: [] for g in GENRES}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

def file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    return 'video' if ext in {'mp4', 'webm', 'mov', 'avi'} else 'image'

# ── Home ─────────────────────────────────────────────────────
@app.route('/')
def index():
    data = load_data()
    stats = {}
    recent = []
    total_movies = 0
    total_photos = 0
    total_videos = 0
    active_genres = 0

    for g in GENRES:
        movies = data.get(g['key'], [])
        movie_count = len(movies)
        stats[g['key']] = movie_count
        if movie_count:
            active_genres += 1
            total_movies += movie_count
        for movie in movies:
            for m in movie.get('media', []):
                if m['type'] == 'image':
                    total_photos += 1
                else:
                    total_videos += 1
            if recent.__len__() < 10:
                recent.append({**movie, 'genre_key': g['key'], 'genre_label': g['label'], 'emoji': g['emoji']})

    return render_template('index.html',
        genres=GENRES,
        stats=stats,
        recent=recent,
        total_movies=total_movies,
        total_photos=total_photos,
        total_videos=total_videos,
        active_genres=active_genres,
    )

# ── Genre page ────────────────────────────────────────────────
@app.route('/genre/<genre_key>')
def genre_page(genre_key):
    if genre_key not in GENRE_MAP:
        abort(404)
    g = GENRE_MAP[genre_key]
    data = load_data()
    movies = data.get(genre_key, [])

    all_media = [m for movie in movies for m in movie.get('media', [])]
    photos = sum(1 for m in all_media if m['type'] == 'image')
    clips  = sum(1 for m in all_media if m['type'] == 'video')
    ratings = [movie['rating'] for movie in movies if movie.get('rating')]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

    return render_template('genre.html',
        g=g,
        g_info=g,
        genres=GENRES,
        movies=movies,
        photo_count=photos,
        clip_count=clips,
        avg_rating=avg_rating,
    )

# ── Add movie ─────────────────────────────────────────────────
@app.route('/genre/<genre_key>/add', methods=['POST'])
def add_movie(genre_key):
    if genre_key not in GENRE_MAP:
        abort(404)

    title        = request.form.get('title', '').strip()
    director     = request.form.get('director', '').strip()
    release_year = request.form.get('release_year', '').strip()
    year_watched = request.form.get('year_watched', '').strip()
    rating       = request.form.get('rating', '')
    review       = request.form.get('review', '').strip()

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    movie = {
        'id': str(uuid.uuid4()),
        'title': title,
        'director': director,
        'release_year': release_year,
        'year_watched': year_watched or str(datetime.now().year),
        'rating': int(rating) if rating.isdigit() and 1 <= int(rating) <= 5 else None,
        'review': review,
        'media': [],
        'added_at': datetime.now().isoformat(),
    }

    files = request.files.getlist('media')
    for f in files:
        if f and f.filename and allowed_file(f.filename):
            ext      = f.filename.rsplit('.', 1)[1].lower()
            fname    = f"{uuid.uuid4().hex}.{ext}"
            f.save(os.path.join(UPLOAD_DIR, fname))
            movie['media'].append({
                'id':       str(uuid.uuid4()),
                'filename': fname,
                'name':     os.path.splitext(secure_filename(f.filename))[0],
                'type':     file_type(f.filename),
            })

    data = load_data()
    data.setdefault(genre_key, []).insert(0, movie)
    save_data(data)

    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Add media to existing movie ───────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/add-media', methods=['POST'])
def add_media(genre_key, movie_id):
    data = load_data()
    movies = data.get(genre_key, [])
    movie = next((m for m in movies if m['id'] == movie_id), None)
    if not movie:
        abort(404)

    files = request.files.getlist('media')
    for f in files:
        if f and f.filename and allowed_file(f.filename):
            ext   = f.filename.rsplit('.', 1)[1].lower()
            fname = f"{uuid.uuid4().hex}.{ext}"
            f.save(os.path.join(UPLOAD_DIR, fname))
            movie['media'].append({
                'id':       str(uuid.uuid4()),
                'filename': fname,
                'name':     os.path.splitext(secure_filename(f.filename))[0],
                'type':     file_type(f.filename),
            })

    save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Edit movie ────────────────────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/edit', methods=['POST'])
def edit_movie(genre_key, movie_id):
    data = load_data()
    movies = data.get(genre_key, [])
    movie = next((m for m in movies if m['id'] == movie_id), None)
    if not movie:
        abort(404)

    movie['title']        = request.form.get('title', movie['title']).strip()
    movie['director']     = request.form.get('director', '').strip()
    movie['release_year'] = request.form.get('release_year', '').strip()
    movie['year_watched'] = request.form.get('year_watched', '').strip()
    rating = request.form.get('rating', '')
    movie['rating'] = int(rating) if rating.isdigit() and 1 <= int(rating) <= 5 else None
    movie['review'] = request.form.get('review', '').strip()

    save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Delete movie ──────────────────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/delete', methods=['POST'])
def delete_movie(genre_key, movie_id):
    data = load_data()
    movies = data.get(genre_key, [])
    movie = next((m for m in movies if m['id'] == movie_id), None)
    if movie:
        for m in movie.get('media', []):
            fpath = os.path.join(UPLOAD_DIR, m['filename'])
            if os.path.exists(fpath):
                os.remove(fpath)
        data[genre_key] = [m for m in movies if m['id'] != movie_id]
        save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Delete single media item ──────────────────────────────────
@app.route('/genre/<genre_key>/movie/<movie_id>/media/<media_id>/delete', methods=['POST'])
def delete_media(genre_key, movie_id, media_id):
    data = load_data()
    movies = data.get(genre_key, [])
    movie = next((m for m in movies if m['id'] == movie_id), None)
    if movie:
        item = next((m for m in movie['media'] if m['id'] == media_id), None)
        if item:
            fpath = os.path.join(UPLOAD_DIR, item['filename'])
            if os.path.exists(fpath):
                os.remove(fpath)
            movie['media'] = [m for m in movie['media'] if m['id'] != media_id]
            save_data(data)
    return redirect(url_for('genre_page', genre_key=genre_key))

# ── Serve uploaded files ──────────────────────────────────────
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
