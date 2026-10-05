#!/usr/bin/env python3
"""Run the real Laya server on loopback with Mermaider browser CORS."""
import argparse
import importlib.util
import os

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8000)
parser.add_argument('--check', action='store_true', help='Check installed dependencies without loading model weights')
args = parser.parse_args()
if not 1024 <= args.port <= 65535:
    parser.error('Choose a port between 1024 and 65535')
if any(importlib.util.find_spec(name) is None for name in ('laya', 'uvicorn', 'fastapi')):
    raise SystemExit('Install dependencies in a virtual environment: python -m pip install "laya[serve]==0.3.22"')
if args.check:
    print('Laya HTTP dependencies available; no inference or model download performed.')
    raise SystemExit(0)
os.environ.setdefault('LAYA_MODELS', 'multilingual')
os.environ.setdefault('LAYA_PRELOAD', '1')
os.environ['LAYA_HOST'] = '127.0.0.1'
os.environ['LAYA_PORT'] = str(args.port)
from laya.serve import create_app
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

origins = ['https://mermaider.appwrite.network', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174']
app = create_app()
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])
@app.middleware('http')
async def local_network_permission(request, call_next):
    response = await call_next(request)
    if request.headers.get('origin') in origins and request.headers.get('access-control-request-private-network') == 'true':
        response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response
uvicorn.run(app, host='127.0.0.1', port=args.port)
