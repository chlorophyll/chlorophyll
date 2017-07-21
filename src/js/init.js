// External dependencies
import * as THREE from 'three';
import keyboardJS from 'keyboardjs';
import Vue from 'vue';

// Chlorophyll modules
import Hotkey from 'chl/keybindings';
import Model from 'chl/model';
import GroupManager from 'chl/mapping/groups';
import PatternManager from 'chl/patterns/manager';
import ScreenManager from 'chl/screenmanager';
import WorldState from 'chl/worldstate';
import { MarqueeSelection, LineSelection, PlaneSelection } from 'chl/tools/selection';
import LiteGUI from 'chl/litegui';
import 'chl/patches';
import Const from 'chl/const';

// Vue components
import Toolbar from '@/components/toolbar';

import chrysanthemum from 'models/chrysanthemum'; // TODO proper loader


// Chlorophyll dataset manager objects
let toolbarManager;
let screenManager;
let groupManager;
let patternManager;

// chlorophyll objects
let worldState;

const UILayout = {};

export {
    UILayout,
    toolbarManager,
    screenManager,
    groupManager,
    patternManager,
    worldState
};

function Chlorophyll() {
    let self = this;

    this.frontPlane = null;
    this.backPlane = null;
    this.selectionThreshold = 5; // TODO track in selection tools

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

    this.init = function() {
        /**************
         * GUI layout *
         **************/
        LiteGUI.init();

        UILayout.menu = new LiteGUI.Menubar();
        UILayout.menu.add('File/New');
        UILayout.menu.add('Edit/Undo', function() { worldState.undo(); });
        UILayout.menu.add('Edit/Redo', function() { worldState.redo(); });
            keyboardJS.bind(Hotkey.undo, function() {
            worldState.undo();
        });
        UILayout.menu.add('View');

        keyboardJS.bind(Hotkey.redo, function() {
            worldState.redo();
        });

        UILayout.menu.add('Help/About');

        LiteGUI.add(UILayout.menu);

        // Center viewport container
        let mainarea = new LiteGUI.Area('mainarea', {
            content_id: 'container',
            height: 'calc( 100% - 20px )',
            main: true,
            immediateResize: true
        });
        LiteGUI.add(mainarea);
        // Bottom tabbed pattern / sequencer editor area
        mainarea.split('vertical', [null, Const.dock_size], true);
        let dock = mainarea.getSection(1);
        dock.split('horizontal', [null, Const.sidebar_size], true);
        UILayout.sidebar_bottom = dock.getSection(1);
        dock = dock.getSection(0);

        UILayout.tabs = new LiteGUI.Tabs(null, {size: 'full'});
        dock.add(UILayout.tabs);
        mainarea = mainarea.getSection(0);

        // Group, mapping & pattern browser sidebar
        mainarea.split('horizontal', [null, Const.sidebar_size], true);
        UILayout.sidebar_top = mainarea.getSection(1);
        // UILayout.sidebar_bottom = UILayout.sidebar.getSection(1);

        mainarea = mainarea.getSection(0);


        // Viewport side toolbar
        mainarea.split('horizontal', [Const.toolbar_size, null], true);
        let toolbar_panel = new LiteGUI.Panel('toolbar');

        UILayout.toolbar = toolbar_panel.root;

        mainarea.getSection(0).add(toolbar_panel);
        mainarea = mainarea.getSection(1);

        let viewport = UILayout.viewport = mainarea.root;
        viewport.style.position = 'relative';
        viewport.style.top = 0;
        viewport.style.left = 0;


        /****************************
         * Three.js rendering setup *
         ****************************/
        let scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

        let renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(scene.fog.color);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        mainarea.content.appendChild(renderer.domElement);

        screenManager = new ScreenManager(UILayout.viewport, renderer, scene);
        screenManager.addScreen('main', {isOrtho: false, active: true});
        let v = new THREE.Vector3();
        screenManager.activeScreen.camera.getWorldDirection(v);
        let nv = v.clone().negate();
        self.frontPlane = new THREE.Plane(v, Const.max_clip_plane);
        self.backPlane = new THREE.Plane(nv, Const.max_clip_plane);
        renderer.clippingPlanes = [];

        let model = initModelFromJson(scene, chrysanthemum);


        /**************************
         * Viewport toolbar setup *
         **************************/
        toolbarManager = new Vue(Toolbar).$mount('#toolbar');
        toolbarManager.menu = UILayout.menu;
        toolbarManager.menu_dir = 'Edit/Select';
        toolbarManager.tools = [
            null,
            {
                name: 'camera',
                toolobj: {
                    enable() {
                        screenManager.activeScreen.controlsEnabled = true;
                    },
                    disable() {
                        screenManager.activeScreen.controlsEnabled = false;
                    }
                },
                hotkey: Hotkey.tool_camera,
                momentary_hotkey: Hotkey.tool_camera_momentary
            },
            null,
            {
                name: 'marquee',
                toolobj: new MarqueeSelection(UILayout.viewport, model),
                hotkey: Hotkey.tool_select_marquee
            },
            {
                name: 'line',
                toolobj: new LineSelection(UILayout.viewport, model),
                hotkey: Hotkey.tool_select_line
            },
            {
                name: 'plane',
                toolobj: new PlaneSelection(UILayout.viewport, model),
                hotkey: Hotkey.tool_select_plane
            },
            null
        ];
        toolbarManager.active = 'camera';


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
                renderer.clippingPlanes = [self.frontPlane, self.backPlane];
            else
                renderer.clippingPlanes = [];
        });
        rendering_widgets.addDualSlider('Clipping', {left: -1000, right: 1000},
            {
                min: -Const.max_clip_plane,
                max: Const.max_clip_plane,
                step: 10,
                callback: function(val) {
                    self.backPlane.constant = -val.left;
                    self.frontPlane.constant = val.right;
                }
            });
        rendering_widgets.addSlider('Selection Threshold', self.selectionThreshold,
            { min: 0, max: 15, step: 0.1, callback: function(val) {
                    self.selectionThreshold = val;
                }
            });
        rendering_widgets.addCheckbox('Show Strips', false,
            { callback: function(val) {
                    model.setStripVisibility(val);
                }
            });
        rendering_win.add(rendering_widgets);
        UILayout.menu.add('View/Viewport Settings', function() {
            rendering_win.show();
            rendering_win.setPosition(window.innerWidth - 520, 20);
        });


        mainarea.onresize = screenManager.resize;
        window.addEventListener('resize', screenManager.resize, false);
    };

    this.animate = function() {
        requestAnimationFrame(self.animate);

        let v = new THREE.Vector3();
        screenManager.activeScreen.camera.getWorldDirection(v);
        self.frontPlane.normal = v;
        self.backPlane.normal = v.clone().negate();

        screenManager.render();
    };
}

export default new Chlorophyll();
