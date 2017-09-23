import klay from 'klayjs';

export default function GraphAutoLayout() {
    let defaultOptions = {
        'algorithm': 'de.cau.cs.kieler.klay.layered',
        'layoutHierarchy': true,
        'spacing': 20,
        'borderSpacing': 20,
        'edgeSpacingFactor': 0.2,
        'inLayerSpacingFactor': 2.0,
        'nodePlace': 'BRANDES_KOEPF',
        'nodeLayering': 'NETWORK_SIMPLEX',
        'edgeRouting': 'POLYLINE',
        'crossMin': 'LAYER_SWEEP',
        'direction': 'RIGHT'
    };

    this.layout = function(graph, callback) {
        callback = callback || console.log;

        let kgraph = encodeAsKGraph(graph);

        klay.layout({
            graph: kgraph,
            options: defaultOptions,
            success: callback
        });
    };

    function encodeAsKGraph(graph) {
        let portConstraints = 'FIXED_POS';

        let portProperties = {
            inportSide: 'WEST',
            outportSide: 'EAST',
            width: 8,
            height: 8
        };

        let knodes = [];

        graph.forEachNode(function(node) {
            function make_port(is_input) {
                return function(port, slot) {
                    const x = node.vm.connectionX(slot, is_input);
                    const y = node.vm.connectionY(slot, is_input);
                    const porttype = is_input ? 'input' : 'output';
                    const portSide = is_input ? 'WEST' : 'EAST';
                    const id = `node${id}-${porttype}${slot}`;
                    const { width, height } = portProperties;
                    return {
                        id,
                        width,
                        height,
                        x: x,
                        y: y,
                        properties: {
                            'de.cau.cs.kieler.portSide': portSide
                        }
                    };
                };
            }

            const ports = [
                ...node.input_info.map(make_port(true)),
                ...node.output_info.map(make_port(false)),
            ];

            let {width, height} = node.vm;
            const id = `node${node.id}`;

            let knode = {
                id,
                width,
                height,
                ports,
                properties: { portConstraints }
            };
            knodes.push(knode);
        });

        let kedges = [];

        graph.forEachEdge(function(edge, id) {
            kedges.push({
                id: `edge${id}`,
                source: `node${edge.src_id}`,
                sourcePort: `node${edge.src_id}-output${edge.src_slot}`,
                target: `node${edge.dst_id}`,
                targetPort: `node${edge.dst_id}-input${edge.dst_slot}`
            });
        });

        return {
            id: 'graph',
            children: knodes,
            edges: kedges
        };

    }
};
