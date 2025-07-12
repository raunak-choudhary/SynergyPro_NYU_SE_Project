#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python3.9 manage.py migrate --noinput

# Collect static files
python3.9 manage.py collectstatic --noinput --clear

# Initialize keywords (if your management command exists)
python3.9 manage.py initialize_keywords || echo "Keywords initialization skipped"