ColorPool = {
	colors: [
		new THREE.Color(0xf0ffff),
		new THREE.Color(0xf5f5dc),
		new THREE.Color(0x0000ff),
		new THREE.Color(0xa52a2a),
		new THREE.Color(0x00ffff),
		new THREE.Color(0x00008b),
		new THREE.Color(0x008b8b),
		new THREE.Color(0xa9a9a9),
		new THREE.Color(0x006400),
		new THREE.Color(0xbdb76b),
		new THREE.Color(0x8b008b),
		new THREE.Color(0xff8c00),
		new THREE.Color(0x9932cc),
		new THREE.Color(0x8b0000),
		new THREE.Color(0xe9967a),
		new THREE.Color(0x9400d3),
		new THREE.Color(0xff00ff),
		new THREE.Color(0xffd700),
		new THREE.Color(0x008000),
		new THREE.Color(0x4b0082),
		new THREE.Color(0xf0e68c),
		new THREE.Color(0xadd8e6),
		new THREE.Color(0xe0ffff),
		new THREE.Color(0x90ee90),
		new THREE.Color(0xd3d3d3),
		new THREE.Color(0xffb6c1),
		new THREE.Color(0xffffb0),
		new THREE.Color(0x00ff00),
		new THREE.Color(0xff00ff),
		new THREE.Color(0x800000),
		new THREE.Color(0x808000),
		new THREE.Color(0xffa500),
		new THREE.Color(0x800080),
		new THREE.Color(0xff0000),
		new THREE.Color(0xffff00)],

	/* TODO make this not repeat colors
	this.unusedColors = colors;

	this.get = function() {};
	this.recycle = function() {};
	*/

	random: function() {
		return this.colors[Math.floor(Math.random() * this.colors.length)];
	}
};
