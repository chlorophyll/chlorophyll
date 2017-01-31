// dom
var container;

// threejs objects
var camera, scene, controls, renderer, particles, geometry;

// chlorophyll objects
var model, handle;
var worldState;

var frontPlane, backPlane;

init();
animate();

function init() {
	container = document.getElementById('container');
	var width = container.clientWidth;
	var height = container.clientHeight;
	//
	camera = new THREE.PerspectiveCamera(45, width/height, 2, 2000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 750, 2000);

	geometry = new THREE.BufferGeometry();

	positions = new Float32Array(900 * 3);
	colors = new Float32Array(900 * 3);

	model = new Model(geometry);
	particles = model.makeMesh(icosahedron_data);
	scene.add(particles);

	worldState = new WorldState({
		activeSelection: model.createOverlay(10),
		groupSet: new GroupManager(model)
	});

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

	handle = new ViewportHandle(scene, camera, renderer);
	handle.setMode("translate");

	window.addEventListener('resize', onWindowResize, false);

	var v = new THREE.Vector3();
	camera.getWorldDirection(v);
	var nv = v.clone().negate();

	frontPlane = new THREE.Plane(v, 1000);
	backPlane =  new THREE.Plane(nv, 1000);

	renderer.clippingPlanes = [frontPlane, backPlane];

	QuickSettings.useExtStyleSheet();

	var settings = QuickSettings.create(0, 0, "Controls");
	settings.addRange('Back Clipping', -1000, 1000, -1000, 1, function(val) {
		backPlane.constant = -val;
	});
	settings.addRange('Front Clipping', -1000, 1000, 1000, 1, function(val) {
		frontPlane.constant = val;
	});

	commandManager = new CommandManager();
	commandManager.addCommand('marquee', new MarqueeSelection(model, container), 'm');
	commandManager.addCommand('line', new LineSelection(model, container), 'l');
	commandManager.addCommand('navigate', controls, 'n', true);

	Mousetrap.prototype.stopCallback = function(e, element, combo) {
		if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
			return false;
		}

		var textbox = (element.tagName == 'INPUT' && element.type == 'text');
		var select = (element.tagName == 'SELECT');
		var textarea = (element.tagName == 'TEXTAREA');
		var editable = (element.contentEditable && element.contentEditable == 'true')

		return textbox || select || textarea || editable;
	}

	Mousetrap.bind('n', function() {
		settings.setValue('navigate', !uiShim.navigate);
	});

	Mousetrap.bind('mod+z', function() {
		worldState.undo();
	});

	Mousetrap.bind('mod+shift+z', function() {
		worldState.redo();
	});
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
	handle.update();
	render();
	controls.update();
}

function render() {
	renderer.render(scene, camera);
}
