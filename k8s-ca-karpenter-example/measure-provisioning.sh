#!/usr/bin/env bash

set -euo pipefail

DEPLOYMENT_NAME="inflate"
TARGET_REPLICAS="50"
NAMESPACE="default"
TIMEOUT="1200s"

start_ts="$(date +%s)"

kubectl -n "${NAMESPACE}" scale deployment "${DEPLOYMENT_NAME}" --replicas="${TARGET_REPLICAS}"

kubectl -n "${NAMESPACE}" wait deployment "${DEPLOYMENT_NAME}" \
  --for=condition=Available \
  --timeout="${TIMEOUT}"

end_ts="$(date +%s)"
elapsed="$(( end_ts - start_ts ))"

echo "Elapsed time: ${elapsed} seconds"
