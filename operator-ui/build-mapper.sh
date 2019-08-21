#/usr/bin/env bash
set -e
local_branch=$(git rev-parse --abbrev-ref --symbolic-full-name HEAD)
remote_branch=$(git rev-parse --abbrev-ref --symbolic-full-name @{upstream})
nbehind=$(git rev-list --right-only --count ${local_branch}..${remote_branch})

if (( nbehind > 0 )); then
echo "branch ${local_branch} is $nbehind commits behind upstream. Run git pull?"
select yn in "Yes" "No"; do
    case $yn in
        Yes ) git pull; break;;
    esac
done
fi

toplevel=$(git rev-parse --show-toplevel)
operator="${toplevel}/operator-ui"

cd $operator/mapper
yarn
yarn build
cd $operator/backend
yarn
yarn build
