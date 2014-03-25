#!/bin/bash

for file in *.md; do
	(cat style.html && marked --gfm "$file" --breaks --tables) > "${file%.*}.html"
done
