// dom
var container;

// threejs objects
var camera, scene, controls, renderer;

// chlorophyll objects
var model, handle;
var worldState;

var selectionThreshold = 5; // put this somewhere reasonable...?

var frontPlane, backPlane;
var UI;

init();
animate();

function initModelFromJson(json) {
	model = new Model(json);
	model.addToScene(scene);
	worldState = new WorldState({
		activeSelection: model.createOverlay(10),
		groupSet: new GroupManager(model)
	});

	selectionManager = new CommandManager();
	selectionManager.addCommand('marquee', new MarqueeSelection(model, container), 'm');
	selectionManager.addCommand('line', new LineSelection(model, container), 'l');
	selectionManager.addCommand('plane', new PlaneSelection(model, container), 'p');
	selectionManager.addCommand('navigate', controls, 'n', true);

}

function chooseModelFile(file) {
	var reader = new FileReader();
	reader.onload = function (e) {
		try {
			initModelFromJson(e.target.result);
		} catch (ex) {
			console.log('ex when trying to parse json = ' + ex);
		}
	}
	reader.readAsText(file);
}

function init() {
	container = document.getElementById('container');
	var width = container.clientWidth;
	var height = container.clientHeight;
	//
	camera = new THREE.PerspectiveCamera(45, width/height, 2, 2000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 750, 2000);

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

	UI = new UIManager();
	var globalUI = {
		panels: [],
		controls: [],
		hotkeys: [
			{key: 'mod+z', callback: function() { worldState.undo(); }},
			{key: 'mod+shift+z', callback: function() { worldState.redo(); }},
		]
	};
	var globalView = UI.newMode("global", globalUI);
	UI.enableMode("global");

	var groupMapUI = {
		panels: [{
			name: "settings",
			x: 0, y: 0
		}],
		controls: [
			{
				panel: "settings", type: QuickSettings.addRange,
				params: ['Back Clipping', -1000, 1000, -1000, 1, function(val) {
					backPlane.constant = -val;
				}]
			},
			{
				panel: "settings", type: QuickSettings.addRange,
				params: ['Front Clipping', -1000, 1000, 1000, 1, function(val) {
					frontPlane.constant = val;
				}]
			},
			{
				panel: "settings", type: QuickSettings.addRange,
				params: ['Search Threshold', 0, 15, selectionThreshold, 0.1, function(val) {
					selectionThreshold = val;
				}]
			},
			{
				panel: "settings", type: QuickSettings.addBoolean,
				params: ['Show Strips', false, function(val) {
					model.setStripVisibility(val)
				}]
			},
			{
				panel: "settings", type: QuickSettings.addFileChooser,
				params: ['Model Loader', 'choose a model file', "application/json",
					chooseModelFile]
			},
		]
	}
	var groupConfigView = UI.newMode("grouping_mapping", groupMapUI, "global");
	UI.enableMode("grouping_mapping");

	// TODO handle disabling controls in UI manager
	// settings.disableControl('Model Loader');

	initModelFromJson(icosahedron_data);

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
