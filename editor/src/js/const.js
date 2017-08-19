/*
 * Constants, configuration, and magic numbers
 */
const Const = {
    // UI & field sizes
    dock_size: 225,
    sidebar_size: 235,
    toolbar_size: 75,
    group_smallbutton_width: 40,
    max_name_len: 40,
    // Mapping type to choose when an arbitrary one is needed
    default_map_type: 'cartesian2d',
    // camera / visibility settings
    max_draw_dist: 1000000,
    fog_start: 1000,
    max_clip_plane: 1000,

    Graph: {
        NODE_SLOT_HEIGHT: 15,
        NODE_DEFAULT_COLOR: '#999',
        NODE_DEFAULT_BGCOLOR: '#444',
        NODE_DEFAULT_BOXCOLOR: '#AEF',
        DEFAULT_POSITION: [100, 100],
        NODE_TITLE_HEIGHT: 16,
        NODE_WIDTH: 140,
        NODE_MIN_WIDTH: 50
    }
};
export default Const;
