import register_pattern_nodes from '@/common/nodes/pattern';
import register_pixel_stage_nodes from '@/common/nodes/pixel_stage';
import register_oscillator_nodes from '@/common/nodes/oscillators';
import register_crgb_nodes from '@/common/nodes/color';
import register_mapping_nodes from '@/common/nodes/mapping';

let registered = false;

export default function register_nodes() {
    if (registered)
        return;
    register_crgb_nodes();
    register_pixel_stage_nodes();
    register_mapping_nodes();
    register_pattern_nodes();
    register_oscillator_nodes();
    registered = true;
};

