import Units from '@/common/units';
import * as glsl from '@/common/glsl';
import * as glslify from 'glslify';

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
    },

    global_decls() {
        return global_decls;
    },

    uniform(type, name) {
        return glsl.UniformDecl(Compilation.glsl_type(type), name);
    },

    generateSource(uniforms, compiled, main) {
        const compiledUniforms = compiled.uniforms.map(
            ({type, name}) => glsl.UniformDecl(type, glsl.Ident(name))
        );
        const ast = glsl.Root([
            ...compiled.requirements,
            ...uniforms,
            ...compiledUniforms,
            compiled.source,
            main
        ]);
        const toplevel = Compilation.global_decls().join('\n');
        const sourceString = toplevel + glsl.generate(ast);
        return glslify.compile(sourceString);
    }

};

export class GraphCompiler {
    constructor(graph) {
        this.graph = graph;
    }

    reset() {
        this.out = [];
        this.uniforms = [];
        this.requirements = new Map();
        this.id = 0;
        this.context = null;
    }

    import(moduleName) {
        if (this.requirements.has(moduleName)) {
            return this.requirements.get(moduleName);
        }

        const ident = 'importedFunction'+this.id++;
        this.requirements.set(moduleName, ident);
        return ident;
    }

    ident() {
        const suffix = this.context === null ? '' : '_'+this.context.name;
        return `graph${this.graph.id}${suffix}`;
    }

    compile(context=null) {
        this.reset();
        this.context = context;
        /*
        for (let {name, type} of this.graph.global_inputs.values()) {
            this.uniform(type, name);
        }
        */

        /* hmm
        for (let {name, type} of this.graph.global_outputs.values()) {
            this.varying(type, name);
        }
        */

        this.graph.forEachNode((node) => {
            for (let slot = 0; slot < node.input_info.length; slot++) {
                let name = this.default_name(node, slot);
                if (node.id == 6 && slot == 0) {
                    console.log(node.input_info);
                }
                let { type } = node.input_info[slot];

                if (name == undefined)
                    continue;

                this.uniform(type, name, () => {
                    let ret = node.defaultForSlot(slot).valueOf();
                    return ret;
                });

            }
            if (node.compile) {
                this.out.push(glsl.Comment(`node ${node.id} (${node.vm.title})`));
                node.compile(this);
                this.out.push(glsl.Comment(`end node ${node.id}`));
            }
        });
        let params = [];
        for (const {type, name} of this.graph.global_inputs.values()) {
            let t = Compilation.glsl_type(type);
            params.push(glsl.InParam(t, name));
        }
        for (const {type, name} of this.graph.global_outputs.values()) {
            let t = Compilation.glsl_type(type);
            params.push(glsl.OutParam(t, name));
        }
        if (this.context !== null) {
            for (const {type, name} of this.context.inputs) {
                const t = Compilation.glsl_type(type);
                params.push(glsl.InParam(t, name));
            }
            for (const {type, name} of this.context.outputs) {
                const t = Compilation.glsl_type(type);
                params.push(glsl.OutParam(t, name));
            }
        }
        const requirements = [];

        for (const [module, ident] of this.requirements.entries()) {
            requirements.push(glsl.Pragma('glslify',
                glsl.BinOp(
                    glsl.Ident(ident),
                    '=',
                    glsl.FunctionCall('require', [glsl.String(module)])
                )
            ));
        }

        return {
            source: glsl.FunctionDecl('void', this.ident(), params, this.out),
            uniforms: this.uniforms,
            requirements,
        };
    }

    uniform(t, name, getValue) {
        const type = Compilation.glsl_type(t);
        this.uniforms.push({type, name, getValue});
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

    default_name(node, slot) {
        const { name } = node.input_info[slot];
        if (node.vm.defaults[name] === undefined || node.vm.defaults[name] == null) {
            return undefined;
        }
        return `default_${node.id}_${name}`;
    }

    default_value(node, slot) {
        const name = this.default_name(node, slot);
        if (name === undefined)
            return undefined;
        return glsl.Ident(name);
    }


    getGlobalInput(name) {
        return glsl.Ident(name);
    }

    setGlobalOutput(name, expr) {
        this.out.push(glsl.BinOp(glsl.Ident(name), '=', expr));
    }

    getInputAndInferType(node, slot, default_type=undefined) {
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
            if (!decl_type) {
                decl_type = outgoing_type;
            }
            if (!decl_type) {
                decl_type = default_type;
            }
        } else {
            init_expr = this.default_value(node, slot);
        }
        this.declare(decl_type, v_dst, init_expr);

        return {v: v_dst, type: decl_type};
    }

    getInput(node, slot) {
        return this.getInputAndInferType(node, slot).v;
    }

    setOutput(node, slot, val, type) {
        if (!type) {
            type = node.output_info[slot].type;
        }
        this.declare(type, this.output(node, slot), val);
    }
};
