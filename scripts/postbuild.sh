#!/usr/bin/sh

cat node-bin.sh > bin/nktool
cat dist/main.js >> bin/nktool

chmod +x bin/nktool

rm -rf dist
