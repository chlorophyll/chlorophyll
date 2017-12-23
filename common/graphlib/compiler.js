import Units from '@/common/units';

let decls = [];
let types = new Map();

function isConvertible(t1, t2) {
    return t1 && t2 && t1.isUnit && t2.isUnit;
}

export let Compilation = {
    toplevel(source) {
        decls.push(source);
    },

    registerType(name, obj) {
        let {type, decl} = obj.declare();

        if (decl !== undefined) {
            decls.push(decl);
        }

        types.set(name, {type, obj});
    },


    glsl_type(type) {
        let t = types.get(type);
        if (t !== undefined)
            return t.type;

        if (type == 'number') {
            return 'float';
        }

        if (type.isUnit) {
            return 'float';
        }

        return type;
    }
};

export class GraphCompiler {
    constructor(graph) {
        this.graph = graph;
    }

    reset() {
        this.out = [];
        this.uniforms = [];
        this.id = 0;
    }

    compile() {
        this.reset();

        this.out.push('void main() {');

        this.graph.forEachNode((node) => {
            for (let slot = 0; slot < node.input_info.length; slot++) {
                let v = this.default_value(node, slot);
                let { type } = node.input_info[slot];

                if (v == undefined)
                    continue;

                this.uniform(type, v);

            }
            if (node.compile) {
                this.comment(`node ${node.id}`);
                node.compile(this);
                this.comment(`end node ${node.id}`);
                this.out.push('');
            }
        });

        this.out.push('}');

        let output = [...this.uniforms, ...decls, ...this.out];

        return output.join('\n');
    }

    uniform(type, name) {
        let t = Compilation.glsl_type(type);
        this.uniforms.push(`uniform ${t} ${name};`);
    }

    comment(s) {
        this.out.push('// '+s);
    }

    variable(prefix) {
        prefix = prefix || '';
        return `v${prefix}_${this.id++}`;
    }

    input(node, slot) {
        return `input_${node.id}_${slot}`;
    }

    output(node, slot) {
        return `output_${node.id}_${slot}`;
    }

    declare(type, v, init) {
        let t = Compilation.glsl_type(type);
        let suffix = '';
        if (init) {
            suffix = ` = ${init}`;
        }
        this.out.push(`${t} ${v}${suffix};`);
        return v;
    }

    default_value(node, slot) {
        const { name } = node.input_info[slot];
        if (node.vm.defaults[name] === undefined) {
            return undefined;
        }
        return `default_${node.id}_${name}`;
    }

    getGlobalInput(name) {
        return 'placeholder';
    }

    getInput(node, slot) {
        const { type, src } = node.input_info[slot];

        let v_dst = this.input(node, slot);

        const { autoconvert } = node.vm.inputs[slot].settings;

        let init_expr;

        let decl_type = type;

        if (src) {
            let outgoing_type = src.node.output_info[src.slot].type;

            let v_src = this.output(src.node, src.slot);

            if (autoconvert && isConvertible(outgoing_type, type)) {
                init_expr = Units.compile(v_src, outgoing_type, type);
            } else {
                init_expr = v_src;
            }
        } else {
            init_expr = this.default_value(node, slot);
        }
        this.declare(decl_type, v_dst, init_expr);

        return v_dst;
    }

    setOutput(node, slot, val) {
        let { type } = node.output_info[slot];
        this.declare(type, this.output(node, slot), val);
    }
};

window.GraphCompiler = GraphCompiler;
