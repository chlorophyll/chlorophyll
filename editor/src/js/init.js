// External dependencies
import * as THREE from 'three';
import Vue from 'vue';

import { remote } from 'electron';

// Chlorophyll modules
import Hotkey from 'chl/keybindings';
import { initModelFromJson } from 'chl/model';
import { renderer, scene, activeScreen } from 'chl/viewport';
import { MarqueeSelection, LineSelection, PlaneSelection } from 'chl/tools/selection';
import 'chl/patches';
import Const from 'chl/const';

import 'chl/patterns';

import rootComponent from '@/components/root';

import chrysanthemum from 'models/chrysanthemum'; // TODO proper loader

const { app, Menu } = remote;

// Chlorophyll UI manager objects

export {
    animManager,
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
                        //todo undo
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'ComandOrControl+Shift+Z',
                    click() {
                        //todo redo
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
