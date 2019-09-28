import GraphLib from '../graphlib';
import GraphNode from '../graphlib/graph_node';
import Signal, {SignalBlob} from '../osc/signal';

function makeSignalNode(signalAttrs) {
    const argTypes = Signal.argsToGraphTypes(signalAttrs.args);
    const outputs = argTypes.map((t, i) => GraphNode.output(`value${i}`, t));

    const node = class extends GraphNode {
        static title: string = signalAttrs.name;
        static getOutputs() {
            return outputs;
        }
        private signal = null;
        constructor(options) {
            super(options, {
                config: {
                    color: '#7496a6', boxcolor: '#69a4bf'
                }
            });

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

            const signalName = this.signal.ident;

            // TODO why is this a loop?
            for (let i = 0; i < argTypes.length; i++) {
                c.uniform(argTypes[i], signalName, () => this.signal.getValue());
                c.setOutput(this, i, c.getGlobalInput(signalName));
            }
        }
    };
    return node;
}

export default function register_signal_nodes(signals: Array<SignalBlob>) {
    for (let signalAttrs of signals) {
        GraphLib.registerNodeType(`input/${signalAttrs.name}`, makeSignalNode(signalAttrs));
    }
};
