// External dependencies
import * as THREE from 'three';
import keyboardJS from 'keyboardjs';

// Chlorophyll modules
import Hotkey from 'chl/keybindings';
import Model from 'chl/model';
import { renderer, scene } from 'chl/viewport';
import PatternManager from 'chl/patterns/manager';
import { worldState } from 'chl/worldstate';
import { MarqueeSelection, LineSelection, PlaneSelection } from 'chl/tools/selection';
import LiteGUI from 'chl/litegui';
import 'chl/patches';
import 'chl/widgets/litegui-extensions';
import Const from 'chl/const';

// Vue components
import {
    animManager,
    toolbarManager,
    mappingManager,
    viewportManager,
} from 'chl/vue/root';

import store from 'chl/vue/store';

import chrysanthemum from 'models/chrysanthemum'; // TODO proper loader

// Chlorophyll UI manager objects
let patternManager;
let currentModel;
// XXX dummy GroupManager
let groupManager = {
    listMappings() {
        return [];
    }
};

const UILayout = {};

export {
    UILayout,
    toolbarManager,
    groupManager,
    patternManager,
    animManager,
    currentModel
};

function Chlorophyll() {
    const self = this;

    this.frontPlane = null;
    this.backPlane = null;
    this.selectionThreshold = 5; // TODO track in selection tools

    function initModelFromJson(json) {
        let model = new Model(json);
        model.addToScene(scene);

        patternManager = new PatternManager(groupManager);

        worldState.init({
            patternManager: patternManager,
        });

        currentModel = model;

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
        UILayout.menu.add('View');

        keyboardJS.bind(Hotkey.undo, function() {
            worldState.undo();
        });
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

        let viewport_axes = document.createElement('div');
        viewport_axes.id = 'viewport-axes';
        viewport.appendChild(viewport_axes);

        /****************************
         * Three.js rendering setup *
         ****************************/
        viewportManager.$mount(mainarea.root);

        let v = new THREE.Vector3();
        store.viewport.activeScreen.camera.getWorldDirection(v);
        let nv = v.clone().negate();
        self.frontPlane = new THREE.Plane(v, Const.max_clip_plane);
        self.backPlane = new THREE.Plane(nv, Const.max_clip_plane);
        renderer.clippingPlanes = [];

        console.log('beep boop');

        let model = initModelFromJson(chrysanthemum);

        /*************************************
         * Mapping manager + Sequencer setup *
         *************************************/
        const mapmanager_panel = new LiteGUI.Panel('mapping-manager');
        UILayout.sidebar_top.add(mapmanager_panel);
        mappingManager.$mount('#mapping-manager');

        const seq_area = new LiteGUI.Area({
            content_id: 'sequencer',
            autoresize: 'true'
        });
        UILayout.tabs.addTab('Sequencer', {
            content: seq_area.root,
            width: '100%',
            size: 'full'
        });
        animManager.$mount('#sequencer');

        /**************************
         * Viewport toolbar setup *
         **************************/
        toolbarManager.$mount('#toolbar');
        toolbarManager.menu = UILayout.menu;
        toolbarManager.menu_dir = 'Edit/Select';
        toolbarManager.tools = [
            null,
            {
                name: 'camera',
                toolobj: {
                    enable() {
                        store.viewport.activeScreen.controlsEnabled = true;
                    },
                    disable() {
                        store.viewport.activeScreen.controlsEnabled = false;
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
