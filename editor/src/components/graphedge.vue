<template>
    <path stroke="#aaa" fill="transparent" :d="path_string" />
</template>

<script>
import Const from 'chl/const';
import Util from 'chl/util';

export default {
    props: ['graph', 'edge'],
    computed: {
        src_node() {
            return this.graph.getNodeById(this.edge.src_id).vm;
        },
        dst_node() {
            return this.graph.getNodeById(this.edge.dst_id).vm;
        },
        src_pos() {
            let x = this.src_node.connectionX(this.edge.src_slot, false);
            let y = this.src_node.connectionY(this.edge.src_slot, false);
            return this.src_node.canvasPos([x, y]);
        },
        dst_pos() {
            let x = this.dst_node.connectionX(this.edge.dst_slot, true);
            let y = this.dst_node.connectionY(this.edge.dst_slot, true);
            return this.dst_node.canvasPos([x, y]);
        },
        src_box() {
            return this.box(this.src_node);
        },
        dst_box() {
            return this.box(this.dst_node);
        },
        path_string() {
            const src_pos = this.src_pos;
            const dst_pos = this.dst_pos;
            const src_box = this.src_box;
            const dst_box = this.dst_box;

            if (src_pos[0] > dst_pos[0] && (src_box[3] < dst_box[1] ||
                                            dst_box[3] < src_box[1])) {
                let src_end_y = this.curveY(
                    src_box,
                    dst_box,
                    this.src_node.outputs,
                    this.edge.src_slot
                );
                let dst_end_y = this.curveY(
                    dst_box,
                    src_box,
                    this.dst_node.inputs,
                    this.edge.dst_slot
                );

            // Don't slope further away from the destination
            if ((src_box[1] < dst_box[1] && src_end_y > dst_end_y) ||
                    (src_box[1] > dst_box[1] && src_end_y < dst_end_y)) {
                src_end_y = dst_end_y;
            }

            let src_end_x = src_pos[0] + 5;
            let dst_end_x = dst_pos[0] - 5;
            let dx = src_end_x - dst_end_x;
            let dy = src_end_y - dst_end_y;

            // Scale the width of the curve up with the height
            let src_cwidth1 = Math.abs(src_end_y - src_pos[1]) / 2;
            let dst_cwidth1 = Math.abs(dst_end_y - dst_pos[1]) / 2;
            let src_cwidth2 = Math.min(src_cwidth1, dx / 2);
            let dst_cwidth2 = Math.min(dst_cwidth1, dx / 2);
            // Align the curve handles with the connecting line
            let src_cheight = src_cwidth2 * (dy / dx);
            let dst_cheight = dst_cwidth2 * (dy / dx);
            // Scale the handle down if it pokes past the slot
            let src_hratio = Math.abs(src_end_y - src_pos[1]) / Math.abs(src_cheight);
            let dst_hratio = Math.abs(dst_end_y - dst_pos[1]) / Math.abs(dst_cheight);
            if (src_hratio < 1) {
                src_cheight *= src_hratio;
                src_cwidth2 *= src_hratio;
            }
            if (dst_hratio < 1) {
                dst_cheight *= dst_hratio;
                dst_cwidth2 *= dst_hratio;
            }

            let src_curve =
                `M ${src_pos[0]}              ${src_pos[1]} ` +
                `C ${src_pos[0] + src_cwidth1} ${src_pos[1]} ` +
                 ` ${src_end_x + src_cwidth2}  ${src_end_y + src_cheight} ` +
                 ` ${src_end_x}               ${src_end_y} `;

            let middle_curve =
                `S ${dst_end_x + dst_cwidth2} ${dst_end_y + dst_cheight} ` +
                  `${dst_end_x}               ${dst_end_y} `;

            let dst_curve =
                `S ${dst_pos[0] - dst_cwidth1} ${dst_pos[1]} ` +
                  `${dst_pos[0]}               ${dst_pos[1]} `;

            return src_curve + middle_curve + dst_curve;
            } else {
                return Util.bezierByH(
                    src_pos[0], src_pos[1],
                    dst_pos[0], dst_pos[1]
                );
            }
        }
    },
    methods: {
        box(node) {
            return [
                ...node.canvasPos([0, -Const.Graph.NODE_TITLE_HEIGHT]),
                ...node.canvasPos([node.width, node.height]),
            ];
        },
        curveY(node_box, other_box, node_slots, slot) {
            const num_slots = node_slots.length;
            let on_top = (node_box[1] < other_box[1]);
            let v_gap, rel_slot;
            // Route around top or bottom corner based on which is on top
            if (on_top) {
                v_gap = other_box[1] - node_box[3];
                rel_slot = num_slots - slot;
            } else {
                v_gap = node_box[1] - other_box[3];
                rel_slot = slot + 1;
            }
            let vert_off = rel_slot * Math.min(Const.Graph.NODE_SLOT_HEIGHT / 2,
                v_gap / (num_slots + 1));

            return on_top ? node_box[3] + vert_off : node_box[1] - vert_off;
        }
    }
};
</script>
