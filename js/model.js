function Model() {
	var stripOffsets;
	var numPixels;
	var pixelData;
	var colors;
	this.loadData = function(json) {
		var model = JSON.parse(json);

		numPixels = model['num_pixels'];
		stripOffsets = [0]

		pixelData = new Float32Array(numPixels*3);
		colors = new Float32Array(numPixels*3);
		var i = 0;
		strips = model['strips'];
		for (var strip = 0; strip < strips.length; strip++) {
			for (var pixel = 0; pixel < strips[strip].length; pixel++) {
				for (var coord = 0; coord < 3; coord++) {
					pixelData[3*i + coord] = strips[strip][pixel][coord];
				}
				i++;
			}
			stripOffsets.push(i);
		}
	};

	this.forEachStrip = function(func) {
		var strip = 0;
		for (var i = 0; i < numPixels; i++) {
			var stripEnd = stripOffsets[strip+1];
			if (i >= stripEnd)
				strip++;
			func(strip, i);
		}
	};

	this.forEachPixelInStrip = function(strip, func) {
		var stripStart = stripOffsets[strip];
		var stripEnd = stripOffsets[strip+1];
		for (var i = stripStart; i < stripEnd; i++) {
			func(strip, i);
		}
	}

	this.getPosition = function(i) {
		return pixelData.slice(3*i, 3*(i+1));
	};

	this.getStrip = function(i) {
		for (var s = 0; s < stripOffsets.length-1; s++) {
			var start = stripOffsets[s];
			if (start >= i) {
				return s;
			}
		}
		return undefined;//
	}

	this.makeMesh = function(geometry) {
		var stripColors = [
			[  0,   1,   0],
			[0.5,   0,   1],
			[  1,   0,   0],
			[  1, 0.5,   0],
			[  1,   1,   0]
		]

		this.forEachStrip(function(strip, i) {
			for (var j = 0; j < 3; j++) {
				colors[3*i + j] = stripColors[strip][j];
			}
		});
		geometry.addAttribute('position', new THREE.BufferAttribute(pixelData, 3));
		geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));

		geometry.computeBoundingSphere();
		var material = new THREE.PointsMaterial({ size: 10, vertexColors: THREE.VertexColors });
		particles = new THREE.Points(geometry, material);

		return particles;
	};
}
