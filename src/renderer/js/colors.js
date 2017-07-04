import THREE from 'three';

export default function ColorPool() {
	var colors = [
		new THREE.Color(0x24c6ff),
		new THREE.Color(0xffa21a),
		new THREE.Color(0x774cfa),
		new THREE.Color(0xb4f553),
		new THREE.Color(0xda00a9),
		new THREE.Color(0x00df8a),
		new THREE.Color(0x8938a7),
		new THREE.Color(0xb7b500),
		new THREE.Color(0x015ad6),
		new THREE.Color(0xcd9600),
		new THREE.Color(0x798bff),
		new THREE.Color(0x009d47),
		new THREE.Color(0xff8eff),
		new THREE.Color(0x236b1f),
		new THREE.Color(0xb31361),
		new THREE.Color(0x02a894),
		new THREE.Color(0xff6c7e),
		new THREE.Color(0x007087),
		new THREE.Color(0xad2943),
		new THREE.Color(0x7bbcff),
		new THREE.Color(0x6a7c00),
		new THREE.Color(0xd6afff),
		new THREE.Color(0x7c6000),
		new THREE.Color(0xff8eb4),
		new THREE.Color(0x854875),
	]

	/* TODO make this not repeat colors
	this.unusedColors = colors;

	this.get = function() {};
	this.recycle = function() {};

	*/
	var i = 0;
	this.random = function() {
		i = (i + 1) % (colors.length);
		return colors[i];
	}
}
