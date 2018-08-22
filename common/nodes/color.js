import GraphLib, { GraphNode } from '@/common/graphlib';
import { Compilation } from '@/common/graphlib/compiler';
import Units from '@/common/units';

let node_types = [];
// vec3 hsv2rgb(vec3 c) {
//   vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
//   vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
//   return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
// }

Compilation.toplevel(`

float piece(float x, float start, float end) {
  return step(start, x)*(1.-step(end, x));
}

float line(float x1, float y1, float x2, float y2, float t) {
  float l = piece(t, x1, x2)*mix(y1, y2, (t-x1)/(x2-x1));
  return l;
}

float sline(float x1, float y1, float x2, float y2, float t) {
  return line(x1/256., y1/256., x2/256., y2/256., t);
}

float green(float hue) {
  return (
      sline(0., 0., 96., 256., hue)
    + sline(96., 256., 128., 171., hue)
    + sline(128., 171., 160., 0., hue)
  );
}

float red(float hue) {
  return (
      sline(0., 256., 32., 171., hue)
    + sline(32., 171., 64., 171., hue)
    + sline(64., 171., 96., 0., hue)
    + sline(96., 0., 160., 0., hue)
    + sline(160., 0., 256., 256., hue)
  );
}

float blue(float hue) {
  return (
      sline(0., 0., 96., 0., hue)
    + sline(96., 0., 128., 85., hue)
    + sline(128., 85., 160., 256., hue)
    + sline(160., 256., 256., 0., hue)
  );
}

vec3 hsv2rgb(vec3 c) {
  float h = fract(c.x);
  vec3 u = vec3(1.);
  vec3 o = vec3(red(h), green(h), blue(h));
  return c.z * mix(u, o, c.y);
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
            GraphNode.input('hue', Units.Percentage),
            GraphNode.input('sat', Units.Percentage),
            GraphNode.input('val', Units.Percentage),
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

class CRGB extends GraphNode {
    constructor(options) {
        let inputs = [
            GraphNode.input('red', Units.Percentage),
            GraphNode.input('green', Units.Percentage),
            GraphNode.input('blue', Units.Percentage),
        ];

        let outputs = [
            GraphNode.output('output', 'CRGB')
        ];
        const config = {
            visualization: 'color-preview',
        };
        super(options, inputs, outputs, { config });
    }

    compile(c) {
        const r = c.getInput(this, 0);
        const g = c.getInput(this, 1);
        const b = c.getInput(this, 2);

        c.setOutput(this, 0, glsl.FunctionCall('vec3', [r, g, b]));
    }
};

CRGB.title = 'CRGB';
node_types.push(['CRGB/CRGB', CRGB]);

export default function register_crgb_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
