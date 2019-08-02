#/usr/bin/env bash

toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/frontend
yarn build
cd $operator/backend
yarn build
yarn serve $1
