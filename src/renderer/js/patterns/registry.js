import register_pattern_nodes from 'chl/patterns/nodes';
import register_util_nodes from 'chl/patterns/util';
import register_oscillator_nodes from 'chl/oscillators/nodes';
import register_math8_nodes from 'chl/fastled/math8';
import register_crgb_nodes from 'chl/fastled/color';

export default function register_nodes() {
    register_crgb_nodes();
    register_math8_nodes();
    register_util_nodes();
    register_pattern_nodes();
    register_oscillator_nodes();
};

