import PipeToPam from 'pipe2pam';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegBin from 'ffmpeg-static';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import * as twgl from 'twgl.js';
import Units from '@/common/units';

ffmpeg.setFfmpegPath(ffmpegBin.path);

//const file = '/Users/rpearl/Downloads/4k-ultra-hd-abstract-nebula-space-creative-galaxy-background_nybzvmxi__D.mp4';
//
class VideoSource {
    constructor(file) {
        const pam = new PipeToPam();
        pam.on('pam', data => this.processFrame(data));
        this.texture = null;

        const cmd = ffmpeg(file)
            .format('image2pipe')
            .videoCodec('pam')
            .videoFilters('realtime,scale=w=iw/4:h=ih/4')
            .on('start', cmd => console.log(cmd))
            .inputOptions('-stream_loop -1')
            .inputOptions('-fflags +genpts')
            .outputOptions('-pix_fmt rgb24');

        this.pam = pam;
        this.cmd = cmd;
    }

    processFrame(data) {
        const {gl} = this;
        const {width, height} = data;
        const textureOptions = {
            width,
            height,
            format: gl.RGB,
            type: gl.UNSIGNED_BYTE,
            minMag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
            auto: false,
        };
        if (!this.texture) {
            this.texture = twgl.createTexture(gl, textureOptions);
            console.log(data);
        }

        twgl.setTextureFromArray(gl, this.texture, data.pixels, textureOptions);
    }

    start() {
        if (!this.started) {
            this.started = true;
            this.cmd.pipe(this.pam);
        }
    }
}

const vid = new VideoSource('/Users/rpearl/Dropbox/chlorophyll-dragon/videos/Loops/abstract-bright-green-form-visualization-5_zjqjotoxr__D.mp4');

class VideoNode extends GraphNode {
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
        vid.gl = c.gl;
        vid.start();
        const texture = c.variable();
        c.uniform('sampler2D', texture.name, () => vid.texture);
        const x = c.getInput(this, 0);
        const y = c.getInput(this, 1);

        const pos = glsl.FunctionCall('vec2', [x, y]);

        const output = glsl.Dot(glsl.FunctionCall('texture2D', [texture, pos]), 'rgb');
        const gamma = glsl.Const(2.2);
        const toLinear = glsl.FunctionCall('pow', [
            output,
            glsl.FunctionCall('vec3', [gamma])
        ]);
        c.setOutput(this, 0, toLinear);
    }
}

VideoNode.title = 'Video';
const node_types = [['input/video', VideoNode]];

export default function register_video_nodes() {
    GraphLib.registerNodeTypes(node_types);
}
