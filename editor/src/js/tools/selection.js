import * as THREE from 'three';
import Immutable from 'immutable';
import keyboardJS from 'keyboardjs';
import Hotkey from 'chl/keybindings';
import Util from 'chl/util';
import Chlorophyll from 'chl/init';
import LiteGUI from 'chl/litegui';

import store from 'chl/vue/store';

import { activeScreen, isClipped } from 'chl/viewport';


/*
 * Generic selection tool class. Handles enabling, disabling, maintaining
 * the active selection, and default keybindings.
 *
 * name argument is any arbitrary unique string to refer to the tool.
 */
function SelectionTool(viewport, model, name) {
    let self = this;

    this.viewport = viewport !== undefined ? viewport : document;
    this.model = model;
    // Used by Toolbar
    this.ui_button = null;


    // Is the tool active?
    this.enabled = false;
    // Is the tool in use? (e.g. currently dragging out a marquee or in the
    // middle of a series of necessary clicks)
    this.in_progress = false;
    // Flags for tool modes, set based on keys when a selection is started.
    // Default behavior is to clear out the existing selection and to replace
    // with the new one.
    this.adding = false;
    this.subtracting = false;
    // Is it possible to cancel the selection while it's happening?
    this.cancellable = true;
    // Called when the selection is cancelled  to clean up state
    this.reset = function() {};

    // Selection tools will add and remove points using this overlay, then call
    // finishSelection() to make it the active selection.
    this.highlight = new THREE.Color(0xffffff);
    this.cur_sel = this.model.createOverlay(20, this.highlight);
    // The selection as it was when startSelection() was called.
    this.initial_selection = null;

    // Deselect all points
    this.deselectAll = function() {
        if (store.state.selection.active.length > 0) {
            store.commit('selection/clear');
            // XXX worldState.checkpoint();
        }
    };

    let enabled_kb_ctx = name + '-seltool-enabled';
    let selecting_kb_ctx = name + '-seltool-selecting';

    // Called when the tool is activated
    this.enable = function() {
        self.enabled = true;
        keyboardJS.setContext(enabled_kb_ctx);
    };

    // Called when the user switches away from this tool
    this.disable = function() {
        if (self.in_progress)
            self.cancelSelection();

        self.enabled = false;
        self.in_progress = false;
        self.adding = false;
        self.subtracting = false;

        keyboardJS.setContext('global');

        self.cur_sel.pixels = self.cur_sel.pixels.clear();
    };

    // startSelection and finishSelection are called when the tool begins and ends
    // a run of actually selecting/deselecting points.

    // Takes the mouse event which began the selection.
    this.startSelection = function(event) {
        self.adding = false;
        self.subtracting = false;
        if (event.altKey) {
            self.subtracting = true;
        } else if (event.shiftKey) {
            self.adding = true;
        } else {
            // Start with an empty selection if we're not adding or subtracting
            // from an existing one.
            store.commit('selection/clear');
        }
        self.in_progress = true;
        self.cur_sel.pixels = Immutable.Set(store.state.selection.active);
        self.initial_selection = self.cur_sel.pixels;
        store.commit('selection/clear');

        if (self.cancellable)
            keyboardJS.setContext(selecting_kb_ctx);
    };

    function endSelection() {
        self.in_progress = false;
        self.cur_sel.pixels = self.cur_sel.pixels.clear();
        self.initial_selection = null;

        keyboardJS.setContext(enabled_kb_ctx);
    }

    // Stop selecting and save the current selection as final.
    this.finishSelection = function() {
        store.commit('selection/set', self.cur_sel.pixels.toArray());
        endSelection();
        // XXX worldState.checkpoint();
    };

    // Don't exit the tool, but stop selecting and throw out state, returning
    // to before the selection
    this.cancelSelection = function() {
        store.commit('selection/set', self.initial_selection.toArray());
        self.reset();
        endSelection();
    };

    keyboardJS.withContext(enabled_kb_ctx, function() {
        keyboardJS.bind(Hotkey.cancel_selection, self.deselectAll);
    });

    keyboardJS.withContext(selecting_kb_ctx, function() {
        keyboardJS.bind(Hotkey.cancel_selection, self.cancelSelection);
    });

}

export function MarqueeSelection(viewport, model) {
    SelectionTool.call(this, viewport, model, 'marquee');
    let self = this;

    let rect = {};

    this.box = document.createElement('div');
    this.box.style.position = 'absolute';
    this.box.style.borderStyle = 'dotted';
    this.box.style.borderWidth = '1px';
    this.box.style.borderColor = 'white';
    this.box.style.display = 'none';

    this.viewport.appendChild(this.box);

    this.viewport.addEventListener('mousedown', onMouseDown, false);
    this.viewport.addEventListener('mouseup', onMouseUp, false);
    this.viewport.addEventListener('mousemove', onMouseMove, false);

    this.cancellable = false;

    function onMouseDown(event) {
        if (!self.enabled)
            return;

        self.startSelection(event);

        let coords = Util.relativeCoords(viewport, event.pageX, event.pageY);
        rect.startX = coords.x;
        rect.startY = coords.y;
        self.box.style.display = 'block';
    }

    function drawRect() {
        let l = Math.min(rect.startX, rect.endX);
        let r = Math.max(rect.startX, rect.endX);
        let t = Math.min(rect.startY, rect.endY);
        let b = Math.max(rect.startY, rect.endY);

        self.box.style.left = l+'px';
        self.box.style.top = t+'px';
        self.box.style.width = (r - l) + 'px';
        self.box.style.height = (b - t) + 'px';
    }

    function onMouseUp(event) {
        if (!self.in_progress)
            return;

        self.box.style.display = 'none';
        self.box.style.left = 0;
        self.box.style.top = 0;
        self.box.style.width = 0;
        self.box.style.height = 0;

        self.finishSelection();
    }

    function selectPoints() {
        let l = Math.min(rect.startX, rect.endX);
        let r = Math.max(rect.startX, rect.endX);
        let t = Math.min(rect.startY, rect.endY);
        let b = Math.max(rect.startY, rect.endY);

        self.cur_sel.pixels = self.cur_sel.pixels.clear();
        self.cur_sel.pixels = self.initial_selection;

        self.model.forEach(function(strip, i) {
            let v = self.model.getPosition(i);
            if (isClipped(v))
                return;

            let s = activeScreen().screenCoords(v);

            if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
                if (self.subtracting) {
                    self.cur_sel.pixels = self.cur_sel.pixels.delete(i);
                } else {
                    self.cur_sel.pixels = self.cur_sel.pixels.add(i);
                }
            }
        });
    }

    function onMouseMove(event) {
        if (!self.in_progress)
            return;

        event.preventDefault();

        let coords = Util.relativeCoords(viewport, event.pageX, event.pageY);
        rect.endX = coords.x;
        rect.endY = coords.y;

        drawRect();
        selectPoints();
    }

    this.reset = function() {
    };
}

export function LineSelection(viewport, model) {
    SelectionTool.call(this, viewport, model, 'line');
    let self = this;

    let p1 = undefined;

    this.viewport.addEventListener('mousedown', onMouseDown, false);

    function onMouseDown(event) {
        if (!self.enabled)
            return;

        let coords = Util.relativeCoords(viewport, event.pageX, event.pageY);
        let chosen = activeScreen().getPointAt(self.model, coords.x, coords.y);
        if (!chosen)
            return;

        if (!p1) {
            self.startSelection(event);
            p1 = chosen.index;
            self.cur_sel.pixels = self.cur_sel.pixels.add(p1);
        } else {
            let p2 = chosen.index;
            self.cur_sel.pixels = self.cur_sel.pixels.add(p2);
            let pos1 = self.model.getPosition(p1);
            let pos2 = self.model.getPosition(p2);
            let line = new THREE.Line3(pos1, pos2);

            // Reduce search to points within a sphere containing the line
            let midPoint = pos1.clone().add(pos2).divideScalar(2);
            let rad = midPoint.clone().sub(pos1).length() + 0.1;
            let points = self.model.pointsWithinRadius(midPoint, rad);

            for (let i = 0; i < points.length; i++) {
                let dist = Util.distanceToLine(points[i].position, line);
                if (dist < Chlorophyll.selectionThreshold) {
                    self.cur_sel.pixels = self.cur_sel.pixels.add(points[i].index);
                }
            }
            p1 = p2 = undefined;

            self.finishSelection();
        }
    }
}

export function PlaneSelection(viewport, model) {
    SelectionTool.call(this, viewport, model, 'plane');
    let self = this;

    let points = [];

    this.viewport.addEventListener('mousedown', onMouseDown, false);

    this.reset = function() {
        points = [];
    };

    function onMouseDown(event) {
        if (!self.enabled)
            return;

        let coords = Util.relativeCoords(viewport, event.pageX, event.pageY);
        let chosen = activeScreen().getPointAt(self.model, coords.x, coords.y);
        if (!chosen)
            return;

        if (points.length < 3) {
            if (points.length == 0)
                self.startSelection(event);

            points.push(self.model.getPosition(chosen.index));
            // TODO needs actively selecting points to be distinct from
            // already selected points or unselected points
            if (self.subtracting) {
                self.cur_sel.pixels = self.cur_sel.pixels.unset(chosen.index);
            } else {
                self.cur_sel.pixels = self.cur_sel.pixels.set(chosen.index);
            }
        }

        if (points.length == 3) {
            let line = new THREE.Line3(points[0], points[1]);
            let dist = Util.distanceToLine(points[2], line, false);

            if (dist < Chlorophyll.selectionThreshold) {
                LiteGUI.showMessage('Points must not be collinear');
                points = [];
                self.cancelSelection();
                return;
            }
            let plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);

            self.model.forEach(function(strip, i) {
                let planeToPoint = plane.distanceToPoint(self.model.getPosition(i));
                if (Math.abs(planeToPoint) < Chlorophyll.selectionThreshold) {
                    if (self.subtracting) {
                        self.cur_sel.pixels = self.cur_sel.pixels.unset(i);
                    } else {
                        self.cur_sel.pixels = self.cur_sel.pixels.set(i);
                    }
                }
            });
            self.finishSelection();
        }
    }
}
