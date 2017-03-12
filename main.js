// dom
var container;

// threejs objects
var screenManager;

// chlorophyll objects
var model;
var worldState;
var selectionThreshold = 5; // put this somewhere reasonable...?

var UI = {};

var frontPlane, backPlane;

init();
animate();

function initModelFromJson(scene, json) {
	model = new Model(json);
	model.addToScene(scene);
	worldState = new WorldState({
		activeSelection: model.createOverlay(10),
		groupSet: new GroupManager(model)
	});

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
	LiteGUI.init();

	UI.menu = new LiteGUI.Menubar();
	UI.menu.add("File/New");
	UI.menu.add("Edit/Undo", function() { worldState.undo() });
	UI.menu.add("Edit/Redo", function() { worldState.redo() });
		Mousetrap.bind('mod+z', function() {
		worldState.undo();
	});

	Mousetrap.bind('mod+shift+z', function() {
		worldState.redo();
	});

	UI.menu.add('Help/About');

	LiteGUI.add(UI.menu);

	var mainarea = new LiteGUI.Area("mainarea", {
		content_id: "container",
		height: "calc( 100% - 20px )",
		main:true,
		inmediateResize: true
	});
	LiteGUI.add(mainarea);

	mainarea.split("horizontal",[null,256],true);
	//UI.sidebar = new LiteGUI.Panel("sidebar");
	UI.sidebar = mainarea.getSection(1);
	//mainarea.getSection(1).add(UI.sidebar);

	mainarea = mainarea.getSection(0);

	mainarea.split('horizontal', [64, null], true);
	var toolbar_panel = new LiteGUI.Panel("toolbar");

	UI.toolbar = new LiteGUI.Inspector();

	toolbar_panel.add(UI.toolbar);

	mainarea.getSection(0).add(toolbar_panel);

	container = mainarea.getSection(1).content;
	container.style.position = 'relative';
	container.style.top = 0;
	container.style.left = 0;

	//TODO: unsure exactly where these settings should live
	var rendering_win = new LiteGUI.Dialog('render_settings', {title:'Rendering Settings', minimize: true, width: 256, scroll: true, resizable:true, draggable: true});
	rendering_win.show();
	rendering_win.setPosition(window.innerWidth - 520, 20);
	var rendering_widgets = new LiteGUI.Inspector();
	rendering_widgets.addSlider("Back Clipping", -1000,
		{ min: -1000, max: 1000, step: 10, callback: function(val) {
				backPlane.constant = -val;
			}
		});
	rendering_widgets.addSlider("Front Clipping", 1000,
		{ min: -1000, max: 1000, step: 10, callback: function(val) {
				frontPlane.constant = val;
			}
		});
	rendering_widgets.addSlider("Selection Threshold", selectionThreshold,
		{ min: 0, max: 15, step: 0.1, callback: function(val) {
				selectionThreshold = val;
			}
		});
	rendering_widgets.addCheckbox("Show Strips", false,
		{ callback: function(val) {
				model.setStripVisibility(val);;
			}
		});
	// TODO: figure out file loader
	rendering_win.add(rendering_widgets);

	var width = container.clientWidth;
	var height = container.clientHeight;

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
	screenManager.addScreen('main', {isOrtho: false, active: true});
	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	var nv = v.clone().negate();
	frontPlane = new THREE.Plane(v, 1000);
	backPlane =  new THREE.Plane(nv, 1000);
	renderer.clippingPlanes = [frontPlane, backPlane];

	selectionManager = new CommandManager('Edit/Select', UI.toolbar, UI.menu);
	selectionManager.addCommand('marquee', new MarqueeSelection(container), 'm');
	selectionManager.addCommand('line', new LineSelection(container), 'l');
	selectionManager.addCommand('plane', new PlaneSelection(container), 'p');
	selectionManager.disableButtons();

	UI.toolbar.addSeparator();

	initModelFromJson(scene, icosahedron_data);
	selectionManager.foreachCommand(function(command) {
		command.model = model;
	});

	selectionManager.enableButtons();

	mainarea.onresize = screenManager.resize;
	window.addEventListener('resize', screenManager.resize, false);
}

//function init() {
//
//
//	var v = new THREE.Vector3();
//	screenManager.activeScreen.camera.getWorldDirection(v);
//	var nv = v.clone().negate();
//
//
//	renderer.clippingPlanes = [frontPlane, backPlane];
//
//	QuickSettings.useExtStyleSheet();
//
//	UI = new UIManager();
//
//	var globalView = UI.newView("global", null)
//		.addHotkey('mod+z', function() { worldState.undo(); })
//		.addHotkey('mod+shift+z', function() { worldState.redo(); });
//	globalView.enable();
//
//	var groupConfigView = UI.newView("grouping_mapping", "global");
//	groupConfigView.panel("settings", 0, 0)
//		.addControl(QuickSettings.addRange,
//			['Back Clipping', -1000, 1000, -1000, 1],
//			function(val) {
//					backPlane.constant = -val;
//			})
//		.addControl(QuickSettings.addRange,
//			['Front Clipping', -1000, 1000, 1000, 1],
//			function(val) {
//					frontPlane.constant = val;
//			})
//		.addControl(QuickSettings.addRange,
//			['Search Threshold', 0, 15, selectionThreshold, 0.1],
//			function(val) {
//					selectionThreshold = val;
//			})
//		.addControl(QuickSettings.addBoolean,
//			['Show Strips', false],
//			function(val) {
//					model.setStripVisibility(val)
//			})
//		.addControl(QuickSettings.addFileChooser,
//			['Model Loader', 'choose a model file', "application/json"],
//			function(val) {
//					chooseModelFile(scene, val);
//			});
//	groupConfigView.enable();
//
//	// TODO handle disabling controls in UI manager
//	//settings.disableControl('Model Loader');
//
//	//initModelFromJson(scene, icosahedron_data);
//
//	Mousetrap.prototype.stopCallback = function(e, element, combo) {
//		if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
//			return false;
//		}
//
//		var textbox = (element.tagName == 'INPUT' && element.type == 'text');
//		var select = (element.tagName == 'SELECT');
//		var textarea = (element.tagName == 'TEXTAREA');
//		var editable = (element.contentEditable && element.contentEditable == 'true')
//
//		return textbox || select || textarea || editable;
//	}
//
//}
//
function animate() {
	requestAnimationFrame(animate);

	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	frontPlane.normal = v;
	backPlane.normal = v.clone().negate();

	screenManager.render();
}
