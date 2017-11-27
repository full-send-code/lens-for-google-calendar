#!/bin/bash

# built for Mac

RELEASE=$(date '+%Y-%m-%dT%H:%M:%S')
DIST=dist

mkdir -p $DIST

RELEASE_FILE=${DIST}/google-calendar-selector.${RELEASE}.zip

zip -r -q ${RELEASE_FILE} \
    index.html \
    manifest.json \
    css/ \
    icons/ \
    lib/ \
    src/ \
    icons/

echo created release: $RELEASE_FILE
