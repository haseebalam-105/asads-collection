#!/bin/bash
# Keepalive wrapper — restarts Next.js if it dies
cd /home/z/my-project/lll
while true; do
  echo "[$(date)] Starting next start..."
  node node_modules/next/dist/bin/next start -p 3000 >> /tmp/start.log 2>&1
  echo "[$(date)] next start exited with code $?, restarting in 2s..."
  sleep 2
done
