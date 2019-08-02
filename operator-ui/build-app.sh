#/usr/bin/env bash
set -e
toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/frontend
yarn
yarn build
cd $operator/backend
yarn
yarn build
