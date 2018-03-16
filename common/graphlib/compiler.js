import Units from '@/common/units';

import * as glsl from '@/common/glsl';

let global_decls = [];
let types = new Map();

function isConvertible(t1, t2) {
    return t1 && t2 && t1.isUnit && t2.isUnit;
}

export let Compilation = {
    toplevel(source) {
        global_decls.push(source);
    },

    registerType(name, obj) {
        let {type, decl} = obj.declare();

        if (decl !== undefined) {
            global_decls.push(decl);
        }

        types.set(name, {type, obj});
    },

    registerAlias(name, type) {
        types.set(name, { type });
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
        this.decls = [];
        this.id = 0;
    }

    compile() {
        this.reset();

        for (let {name, type, per_pixel} of this.graph.global_inputs.values()) {
            if (per_pixel) {
                this.attribute(type, name);
            } else {
                this.uniform(type, name);
            }
        }

        for (let {name, type} of this.graph.global_outputs.values()) {
            this.varying(type, name);
        }

        this.graph.forEachNode((node) => {
            for (let slot = 0; slot < node.input_info.length; slot++) {
                let v = this.default_value(node, slot);
                if (node.id == 6 && slot == 0) {
                    console.log(node.input_info);
                }
                let { type } = node.input_info[slot];

                if (v == undefined)
                    continue;

                this.uniform(type, v);

            }
            if (node.compile) {
                this.out.push(glsl.Comment(`node ${node.id}`));
                node.compile(this);
                this.out.push(glsl.Comment(`end node ${node.id}`));
            }
        });

        let main = glsl.FunctionDecl('void', 'main', [], this.out);

        let output = glsl.Root([...this.decls, main]);

        return global_decls.join('\n') + glsl.generate(output);

        return glsl.Root(output);
    }

    decl(fn, type, name) {
        let t = Compilation.glsl_type(type);
        this.decls.push(fn(t, name));
    }

    uniform(type, name) {
        this.decl(glsl.UniformDecl, type, name);
    }

    attribute(type, name) {
        this.decl(glsl.AttributeDecl, type, name);
    }

    varying(type, name) {
        this.decl(glsl.VaryingDecl, type, name);
    }

    variable(prefix='') {
        return glsl.Ident(`v${prefix}_${this.id++}`);
    }

    input(node, slot) {
        return glsl.Ident(`input_${node.id}_${slot}`);
    }

    output(node, slot) {
        return glsl.Ident(`output_${node.id}_${slot}`);
    }

    declare(type, v, init) {
        let t = Compilation.glsl_type(type);

        let stmt = glsl.Variable(t, v);

        if (init) {
            stmt = glsl.BinOp(stmt, '=', init);
        }

        this.out.push(stmt);
        return v;
    }

    default_value(node, slot) {
        const { name } = node.input_info[slot];
        if (node.vm.defaults[name] === undefined || node.vm.defaults[name] == null) {
            return undefined;
        }
        return glsl.Ident(`default_${node.id}_${name}`);
    }

    getGlobalInput(name) {
        return glsl.Ident(name);
    }

    setGlobalOutput(name, expr) {
        this.out.push(glsl.BinOp(glsl.Ident(name), '=', expr));
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
window.glsl = glsl;
