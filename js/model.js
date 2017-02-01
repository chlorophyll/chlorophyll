function Overlay(model) {
	var self = this;
	this.colors = Immutable.Map();

	this.priority = 0;

	this.size = function() {
		return this.colors.size;
	}

	this.set = function(i, color) {
		this.colors = this.colors.set(i, color);
		model.updateColors();
	}

	this.unset = function(i) {
		this.colors = this.colors.delete(i);
		model.updateColors();
	}

	this.updateColors = function() {
		this.colors.keySeq().forEach(function(i) {
			model.setColor(i, self.colors.get(i));
		});
	}

	this.setAll = function(overlay) {
		this.colors = this.colors.merge(overlay.colors);
		model.updateColors();
	}

	this.unsetAll = function(overlay) {
		overlay.colors.keySeq().forEach(function(i) {
			self.colors = self.colors.delete(i);
		});
		model.updateColors();
	}

	this.setAllFromSet = function(pixels, color) {
		pixels.forEach(function(i) {
			self.colors = self.colors.set(i, color);
		});
		model.updateColors();
	}

	this.clear = function() {
		this.colors = this.colors.clear();
		model.updateColors();
	}

	this.getPixels = function() {
		return Immutable.Set.fromKeys(this.colors);
	}

	this.setPriority = function (pri) {
		this.priority = pri;
	}

	this.getPriority = function() {
		return this.priority;
	}

	this.snapshot = function() {
		return this.colors;
	}

	this.setFromSnapshot = function(snapshot) {
		this.colors = snapshot;
		model.updateColors();
	}
}

function Model(json) {
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
	var stripModels = [];
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
			self.setColor(i, stripColors[strip]);
		});
	}

	this.defaultColor = function(strip) {
		return stripColors[strip];
	}


	this.pointsWithinRadius = function(point, radius) {
		return this.octree.search(point, radius);
	}

	this.updateColors = function() {
		setDefaultColors();
		this.overlays.forEach(function (pri) {
			for (var i = 0, l = pri.length; i < l; i++) {
				pri[i].updateColors();
			}
		});
	}

	this.createOverlay = function(priority) {
		if (!priority)
			priority = 0;

		var overlay = new Overlay(this);
		overlay.setPriority(priority);

		if (!this.overlays[priority])
			this.overlays[priority] = [];
		this.overlays[priority].push(overlay);

		return overlay;
	}

	this.removeOverlay = function(overlay) {
		var pri = overlay.getPriority();
		var index = this.overlays[pri].indexOf(overlay);

		if (index == -1)
			return;

		this.overlays[pri].splice(index, 1);
		this.updateColors();
	}

	this.addToScene = function(scene) {
		scene.add(particles);
		for (var i = 0; i < stripModels.length; i++) {
			scene.add(stripModels[i]);
		}
	}

	this.setStripVisibility = function(val) {
		for (var i = 0; i < stripModels.length; i++) {
			stripModels[i].visible = val;
		}
	}

	// Initialize
	function init() {
		var model = JSON.parse(json);

		numPixels = model['num_pixels'];
		stripOffsets = [0];

		pixelData = [];
		colors = [];
		var i = 0;
		strips = model['strips'];
		var lineMaterial = new THREE.LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1,
			opacity: 0.50,
			transparent: true
		});
		for (var strip = 0; strip < strips.length; strip++) {
			var stripGeometry = new THREE.Geometry();
			for (var pixel = 0; pixel < strips[strip].length; pixel++) {
				pixelData[i] = new THREE.Vector3().fromArray(strips[strip][pixel]);
				if (pixel > 0) {
					stripGeometry.vertices.push(pixelData[i-1]);
					stripGeometry.vertices.push(pixelData[i]);
				}
				i++;
			}
			var model = new THREE.LineSegments(stripGeometry, lineMaterial);
			model.visible = false;
			stripModels.push(model);
			stripOffsets.push(i);
		}

		geometry = new THREE.Geometry();
		geometry.vertices = pixelData;

		setDefaultColors();
		geometry.colors = colors;

		geometry.computeBoundingSphere();
		var material = new THREE.PointsMaterial({ size: 15, vertexColors: THREE.VertexColors });
		particles = new THREE.Points(geometry, material);
		self.octree.add(particles, {useVertices: true});

		for (var i = 0; i < numPixels; i++) {
			self.octree.objectsData[i].index = i;
		}
	}
	init();
}
