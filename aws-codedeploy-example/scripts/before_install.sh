#!/bin/bash
echo "Cleaning old app files..."
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
rm -rf /home/ubuntu/app/*
