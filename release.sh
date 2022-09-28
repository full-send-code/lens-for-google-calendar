#!/bin/bash

# built for Mac

FORCE=false

while getopts 'fh' opt; do
    case "$opt" in
        f)
            FORCE=true
            ;;
        ?|h)
            echo "Usage: $(basename $0) [-f] [-h] [version]"
            echo "  -f force overwriting an existing release package"
            echo "  version defaults to version in manifest.json"
            exit 1
            ;;
    esac
done
shift $(($OPTIND - 1))

MANIFEST_VERSION=$(json version < manifest.json)
RELEASE=${1:-${MANIFEST_VERSION}}
DIST=dist

mkdir -p $DIST

RELEASE_FILE=${DIST}/google-calendar-selector.${RELEASE}.zip

if [ -f $RELEASE_FILE ]; then
    if [ $FORCE == 'false' ]; then
        echo error: release package already exists: $RELEASE_FILE
        exit
    else
        # remove the file so zip doesn't keep adding to it
        rm $RELEASE_FILE
    fi
fi

zip -r --exclude \*~ -q ${RELEASE_FILE} \
    index.html \
    manifest.json \
    css/ \
    icons/ \
    lib/ \
    src/ \
    icons/

echo created release: $RELEASE_FILE
