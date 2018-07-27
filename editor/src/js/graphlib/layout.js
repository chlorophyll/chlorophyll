import ELK from 'elkjs';

function encodeAsELKGraph(graph) {
    const portConstraints = 'FIXED_POS';

    const portProperties = {
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
                const id = `node${node.id}-${porttype}${slot}`;
                const { width, height } = portProperties;
                return {
                    id,
                    width,
                    height,
                    x: x,
                    y: y,
                    properties: {
                        'port.side': portSide
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

    graph.forEachEdge(function(edge) {
        kedges.push({
            id: `edge${edge.id}`,
            sources: [`node${edge.src_id}-output${edge.src_slot}`],
            targets: [`node${edge.dst_id}-input${edge.dst_slot}`],
        });
    });

    return {
        id: 'graph',
        children: knodes,
        edges: kedges
    };

}

const layoutOptions = {
    'algorithm': 'layered',
    'spacing': 20,
    'borderSpacing': 20,
    'edgeSpacingFactor': 0.2,
    'inLayerSpacingFactor': 2.0,
    'edgeRouting': 'ORTHOGONAL',
    'direction': 'RIGHT'
};

const elk = new ELK();

export default function autolayout(graph) {
    const kgraph = encodeAsELKGraph(graph);
    return elk.layout(kgraph, { layoutOptions });
};
