import PipeToPam from 'pipe2pam';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegBin from 'ffmpeg-static';
import ffprobeBin from 'ffprobe-static';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import * as twgl from 'twgl.js';
import Units from '@/common/units';

ffmpeg.setFfmpegPath(ffmpegBin.path);
ffmpeg.setFfprobePath(ffprobeBin.path);

class VideoSource {
    constructor(gl, file) {
        this.gl = gl;
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.pause = this.pause.bind(this);
        this.initPlaceholderTexture();

        const pam = new PipeToPam();
        pam.on('pam', data => this.processFrame(data));

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

    initPlaceholderTexture() {
        const {gl} = this;
        this.texture = twgl.createTexture(gl, {
            width: 1,
            height: 1,
            format: gl.RGB,
            src: [0, 0, 0],
        });
        this.laoded = false;
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
        if (!this.loaded) {
            this.loaded = true;
            this.texture = twgl.createTexture(gl, textureOptions);
        }

        twgl.setTextureFromArray(gl, this.texture, data.pixels, textureOptions);
    }

    start() {
        if (this.runningCmd) {
            this.runningCmd.kill('SIGCONT');
        } else {
            this.runningCmd = this.cmd.clone();
            this.runningCmd.pipe(this.pam);
        }
    }

    stop() {
        this.runningCmd.on('error', () => undefined);
        this.runningCmd.kill('SIGKILL');
        this.runningCmd = undefined;
    }

    pause() {
        this.runningCmd.kill('SIGSTOP');
    }
}


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

    addGraphEventListeners() {
        const vid = this.vid;

        this.graph.addEventListener('start', vid.start);
        this.graph.addEventListener('stop',  vid.stop);
        this.graph.addEventListener('pause', vid.pause);

        this.graph.addEventListener('node-removed', ({node}) => {
            if (node.id === this.id) {
                vid.stop();
                this.graph.removeEventListener('start', vid.start);
                this.graph.removeEventListener('stop',  vid.stop);
                this.graph.removeEventListener('pause', vid.pause);
            }
        });
    }

    compile(c) {
        this.vid = new VideoSource(c.gl, '/Users/rpearl/Dropbox/chlorophyll-dragon/videos/Loops/abstract-bright-green-form-visualization-5_zjqjotoxr__D.mp4');

        this.addGraphEventListeners();

        const texture = c.variable();
        c.uniform('sampler2D', texture.name, () => this.vid.texture);
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
