import GraphLib, {GraphNode} from '../graphlib';
import Signal, {SignalBlob} from '../osc/signal';

class SignalInput extends GraphNode {
    public title: string = 'OSC Signal';
    private signal = null;
    private id;
    private input_info;
    private output_info;
    private graph;

    constructor(options, signalAttrs: SignalBlob) {
        super(
            options,
            [], // Inputs
            Signal.argsToGraphTypes(signalAttrs.args).map((t, i) => GraphNode.output(`value${i}`, t)),
            {config: {color: '#7496a6', boxcolor: '#69a4bf'}}
        );

        this.signal = new Signal(signalAttrs);
        this.signal.enable();

        // Clean up the OSC listener if the node is removed.
        this.graph.addEventListener('node-removed', event => {
            if (!event.node || event.node.id !== this.id || !this.signal)
                return;

            this.signal.disable();
        });
    }

    compile(c) {
        if (this.signal === null)
            return;

        this.output_info.forEach((out, i) => {
            const signalName = this.signal.ident;
            c.uniform(out.type, signalName, () => this.signal.getValue());
            c.setOutput(this, i, c.getGlobalInput(signalName));
        });
    }
}

export default function register_signal_nodes(signals: Array<SignalBlob>) {
    for (let signalAttrs of signals) {
        GraphLib.registerNodeType(`input/${signalAttrs.name}`, SignalInput, signalAttrs);
    }
};
