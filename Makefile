all: zip

zip:
	cd .. && zip -r chrome-hatena-star-everywhere.zip chrome-hatena-star-everywhere \
	    -i chrome-hatena-star-everywhere/* \
	    -i chrome-hatena-star-everywhere/_locales/*/*
