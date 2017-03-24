FastLED = Module;

Math8 = {
	qadd8: FastLED.cwrap('qadd8', 'number', ["number", "number"]),
	qadd7: FastLED.cwrap('qadd7', 'number', ["number", "number"]),
	qsub8: FastLED.cwrap('qsub8', 'number', ["number", "number"]),

	qmul8: FastLED.cwrap('qmul8', 'number', ["number", "number"]),

	avg8: FastLED.cwrap('avg8', 'number', ["number", "number"]),
	avg7: FastLED.cwrap('avg7', 'number', ["number", "number"]),
	avg15: FastLED.cwrap('avg15', 'number', ["number", "number"]),
	avg16: FastLED.cwrap('avg16', 'number', ["number", "number"]),
	abs8: FastLED.cwrap('abs8', 'number', ["number"]),
	sqrt16: FastLED.cwrap('sqrt16', 'number', ["number"]),

	sin16: FastLED.cwrap('sin16', 'number', ["number"]),
	cos16: FastLED.cwrap('cos16', 'number', ["number"]),
	sin8: FastLED.cwrap('sin8', 'number', ["number"]),
	cos8: FastLED.cwrap('cos8', 'number', ["number"]),

	scale8: FastLED.cwrap('scale8', 'number', ["number", "number"]),
	scale8_video: FastLED.cwrap('scale8_video', 'number', ["number", "number"]),
	scale16by8: FastLED.cwrap('scale16by8', 'number', ["number", "number"]),
	scale16: FastLED.cwrap('scale16', 'number', ["number", "number"]),

	nscale8x3: FastLED.cwrap('nscale8x3', 'number', ["number", "number", "number", "number"]),
	nscale8x3_video: FastLED.cwrap('nscale8x3_video', 'number', ["number", "number", "number", "number"]),

	dim8_raw: FastLED.cwrap('dim8_raw', 'number', ["number"]),
	dim8_video: FastLED.cwrap('dim8_video', 'number', ["number"]),
	dim8_lin: FastLED.cwrap('dim8_lin', 'number', ["number" ]),

	brighten8_raw: FastLED.cwrap('brighten8_raw', 'number', ["number"]),
	brighten8_video: FastLED.cwrap('brighten8_video', 'number', ["number"]),
	brighten8_lin: FastLED.cwrap('brighten8_lin', 'number', ["number"]),

	lerp8by8: FastLED.cwrap('lerp8by8', 'number', ["number", "number", "number"]),
	lerp16by16: FastLED.cwrap('lerp16by16', 'number', ["number", "number", "number"]),
	lerp16by8: FastLED.cwrap('lerp16by8', 'number', ["number", "number", "number"]),
	lerp15by8: FastLED.cwrap('lerp15by8', 'number', ["number", "number", "number"]),
	lerp15by16: FastLED.cwrap('lerp15by16', 'number', ["number", "number", "number"]),
	map8: FastLED.cwrap('map8', 'number', ["number", "number", "number"]),

	ease8InOutQuad: FastLED.cwrap('ease8InOutQuad', 'number', ["number"]),
	ease8InOutCubic: FastLED.cwrap('ease8InOutCubic', 'number', ["number"]),
	ease8InOutApprox: FastLED.cwrap('ease8InOutApprox', 'number', ["number"]),

	triwave8: FastLED.cwrap('triwave8', 'number', ["number"]),
	quadwave8: FastLED.cwrap('quadwave8', 'number', ["number"]),
	cubicwave8: FastLED.cwrap('cubicwave8', 'number', ["number"]),
	squarewave8: FastLED.cwrap('squarewave8', 'number', ["number", "number"]),
}
