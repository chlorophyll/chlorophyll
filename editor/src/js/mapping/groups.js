/*
 * Pixel group management
 *
 * The group manager keeps track of all pixel groups for the current model.
 * A pixel group is a set of pixels and a collection of mappings for those
 * points.
 */
/*
Group stuff to replace:


let inlinePicker = new LiteGUI.MiniColor(_color.toArray(), {
    callback: function(v) {
        self.color = new THREE.Color(v[0], v[1], v[2]);
    }
});

visibilityToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    visible = !visible;

    if (visible) {
        self.show();
        visibilityToggle.innerText = 'visibility';
    } else {
        self.hide();
        visibilityToggle.innerText = 'visibility_off';
    }
});
*/

/*
 * Return a list of all current mappings ({name -> mapping obj})
 * This list is not guaranteed to stay valid if mappings are changed!
 * if has_coord_type is provided, only mappings which support the provided
 * type of point mapping will be returned.
 */
/*
this.listMappings = function(with_coord_type) {
    let type = (typeof with_coord_type !== 'undefined') ? with_coord_type : null;
    let maps = [];
    self.groups.forEach(function(group, id) {
        group.mappings.forEach(function(mapping, _) {
            if (!type || type in mapping.coord_types) {
                maps.push({
                    title: mapping.name,
                    mapping: mapping
                });
            }
        });
    });
    return maps;
};
*/
