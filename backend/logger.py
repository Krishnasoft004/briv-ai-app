import logging
import logging.handlers
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
import traceback

class BrivLogger:
    def __init__(self, name: str = "briv_ai", log_dir: str = "logs"):
        self.name = name
        self.log_dir = log_dir
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # Create logs directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
        
        # Clear existing handlers to avoid duplicates
        self.logger.handlers.clear()
        
        # Setup handlers
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup logging handlers for console and file output"""
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, 'app.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, 'error.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        self.logger.addHandler(error_handler)
    
    def _format_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Format log message with optional context"""
        if context:
            # Mask sensitive data
            safe_context = self._mask_sensitive_data(context)
            return f"{message} | Context: {json.dumps(safe_context, default=str)}"
        return message
    
    def _mask_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mask sensitive information in log data"""
        sensitive_keys = ['password', 'token', 'secret', 'key', 'auth']
        masked_data = {}
        
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                masked_data[key] = "***MASKED***"
            else:
                masked_data[key] = value
        
        return masked_data
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log debug message"""
        formatted_message = self._format_message(message, context)
        self.logger.debug(formatted_message)
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log info message"""
        formatted_message = self._format_message(message, context)
        self.logger.info(formatted_message)
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log warning message"""
        formatted_message = self._format_message(message, context)
        self.logger.warning(formatted_message)
    
    def error(self, message: str, context: Optional[Dict[str, Any]] = None, exc_info: bool = False):
        """Log error message"""
        formatted_message = self._format_message(message, context)
        self.logger.error(formatted_message, exc_info=exc_info)
    
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None, exc_info: bool = False):
        """Log critical message"""
        formatted_message = self._format_message(message, context)
        self.logger.critical(formatted_message, exc_info=exc_info)
    
    # Specialized logging methods
    def log_request(self, method: str, endpoint: str, status_code: int, duration: float, user_id: Optional[str] = None):
        """Log HTTP request"""
        context = {
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'duration_ms': round(duration * 1000, 2),
            'user_id': user_id
        }
        self.info(f"HTTP Request: {method} {endpoint} -> {status_code}", context)
    
    def log_database_operation(self, operation: str, table: str, success: bool, duration: float, error: Optional[str] = None):
        """Log database operation"""
        context = {
            'operation': operation,
            'table': table,
            'success': success,
            'duration_ms': round(duration * 1000, 2)
        }
        
        if error:
            context['error'] = error
            self.error(f"Database {operation} failed on {table}", context)
        else:
            self.debug(f"Database {operation} completed on {table}", context)
    
    def log_user_action(self, user_id: str, action: str, details: Optional[Dict[str, Any]] = None):
        """Log user action"""
        context = {
            'user_id': user_id,
            'action': action,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            context.update(details)
        
        self.info(f"User action: {action}", context)
    
    def log_auth_event(self, event_type: str, user_email: str, success: bool, ip_address: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log authentication event"""
        context = {
            'event_type': event_type,
            'user_email': user_email,
            'success': success,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            context.update(details)
        
        level_method = self.info if success else self.warning
        level_method(f"Auth event: {event_type} for {user_email}", context)
    
    def log_exception(self, exception: Exception, context: Optional[Dict[str, Any]] = None):
        """Log exception with full traceback"""
        exc_context = {
            'exception_type': type(exception).__name__,
            'exception_message': str(exception),
            'traceback': traceback.format_exc()
        }
        
        if context:
            exc_context.update(context)
        
        self.error(f"Exception occurred: {type(exception).__name__}", exc_context, exc_info=True)
    
    def log_startup(self, app_name: str, version: str, environment: str, port: int):
        """Log application startup"""
        context = {
            'app_name': app_name,
            'version': version,
            'environment': environment,
            'port': port,
            'startup_time': datetime.utcnow().isoformat()
        }
        self.info(f"Application {app_name} starting up", context)
    
    def log_shutdown(self, app_name: str):
        """Log application shutdown"""
        context = {
            'app_name': app_name,
            'shutdown_time': datetime.utcnow().isoformat()
        }
        self.info(f"Application {app_name} shutting down", context)

# Create global logger instance
logger = BrivLogger()

# Convenience functions for backward compatibility
def log_info(message: str, context: Optional[Dict[str, Any]] = None):
    logger.info(message, context)

def log_error(message: str, context: Optional[Dict[str, Any]] = None, exc_info: bool = False):
    logger.error(message, context, exc_info)

def log_debug(message: str, context: Optional[Dict[str, Any]] = None):
    logger.debug(message, context)

def log_warning(message: str, context: Optional[Dict[str, Any]] = None):
    logger.warning(message, context)
