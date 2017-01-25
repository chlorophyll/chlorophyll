function Overlay(model) {
	this.colors = {};

	this.set = function(i, color) {
		this.colors[i] = color;
		model.updateColors();
	}

	this.unset = function(i) {
		delete this.colors[i];
		model.updateColors();
	}

	this.updateColors = function() {
		for (var i in this.colors) {
			model.setColor(i, this.colors[i]);
		}
	}

	this.setAll = function(overlay) {
		for (var i in overlay.colors) {
			this.colors[i] = overlay.colors[i];
		}
		model.updateColors();
	}

	this.unsetAll = function(overlay) {
		for (var i in overlay.colors) {
			delete this.colors[i];
		}
		model.updateColors();
	}

	this.clear = function() {
		this.colors = {};
		model.updateColors();
	}
}

function Model() {
	var self = this;
	this.overlays = [];
	var stripColors = [
		new THREE.Color(0x00ff00),
		new THREE.Color(0x8000ff),
		new THREE.Color(0xff0000),
		new THREE.Color(0xff8000),
		new THREE.Color(0xffff00)
	]
	var stripOffsets;
	var numPixels;
	var pixelData;
	var colors;
	var geometry;

	this.octree = new THREE.Octree( {
		// when undeferred = true, objects are inserted immediately
		// instead of being deferred until next octree.update() call
		// this may decrease performance as it forces a matrix update
		undeferred: true,
		// set the max depth of tree
		depthMax: Infinity,
		// max number of objects before nodes split or merge
		objectsThreshold: 8,
	});

	this.getPosition = function(i) {
		return pixelData[i];
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


	this.setColor = function(i, color) {
		colors[i] = color;
		geometry.colorsNeedUpdate = true;
	}

	this.getStrip = function(i) {
		for (var s = 0; s < stripOffsets.length-1; s++) {
			var start = stripOffsets[s];
			var end = stripOffsets[s+1];
			if (start <= i && i < end) {
				return s;
			}
		}
		return undefined;//
	}


	var setDefaultColors = function() {
		self.forEachStrip(function(strip, i) {
			model.setColor(i, stripColors[strip]);
		});
	}

	this.defaultColor = function(strip) {
		return stripColors[strip];
	}

	this.makeMesh = function(json) {
		var model = JSON.parse(json);

		numPixels = model['num_pixels'];
		stripOffsets = [0]

		pixelData = [];
		colors = [];
		var i = 0;
		strips = model['strips'];
		for (var strip = 0; strip < strips.length; strip++) {
			for (var pixel = 0; pixel < strips[strip].length; pixel++) {
				for (var coord = 0; coord < 3; coord++) {
					pixelData[i] = new THREE.Vector3().fromArray(strips[strip][pixel]);
				}
				i++;
			}
			stripOffsets.push(i);
		}
		geometry = new THREE.Geometry();

		geometry.vertices = pixelData;

		setDefaultColors();
		geometry.colors = colors;

		geometry.computeBoundingSphere();
		var material = new THREE.PointsMaterial({ size: 15, vertexColors: THREE.VertexColors });
		particles = new THREE.Points(geometry, material);
		console.log(particles);

		this.octree.add(particles, {useVertices: true});

		for (var i = 0; i < this.octree.objectsData.length; i++) {
			this.octree.objectsData[i].index = i;
		}

		return particles;
	};

	this.pointsWithinRadius = function(point, radius) {
		return this.octree.search(point, radius);
	}

	this.updateColors = function() {
		setDefaultColors();
		for (var i = 0, l = this.overlays.length; i < l; i++) {
			this.overlays[i].updateColors();
		}
	}

	this.createOverlay = function() {
		var overlay = new Overlay(this);
		this.overlays.push(overlay);
		return overlay;
	}

	this.removeOverlay = function(overlay) {
		var index = this.overlays.indexOf(overlay);

		if (index == -1)
			return;

		this.overlays.splice(index, 1);

		model.updateColors();
	}
}
