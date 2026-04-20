#!/bin/bash
PYTHON="${PYTHONLIBS_PATH:-$(dirname "$(which uvicorn 2>/dev/null || echo "python3")")}/python3"
UVICORN="$(which uvicorn 2>/dev/null || echo ".pythonlibs/bin/uvicorn")"

if [ ! -f "$UVICORN" ] && [ -f ".pythonlibs/bin/uvicorn" ]; then
  UVICORN=".pythonlibs/bin/uvicorn"
fi

echo "[scan-servers] Using uvicorn: $UVICORN"

"$UVICORN" nmap_api:app    --app-dir scan-servers --host 0.0.0.0 --port 8001 &
"$UVICORN" nikto_api:app   --app-dir scan-servers --host 0.0.0.0 --port 8002 &
"$UVICORN" sqlmap_api:app  --app-dir scan-servers --host 0.0.0.0 --port 8003 &
"$UVICORN" ffuf_api:app    --app-dir scan-servers --host 0.0.0.0 --port 8004 &

GATEWAY_PORT=8090 "$UVICORN" gateway:app --app-dir scan-servers --host 0.0.0.0 --port 8090 &

echo "[scan-servers] All servers started. Gateway on :8090, Tools on :8001-:8004"
wait
