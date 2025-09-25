#!/bin/bash
echo "Validating application..."
for i in {1..10}; do
    curl -f http://localhost:3000/health && exit 0
    echo "Waiting for server to respond..."
    sleep 2
done
echo "Server did not respond in time."
exit 1
