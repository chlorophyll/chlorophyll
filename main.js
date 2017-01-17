
var container, stats;
var camera, scene, controls, renderer, particles, group, geometry, i, h, color, sprite, size;
var model;
var mouseX = 0, mouseY = 0;
var width, height;
var colors;
var positions;
var selected = {};
init();
animate();

function init() {
	container = document.getElementById('container');
	width = container.clientWidth;
	height = container.clientHeight;
	//
	camera = new THREE.PerspectiveCamera(55, width/height, 2, 2000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 750, 2000);

	geometry = new THREE.BufferGeometry();

	positions = new Float32Array(900 * 3);
	colors = new Float32Array(900 * 3);
	var color = new THREE.Color();
	var strip_colors = [
		[  0,   1,   0],
		[0.5,   0,   1],
		[  1,   0,   0],
		[  1, 0.5,   0],
		[  1,   1,   0]
	]
	var i = 0;

	model = new Model(geometry);
	model.loadData(icosahedron_data);
	particles = model.makeMesh();
	scene.add(particles);

	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setClearColor(scene.fog.color);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	container.appendChild(renderer.domElement);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.75;
	controls.enableZoom = true;

	marquee = new Marquee(controls);
	container.appendChild(marquee.dom);

	stats = new Stats();
	container.appendChild(stats.dom);

	document.addEventListener('marquee-move', onMarqueeMove, false);
	document.addEventListener( "mousedown", onDocumentMouseDown);
	window.addEventListener('resize', onWindowResize, false);
}

function onMarqueeMove(event) {
	var l = Math.min(event.detail.startX, event.detail.endX);
	var r = Math.max(event.detail.startX, event.detail.endX);
	var t = Math.min(event.detail.startY, event.detail.endY);
	var b = Math.max(event.detail.startY, event.detail.endY);
	console.log(l,r,t,b);

	var c = new THREE.Color(1, 1, 1);

	model.forEachStrip(function(strip, i) {
		var v = model.getPosition(i);
		var s = Util.screenCoords(v);

		if (i < 5) {
			console.log(s);
		}

		if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
			model.setColor(i, c);
		}
	});
}

function onWindowResize() {
	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(container.clientWidth, container.clientHeight);
}

function onDocumentMouseDown( event ) {
       var mouse3D = new THREE.Vector3(
                       (event.clientX / window.innerWidth) * 2 - 1,
                       -(event.clientY / window.innerHeight) * 2 + 1,
                       0.5);
       var projector = new THREE.Projector();
       var raycaster = new THREE.Raycaster();
       raycaster.params.Points.threshold = 5;
       raycaster.setFromCamera(mouse3D, camera);
       var intersects = raycaster.intersectObject(particles);

       if (intersects.length == 0) return;
       console.log(event.clientX, event.clientY);
	   console.log(screenCoords(intersects[0].point));
}

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
	controls.update();
}

function render() {
	renderer.render(scene, camera);
}
