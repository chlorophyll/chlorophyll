// dom
var container;

// threejs objects
var camera, scene, controls, renderer, particles, geometry;

// chlorophyll objects
var marquee, model;

var frontPlane, backPlane;

init();
animate();

function init() {
	container = document.getElementById('container');
	var width = container.clientWidth;
	var height = container.clientHeight;
	//
	camera = new THREE.PerspectiveCamera(55, width/height, 2, 2000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 750, 2000);

	geometry = new THREE.BufferGeometry();

	positions = new Float32Array(900 * 3);
	colors = new Float32Array(900 * 3);

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
	controls.enableKeys = false;

	marquee = new Marquee(model, container);
	container.appendChild(marquee.dom);

	window.addEventListener('resize', onWindowResize, false);

	var v = new THREE.Vector3();
	camera.getWorldDirection(v);
	var nv = v.clone().negate();
	console.log(v);
	console.log(nv);

	frontPlane = new THREE.Plane(v, 1000);
	backPlane =  new THREE.Plane(nv, 1000);

	model.setColor(0, new THREE.Color(0,0,1));

	renderer.clippingPlanes = [frontPlane, backPlane];

	var uiShim = {
		set navigate(val) {
			controls.enabled = val;
			marquee.enabled = !val;
		},

		get navigate() {
			return controls.enabled;
		},

		set backPlane(val) {
			backPlane.constant = -val;
		},

		set frontPlane(val) {
			frontPlane.constant = val;
		},
	};

	uiShim.navigate = true;

	QuickSettings.useExtStyleSheet();

	var settings = QuickSettings.create(0, 0, "Controls");
	settings.bindRange('backPlane', -1000, 1000, -1000, 1, uiShim);
	settings.bindRange('frontPlane', -1000, 1000, 1000, 1, uiShim);
	settings.bindBoolean('navigate', true, uiShim);
}

function onWindowResize() {
	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
	requestAnimationFrame(animate);
	var v = new THREE.Vector3();
	camera.getWorldDirection(v);
	frontPlane.normal = v;
	backPlane.normal = v.clone().negate();
	render();
	controls.update();
}

function render() {
	renderer.render(scene, camera);
}
