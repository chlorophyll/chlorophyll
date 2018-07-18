import GraphLib, { GraphNode } from '@/common/graphlib';
import { Compilation } from '@/common/graphlib/compiler';
import Units from '@/common/units';

let node_types = [];

Compilation.toplevel(`
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`);

Compilation.registerAlias('CRGB', 'vec3');

class fromHue extends GraphNode {

    constructor(options) {
        let inputs = [GraphNode.input('hue', Units.Numeric)];
        let outputs = [GraphNode.output('CRGB', 'CRGB')];

        super(options, inputs, outputs);
    }

    compile(c) {
        let hue = c.getInput(this, 0);
        let v = c.declare('vec3', c.variable(),
            glsl.FunctionCall('vec3', [hue, glsl.Const(1.0), glsl.Const(1.0)])
        );
        c.setOutput(this, 0,
            glsl.FunctionCall('hsv2rgb', [v])
        );
    }
};
fromHue.title = 'fromHue';
node_types.push(['CRGB/fromHue', fromHue]);

class fromHSV extends GraphNode {
    constructor(options) {
        let inputs = [
            GraphNode.input('hue', Units.Numeric),
            GraphNode.input('sat', Units.Numeric),
            GraphNode.input('val', Units.Numeric),
        ];
        let outputs = [GraphNode.output('CRGB', 'CRGB')];

        super(options, inputs, outputs);
    }

    compile(c) {
        const hue = c.getInput(this, 0);
        const sat = c.getInput(this, 1);
        const val = c.getInput(this, 2);
        let v = c.declare('vec3', c.variable(),
            glsl.FunctionCall('vec3', [hue, sat, val])
        );

        c.setOutput(this, 0, glsl.FunctionCall('hsv2rgb', [v]));
    }
};

fromHSV.title = 'fromHSV';
node_types.push(['CRGB/fromHSV', fromHSV]);

class fadeToBlackBy extends GraphNode {
    constructor(options) {
        let inputs = [
            GraphNode.input('input', 'CRGB'),
            GraphNode.input('fadeFactor', Units.Numeric),
        ];
        let outputs = [GraphNode.output('output', 'CRGB')];
        super(options, inputs, outputs);
    }

    compile(c) {
        const input = c.getInput(this, 0);
        const fadeFactor = glsl.BinOp(glsl.Const(1.0), '-', c.getInput(this, 1));
        c.setOutput(this, 0, glsl.BinOp(input, '*', fadeFactor));
    }
};

fadeToBlackBy.title = 'fadeToBlackBy';
node_types.push(['CRGB/fadeToBlackBy', fadeToBlackBy]);

class lerpColor extends GraphNode {
    constructor(options) {
        let inputs = [
            GraphNode.input('start', 'CRGB'),
            GraphNode.input('end', 'CRGB'),
            GraphNode.input('amount', Units.Numeric),
        ];

        let outputs = [
            GraphNode.output('output', 'CRGB')
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);
        const amount = c.getInput(this, 2);
        c.setOutput(this, 0, glsl.FunctionCall('mix', [a, b, amount]));
    }
};

lerpColor.title = 'lerpColor';
node_types.push(['CRGB/lerpColor', lerpColor]);

export default function register_crgb_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
