#!/usr/bin/env bash
set -e
toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

node $operator/backend/dist/map_server.js $1
