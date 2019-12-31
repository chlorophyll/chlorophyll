import GraphLib, { GraphBase } from '@/common/graphlib';
import EventEmitter from 'events';
import * as path from 'path';

let mediaFolder = '/tmp/chlorophyll-media';
function vm_factory(graph, node, data) {
    return {
        ...data,
        mediaFolder,
    };
}

export class Graph extends GraphBase {
    constructor(id) {
        super(id);
        this._emitter = new EventEmitter();
    }

    emit(name, detail) {
        this._emitter.emit(name, {detail});
    }

    addEventListener(name, cb) {
        this._emitter.addListener(name, cb);
    }
    removeEventListener(name, cb) {
        this._emitter.removeListener(name, cb);
    }

    static restore(snapshot) {
        const graph = new Graph(snapshot.id);
        graph.load_snapshot(snapshot);
        return graph;
    }

    addNode(nodePath, options) {
        const { id } = options;
        return super.addNode(nodePath, id, vm_factory, options);
    }
}

export function restoreAllGraphs(graphset, projectDir) {
    mediaFolder = path.join(projectDir, 'media');
    GraphLib.restore(graphset.map(Graph.restore));
}

