import {SyphonRegistry} from 'SyphonBuffer';
import {getFloatingPointTextureOptions} from '@/common/util/shader_runner';
import GraphLib, { GraphNode } from '@/common/graphlib';
import Units from '@/common/units';
import * as glsl from '@/common/glsl';
import * as twgl from 'twgl.js';

let node_types = [];

const registry = new SyphonRegistry();
let client = null;
let syphonData = {
    width: null,
    height: null,
    texture: null,
    gl: null,
};

function updateTexture(gl, width, height, frame) {
    const textureOptions = {
        width,
        height,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        auto: false,
    };
    if (!syphonData.texture) {
        syphonData.texture = twgl.createTexture(gl, textureOptions);
    }

    syphonData.width = width;
    syphonData.height = height;
    syphonData.gl = gl;
    twgl.setTextureFromArray(gl, syphonData.texture, frame, textureOptions);
}


registry.on('servers-updated', () => {
    const servers = Array.from(registry.serversById.values());
    if (!client && servers.length > 0) {
        client = registry.createClientForServer(servers[0]);
        client.on('frame', (frame, width, height) => {
            const {gl} = syphonData;
            if (!gl) {
                return;
            }
            updateTexture(gl, width, height, frame);
        });

        client.on('disconnected', () => {
            client = null;
            const {gl} = syphonData;
            if (!gl) {
                return;
            }
            resetClient(gl);
        });

        client.connectAsync().catch(e => console.error(e));
    }
});

registry.start();

function resetClient(gl) {
    const sz = 16;
    updateTexture(gl, sz, sz, new Uint8Array(sz*sz*4));
}

class SampleNode extends GraphNode {
    constructor(options) {

        const inputs = [
            GraphNode.input('x', Units.Numeric),
            GraphNode.input('y', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('color', 'CRGB'),
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        resetClient(c.gl);
        const texture = c.variable();
        c.uniform('sampler2D', texture.name, () => syphonData.texture);
        const x = c.getInput(this, 0);
        const y = c.getInput(this, 1);

        const pos = glsl.FunctionCall('vec2', [x, y]);

        const output = glsl.Dot(glsl.FunctionCall('texture2D', [texture, pos]), 'bgr');

        c.setOutput(this, 0, output);
    }
}
SampleNode.title = 'Read Syphon Source';

node_types.push(['input/syphon', SampleNode]);

export default function register_syphon_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
