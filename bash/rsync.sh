#!/usr/bin/env bash
set -x

# rsync -anv /mnt/docs/Study/Markdown/ /home/hogan/Private/github/Documents/markdown
# rsync -anv /mnt/docs/Study/Xmind/ /home/hogan/Private/github/Documents/xmind
rsync -av /mnt/docs/Study/Markdown/ /home/hogan/Private/github/Documents/markdown
rsync -av /mnt/docs/Study/Xmind/ /home/hogan/Private/github/Documents/xmind

cd /home/hogan/Private/github/Documents/
# git add *.md
# git add *.xmind
git add .
git commit -m "markdown update"

while :
do
    git pull --rebase
    if [ 0 == $? ]
    then
        break
    fi
done

while :
do
    git push origin master
    if [ 0 == $? ]
    then
        break
    fi
done

