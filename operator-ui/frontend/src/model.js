import * as THREE from 'three';
import createKDTree from 'static-kdtree';
import ModelBase from '@/common/model';
import modelVertexShader from 'raw-loader!@/model_shader.vert';
import modelFragmentShader from 'raw-loader!@/model_shader.frag';
import {quickSelect} from '@/common/util';

let currentModel = null;
export function initModel(json) {
    currentModel = new Model(json);
}

export function getModel() {
    return currentModel;
}

export class Model extends ModelBase {
    constructor(json) {
        super(json);

        this.colors = new Float32Array(this.num_pixels * 3);
        let offsets = new Float32Array(this.num_pixels * 2);

        const width = this.textureWidth;
        // if 3, then
        // 1/6, (2/6), 3/6, (4/6), 5/6
        for (let i = 0; i < this.num_pixels; i++) {
            const row = Math.floor(i / width);
            const col = i % width;
            offsets[2*i] = (2*col+1) / (2*width);
            offsets[2*i+1] = (2*row+1) / (2*width);
        }


        const geometry = new THREE.InstancedBufferGeometry();
        // const circleGeometry = new THREE.CircleBufferGeometry(1, 6);
        // geometry.index = circleGeometry.index;
        // geometry.attributes = circleGeometry.attributes;

        const geometryCoords = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        geometryCoords.setXYZ(0, -0.5, 0.5, 0.0);
        geometryCoords.setXYZ(1, 0.5, 0.5, 0.0);
        geometryCoords.setXYZ(2, -0.5, -0.5, 0.0);
        geometryCoords.setXYZ(3, 0.5, -0.5, 0.0);
        geometry.addAttribute('position', geometryCoords);

        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0, 0.0, 0.0);
        uvs.setXYZ(1, 1.0, 0.0);
        uvs.setXYZ(2, 0.0, 1.0);
        uvs.setXYZ(3, 1.0, 1.0);
        geometry.addAttribute('uv', uvs);

        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));
        const aTranslate = new THREE.InstancedBufferAttribute(this.positions, 3, false);
        const aOverlayColor = new THREE.InstancedBufferAttribute(this.colors, 3, false);
        const aOffset = new THREE.InstancedBufferAttribute(offsets, 2, false);
        geometry.addAttribute('aTranslate', aTranslate);
        geometry.addAttribute('aOverlayColor', aOverlayColor);
        geometry.addAttribute('aOffset', aOffset);
        this.geometry = geometry;

        const texture = new THREE.DataTexture(
            new Float32Array(3*width*width),
            width,
            width,
            THREE.RGBFormat,
            THREE.FloatType
        );

        const allPositions = this.allPixelPositions().map(({pos}) => pos.toArray());

        if (this.model_info.tree) {
            this.tree = createKDTree.deserialize(this.model_info.tree);
        } else {
            this.tree = createKDTree(allPositions);
            this.model_info.tree = this.tree.serialize();
        }

        const minDistances = allPositions.map(pos => {
            const pts = this.tree.knn(pos, 2);
            const nearest = allPositions[pts[1]];
            let distsq = 0;
            for (let i = 0; i < pos.length; i++) {
                const d = nearest[i] - pos[i];
                distsq += d*d;
            }
            return distsq;
        });

        const distsq = quickSelect(minDistances, 0.75);
        const dist = Math.sqrt(distsq);

        this.pixelsize = 0.8 * dist;
        if (this.num_pixels > 1000) {
            this.pixelsize *= 2;
        }
        this.model_info.pixelsize = this.pixelsize;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                outlineWidth: {value: 0},
                pointSize: { value: this.pixelsize },
                computedColors: { value: texture },
                displayOnly: { value: true },
                scale: { value: 350 },
            },
            vertexShader: modelVertexShader,
            fragmentShader: modelFragmentShader,
            transparent: true,
            depthWrite: true,
            defines: {
                ALPHATEST: 0.999,
            },
            extensions: {
                derivatives: true,
            }
        });

        this.edgeMaterial = this.material.clone();
        this.edgeMaterial.depthTest = true;
        this.edgeMaterial.depthWrite = false;
        this.edgeMaterial.defines.ALPHATEST = 0.15;

        this.particles = new THREE.Mesh(this.geometry, this.material);
        this.edges = new THREE.Mesh(this.geometry, this.edgeMaterial);

        this.scene = new THREE.Scene();
        this.scene.add(this.particles);
        this.scene.add(this.edges);
        this.scene.fog = new THREE.Fog(0x000000, 1000, 100000);
    }
    setFromTexture(texture) {
        this.material.uniforms.computedColors.value = texture;
        this.edgeMaterial.uniforms.computedColors.value = texture;
    }
    zoomCameraToFit(camera, oversizeFactor = 1.1) {
        const boxSize = new THREE.Vector3();
        const center = new THREE.Vector3();
        const boundingBox = new THREE.Box3();
        for (const {pos} of this.allPixelPositions()) {
            boundingBox.expandByPoint(pos);
        }
        boundingBox.getSize(boxSize);
        boundingBox.getCenter(center);
        const {x, y, z} = boxSize;
        const maxDim = Math.max(x, y, z);

        if (camera.isPerspectiveCamera) {
            const fov = camera.fov * ( Math.PI / 180 );
            const cameraZ = Math.abs( maxDim / 2 / Math.tan( fov / 2 ) );
            camera.position.z = oversizeFactor * (center.z + cameraZ);
        } else if (camera.isOrthographicCamera) {
            const maxCameraDim = Math.max(
                camera.right - camera.left,
                camera.top - camera.bottom
            );
            camera.zoom = camera.zoom * (maxCameraDim / maxDim) / oversizeFactor;
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();
        return center;
    }
}
