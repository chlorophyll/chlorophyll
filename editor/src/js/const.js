/*
 * Constants, configuration, and magic numbers
 */
const Const = {
    // UI & field sizes
    dock_size: 400,
    sidebar_size: 220,
    toolbar_size: 25,
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
    num_fps_samples: 20,
    fps_sample_interval: 250,
    timeline_track_height: 32,
    timeline_track_padding: 4,
};
export default Const;

export const ConstMixin = {
    computed: {
        Const() {
            return Const;
        }
    }
};
