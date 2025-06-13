import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename"""
    name, ext = os.path.splitext(secure_filename(original_filename))
    unique_name = f"{name}_{uuid.uuid4().hex}{ext}"
    return unique_name

def format_currency(amount: float, currency: str = '£') -> str:
    """Format currency amount"""
    return f"{currency}{amount:.2f}"

def calculate_vat(amount: float, vat_rate: float = 0.20) -> float:
    """Calculate VAT amount"""
    return amount * vat_rate

def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB"""
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    return 0.0