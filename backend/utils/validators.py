import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Optional[str]:
    """Validate password strength"""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return "Password must contain at least one number"
    
    return None

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS