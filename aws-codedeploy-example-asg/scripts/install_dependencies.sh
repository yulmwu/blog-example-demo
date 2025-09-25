#!/bin/bash
echo "Installing dependencies..."
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app
npm install
