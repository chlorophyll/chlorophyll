import Range from '@/common/util/range';
import Units from '@/common/units';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import Enum from '@/common/util/enum';

import Frequency, { FrequencyQuantities, compileQuantities } from './util';

let node_types = [];
function frequency_default_parameters() {
    return [
        GraphNode.parameter('qty', 'Enum', new Enum(FrequencyQuantities, 'hz')),
    ];
}

class FrequencyNode extends GraphNode {
    constructor(options) {
        let inputs = [
            GraphNode.input('value', Units.Numeric),
        ];

        options.parameters = frequency_default_parameters();

        let outputs = [
            GraphNode.output('freq', 'Frequency')
        ];

        super(options, inputs, outputs);
    }

    onPropertyChange() {
        if (this.vm.parameters.length === 0) {
            this.vm.parameters = frequency_default_parameters();
        }
        const qty = this.vm.parameters[0].value;

        this.vm.title = `Frequency (${qty})`;
    }

    compile(c) {
        const qty = this.vm.parameters[0].value;
        const val = c.getInput(this, 0);
        const hz = compileQuantities[qty](val);
        c.setOutput(this, 0, hz);
    }
}

FrequencyNode.title = 'Frequency';
node_types.push(['oscillators/util/frequency', FrequencyNode]);

class TimeNode extends GraphNode {
    constructor(options) {
        const inputs = [];
        const outputs = [
            GraphNode.output('t', Units.Numeric),
        ];
        super(options, inputs, outputs);
    }

    compile(c) {
        const t = glsl.BinOp(c.getGlobalInput('t'), '/', glsl.Const(60));
        c.setOutput(this, 0, t);
    }
}

TimeNode.title = 'Time';
node_types.push(['oscillators/util/time', TimeNode]);

function applyAmplitude(amplitude, val) {
    const lower = glsl.Dot(amplitude, 'x');
    const upper = glsl.Dot(amplitude, 'y');
    const a = glsl.BinOp(upper, '-', lower);
    return glsl.BinOp(lower, '+', glsl.BinOp(a, '*', val));
}


function make_oscillator(name, {new_phase, value}) {
    let Oscillator = class extends GraphNode {
        constructor(options) {
            const outputs = [GraphNode.output('result', Units.Percentage)];
            const inputs = [
                GraphNode.input('frequency', 'Frequency'),
                GraphNode.input('amplitude', 'Range'),
                GraphNode.input('phase', Units.Percentage),
            ];
            let frequency = new Frequency(1);

            const properties = {
                frequency,
                amplitude: new Range(0, 1, 0, 1),
                phase: 0,
            };

            const config = {
                visualization: 'oscillator-plotter',
            };

            options.properties = { ...properties, ...options.properties };

            super(options, inputs, outputs, { config });
        }
        // phase is stored in units of cycles (0-1)
        new_phase(cur_phase, frequency, framerate) {
            return new_phase(cur_phase, frequency, framerate);
        }

        value(cur_phase, amplitude, phase_offset) {
            return applyAmplitude(amplitude, value(cur_phase, phase_offset));
        }

        compile(c) {
            const oscillator_id = this.graph.getOscillatorId(this);
            const amplitude = c.getInput(this, 1);
            const cycles = c.getInput(this, 2);
            const context_name = c.context ? c.context.name : null;
            if (context_name === 'phase_update') {
                const cur_oscillator = glsl.Ident('cur_oscillator');
                const cur_phase = glsl.Ident('cur_phase');
                const out_phase = glsl.Ident('out_phase');

                const frequency = c.getInput(this, 0);
                const framerate = 60;
                const cond = glsl.BinOp(cur_oscillator, '==', glsl.Ident(oscillator_id));
                const next_phase = this.new_phase(cur_phase, frequency, framerate);
                const stmt = glsl.IfStmt(cond, [
                    glsl.BinOp(out_phase, '=', next_phase),
                    glsl.Return(),
                ]);
                c.out.push(stmt);
                c.setOutput(this, 0, this.value(cur_phase, amplitude, cycles));
            } else {
                const num_oscillators = this.graph.numOscillators();

                const phase_coords = glsl.FunctionCall('vec2', [
                    glsl.Dot(glsl.Ident('vUv'), 'x'),
                    glsl.Const((1+2*oscillator_id) / (2*num_oscillators))
                ]);
                const phase_tex = glsl.Ident('uCurPhase');

                const cur_phase = glsl.Dot(
                    glsl.FunctionCall('texture2D', [phase_tex, phase_coords]),
                    'r'
                );

                c.setOutput(this, 0, this.value(cur_phase, amplitude, cycles));
            }
        }
    };
    Oscillator.is_oscillator = true;
    Oscillator.title = `${name} wave`;
    node_types.push([`oscillators/${name}`, Oscillator]);
}

// 2.*abs(t/p - floor(t/p+0.5));
make_oscillator('triangle', {
    new_phase(cur_phase, frequency, framerate) {
        const t = glsl.Const(1/framerate);
        const p = glsl.BinOp(glsl.Const(1), '/', frequency);
        return glsl.BinOp(cur_phase, '+', glsl.BinOp(t, '/', p));
    },
    value(cur_phase, phase_offset) {
        const total_phase = glsl.BinOp(cur_phase, '+', phase_offset);
        const t = glsl.BinOp(
            total_phase,
            '-',
            glsl.FunctionCall('floor', [glsl.BinOp(total_phase, '+', glsl.Const(0.5))])
        );

        const val = glsl.FunctionCall('abs', [t]);
        return glsl.BinOp(glsl.Const(2), '*', val);
    }
});

// (2*floor(f*t)-floor(2*f*t))+1
make_oscillator('square', {
    new_phase(cur_phase, frequency, framerate) {
        const c = glsl.Const(1/framerate);
        return glsl.BinOp(cur_phase, '+', glsl.BinOp(frequency, '*', c));
    },
    value(cur_phase, phase_offset) {
        const t = glsl.BinOp(phase_offset, '+', cur_phase);

        const wf = glsl.BinOp(
            glsl.Const(1), '+',
            glsl.BinOp(
                glsl.BinOp(glsl.Const(2), '*', glsl.FunctionCall('floor', [t])),
                '-',
                glsl.FunctionCall('floor', [glsl.BinOp(glsl.Const(2), '*', t)])
            )
        );
        return wf;
    }
});


// t - floor(t)
make_oscillator('saw', {
    new_phase(cur_phase, frequency, framerate) {
        const c = glsl.Const(1/framerate);
        return glsl.BinOp(cur_phase, '+', glsl.BinOp(frequency, '*', c));
    },
    value(cur_phase, phase_offset) {
        const t = glsl.BinOp(cur_phase, '+', phase_offset);
        return glsl.BinOp(t, '-', glsl.FunctionCall('floor', [t]));
    }
});

make_oscillator('sine', {
    new_phase(cur_phase, frequency, framerate) {
        const c = glsl.Const(1/framerate);
        return glsl.BinOp(cur_phase, '+', glsl.BinOp(c, '*', frequency));
    },

    value(cur_phase, phase_offset) {
        const total_phase = glsl.BinOp(cur_phase, '+', phase_offset);
        const t = glsl.BinOp(total_phase, '*', glsl.Const(2*Math.PI));

        const val = glsl.BinOp(glsl.Const(1.0), '+', glsl.FunctionCall('sin', [t]));
        const scaled = glsl.BinOp(glsl.Const(0.5), '*', val);
        return scaled;
    }
});
make_oscillator('cos', {
    new_phase(cur_phase, frequency, framerate) {
        const c = glsl.Const(1/framerate);
        return glsl.BinOp(cur_phase, '+', glsl.BinOp(c, '*', frequency));
    },

    value(cur_phase, phase_offset) {
        const total_phase = glsl.BinOp(cur_phase, '+', phase_offset);
        const t = glsl.BinOp(total_phase, '*', glsl.Const(2*Math.PI));

        const val = glsl.BinOp(glsl.Const(1.0), '+', glsl.FunctionCall('cos', [t]));
        const scaled = glsl.BinOp(glsl.Const(0.5), '*', val);
        return scaled;
    }
});

export default function register_oscillator_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
