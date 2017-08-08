import Util from 'chl/util';
import Const from 'chl/const';

export TransformMapping from './3dtransform';
export ProjectionMapping from './projection';

/*
 * Generic Mapping class.
 *
 * Provides a common interface to list types of mapping transformations and
 * generate sets of points from them.
 */
export default function Mapping(manager, group, id, initname) {
    Util.EventDispatcher.call(this);
    let self = this;

    this.group = group;
    this.model = group.model;
    this.id = id;
    let _name = initname;

    this.widget = null;
    this.configuring = false;
    this.normalize = true;

    /*
     * To be provided by mapping subclasses:
     */
    this.showConfig = null;
    this.hideConfig = null;
    this.type = '';
    this.display_name = 'Unknown Type';
    // coord_types describes each type of transformation the mapping supports,
    // in the form: { uniqueidentifier: { name: ..., mapPoint: ...}, ... }
    this.coord_types = {};

    Object.defineProperty(this, 'tree_id', {
        get: function() { return `${group.tree_id}-map-${id}`; }
    });

    Object.defineProperty(this, 'isProjection', {
        get: function() { return (this.type === 'projection'); }
    });

    Object.defineProperty(this, 'isTransform', {
        get: function() { return (this.type === 'transform'); }
    });

    Object.defineProperty(this, 'name', {
        get: function() { return _name; },
        set: function(v) {
            if (v.length > Const.max_name_len) {
                v = v.slice(0, Const.max_name_len);
            }
            _name = v;
            manager.tree.updateItem(self.tree_id, {
                content: _name,
                dataset: {mapping: self}
            });
        }
    });

    Object.defineProperty(this, 'coord_type_menu', {
        get: function() {
            let menu = {};
            for (let type in self.coord_types) {
                if (self.coord_types[type] !== undefined)
                    menu[self.coord_types[type].name] = type;
            }
            return menu;
        }
    });

    manager.tree.insertItem({
        id: self.tree_id,
        content: _name,
        dataset: {mapping: self}
    }, group.tree_id);

    this.getPositions = function(type) {
        if (!(type in self.coord_types)) {
            console.error('No such mapping type: ' + type);
            return;
        }
        let mapFn = self.coord_types[type].mapPoint;
        let norm_factor = 1;
        let norm_coord = self.coord_types[type].norm_coords;
        // Normalize points to within [-1, 1], if enabled.
        if (self.normalize) {
            let max = 0;
            group.pixels.forEach(function(idx) {
                let coords = mapFn(idx).toArray();
                for (let i = 0; i < coords.length; i++) {
                    if (norm_coord[i]) {
                        if (coords[i] > max)
                            max = coords[i];
                        else if (-coords[i] > max)
                            max = -coords[i];
                    }
                }
            });
            if (max != 0)
                norm_factor = 1 / max;
        }
        return group.pixels.map(function(idx) {
            if (self.normalize) {
                let out = mapFn(idx);
                let coords = out.toArray();
                for (let i = 0; i < coords.length; i++) {
                    if (norm_coord[i])
                        coords[i] = coords[i] * norm_factor;
                }
                return [idx, out.fromArray(coords)];
            } else {
                return [idx, mapFn(idx)];
            }
        });
    };

    /*
     * Returns a serialized object containing an array of mapped points for
     * each coordinate type the mapping supports, keyed by coord type.
     */
    this.allMappedPoints = function() {
        let mapped = {};
        for (let type in self.coord_types) {
            if (self.coord_types.hasOwnProperty(type)) {
                mapped[type] = self.getPositions(type);
            }
        }
        return mapped;
    };

    this.destroy = function() {
        if (self.configuring)
            self.hideConfig();
        manager.tree.removeItem(self.tree_id);
    };
}
