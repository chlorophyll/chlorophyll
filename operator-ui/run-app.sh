#/usr/bin/env bash

toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/frontend
yarn
yarn build
cd $operator/backend
yarn
yarn build
yarn serve $1
