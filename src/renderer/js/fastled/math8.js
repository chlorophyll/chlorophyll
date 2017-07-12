import GraphLib from 'chl/graphlib/graph';
import FastLED from './fastled';

export let Math8 = {};
let node_types = [];

(function() {
    let make_node = function(name, ret, args) {
        let argtypes = [];

        for (let arg of args) {
            argtypes.push(arg[1]);
        }

        let func = FastLED.cwrap(name, ret, argtypes);

        Math8[name] = func;

        function F() {
            for (let arg of args) {
                this.addInput(arg[0], arg[1]);
            }
            this.addOutput('result', ret);
        }

        F.title = name;

        F.prototype.onExecute = function() {
            let vals = [];
            for (let i = 0; i < args.length; i++) {
                vals[i] = this.getInputData(i);
            }
            this.setOutputData(0, Math8[name].apply(undefined, vals));
        };

        node_types.push(['lowlevel/math8/'+name, F]);
    };

    make_node('qadd8', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('qadd7', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('qsub8', 'number', [['i', 'number'], ['j', 'number']]);

    make_node('qmul8', 'number', [['i', 'number'], ['j', 'number']]);

    make_node('avg8', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('avg7', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('avg15', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('avg16', 'number', [['i', 'number'], ['j', 'number']]);
    make_node('abs8', 'number', [['i', 'number']]);
    make_node('sqrt16', 'number', [['x', 'number']]);

    make_node('sin16', 'number', [['theta', 'number']]);
    make_node('cos16', 'number', [['theta', 'number']]);
    make_node('sin8', 'number', [['theta', 'number']]);
    make_node('cos8', 'number', [['theta', 'number']]);

    make_node('scale8', 'number', [['i', 'number'], ['scale', 'number']]);
    make_node('scale8_video', 'number', [['i', 'number'], ['scale', 'number']]);
    make_node('scale16by8', 'number', [['i', 'number'], ['scale', 'number']]);
    make_node('scale16', 'number', [['i', 'number'], ['scale', 'number']]);

    make_node('nscale8x3', 'number',
        [['r', 'number'], ['g', 'number'], ['b', 'number'], ['scale', 'number']]);
    make_node('nscale8x3_video', 'number',
        [['r', 'number'], ['g', 'number'], ['b', 'number'], ['scale', 'number']]);

    make_node('dim8_raw', 'number', [['x', 'number']]);
    make_node('dim8_video', 'number', [['x', 'number']]);
    make_node('dim8_lin', 'number', [['x', 'number']]);

    make_node('brighten8_raw', 'number', [['x', 'number']]);
    make_node('brighten8_video', 'number', [['x', 'number']]);
    make_node('brighten8_lin', 'number', [['x', 'number']]);

    make_node('lerp8by8', 'number', [['a', 'number'], ['b', 'number'], ['fract', 'number']]);
    make_node('lerp16by16', 'number', [['a', 'number'], ['b', 'number'], ['fract', 'number']]);
    make_node('lerp16by8', 'number', [['a', 'number'], ['b', 'number'], ['fract', 'number']]);
    make_node('lerp15by8', 'number', [['a', 'number'], ['b', 'number'], ['fract', 'number']]);
    make_node('lerp15by16', 'number', [['a', 'number'], ['b', 'number'], ['fract', 'number']]);
    make_node('map8', 'number',
        [['in', 'number'], ['rangeStart', 'number'], ['rangeEnd', 'number']]);

    make_node('ease8InOutQuad', 'number', [['i', 'number']]);
    make_node('ease8InOutCubic', 'number', [['i', 'number']]);
    make_node('ease8InOutApprox', 'number', [['i', 'number']]);

    make_node('triwave8', 'number', [['in', 'number']]);
    make_node('quadwave8', 'number', [['in', 'number']]);
    make_node('cubicwave8', 'number', [['in', 'number']]);
    make_node('squarewave8', 'number', [['in', 'number'], ['pulsewidth', 'number']]);
})();

export default function register_math8_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
