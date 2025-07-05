import os
import time
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
from logger import logger
from urllib.parse import urlparse
# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    #CORS(app, origins=["http://localhost:3000", "https://*.vercel.app"])
    # === ✅ Dynamic CORS Setup ===
    # ALLOWED_ORIGINS = [
    #     "http://localhost:3000",
    #     ".vercel.app"
    # ]

    @app.after_request
    def apply_combined_after_request(response):
        # --- CORS Handling ---
        origin = request.headers.get("Origin")
        parsed_origin = urlparse(origin).hostname if origin else ""
        ALLOWED_ORIGINS = [
            "localhost",
            ".vercel.app"
        ]
        if any(parsed_origin and parsed_origin.endswith(allowed) for allowed in ALLOWED_ORIGINS):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
            response.headers["Vary"] = "Origin"

        # --- Request Logging ---
        duration = time.time() - getattr(request, 'start_time', time.time())
        logger.log_request(
            method=request.method,
            endpoint=request.path,
            status_code=response.status_code,
            duration=duration
        )

        return response


    def is_allowed_origin(origin):
        if not origin:
            return False
        parsed = urlparse(origin)
        for domain in ALLOWED_ORIGINS:
            if domain.startswith("."):
                if parsed.hostname and parsed.hostname.endswith(domain):
                    return True
            elif domain == origin:
                return True
        return False

    @app.after_request
    def apply_cors_headers(response):
        origin = request.headers.get("Origin")
        if is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
            response.headers["Vary"] = "Origin"
        return response

    @app.route("/api/<path:path>", methods=["OPTIONS"])
    def handle_options(path):
        return apply_cors_headers(jsonify({})), 200
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL')
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable is not set")
        raise ValueError("DATABASE_URL is required")
    
    logger.info("Flask application created", {
        'cors_origins': ["http://localhost:3000", "https://*.vercel.app"],
        'jwt_secret_set': bool(JWT_SECRET)
    })
    
    # Database connection helper
    def get_db_connection():
        try:
            conn = psycopg2.connect(DATABASE_URL)
            return conn
        except Exception as e:
            logger.log_exception(e, {'context': 'database_connection'})
            raise
    
    # Initialize database tables
    def init_db():
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Users table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    health_data_consent BOOLEAN DEFAULT FALSE,
                    email_consent BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Reflections table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS reflections (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    topic VARCHAR(500),
                    summary TEXT,
                    reflection TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Assessments table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS assessments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    reflection_id INTEGER REFERENCES reflections(id) ON DELETE CASCADE,
                    questions JSONB,
                    answers JSONB,
                    score INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insights table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS insights (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    insight_type VARCHAR(50),
                    title VARCHAR(500),
                    description TEXT,
                    confidence FLOAT,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("Database tables initialized successfully")
            
        except Exception as e:
            logger.log_exception(e, {'context': 'database_initialization'})
            raise
    
    # Initialize database on startup
    init_db()
    
    # Middleware for request logging
    @app.before_request
    def log_request_info():
        request.start_time = time.time()
        logger.debug(f"Incoming request: {request.method} {request.path}", {
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        })
    

    # Helper functions
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(password, hashed):
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(user_id, email):
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow().timestamp() + (7 * 24 * 60 * 60)  # 7 days
        }
        return jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    
    def verify_token(token):
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def require_auth(f):
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authorization token required'}), 401
            
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            request.user = payload
            return f(*args, **kwargs)
        
        decorated_function.__name__ = f.__name__
        return decorated_function
    
    # Routes
    @app.route('/health', methods=['GET'])
    def health_check():
        try:
            # Test database connection
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute('SELECT 1')
            cur.close()
            conn.close()
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'database': 'connected'
            })
        except Exception as e:
            logger.log_exception(e, {'context': 'health_check'})
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.utcnow().isoformat(),
                'database': 'disconnected',
                'error': str(e)
            }), 500
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        start_time = time.time()
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'email', 'password']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            name = data['name'].strip()
            email = data['email'].strip().lower()
            password = data['password']
            health_data_consent = data.get('health_data_consent', False)
            email_consent = data.get('email_consent', True)
            
            # Validate email format
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Validate password strength
            if len(password) < 8:
                return jsonify({'error': 'Password must be at least 8 characters long'}), 400
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check if user already exists
            cur.execute('SELECT id FROM users WHERE email = %s', (email,))
            if cur.fetchone():
                logger.log_auth_event('registration_attempt', email, False, request.remote_addr, {'reason': 'email_exists'})
                return jsonify({'error': 'User with this email already exists'}), 409
            
            # Hash password and create user
            password_hash = hash_password(password)
            
            cur.execute('''
                INSERT INTO users (name, email, password_hash, health_data_consent, email_consent)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, email, created_at
            ''', (name, email, password_hash, health_data_consent, email_consent))
            
            user = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            logger.log_auth_event('registration_success', email, True, request.remote_addr, {'user_id': user['id']})
            logger.log_database_operation('INSERT', 'users', True, time.time() - start_time)
            
            return jsonify({
                'message': 'User registered successfully',
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'created_at': user['created_at'].isoformat()
                }
            }), 201
            
        except Exception as e:
            logger.log_exception(e, {'context': 'user_registration', 'email': data.get('email', 'unknown')})
            logger.log_database_operation('INSERT', 'users', False, time.time() - start_time, str(e))
            return jsonify({'error': 'Registration failed. Please try again.'}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        start_time = time.time()
        try:
            data = request.get_json()
            
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get user by email
            cur.execute('SELECT id, name, email, password_hash, created_at FROM users WHERE email = %s', (email,))
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if not user or not verify_password(password, user['password_hash']):
                logger.log_auth_event('login_failed', email, False, request.remote_addr, {'reason': 'invalid_credentials'})
                return jsonify({'error': 'Invalid email or password'}), 401
            
            # Generate token
            token = generate_token(user['id'], user['email'])
            
            logger.log_auth_event('login_success', email, True, request.remote_addr, {'user_id': user['id']})
            logger.log_database_operation('SELECT', 'users', True, time.time() - start_time)
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'created_at': user['created_at'].isoformat()
                }
            })
            
        except Exception as e:
            logger.log_exception(e, {'context': 'user_login', 'email': data.get('email', 'unknown')})
            logger.log_database_operation('SELECT', 'users', False, time.time() - start_time, str(e))
            return jsonify({'error': 'Login failed. Please try again.'}), 500
    
    @app.route('/api/reflections', methods=['GET'])
    @require_auth
    def get_reflections():
        start_time = time.time()
        try:
            user_id = request.user['user_id']
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('''
                SELECT id, topic, summary, reflection, created_at, updated_at
                FROM reflections
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            ''', (user_id,))
            
            reflections = cur.fetchall()
            cur.close()
            conn.close()
            
            # Convert to list of dicts with ISO formatted dates
            reflections_list = []
            for reflection in reflections:
                reflections_list.append({
                    'id': reflection['id'],
                    'topic': reflection['topic'],
                    'summary': reflection['summary'],
                    'reflection': reflection['reflection'],
                    'created_at': reflection['created_at'].isoformat(),
                    'updated_at': reflection['updated_at'].isoformat()
                })
            
            logger.log_database_operation('SELECT', 'reflections', True, time.time() - start_time)
            logger.log_user_action(str(user_id), 'get_reflections', {'count': len(reflections_list)})
            
            return jsonify({'reflections': reflections_list})
            
        except Exception as e:
            logger.log_exception(e, {'context': 'get_reflections', 'user_id': request.user.get('user_id')})
            logger.log_database_operation('SELECT', 'reflections', False, time.time() - start_time, str(e))
            return jsonify({'error': 'Failed to fetch reflections'}), 500
    
    @app.route('/api/reflections', methods=['POST'])
    @require_auth
    def create_reflection():
        start_time = time.time()
        try:
            user_id = request.user['user_id']
            data = request.get_json()
            
            reflection_text = data.get('reflection', '').strip()
            if not reflection_text:
                return jsonify({'error': 'Reflection text is required'}), 400
            
            topic = data.get('topic', '').strip()
            summary = data.get('summary', '').strip()
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('''
                INSERT INTO reflections (user_id, topic, summary, reflection)
                VALUES (%s, %s, %s, %s)
                RETURNING id, topic, summary, reflection, created_at, updated_at
            ''', (user_id, topic or None, summary or None, reflection_text))
            
            reflection = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            reflection_data = {
                'id': reflection['id'],
                'topic': reflection['topic'],
                'summary': reflection['summary'],
                'reflection': reflection['reflection'],
                'created_at': reflection['created_at'].isoformat(),
                'updated_at': reflection['updated_at'].isoformat()
            }
            
            logger.log_database_operation('INSERT', 'reflections', True, time.time() - start_time)
            logger.log_user_action(str(user_id), 'create_reflection', {
                'reflection_id': reflection['id'],
                'word_count': len(reflection_text.split())
            })
            
            return jsonify({
                'message': 'Reflection created successfully',
                'reflection': reflection_data
            }), 201
            
        except Exception as e:
            logger.log_exception(e, {'context': 'create_reflection', 'user_id': request.user.get('user_id')})
            logger.log_database_operation('INSERT', 'reflections', False, time.time() - start_time, str(e))
            return jsonify({'error': 'Failed to create reflection'}), 500
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.log_startup(
        app_name="Briv AI Backend",
        version="1.0.0",
        environment=os.getenv('FLASK_ENV', 'development'),
        port=port
    )
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.log_shutdown("Briv AI Backend")
    except Exception as e:
        logger.log_exception(e, {'context': 'application_startup'})
