function Frequency() {
	var frequency = 1; /* in hz internally */

	var curUnits = 'hz';

	Object.defineProperty(this, 'hz', {
		get: function() { return frequency; },
		set: function(v) { frequency = v; },
		enumerable: true
	});

	Object.defineProperty(this, 'bpm', {
		get: function() { return frequency * 60; },
		set: function(v) { frequency = v/60; },
		enumerable: true
	});

	Object.defineProperty(this, 'sec', {
		get: function() { return 1/frequency; },
		set: function(v) { frequency = 1/v; },
		enumerable: true
	});

	this.toString = function() {
		return this[curUnits] + ' ' + curUnits;
	}

	this.setDisplayUnits = function(units) {
		curUnits = units;
	}

	this.quantity = function() {
		return {number: this[curUnits], units: curUnits};
	}

	this.units = ['hz', 'bpm', 'sec'];

	this.clone = function() {
		var f = new Frequency();
		f.hz = frequency;
		f.setDisplayUnits(curUnits);
		return f;
	}

	this.toJSON = function() {
		return 'Frequency.'+frequency;
	}
}
