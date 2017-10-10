/*
 * Constants, configuration, and magic numbers
 */
const Const = {
    // UI & field sizes
    dock_size: 250,
    sidebar_size: 235,
    toolbar_size: 75,
    group_smallbutton_width: 40,
    max_name_len: 40,
    num_recent_files: 10,
    // Mapping type to choose when an arbitrary one is needed
    default_map_type: 'projection',
    default_coord_type: 'cartesian2d',
    // camera / visibility settings
    max_draw_dist: 1000000,
    fog_start: 1000,
    max_clip_plane: 1000,

};
export default Const;

export const ConstMixin = {
    computed: {
        Const() {
            return Const;
        }
    }
};
