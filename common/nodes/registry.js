import register_pattern_nodes from './pattern';
import register_pixel_stage_nodes from './pixel_stage';
import register_oscillator_nodes from './oscillators';
import register_crgb_nodes from './color';
import register_mapping_nodes from './mapping';
import register_input_nodes from './live_input';
import register_easing_nodes from './easing';
import register_noise_nodes from './noise';

let registered = false;

export default function register_nodes() {
    if (registered)
        return;
    register_crgb_nodes();
    register_pixel_stage_nodes();
    register_mapping_nodes();
    register_pattern_nodes();
    register_oscillator_nodes();
    register_input_nodes();
    register_easing_nodes();
    register_noise_nodes();
    registered = true;
};

