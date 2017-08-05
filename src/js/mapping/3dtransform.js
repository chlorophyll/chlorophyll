import * as THREE from 'three';
import Mapping from './maputil';
import Immutable from 'immutable';
import { screenManager, toolbarManager } from 'chl/init';
import { worldState } from 'chl/worldstate';
import ViewportHandle from 'chl/widgets/widgets3d';

/*
 * 3d transform mappings
 *
 * These are actually simpler than projection mapping. The mapping consists of
 * a simple transformation (translation, rotation, scaling) in 3d space.
 *
 * When a pattern is applied, pixel positions can be described in
 * cartesian, cylindrical (along any axis), or spherical coordinates.
 */
export default function TransformMapping(manager, group, id, initname) {
    Mapping.call(this, manager, group, id, initname);
    let self = this;

    this.display_name = '3D Transform';
    this.isTransform = true;
    this.shape = 'cube';
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.scale = new THREE.Vector3(1, 1, 1);
    this.autoscale = true;

    this.widget = new ViewportHandle(screenManager.activeScreen);
    this.widget.setBoundsPreview(this.shape);
    this.widget.hide();

    let ui_controls = {};

    function scaleToFitPoints() {
        if (!self.autoscale || self.position === null)
            return;

        // TODO scale based on preview shape - a sphere is strictly smaller than
        // the others, though, so it's a workable approximation.
        let furthest = 0;
        self.group.pixels.forEach(function(i) {
            let dist = self.position.distanceToSquared(self.model.getPosition(i));
            if (dist > furthest)
                furthest = dist;
        });
        let scale_factor = 2 * Math.sqrt(furthest);

        self.scale.fromArray([scale_factor, scale_factor, scale_factor]);
        self.widget.setScale(self.scale);
        ui_controls.scale_widget.setValue(self.scale.toArray(), true);
    }

    function update(update_ui) {
        if (self.configuring)
            scaleToFitPoints();

        self.widget.setPos(self.position);
        self.widget.setRot(self.rotation);
        self.widget.setScale(self.scale);
        self.widget.setBoundsPreview(self.shape);

        if (self.configuring && update_ui) {
            ui_controls.pos_widget.setValue(self.position.toArray(), true);
            // Euler angles return the order as well.
            ui_controls.rot_widget.setValue(self.rotation.toArray()
                .slice(0, 3).map((x) => x * THREE.Math.RAD2DEG), true);
            ui_controls.scale_widget.setValue(self.scale.toArray(), true);
        }

        self.dispatchEvent(new CustomEvent('change'));
    }

    /*
     * Manipulate a point to be positioned correctly for the mapping.
     * Returns new coordinates for the point in local cartesian space.
     */
    function transformPoint(idx) {
        let pos = self.model.getPosition(idx);
        let fromOrigin = pos.clone().sub(self.position);
        let rot_inv = new THREE.Quaternion();
        rot_inv.setFromEuler(self.rotation).inverse();
        fromOrigin.applyQuaternion(rot_inv);
        fromOrigin.divide(self.scale);

        return fromOrigin;
    }

    this.map_types.cartesian3d = {
        name: '3D Cartesian',
        norm_coords: [true, true, true],
        mapPoint: transformPoint
    };

    this.map_types.cylinder3d = {
        name: '3D Cylindrical',
        norm_coords: [true, false, true],
        mapPoint: function(idx) {
            let cart = transformPoint(idx);
            // x, y, z -> r, theta, z
            let polar = new THREE.Vector2(cart.x, cart.y);
            return new THREE.Vector3(polar.length(), polar.angle(), cart.z);
        }
    };

    this.map_types.sphere3d = {
        name: '3D Spherical',
        norm_coords: [true, false, false],
        mapPoint: function(idx) {
            let cart = transformPoint(idx);
            let r = cart.length();
            let theta = (r == 0) ? 0 : Math.acos(cart.z / r);
            let phi = (r == 0) ? 0 : Math.atan2(cart.y, cart.x);
            return new THREE.Vector3(r, theta, phi);
        }
    };

    /*
     * When selected, show the 3d manipulation widget & UI controls.
     * TODO When not autoscaling, enable the manual scaling control.
     */
    this.showConfig = function(inspector) {
        if (self.configuring) return;
        self.configuring = true;

        ui_controls.inspector = inspector;

        toolbarManager.setActiveTool('camera');
        self.model.hideUnderlyingModel();

        self.widget.show();
        self.widget.setPos(self.position);
        self.widget.setRot(self.rotation);
        self.widget.setScale(self.scale);

        ui_controls.previewshape_widget = inspector.addComboButtons(
            'Preview', 'cube',
            {
                values: ['cube', 'cylinder', 'sphere'],
                callback: function(v) {
                    self.shape = v;
                    update(true);
                }
            });

        ui_controls.controlmode_widget = inspector.addComboButtons(
            'Control mode', 'translate',
            {
                values: ['translate', 'rotate'],
                callback: self.widget.setMode
            });

        ui_controls.pos_widget = inspector.addVector3('Position',
            self.position.toArray(),
            {
                precision: 1,
                callback: function(v) {
                    self.position.fromArray(v);
                    update(false);
                }
            });

        ui_controls.rot_widget = inspector.addVector3('Rotation',
            self.rotation.toArray().slice(0, 3).map((x) => x * THREE.Math.RAD2DEG),
            {
                min: -180, max: 180,
                precision: 1,
                callback: function(v) {
                    self.rotation.fromArray(v.map((x) => x * THREE.Math.DEG2RAD));
                    update(false);
                }
            });

        ui_controls.scale_widget = inspector.addVector3('Scale',
            self.scale.toArray(),
            {
                precision: 1,
                disabled: true,
                callback: function(v) {
                    self.scale.fromArray(v);
                    update(false);
                }
            });

        inspector.addTitle('Reset:');
        inspector.widgets_per_row = 3;
        inspector.addButton(null, 'Position', function() {
            self.position.fromArray([0, 0, 0]);
            update(true);
        });
        inspector.addButton(null, 'Rotation', function() {
            self.rotation.fromArray([0, 0, 0]);
            update(true);
        });
        ui_controls.reset_scale = inspector.addButton(null, 'Scale', function() {
            if (!self.autoscale) {
                self.scale.fromArray([1, 1, 1]);
                update(true);
            }
        });
        inspector.widgets_per_row = 1;

        inspector.addCheckbox('Auto Scale', self.autoscale, function(val) {
            self.autoscale = val;
            if (val)
                update(true);
        });

        self.widget.control.addEventListener('objectChange', function() {
            let transform = self.widget.data();
            self.position = transform.pos;
            self.rotation.setFromQuaternion(transform.quaternion);
            update(true);
        });

        scaleToFitPoints();

        self.widget.control.addEventListener('mouseUp', function() {
            worldState.checkpoint();
        });
    };

    this.hideConfig = function() {
        if (!self.configuring) return;
        self.configuring = false;

        self.model.showUnderlyingModel();
        self.widget.hide();

        self.widget.control.removeEventListener('objectChange');
        self.widget.control.removeEventListener('mouseUp');
        ui_controls.inspector.clear();
        ui_controls = {};
    };

    this.destroy = function() {
        self.hideConfig();
        manager.tree.removeItem(self.tree_id);
    };

    this.snapshot = function() {
        return Immutable.fromJS({
            map_class: 'transform',
            name: self.name,
            id: self.id,
            tree_id: self.tree_id,
            normalize: self.normalize,
            position: self.position.toArray(),
            rotation: self.rotation.toArray(),
            scale: self.scale.toArray(),
            autoscale: self.autoscale
        });
    };

    this.restore = function(snapshot) {
        self.id = snapshot.get('id');
        self.tree_id = snapshot.get('tree_id');
        self.name = snapshot.get('name');
        self.normalize = snapshot.get('normalize');
        self.position.fromArray(snapshot.get('position').toArray());
        self.rotation.fromArray(snapshot.get('rotation').toArray());
        self.scale.fromArray(snapshot.get('scale').toArray());
        self.autoscale = snapshot.get('autoscale');
        // Only update the UI if it's open
        update(self.configuring);
    };
}
