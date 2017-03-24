#ifndef _MATH_H_
#define _MATH_H_

#include <cstdint>
#include <emscripten.h>

#define PACKED(r,g,b) ( (r) << 16 | (g) << 8 | b )

extern "C" {
	typedef uint8_t fract8;
	typedef uint16_t fract16;
	typedef uint16_t  accum88;  ///< ANSI: unsigned short _Accum.  8 bits int, 8 bits fraction
	typedef int16_t   saccum78; ///< ANSI: signed   short _Accum.  7 bits int, 8 bits fraction
	typedef uint32_t  accum1616;///< ANSI: signed         _Accum. 16 bits int, 16 bits fraction
	typedef int32_t   saccum1516;///< ANSI: signed         _Accum. 15 bits int, 16 bits fraction
	typedef uint16_t  accum124; ///< no direct ANSI counterpart. 12 bits int, 4 bits fraction
	typedef int32_t   saccum114;///< no direct ANSI counterpart. 1 bit int, 14 bits fraction

	// math
	EMSCRIPTEN_KEEPALIVE uint8_t  qadd8(uint8_t i, uint8_t j);
	EMSCRIPTEN_KEEPALIVE int8_t   qadd7(int8_t i, int8_t j);
	EMSCRIPTEN_KEEPALIVE uint8_t  qsub8(uint8_t i, uint8_t j);

	EMSCRIPTEN_KEEPALIVE uint8_t  qmul8(uint8_t i, uint8_t j);

	EMSCRIPTEN_KEEPALIVE uint8_t   avg8(uint8_t i, uint8_t j);
	EMSCRIPTEN_KEEPALIVE int8_t    avg7(int8_t i, int8_t j);
	EMSCRIPTEN_KEEPALIVE int16_t  avg15(int16_t i, int16_t j);
	EMSCRIPTEN_KEEPALIVE uint16_t avg16(uint16_t i, uint16_t j);
	EMSCRIPTEN_KEEPALIVE int8_t    abs8(int8_t i);
	EMSCRIPTEN_KEEPALIVE uint8_t sqrt16(uint16_t x);

	EMSCRIPTEN_KEEPALIVE int16_t sin16(uint16_t theta);
	EMSCRIPTEN_KEEPALIVE int16_t cos16(uint16_t theta);
	EMSCRIPTEN_KEEPALIVE int8_t sin8(uint8_t theta);
	EMSCRIPTEN_KEEPALIVE int8_t cos8(uint8_t theta);


	EMSCRIPTEN_KEEPALIVE // scaling
	EMSCRIPTEN_KEEPALIVE uint8_t  scale8(uint8_t i, fract8 scale);
	EMSCRIPTEN_KEEPALIVE uint8_t  scale8_video(uint8_t i, fract8 scale);
	EMSCRIPTEN_KEEPALIVE uint16_t scale16by8(uint16_t i, fract8 scale);
	EMSCRIPTEN_KEEPALIVE uint16_t scale16(uint16_t i, fract16 scale);

	EMSCRIPTEN_KEEPALIVE uint32_t nscale8x3( uint8_t r, uint8_t g, uint8_t b, fract8 scale);
	EMSCRIPTEN_KEEPALIVE uint32_t nscale8x3_video( uint8_t r, uint8_t g, uint8_t b, fract8 scale);

	EMSCRIPTEN_KEEPALIVE uint8_t  dim8_raw(uint8_t x);
	EMSCRIPTEN_KEEPALIVE uint8_t  dim8_video(uint8_t x);
	EMSCRIPTEN_KEEPALIVE uint8_t  dim8_lin(uint8_t x );

	EMSCRIPTEN_KEEPALIVE uint8_t  brighten8_raw(uint8_t x);
	EMSCRIPTEN_KEEPALIVE uint8_t  brighten8_video(uint8_t x);
	EMSCRIPTEN_KEEPALIVE uint8_t  brighten8_lin(uint8_t x);

	EMSCRIPTEN_KEEPALIVE // interpolation
	EMSCRIPTEN_KEEPALIVE uint8_t  lerp8by8(uint8_t a, uint8_t b, fract8 frac);
	EMSCRIPTEN_KEEPALIVE uint16_t lerp16by16(uint16_t a, uint16_t b, fract16 frac);
	EMSCRIPTEN_KEEPALIVE uint16_t lerp16by8(uint16_t a, uint16_t b, fract8 frac);
	EMSCRIPTEN_KEEPALIVE int16_t  lerp15by8(int16_t a, int16_t b, fract8 frac);
	EMSCRIPTEN_KEEPALIVE int16_t  lerp15by16(int16_t a, int16_t b, fract16 frac);
	EMSCRIPTEN_KEEPALIVE uint8_t  map8(uint8_t in, uint8_t rangeStart, uint8_t rangeEnd);

	EMSCRIPTEN_KEEPALIVE // easing
	EMSCRIPTEN_KEEPALIVE uint8_t ease8InOutQuad( uint8_t i);
	EMSCRIPTEN_KEEPALIVE fract8 ease8InOutCubic( fract8 i);
	EMSCRIPTEN_KEEPALIVE fract8 ease8InOutApprox( fract8 i);

	EMSCRIPTEN_KEEPALIVE // pulses
	EMSCRIPTEN_KEEPALIVE uint8_t triwave8(uint8_t in);
	EMSCRIPTEN_KEEPALIVE uint8_t quadwave8(uint8_t in);
	EMSCRIPTEN_KEEPALIVE uint8_t cubicwave8(uint8_t in);
	EMSCRIPTEN_KEEPALIVE uint8_t wheel8(uint8_t in);
	EMSCRIPTEN_KEEPALIVE uint8_t squarewave8( uint8_t in, uint8_t pulsewidth=128);
}
#endif
