import GraphLib, { GraphNode } from '@/common/graphlib';
import Units from '@/common/units';

import Plane from 'three';

let node_types = [];

class PlaneNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('normal', 'vector3'),
            GrapNode.input('constant', Units.Distance),
        ];

        const outputs = [
            GraphNode.output('plane')
        ];

        super(options, inputs, outputs);
    }

    onExecute() {
        let normal = this.getInputData(0);
        let constant = this.getInputData(1);

        let plane = new Plane(normal, constant.valueOf());

        return plane;
    }
}
