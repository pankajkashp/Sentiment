"""Add backend and tests to sys.path for pytest."""
import sys
from pathlib import Path

# Project root
sys.path.insert(0, str(Path(__file__).parent))
