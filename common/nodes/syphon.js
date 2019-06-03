import {SyphonRegistry} from 'SyphonBuffer';

import {getFloatingPointTextureOptions} from '@/common/util/shader_runner';
let node_types = [];

const registry = new SyphonRegistry();

let client = null;

let textureInfo = {
    width: null,
    height: null,
    texture: null,
};


registry.on('servers-updated', () => {
    const servers = Array.from(registry.serversById.values());
    if (servers.length === 1) {
        client = registry.createClientForServer(servers[0]);
        client.on('disconnected', () => client = null);

        client.connectAsync().catch(e => console.error(e));
    }
});

function initClient(gl) {
    client.on('frame', (frame, width, height) => {
        if (textureInfo.width !== width || textureInfo.height !== height) {
            const textureOptions = {
                ...getFloatingPointTextureOptions(gl, width, height),
            };
            if (!textureInfo.texture) {
                textureInfo.texture = twgl.createTexture(gl, textureOptions);
            }
        }
        textureInfo.width = width;
        textureInfo.height = height;
        twgl.setTextureFromArray(gl, textureInfo.texture, frame, textureOptions);
    });
}

class SyphonSourceNode extends GraphNode {

    constructor(options) {
        const inputs = [];
        const outputs = [
            GraphNode.output('output', 'texture'),
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        initClient(c.gl);

        const ident = c.variable();
        c.uniform('sampler2D', ident, () => textureInfo.texture);
        c.setOutput(0, ident);
    }
}

SyphonSourceNode.title = 'Syphon Source';
node_types.push(['input/syphon', SyphonSourceNode]);

class SampleNode extends GraphNode {

    constructor(options) {

        const inputs = [
            GraphNode.input('texture', 'texture'),
            GraphNode.input('x', Units.Numeric),
            GraphNode.input('y', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('color', 'CRGB'),
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        const texture = c.getInput(this, 0);
        const x = c.getInput(this, 1);
        const y = c.getInput(this, 2);

        const pos = glsl.FunctionCall('vec2', [x, y]);

        const output = glsl.Dot(glsl.FunctionCall('texture2D', [texture, pos]), 'rgb');

        c.setOutput(this, 0, output);
    }
}

node_types.push(['input/sampleTexture', SampleNode]);

export default function register_syphon_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
