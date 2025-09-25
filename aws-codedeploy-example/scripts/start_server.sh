#!/bin/bash
echo "Starting the app with PM2..."
cd /home/ubuntu/app
pm2 start ecosystem.config.js
