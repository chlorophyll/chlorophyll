import GraphLib from '@/common/graphlib';
import { getMappedPoints, convertPointCoords } from '@/common/mapping';

import * as THREE from 'three';

import { renderer } from 'chl/viewport';

export class PatternRunner {
    constructor(model, pattern, mapping) {
        const { coord_type, mapping_type } = pattern;
        const mapped_points = getMappedPoints(model, mapping, coord_type);

        this.positions = convertPointCoords(mapping_type, coord_type, mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);

        let scene = new THREE.Scene();
        let camera = new THREE.Camera();
        camera.position.z = 1;
        /*
        outline:
        + update graph compiler to produce fragments instead of vertex shaders
        + update graph compiler to give back a list of uniforms
        + create new rawshadermaterial with a passthrough vertex shader and the
          compiled fragment shader
        - construct appropriate positions texture as input
          - one row for each strip?
        - create render shader to color the points

        - generally follow http://barradeau.com/blog/?p=621
        - https://github.com/mrdoob/three.js/blob/dev/examples/js/GPUComputationRenderer.js maybe useful
        - ignore the others for now
        - expect to rewrite but you need to start *somewhere*
        */

        /* TODO: revamp model into rows where each row is a strip */
        let positionsData = new Float32Array(model.num_pixels*4);

        this.positions.forEach(([idx, pos]) => {
            pos.toArray(positionsData, 4*idx);
            positionsData[4*idx+3] = 255; /* masking */
        });

        let positionsTexture = new THREE.DataTexture(
            positionsData,
            model.num_pixels,
            1,
            THREE.RGBAFormat,
            THREE.FloatType
        );

        let uniforms = {};
        for (let {name, type} of this.graph.global_inputs.values()) {
            uniforms[name] = {value: null};
        }

        const computeShader = new THREE.RawShaderMaterial({
            uniforms
        });

        let mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), passThruShader);
        scene.add(mesh);
    }
}
