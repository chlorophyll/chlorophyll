SRC=src
TOOLS=tools

SOURCES=$(SRC)/math8.cpp $(SRC)/hsv2rgb.cpp
CPPFLAGS=--post-js fastled-post.js --pre-js fastled-pre.js


.PHONY: all clean

all: fastled.js

#%.bc: %.cpp
#	emcc $(CPPFLAGS) $^ -o $@

fastled.js: $(SOURCES)
	emcc $(CPPFLAGS) -o $@ $^

clean:
	rm -f fastled.js
