SRC=src
TOOLS=tools

SOURCES=$(SRC)/math8.cpp $(SRC)/hsv2rgb.cpp


.PHONY: all clean

all: fastled.js

#%.bc: %.cpp
#	emcc $(CPPFLAGS) $^ -o $@

fastled.js: $(SOURCES)
	emcc $(CPPFLAGS) -o $@ $^

clean:
	rm -f fastled.js
