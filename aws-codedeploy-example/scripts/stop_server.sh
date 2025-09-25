#!/bin/bash
echo "Stopping existing app..."
pm2 stop ecosystem.config.js || true
