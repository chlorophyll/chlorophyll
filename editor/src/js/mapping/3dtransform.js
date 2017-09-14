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

    this.shape = 'cube';
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.scale = new THREE.Vector3(1, 1, 1);
    this.autoscale = true;

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

    this.coord_types.cartesian3d = {
        name: '3D Cartesian',
        norm_coords: [true, true, true],
        precompute: null,
        mapPoint: transformPoint
    };

    this.coord_types.cylinder3d = {
        name: '3D Cylindrical',
        norm_coords: [true, false, true],
        precompute: null,
        mapPoint: function(idx) {
            let cart = transformPoint(idx);
            // x, y, z -> r, theta, z
            let polar = new THREE.Vector2(cart.x, cart.y);
            return new THREE.Vector3(polar.length(), polar.angle(), cart.z);
        }
    };

    this.coord_types.sphere3d = {
        name: '3D Spherical',
        norm_coords: [true, false, false],
        precompute: null,
        mapPoint: function(idx) {
            let cart = transformPoint(idx);
            let r = cart.length();
            let theta = (r == 0) ? 0 : Math.acos(cart.z / r);
            let phi = (r == 0) ? 0 : Math.atan2(cart.y, cart.x);
            return new THREE.Vector3(r, theta, phi);
        }
    };
}
