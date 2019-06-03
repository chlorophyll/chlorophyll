import {SyphonRegistry} from 'SyphonBuffer';
import {getFloatingPointTextureOptions} from '@/common/util/shader_runner';
import GraphLib, { GraphNode } from '@/common/graphlib';
import Units from '@/common/units';
import * as glsl from '@/common/glsl';
import * as twgl from 'twgl.js';

let node_types = [];

const registry = new SyphonRegistry();

let client = null;

let textureInfo = {
    width: null,
    height: null,
    texture: null,
    gl: null,
};


registry.on('servers-updated', () => {
    const servers = Array.from(registry.serversById.values());
    if (servers.length === 1) {
        client = registry.createClientForServer(servers[0]);
        client.on('disconnected', () => client = null);
        client.on('frame', (frame, width, height) => {
            if (!textureInfo.gl) {
                return;
            }
            const {gl} = textureInfo;
            const textureOptions = {
                width,
                height,
                format: gl.RGBA,
                type: gl.UNSIGNED_BYTE,
                minMag: gl.NEAREST,
                wrap: gl.CLAMP_TO_EDGE,
                auto: false,
            };
            if (textureInfo.width !== width || textureInfo.height !== height) {
                if (!textureInfo.texture) {
                    textureInfo.texture = twgl.createTexture(textureInfo.gl, textureOptions);
                }
            }
            textureInfo.width = width;
            textureInfo.height = height;
            twgl.setTextureFromArray(textureInfo.gl, textureInfo.texture, frame, textureOptions);
        });

        client.on('connected', () => {
            console.log('connected');
        });

        client.connectAsync().catch(e => console.error(e));
    }
});

registry.start();

function initClient(gl) {
    textureInfo.gl = gl;
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
        initClient(c.gl);
        const texture = c.variable();
        c.uniform('sampler2D', texture.name, () => textureInfo.texture);
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
