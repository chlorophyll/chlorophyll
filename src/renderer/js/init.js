import * as THREE from 'three';
import Model from 'chl/model';
import GroupManager from 'chl/mapping/groups';
import PatternManager from 'chl/patterns/manager';
import WorldState from 'chl/worldstate';

// dom
let container;

// Chlorophyll dataset manager objects
let toolbarManager;
let screenManager;
let groupManager;
let patternManager;

// chlorophyll objects
let worldState;

const UI = {};

export {
    UI,
    toolbarManager,
    screenManager,
    groupManager,
    patternManager,
    worldState
};

export default function Chlorophyll() {
    let frontPlane, backPlane;
    let selectionThreshold = 5; // TODO track in selection tools

    function initModelFromJson(scene, json) {
        let model = new Model(json);
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
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                initModelFromJson(scene, e.target.result);
            } catch (ex) {
                console.log('ex when trying to parse json = ' + ex);
            }
        };
        reader.readAsText(file);
    }

    this.init = function() {
        /**************
         * GUI layout *
         **************/
        LiteGUI.init();

        UI.menu = new LiteGUI.Menubar();
        UI.menu.add('File/New');
        UI.menu.add('Edit/Undo', function() { worldState.undo(); });
        UI.menu.add('Edit/Redo', function() { worldState.redo(); });
            keyboardJS.bind(Hotkey.undo, function() {
            worldState.undo();
        });
        UI.menu.add('View');

        keyboardJS.bind(Hotkey.redo, function() {
            worldState.redo();
        });

        UI.menu.add('Help/About');

        LiteGUI.add(UI.menu);

        // Center viewport container
        let mainarea = new LiteGUI.Area('mainarea', {
            content_id: 'container',
            height: 'calc( 100% - 20px )',
            main: true,
            inmediateResize: true
        });
        LiteGUI.add(mainarea);
        // Bottom tabbed pattern / sequencer editor area
        mainarea.split('vertical', [null, Const.dock_size], true);
        let dock = mainarea.getSection(1);
        dock.split('horizontal', [null, Const.sidebar_size], true);
        UI.sidebar_bottom = dock.getSection(1);
        dock = dock.getSection(0);

        UI.tabs = new LiteGUI.Tabs(null, {size: 'full'});
        dock.add(UI.tabs);
        mainarea = mainarea.getSection(0);

        // Group, mapping & pattern browser sidebar
        mainarea.split('horizontal', [null, Const.sidebar_size], true);
        UI.sidebar_top = mainarea.getSection(1);
        // UI.sidebar_bottom = UI.sidebar.getSection(1);

        mainarea = mainarea.getSection(0);


        // Viewport side toolbar
        mainarea.split('horizontal', [Const.toolbar_size, null], true);
        let toolbar_panel = new LiteGUI.Panel('toolbar');

        UI.toolbar = new LiteGUI.Inspector();

        toolbar_panel.add(UI.toolbar);

        mainarea.getSection(0).add(toolbar_panel);
        mainarea = mainarea.getSection(1);
        UI.viewport = mainarea;

        container = mainarea.content;
        container.style.position = 'relative';
        container.style.top = 0;
        container.style.left = 0;


        /****************************
         * Three.js rendering setup *
         ****************************/
        let scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

        let renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(scene.fog.color);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        screenManager = new ScreenManager(renderer, scene);
        screenManager.addScreen('main', {isOrtho: false, active: true});
        let v = new THREE.Vector3();
        screenManager.activeScreen.camera.getWorldDirection(v);
        let nv = v.clone().negate();
        frontPlane = new THREE.Plane(v, Const.max_clip_plane);
        backPlane = new THREE.Plane(nv, Const.max_clip_plane);
        renderer.clippingPlanes = [];

        let model = initModelFromJson(scene, chrysanthemum);


        /**************************
         * Viewport toolbar setup *
         **************************/
        toolbarManager = new Toolbar('Edit/Select', UI.toolbar, UI.menu);
        toolbarManager.addTool('camera', {
            enable: function() {
                screenManager.activeScreen.controlsEnabled = true;
            },
            disable: function() {
                screenManager.activeScreen.controlsEnabled = false;
            }
        }, Hotkey.tool_camera, Hotkey.tool_camera_momentary);
        UI.toolbar.addSeparator();
        toolbarManager.addTool('marquee', new MarqueeSelection(container, model),
            Hotkey.tool_select_marquee);
        toolbarManager.addTool('line', new LineSelection(container, model),
            Hotkey.tool_select_line);
        toolbarManager.addTool('plane', new PlaneSelection(container, model),
            Hotkey.tool_select_plane);
        toolbarManager.enableButtons();
        toolbarManager.setActiveTool('camera');


        /******************************
         * Render settings dialog box *
         ******************************/
        // TODO: unsure exactly where these settings should live
        let rendering_win = new LiteGUI.Dialog('render_settings',
            {
                title: 'Viewport Settings',
                close: true,
                width: 256,
                scroll: true,
                resizable: true,
                draggable: true
            });
        let rendering_widgets = new LiteGUI.Inspector();
        rendering_widgets.addCheckbox('Clip view', false, function(val) {
            if (val)
                renderer.clippingPlanes = [frontPlane, backPlane];
            else
                renderer.clippingPlanes = [];
        });
        rendering_widgets.addDualSlider('Clipping', {left: -1000, right: 1000},
            {
                min: -Const.max_clip_plane,
                max: Const.max_clip_plane,
                step: 10,
                callback: function(val) {
                    backPlane.constant = -val.left;
                    frontPlane.constant = val.right;
                }
            });
        rendering_widgets.addSlider('Selection Threshold', selectionThreshold,
            { min: 0, max: 15, step: 0.1, callback: function(val) {
                    selectionThreshold = val;
                }
            });
        rendering_widgets.addCheckbox('Show Strips', false,
            { callback: function(val) {
                    model.setStripVisibility(val);
                }
            });
        rendering_win.add(rendering_widgets);
        UI.menu.add('View/Viewport Settings', function() {
            rendering_win.show();
            rendering_win.setPosition(window.innerWidth - 520, 20);
        });


        mainarea.onresize = screenManager.resize;
        window.addEventListener('resize', screenManager.resize, false);
    };

    this.animate = function() {
        requestAnimationFrame(animate);

        let v = new THREE.Vector3();
        screenManager.activeScreen.camera.getWorldDirection(v);
        frontPlane.normal = v;
        backPlane.normal = v.clone().negate();

        screenManager.render();
    };
}
