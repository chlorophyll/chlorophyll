import register_pattern_nodes from 'chl/patterns/nodes';
import register_util_nodes from 'chl/patterns/util';
import register_oscillator_nodes from 'chl/oscillators/nodes';
import register_math8_nodes from 'chl/fastled/math8';
import register_crgb_nodes from 'chl/fastled/color';
import register_mapping_nodes from 'chl/patterns/mapping_nodes';

let registered = false;

export default function register_nodes() {
    if (registered)
        return;
    register_crgb_nodes();
    register_math8_nodes();
    register_util_nodes();
    register_mapping_nodes();
    register_pattern_nodes();
    register_oscillator_nodes();
    registered = true;
};

