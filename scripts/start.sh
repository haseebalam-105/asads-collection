#!/bin/bash
# Persistent start script — starts the Next.js production server
# and keeps it running in the background.
cd /home/z/my-project/lll
exec node node_modules/next/dist/bin/next start -p 3000
