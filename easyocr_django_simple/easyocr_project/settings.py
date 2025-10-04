# easyocr_project/settings.py

import os
from pathlib import Path # Preferred way to handle paths in modern Python/Django
from dotenv import load_dotenv # Used to load .env files

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# Use pathlib.Path for clean, cross-platform path handling
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the .env file located in the project root
load_dotenv(os.path.join(BASE_DIR, '.env')) # Load .env file

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Fetch sensitive data from environment variables
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'your-fallback-secret-key-for-dev')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True' # Load DEBUG from .env
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') # Load allowed hosts

# --- API Key Integration ---
# Fetch the Gemini API Key directly from environment for use in llm_parser.py
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
# Fetch the OpenAI API Key for LLM processing
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# ---------------------------


DEBUG = True # Keep this True for development

ALLOWED_HOSTS = ['127.0.0.1', 'localhost'] # Add these
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'ocr_app', # Your app added here
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'easyocr_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'easyocr_project.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3', # Using pathlib
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

# USE_L10N is deprecated in modern Django versions (>= 4.0), replaced by USE_TZ/USE_I18N
# USE_L10N = True 

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    # Add any global static directories here
]

# Media files (for user uploads like images)
# For temporary uploads (will be deleted after processing)
MEDIA_ROOT = BASE_DIR / 'temp_uploads' # Using pathlib
MEDIA_URL = '/media/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
