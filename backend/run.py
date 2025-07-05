#!/usr/bin/env python3
"""
Briv AI Backend Server Runner
Starts the Flask application with proper configuration
"""

import os
import sys
from dotenv import load_dotenv
from app import create_app
from logger import logger

def main():
    """Main entry point for the application"""
    
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = create_app()
    
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    logger.log_startup(
        app_name="Briv AI Backend",
        version="1.0.0",
        environment=os.getenv('FLASK_ENV', 'development'),
        port=port
    )
    
    print(f"🚀 Starting Briv AI Backend on http://{host}:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"📊 Environment: {os.getenv('FLASK_ENV', 'development')}")
    
    # Database configuration check
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        # Mask sensitive parts of the URL
        masked_url = db_url[:20] + "..." + db_url[-20:] if len(db_url) > 40 else db_url
        logger.info(f"Database URL configured: {masked_url}")
    else:
        logger.warning("No DATABASE_URL configured!")
    
    # Flask configuration
    secret_key = os.getenv('SECRET_KEY')
    if secret_key:
        logger.info("Secret key configured")
    else:
        logger.warning("No SECRET_KEY configured - using default!")
    
    # Start the server
    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
        
    except KeyboardInterrupt:
        logger.log_shutdown("Briv AI Backend")
        print("\n👋 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.log_exception(e, {'context': 'application_startup'})
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
