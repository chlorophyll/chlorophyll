import PipeToPam from 'pipe2pam';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegBin from 'ffmpeg-static';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import * as twgl from 'twgl.js';
import * as path from 'path';
import Units from '@/common/units';
import Ringbuffer from 'ringbufferjs';
ffmpeg.setFfmpegPath(ffmpegBin.path);

const NUM_BUFFERS = 10;
const BUFFERING_TIME = 400; /*ms*/
const FPS = 20;

class VideoSource {
    constructor() {
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.pause = this.pause.bind(this);

        this.loaded = false;
        this.running = false;

        this.buffers = new Ringbuffer(NUM_BUFFERS);
    }

    initPlaceholderTexture(gl) {
        this.gl = gl;
        if (!this.loaded) {
            this.texture = twgl.createTexture(gl, {
                width: 1,
                height: 1,
                format: gl.RGB,
                internalFormat: gl.RGB,
                src: [0, 0, 0],
            });
        }

    }

    setFile(file) {
        if (file === this.file) {
            return;
        }
        const running = this.running;
        this.file = file;
        this.stop();
        if (this.file) {
            this.cmd = ffmpeg(this.file)
                .format('image2pipe')
                .renice(-10)
                .videoCodec('pam')
                .videoFilters(`realtime,scale=w=iw/4:h=ih/4,fps=${FPS}`)
                .on('start', cmd => console.log(cmd))
                .inputOptions('-stream_loop -1')
                .inputOptions('-fflags +genpts')
                .outputOptions('-pix_fmt rgb24');

        } else {
            this.cmd = undefined;
        }
        if (this.gl) {
            this.initPlaceholderTexture(this.gl);
        }

        if (running) {
            this.start();
        }
    }

    processFrame(data) {
        const {gl} = this;
        const {width, height} = data;
        this.width = parseInt(width);
        this.height = parseInt(height);
        const textureOptions = {
            width: this.width,
            height: this.height,
            format: gl.RGB,
            internalFormat: gl.RGB,
            type: gl.UNSIGNED_BYTE,
            minMag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
            flipY: true,
            auto: false,
        };
        if (!this.loaded) {
            this.loaded = true;
            this.texture = twgl.createTexture(gl, textureOptions);
        }

        this.buffers.enq(Buffer.from(data.pixels));
    }

    writeFrame() {
        if (this.buffers.isEmpty() || !this.gl) {
            return;
        }
        const {gl, width, height} = this;
        const pixels = this.buffers.deq();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    }

    startWriting() {
        this.intervalId = setInterval(() => this.writeFrame(), 1000/FPS);
    }

    stopWriting() {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    start() {
        if (this.runningCmd) {
            this.runningCmd.kill('SIGCONT');
            this.startWriting();
        } else if (this.cmd) {
            this.runningCmd = this.cmd.clone();
            this.pam = new PipeToPam();
            this.pam.on('pam', data => this.processFrame(data));
            this.runningCmd.pipe(this.pam);

            this.intervalId = setTimeout(() => this.startWriting(), BUFFERING_TIME);
        }

        this.running = true;
    }

    stop() {
        if (this.runningCmd) {
            this.runningCmd.on('error', () => undefined);
            this.runningCmd.kill('SIGKILL');
            this.runningCmd = undefined;
        }
        this.running = false;
        this.loaded = false;
        this.buffers = new Ringbuffer(NUM_BUFFERS);
        this.stopWriting();
    }

    pause() {
        if (this.runningCmd) {
            this.runningCmd.kill('SIGSTOP');
        }

        this.stopWriting();

    }
}


class VideoNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Numeric),
            GraphNode.input('y', Units.Numeric),
        ];

        if (!options.parameters) {
            options.parameters = [
                GraphNode.parameter('file', 'MediaFile'),
            ];
        }

        const outputs = [
            GraphNode.output('color', 'CRGB'),
        ];

        super(options, inputs, outputs);

        this.videoSource = new VideoSource(this.vm.mediaFolder);
        this.refreshVideoSource();
        this.addGraphEventListeners();
    }

    refreshVideoSource() {
        const filename = this.vm.parameters[0].value;
        const fullPath = filename ? path.join(this.vm.mediaFolder, filename) : undefined;
        this.videoSource.setFile(fullPath);
    }

    onPropertyChange() {
        this.refreshVideoSource();
    }

    addGraphEventListeners() {
        const vid = this.videoSource;
        this.graph.addEventListener('start', vid.start);
        this.graph.addEventListener('stop',  vid.stop);
        this.graph.addEventListener('pause', vid.pause);

        this.graph.addEventListener('node-removed', ev => {
            const {node} = ev.detail;
            if (node.id === this.id) {
                vid.stop();
                this.graph.removeEventListener('start', vid.start);
                this.graph.removeEventListener('stop',  vid.stop);
                this.graph.removeEventListener('pause', vid.pause);
            }
        });
    }

    compile(c) {
        this.videoSource.initPlaceholderTexture(c.gl);

        const texture = c.variable();
        c.uniform('sampler2D', texture.name, () => this.videoSource.texture);
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
