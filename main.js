// dom
var container;

// Chlorophyll dataset manager objects
var toolbarManager;
var screenManager;
var groupManager;
var patternManager;

// chlorophyll objects
var worldState;
var selectionThreshold = 5; // put this somewhere reasonable...?

var UI = {};

var frontPlane, backPlane;

init();
animate();

function initModelFromJson(scene, json) {
	var model = new Model(json);
	model.addToScene(scene);
	groupManager = new GroupManager(model);
	patternManager = new PatternManager();
	worldState = new WorldState({
		activeSelection: model.createOverlay(10),
		groupSet: groupManager,
		graphManager: patternManager,
	});
	return model;
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
	/**************
	 * GUI layout *
	 **************/
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

	// Center viewport container
	var mainarea = new LiteGUI.Area("mainarea", {
		content_id: "container",
		height: "calc( 100% - 20px )",
		main:true,
		inmediateResize: true
	});
	LiteGUI.add(mainarea);

	// Group, mapping & pattern browser sidebar
	mainarea.split("horizontal",[null,220],true);
	UI.sidebar = mainarea.getSection(1);

	mainarea = mainarea.getSection(0);

	// Bottom tabbed pattern / sequencer editor area
	mainarea.split('vertical',[null,225], true);
	var dock = mainarea.getSection(1);
	UI.tabs = new LiteGUI.Tabs(null, {size: 'full'});
	console.log(UI.tabs);

	dock.add(UI.tabs);
	mainarea = mainarea.getSection(0);

	// Viewport side toolbar
	mainarea.split('horizontal', [75, null], true);
	var toolbar_panel = new LiteGUI.Panel("toolbar");

	UI.toolbar = new LiteGUI.Inspector();

	toolbar_panel.add(UI.toolbar);

	mainarea.getSection(0).add(toolbar_panel);
	mainarea = mainarea.getSection(1);

	container = mainarea.content;
	container.style.position = 'relative';
	container.style.top = 0;
	container.style.left = 0;


	/****************************
	 * Three.js rendering setup *
	 ****************************/
	var scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(scene.fog.color);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);

	screenManager = new ScreenManager(renderer, scene);
	screenManager.addScreen('main', {isOrtho: false, active: true});
	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	var nv = v.clone().negate();
	frontPlane = new THREE.Plane(v, Const.max_clip_plane);
	backPlane =  new THREE.Plane(nv, Const.max_clip_plane);
	renderer.clippingPlanes = [];

	var model = initModelFromJson(scene, chrysanthemum);


	/**************************
	 * Viewport toolbar setup *
	 **************************/
	toolbarManager = new Toolbox('Edit/Select', UI.toolbar, UI.menu);
	toolbarManager.addTool("camera", {
		enable: function() {
			screenManager.activeScreen.controlsEnabled = true;
		},
		disable: function() {
			screenManager.activeScreen.controlsEnabled = false;
		}
	}, 'c');
	UI.toolbar.addSeparator();
	toolbarManager.addTool('marquee', new MarqueeSelection(container, model), 'm');
	toolbarManager.addTool('line', new LineSelection(container, model), 'l');
	toolbarManager.addTool('plane', new PlaneSelection(container, model), 'p');
	toolbarManager.enableButtons();
	toolbarManager.setActiveTool('camera');


	/******************************
	 * Render settings dialog box *
	 ******************************/
	//TODO: unsure exactly where these settings should live
	var rendering_win = new LiteGUI.Dialog('render_settings',
		{
			title:'Rendering Settings',
			minimize: true,
			width: 256,
			scroll: true,
			resizable:true,
			draggable: true
		});
	rendering_win.show();
	rendering_win.setPosition(window.innerWidth - 520, 20);
	var rendering_widgets = new LiteGUI.Inspector();
	rendering_widgets.addCheckbox("Clip view", false, function(val) {
		if (val)
			renderer.clippingPlanes = [frontPlane, backPlane];
		else
			renderer.clippingPlanes = [];
	});
	rendering_widgets.addDualSlider("Clipping", {left: -1000, right: 1000},
		{
			min: -Const.max_clip_plane,
			max: Const.max_clip_plane,
			step: 10,
			callback: function(val) {
				backPlane.constant = -val.left;
				frontPlane.constant = val.right;
			}
		});
	rendering_widgets.addSlider("Selection Threshold", selectionThreshold,
		{ min: 0, max: 15, step: 0.1, callback: function(val) {
				selectionThreshold = val;
			}
		});
	rendering_widgets.addCheckbox("Show Strips", false,
		{ callback: function(val) {
				model.setStripVisibility(val);
			}
		});
	// TODO: figure out file loader
	rendering_win.add(rendering_widgets);


	mainarea.onresize = screenManager.resize;
	window.addEventListener('resize', screenManager.resize, false);
}

function animate() {
	requestAnimationFrame(animate);

	var v = new THREE.Vector3();
	screenManager.activeScreen.camera.getWorldDirection(v);
	frontPlane.normal = v;
	backPlane.normal = v.clone().negate();

	screenManager.render();
}
