import GraphLib, { GraphBase } from '@/common/graphlib';
function vm_factory(graph, node, data) {
    return data;
}

export class Graph extends GraphBase {
    constructor(id) {
        super(id);
    }

    emit(name, detail) {
    }

    static restore(snapshot) {
        const graph = new Graph(snapshot.id);
        graph.load_snapshot(snapshot);
        return graph;
    }

    addNode(path, options) {
        const { id } = options;
        return super.addNode(path, id, vm_factory, options);
    }
}

export function restoreAllGraphs(graphset) {
    GraphLib.restore(graphset.map(Graph.restore));
}

