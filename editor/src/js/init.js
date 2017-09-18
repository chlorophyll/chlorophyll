// External dependencies
import * as THREE from 'three';
import Vue from 'vue';

import { remote } from 'electron';

// Chlorophyll modules
import Hotkey from 'chl/keybindings';
import Model from 'chl/model';
import { renderer, scene, activeScreen } from 'chl/viewport';
import { worldState } from 'chl/worldstate';
import { MarqueeSelection, LineSelection, PlaneSelection } from 'chl/tools/selection';
import 'chl/patches';
import 'chl/widgets/litegui-extensions';
import Const from 'chl/const';

import 'chl/patterns';

import rootComponent from '@/components/root';

import chrysanthemum from 'models/chrysanthemum'; // TODO proper loader

const { app, Menu } = remote;

// Chlorophyll UI manager objects
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
    groupManager,
    animManager,
    currentModel
};


// tool declaration
let selectionTools;

function initSelectionTools(model) {
    let viewport = document.getElementById('viewport');
    selectionTools = [
        null,
        {
            name: 'camera',
            toolobj: {
                enable() {
                    activeScreen().controlsEnabled = true;
                },
                disable() {
                    activeScreen().controlsEnabled = false;
                }
            },
            hotkey: Hotkey.tool_camera,
            momentary_hotkey: Hotkey.tool_camera_momentary,
            active: true,
        },
        null,
        {
            name: 'marquee',
            toolobj: new MarqueeSelection(viewport, model),
            hotkey: Hotkey.tool_select_marquee
        },
        {
            name: 'line',
            toolobj: new LineSelection(viewport, model),
            hotkey: Hotkey.tool_select_line
        },
        {
            name: 'plane',
            toolobj: new PlaneSelection(viewport, model),
            hotkey: Hotkey.tool_select_plane
        },
        null
    ];
}

// menu creation

function initMenu() {
    let appMenu = [];

    let windowMenu = {
        role: 'window',
        submenu: [
            {role: 'minimize'},
            {role: 'close'}
        ]
    };

    if (process.platform === 'darwin') {
        appMenu = [{
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        }];

        windowMenu.submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ];
    }

    /* xxx add this back in once toolbox is rewritten
    let selectionMenu = selectionTools.filter((t) => t !== null).map((tool) => ({
        label: tool.name,
        click() {
            toolbarManager.active = tool.name;
        }
    }));

    let toolMenu = {
        label: 'Tools',
        submenu: [
            {
                label: 'Selection',
                submenu: selectionMenu
            }
        ],
    };
    */

    const menuTemplate = [
        ...appMenu,
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CommandOrControl+Z',
                    click() {
                        worldState.undo();
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'ComandOrControl+Shift+Z',
                    click() {
                        worldState.redo();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Viewport Settings',
                    click() {
                        // todo once layout
                        // rendering_win.show();
                        // rendering_win.setPosition(window.innerWidth - 520, 20);
                    }
                },
            ]
        },
        /* toolMenu, */
        windowMenu,
        {
            role: 'help',
        },
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}


function Chlorophyll() {
    const self = this;

    this.frontPlane = null;
    this.backPlane = null;
    this.selectionThreshold = 5; // TODO track in selection tools

    function initModelFromJson(json) {
        let model = new Model(json);

        worldState.init({});

        currentModel = model;

        return model;
    }

    this.init = function() {
        let model = initModelFromJson(chrysanthemum);
        initMenu();

        let root = new Vue(rootComponent);
        root.$mount('#app');
        initSelectionTools(model);
        root.selectionTools = selectionTools;

        let v = new THREE.Vector3();
        activeScreen().camera.getWorldDirection(v);
        let nv = v.clone().negate();
        self.frontPlane = new THREE.Plane(v, Const.max_clip_plane);
        self.backPlane = new THREE.Plane(nv, Const.max_clip_plane);
        renderer.clippingPlanes = [];

        model.addToScene(scene);
    };
    // this._init = function() {
    //     /**************
    //      * GUI layout *
    //      **************/
    //     LiteGUI.init();

    //     // Center viewport container
    //     let mainarea = new LiteGUI.Area('mainarea', {
    //         content_id: 'container',
    //         height: 'calc( 100% - 20px )',
    //         main: true,
    //         immediateResize: true
    //     });
    //     LiteGUI.add(mainarea);
    //     // Bottom tabbed pattern / sequencer editor area
    //     mainarea.split('vertical', [null, Const.dock_size], true);
    //     let dock = mainarea.getSection(1);
    //     dock.split('horizontal', [null, Const.sidebar_size], true);
    //     UILayout.sidebar_bottom = dock.getSection(1);
    //     dock = dock.getSection(0);

    //     UILayout.tabs = new LiteGUI.Tabs(null, {size: 'full'});
    //     dock.add(UILayout.tabs);
    //     mainarea = mainarea.getSection(0);

    //     // Group, mapping & pattern browser sidebar
    //     mainarea.split('horizontal', [null, Const.sidebar_size], true);
    //     UILayout.sidebar_top = mainarea.getSection(1);


    //     // UILayout.sidebar_bottom = UILayout.sidebar.getSection(1);

    //     mainarea = mainarea.getSection(0);


    //     // Viewport side toolbar
    //     mainarea.split('horizontal', [Const.toolbar_size, null], true);
    //     let toolbar_panel = new LiteGUI.Panel('toolbar');

    //     UILayout.toolbar = toolbar_panel.root;

    //     mainarea.getSection(0).add(toolbar_panel);
    //     mainarea = mainarea.getSection(1);

    //     let viewport = UILayout.viewport = mainarea.root;
    //     viewport.style.position = 'relative';
    //     viewport.style.top = 0;
    //     viewport.style.left = 0;

    //     let mountpoint = document.createElement('div');
    //     mainarea.content.appendChild(mountpoint);

    //     /****************************
    //      * Three.js rendering setup *
    //      ****************************/

    //     viewportManager.$mount(mountpoint);

    //     let v = new THREE.Vector3();
    //     activeScreen().camera.getWorldDirection(v);
    //     let nv = v.clone().negate();
    //     self.frontPlane = new THREE.Plane(v, Const.max_clip_plane);
    //     self.backPlane = new THREE.Plane(nv, Const.max_clip_plane);
    //     renderer.clippingPlanes = [];

    //     let model = initModelFromJson(chrysanthemum);

    //     /*************************************
    //      * Mapping manager + Sequencer setup *
    //      *************************************/
    //     const mapmanager_panel = new LiteGUI.Panel('mapping-manager');
    //     UILayout.sidebar_top.add(mapmanager_panel);
    //     mappingManager.$mount('#mapping-manager');

    //     const seq_area = new LiteGUI.Area({
    //         content_id: 'sequencer',
    //         autoresize: 'true'
    //     });
    //     UILayout.tabs.addTab('Sequencer', {
    //         content: seq_area.root,
    //         width: '100%',
    //         size: 'full'
    //     });
    //     animManager.$mount('#sequencer');

    //     /**************************
    //      * Viewport toolbar setup *
    //      **************************/
    //     initSelectionTools(model);
    //     initMenu();
    //     toolbarManager.$mount('#toolbar');
    //     toolbarManager.tools = selectionTools;
    //     toolbarManager.active = 'camera';


    //     /******************************
    //      * Render settings dialog box *
    //      ******************************/
    //     // TODO: unsure exactly where these settings should live
    //     let rendering_win = new LiteGUI.Dialog('render_settings',
    //         {
    //             title: 'Viewport Settings',
    //             close: true,
    //             width: 256,
    //             scroll: true,
    //             resizable: true,
    //             draggable: true
    //         });
    //     let rendering_widgets = new LiteGUI.Inspector();
    //     rendering_widgets.addCheckbox('Clip view', false, function(val) {
    //         if (val)
    //             renderer.clippingPlanes = [self.frontPlane, self.backPlane];
    //         else
    //             renderer.clippingPlanes = [];
    //     });
    //     rendering_widgets.addDualSlider('Clipping', {left: -1000, right: 1000},
    //         {
    //             min: -Const.max_clip_plane,
    //             max: Const.max_clip_plane,
    //             step: 10,
    //             callback: function(val) {
    //                 self.backPlane.constant = -val.left;
    //                 self.frontPlane.constant = val.right;
    //             }
    //         });
    //     rendering_widgets.addSlider('Selection Threshold', self.selectionThreshold,
    //         { min: 0, max: 15, step: 0.1, callback: function(val) {
    //                 self.selectionThreshold = val;
    //             }
    //         });
    //     rendering_widgets.addCheckbox('Show Strips', false,
    //         { callback: function(val) {
    //                 model.setStripVisibility(val);
    //             }
    //         });
    //     rendering_win.add(rendering_widgets);
    // };

    this.animate = function() {
        requestAnimationFrame(self.animate);

        let v = new THREE.Vector3();
        activeScreen().camera.getWorldDirection(v);
        self.frontPlane.normal = v;
        self.backPlane.normal = v.clone().negate();

        activeScreen().controls.update();
        activeScreen().render();
    };
}

export default new Chlorophyll();
