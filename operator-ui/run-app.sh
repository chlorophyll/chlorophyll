toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/backend
yarn serve $1
