import GraphLib, { GraphNode } from '@/common/graphlib';
import { Compilation } from '@/common/graphlib/compiler';
import Units from '@/common/units';
import * as glsl from '@/common/glsl';

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

float dim(float t) {
  return (pow(2., 4. * t)-1.)/15.;
}

vec3 hsv2rgb(vec3 c) {
  float h = fract(c.x);
  c = clamp(c, 0., 1.);
  vec3 u = vec3(1.);
  vec3 o = vec3(red(h), green(h), blue(h));
  float val = c.z;
  float sat = 1. - dim(1. - c.y);
  return val * mix(u, o, sat);
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

class Grayscale extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('value', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('output', 'CRGB')
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        const v = c.getInput(this, 0);
        c.setOutput(this, 0, glsl.FunctionCall('vec3', [v]));
    }
}
Grayscale.title = 'Grayscale';
node_types.push(['CRGB/Grayscale', Grayscale]);

class TestPattern extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
        ];
        const outputs = [
            GraphNode.output('output', 'CRGB')
        ];
        super(options, inputs, outputs);
    }

    compile(c) {
        const mapToUnit = v => {
            return c.declare('float', c.variable(),
                glsl.BinOp(glsl.BinOp(v, '/', glsl.Const(2)), '+', glsl.Const(0.5))
            );
        };

        const x = mapToUnit(c.getInput(this, 0));
        const y = mapToUnit(c.getInput(this, 1));
        const div = c.declare('float', c.variable(), glsl.Const(1 / 14.0));
        const space = c.declare('float', c.variable(), glsl.Const(1 / 7.5));

        const stride = c.declare('vec2', c.variable(),
            glsl.FunctionCall('vec2', [
                glsl.FunctionCall('mod', [x, space]),
                glsl.FunctionCall('mod', [y, space]),
            ])
        );

        const color = c.declare('vec3', c.variable(),
            glsl.FunctionCall('vec3', [
                glsl.BinOp(glsl.Const(1), '-', x),
                glsl.BinOp(glsl.Const(1), '-', y),
                x
            ])
        );
        const lighten = glsl.FunctionCall('vec3', [
            glsl.Const(0.8), glsl.Const(0.8), glsl.Const(0.8)
        ]);

        c.out.push(
            glsl.IfStmt(glsl.BinOp(glsl.Dot(stride, 'x'), '>', div), [
                glsl.BinOp(color, '=', glsl.BinOp(
                    glsl.BinOp(color, '+', lighten), '/', glsl.Const(2)
                ))
            ])
        );

        c.out.push(
            glsl.IfStmt(glsl.BinOp(glsl.Dot(stride, 'y'), '>', div), [
                glsl.BinOp(color, '=', glsl.BinOp(color, '/', glsl.Const(1.5)))
            ])
        );

        c.setOutput(this, 0, color);
    }
}
TestPattern.title = 'Test Pattern';
node_types.push(['CRGB/TestPattern', TestPattern]);

export default function register_crgb_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
