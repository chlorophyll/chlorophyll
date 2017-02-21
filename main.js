// dom
var container;

// threejs objects
var screenManager;

// chlorophyll objects
var model;
var worldState;
var selectionThreshold = 5; // put this somewhere reasonable...?

var frontPlane, backPlane;
var UI;

init();
animate();

function initModelFromJson(scene, json) {
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
	selectionManager.addCommand('navigate', screenManager.controls, 'n', true);

}

function chooseModelFile(scene, file) {
	var reader = new FileReader();
	reader.onload = function (e) {
		try {
			initModelFromJson(scene, e.target.result);
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

	var scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 750, 2000);

	var renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setClearColor(scene.fog.color);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	container.appendChild(renderer.domElement);
	var cameraP = new THREE.PerspectiveCamera(45, width/height, 2, 2000 );
	var cameraO = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 2, 2000);
	cameraP.position.z = 1000;
	cameraO.position.z = 1000;

	screenManager = new ScreenManager(renderer, scene);
	screenManager.addScreen('main', cameraP, true);
	screenManager.addScreen('ortho', cameraO);

	window.addEventListener('resize', onWindowResize, false);

	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	var nv = v.clone().negate();

	frontPlane = new THREE.Plane(v, 1000);
	backPlane =  new THREE.Plane(nv, 1000);

	renderer.clippingPlanes = [frontPlane, backPlane];

	QuickSettings.useExtStyleSheet();

	UI = new UIManager();

	var globalView = UI.newView("global", null)
		.addHotkey('mod+z', function() { worldState.undo(); })
		.addHotkey('mod+shift+z', function() { worldState.redo(); });
	globalView.enable();

	var groupConfigView = UI.newView("grouping_mapping", "global");
	groupConfigView.panel("settings", 0, 0)
		.addControl(QuickSettings.addRange,
			['Back Clipping', -1000, 1000, -1000, 1],
			function(val) {
					backPlane.constant = -val;
			})
		.addControl(QuickSettings.addRange,
			['Front Clipping', -1000, 1000, 1000, 1],
			function(val) {
					frontPlane.constant = val;
			})
		.addControl(QuickSettings.addRange,
			['Search Threshold', 0, 15, selectionThreshold, 0.1],
			function(val) {
					selectionThreshold = val;
			})
		.addControl(QuickSettings.addBoolean,
			['Show Strips', false],
			function(val) {
					model.setStripVisibility(val)
			})
		.addControl(QuickSettings.addFileChooser,
			['Model Loader', 'choose a model file', "application/json"],
			function(val) {
					chooseModelFile(scene, val);
			});
	groupConfigView.enable();

	// TODO handle disabling controls in UI manager
	//settings.disableControl('Model Loader');

	//initModelFromJson(scene, icosahedron_data);

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
	screenManager.resize();
}

function animate() {
	requestAnimationFrame(animate);

	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	frontPlane.normal = v;
	backPlane.normal = v.clone().negate();

	screenManager.render();
}
