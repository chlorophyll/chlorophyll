#include "math8.h"


extern "C" {


uint8_t qadd8(uint8_t i, uint8_t j) {
    unsigned int t = i + j;
    if(t > 255) t = 255;
    return t;
}


int8_t qadd7(int8_t i, int8_t j) {
    int16_t t = i + j;
    if(t > 127) t = 127;
    return t;
}

uint8_t qsub8(uint8_t i, uint8_t j) {
    int t = i - j;
    if(t < 0) t = 0;
    return t;
}

uint8_t qmul8(uint8_t i, uint8_t j) {
	int p = i*j;
	if (p > 255) p = 255;
	return p;
}

uint8_t avg8(uint8_t i, uint8_t j) {
	return (i+j) >> 1;
}

int8_t avg7(int8_t i, int8_t j) {
    return ((i + j) >> 1) + (i & 0x1);
}

int16_t avg15(int16_t i, int16_t j) {
    return ((int32_t)((int32_t)(i) + (int32_t)(j)) >> 1) + (i & 0x1);
}

uint16_t avg16(uint16_t i, uint16_t j)
{
    return (uint32_t)((uint32_t)(i) + (uint32_t)(j)) >> 1;
}

int8_t abs8(int8_t i) {
	if (i < 0) i = -1;
	return i;
}

uint8_t sqrt16(uint16_t x) {
    if(x <= 1) {
        return x;
    }

    uint8_t low = 1; // lower bound
    uint8_t hi, mid;

    if(x > 7904) {
        hi = 255;
    } else {
        hi = (x >> 5) + 8; // initial estimate for upper bound
    }

    do {
        mid = (low + hi) >> 1;
        if ((uint16_t)(mid * mid) > x) {
            hi = mid - 1;
        } else {
            if(mid == 255) {
                return 255;
            }
            low = mid + 1;
        }
    } while (hi >= low);
    return low - 1;
}

int16_t sin16(uint16_t theta) {
    static const uint16_t base[] =
    { 0, 6393, 12539, 18204, 23170, 27245, 30273, 32137 };
    static const uint8_t slope[] =
    { 49, 48, 44, 38, 31, 23, 14, 4 };

    uint16_t offset = (theta & 0x3FFF) >> 3; // 0..2047
    if(theta & 0x4000) offset = 2047 - offset;

    uint8_t section = offset / 256; // 0..7
    uint16_t b   = base[section];
    uint8_t  m   = slope[section];

    uint8_t secoffset8 = (uint8_t)(offset) / 2;

    uint16_t mx = m * secoffset8;
    int16_t  y  = mx + b;

    if(theta & 0x8000) y = -y;

    return y;
}

int16_t cos16(uint16_t theta) {
    return sin16(theta + 16384);
}

const uint8_t b_m16_interleave[] = { 0, 49, 49, 41, 90, 27, 117, 10 };
int8_t sin8(uint8_t theta) {
    uint8_t offset = theta;
    if(theta & 0x40) {
        offset = (uint8_t)255 - offset;
    }
    offset &= 0x3F; // 0..63

    uint8_t secoffset  = offset & 0x0F; // 0..15
    if(theta & 0x40) secoffset++;

    uint8_t section = offset >> 4; // 0..3
    uint8_t s2 = section * 2;
    const uint8_t* p = b_m16_interleave;
    p += s2;
    uint8_t b   =  *p;
    p++;
    uint8_t m16 =  *p;

    uint8_t mx = (m16 * secoffset) >> 4;

    int8_t y = mx + b;
    if(theta & 0x80) y = -y;

    y += 128;

    return y;
}

int8_t cos8(uint8_t theta) {
    return sin8(theta + 64);
}

uint8_t scale8(uint8_t i, fract8 scale) {
    return (((uint16_t)i) * (1+(uint16_t)(scale))) >> 8;
}

uint8_t scale8_video(uint8_t i, fract8 scale) {
    uint8_t j = (((int)i * (int)scale) >> 8) + ((i&&scale)?1:0);
    return j;
}

uint32_t nscale8x3( uint8_t r, uint8_t g, uint8_t b, fract8 scale)
{
    uint16_t scale_fixed = scale + 1;
    r = (((uint16_t)r) * scale_fixed) >> 8;
    g = (((uint16_t)g) * scale_fixed) >> 8;
    b = (((uint16_t)b) * scale_fixed) >> 8;

    return PACKED(r,g,b);
}

uint32_t nscale8x3_video( uint8_t r, uint8_t g, uint8_t b, fract8 scale)
{
    uint8_t nonzeroscale = (scale != 0) ? 1 : 0;
    r = (r == 0) ? 0 : (((int)r * (int)(scale) ) >> 8) + nonzeroscale;
    g = (g == 0) ? 0 : (((int)g * (int)(scale) ) >> 8) + nonzeroscale;
    b = (b == 0) ? 0 : (((int)b * (int)(scale) ) >> 8) + nonzeroscale;
    return PACKED(r,g,b);
}

uint16_t scale16by8(uint16_t i, fract8 scale ) {
    uint16_t result;
    result = (i * (1+((uint16_t)scale))) >> 8;
    return result;
}

uint16_t scale16(uint16_t i, fract16 scale) {
    uint16_t result;
    result = ((uint32_t)(i) * (1+(uint32_t)(scale))) / 65536;
    return result;
}

uint8_t dim8_raw(uint8_t x)
{
    return scale8(x, x);
}

/// Adjust a scaling value for dimming for video (value will never go below 1)
uint8_t dim8_video(uint8_t x)
{
    return scale8_video(x, x);
}

/// Linear version of the dimming function that halves for values < 128
uint8_t dim8_lin(uint8_t x) {
    if(x & 0x80 ) {
        x = scale8(x, x);
    } else {
        x += 1;
        x /= 2;
    }
    return x;
}

/// inverse of the dimming function, brighten a value
uint8_t brighten8_raw(uint8_t x) {
    uint8_t ix = 255 - x;
    return 255 - scale8(ix, ix);
}

/// inverse of the dimming function, brighten a value
uint8_t brighten8_video(uint8_t x) {
    uint8_t ix = 255 - x;
    return 255 - scale8_video(ix, ix);
}

/// inverse of the dimming function, brighten a value
uint8_t brighten8_lin(uint8_t x ) {
    uint8_t ix = 255 - x;
    if(ix & 0x80 ) {
        ix = scale8(ix, ix);
    } else {
        ix += 1;
        ix /= 2;
    }
    return 255 - ix;
}

uint8_t lerp8by8(uint8_t a, uint8_t b, fract8 frac)
{
    uint8_t result;
    if(b > a) {
        uint8_t delta = b - a;
        uint8_t scaled = scale8(delta, frac);
        result = a + scaled;
    } else {
        uint8_t delta = a - b;
        uint8_t scaled = scale8(delta, frac);
        result = a - scaled;
    }
    return result;
}

uint16_t lerp16by16(uint16_t a, uint16_t b, fract16 frac)
{
    uint16_t result;
    if(b > a ) {
        uint16_t delta = b - a;
        uint32_t scaled = scale16(delta, frac);
        result = a + scaled;
    } else {
        uint16_t delta = a - b;
        uint16_t scaled = scale16(delta, frac);
        result = a - scaled;
    }
    return result;
}

uint16_t lerp16by8(uint16_t a, uint16_t b, fract8 frac) {
    uint16_t result;
    if(b > a) {
        uint16_t delta = b - a;
        uint16_t scaled = scale16by8(delta, frac);
        result = a + scaled;
    } else {
        uint16_t delta = a - b;
        uint16_t scaled = scale16by8(delta, frac);
        result = a - scaled;
    }
    return result;
}

int16_t lerp15by8(int16_t a, int16_t b, fract8 frac)
{
    int16_t result;
    if(b > a) {
        uint16_t delta = b - a;
        uint16_t scaled = scale16by8(delta, frac);
        result = a + scaled;
    } else {
        uint16_t delta = a - b;
        uint16_t scaled = scale16by8(delta, frac);
        result = a - scaled;
    }
    return result;
}

/// linear interpolation between two signed 15-bit values,
/// with 8-bit fraction
int16_t lerp15by16(int16_t a, int16_t b, fract16 frac)
{
    int16_t result;
    if(b > a) {
        uint16_t delta = b - a;
        uint16_t scaled = scale16(delta, frac);
        result = a + scaled;
    } else {
        uint16_t delta = a - b;
        uint16_t scaled = scale16(delta, frac);
        result = a - scaled;
    }
    return result;
}

uint8_t map8(uint8_t in, uint8_t rangeStart, uint8_t rangeEnd) {
    uint8_t rangeWidth = rangeEnd - rangeStart;
    uint8_t out = scale8(in, rangeWidth);
    out += rangeStart;
    return out;
}


uint8_t ease8InOutQuad(uint8_t i) {
    uint8_t j = i;
    if(j & 0x80 ) {
        j = 255 - j;
    }
    uint8_t jj  = scale8( j, (j+1));
    uint8_t jj2 = jj << 1;
    if(i & 0x80 ) {
        jj2 = 255 - jj2;
    }
    return jj2;
}
fract8 ease8InOutCubic(fract8 i) {
    uint8_t ii  = scale8( i, i);
    uint8_t iii = scale8(ii, i);

    uint16_t r1 = (3 * (uint16_t)(ii)) - (2 * (uint16_t)(iii));

    uint8_t result = r1;

    // if we got "256", return 255:
    if(r1 & 0x100 ) {
        result = 255;
    }
    return result;
}

fract8 ease8InOutApprox(fract8 i) {
    if(i < 64) {
        // start with slope 0.5
        i /= 2;
    } else if(i > (255 - 64)) {
        // end with slope 0.5
        i = 255 - i;
        i /= 2;
        i = 255 - i;
    } else {
        // in the middle, use slope 192/128 = 1.5
        i -= 64;
        i += (i / 2);
        i += 32;
    }

    return i;
}

uint8_t triwave8(uint8_t in) {
    if(in & 0x80) {
        in = 255 - in;
    }
    uint8_t out = in << 1;
    return out;
}

uint8_t quadwave8(uint8_t in) {
    return ease8InOutQuad(triwave8(in));
}

uint8_t cubicwave8(uint8_t in) {
    return ease8InOutCubic(triwave8(in));
}

uint8_t squarewave8(uint8_t in, uint8_t pulsewidth) {
    if(in < pulsewidth || (pulsewidth == 255)) {
        return 255;
    } else {
        return 0;
    }
}
}
