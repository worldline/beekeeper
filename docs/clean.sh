#!/bin/bash

for file in *.md; do
  rm -f "${file%.*}.html"
done
