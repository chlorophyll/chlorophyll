#!/usr/bin/env bash
set -e
toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/backend
yarn serve $1
