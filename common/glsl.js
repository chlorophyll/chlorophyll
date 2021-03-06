export function FunctionDecl(ret_type, name, params, b) {
    let body = Scope(b);
    return {
        type: 'function_decl',
        ret_type,
        name,
        params,
        body,
        no_semicolon: true,
    };
}
export function String(value) {
    return {
        type: 'string',
        value,
    };
}

export function Pragma(name, stmt) {
    return {
        type: 'pragma',
        name,
        stmt,
    };
}

export function IfStmt(expr, body) {
    return {
        type: 'if_stmt',
        expr,
        body: Scope(body),
        no_semicolon: true,
    };
}

export function AssignStmt(lhs, rhs) {
    return {
        type: 'assign_stmt',
        lhs,
        rhs,
    };
}

export function Comment(text) {
    return {
        type: 'comment',
        text,
        no_semicolon: true,
    };
}

export function Const(value) {
    return {
        type: 'const',
        value,
    };
}
export function Bool(value) {
    return {
        type: 'bool',
        value,
    };
}

export function Scope(statements) {
    return {
        type: 'scope',
        statements,
    };
}

export let Root = Scope;

export function BinOp(lhs, operator, rhs) {
    return {
        type: 'binary_op',
        lhs,
        operator,
        rhs,
        parenthesize: true,
    };
}

export function Dot(lhs, fields) {
    return {
        type: 'dot',
        lhs,
        fields
    };
}

export function UnOp(operator, expr) {
    return {
        type: 'unary_op',
        operator,
        expr,
    };
}

export function NoOp() {
    return {type: 'noop'};
}

export function TernaryOp(condition, tbranch, fbranch) {
    return {
        type: 'ternary_op',
        condition,
        tbranch,
        fbranch,
    };
}

export function Ident(name) {
    return {
        type: 'ident',
        name,
    };
}

export function Return(expr) {
    return {
        type: 'return',
        expr,
    };
}

function _VarDecl(qualifier, var_type, n) {
    let name;
    if (typeof(n) == 'string') {
        name = Ident(n);
    } else {
        name = n;
    }

    return {
        type: 'var_decl',
        qualifier,
        var_type,
        name,
    };
}

export function AttributeDecl(type, name) {
    return _VarDecl('attribute', type, name);
}

export function UniformDecl(type, name) {
    return _VarDecl('uniform', type, name);
}

export function VaryingDecl(type, name) {
    return _VarDecl('varying', type, name);
}

export function Variable(type, name) {
    return _VarDecl(undefined, type, name);
}

export function InParam(type, name) {
    return _VarDecl('in', type, name);
}

export function OutParam(type, name) {
    return _VarDecl('out', type, name);
}

export function FunctionCall(name, args) {
    return {
        type: 'function_call',
        name,
        args,
    };
}

let generator = {
    comment(c, node) {
        c.emit('// ');
        c.emit(node.text);
        c.newline();
    },

    function_decl(c, node) {
        c.emit(node.ret_type);
        c.emit(' ');
        c.emit(node.name);
        c.emit('(');
        let first = true;
        for (let param of node.params) {
            if (!first) c.emit(', ');
            c.visit(param);
            first = false;
        }
        c.emit(') {');
        c.indent();
        c.visit(node.body);
        c.dedent();
        c.line('}');
    },

    pragma(c, node) {
        c.emit(`#pragma ${node.name}: `);
        c.visit(node.stmt);
    },

    string(c, node) {
        c.emit(`"${node.value}"`);
    },

    if_stmt(c, node) {
        c.emit('if (');
        c.visit(node.expr);
        c.emit(') {');
        c.indent();
        c.visit(node.body);
        c.dedent();
        c.line('}');
    },

    assign_stmt(c, node) {
        c.visit(node.lhs);
        c.emit(' = ');
        c.visit(node.rhs);
    },

    binary_op(c, node) {
        if (node.lhs.parenthesize) {
            c.emit('(');
        }
        c.visit(node.lhs);
        if (node.lhs.parenthesize) {
            c.emit(')');
        }
        c.emit(` ${node.operator} `);
        if (node.rhs.parenthesize) {
            c.emit('(');
        }
        c.visit(node.rhs);
        if (node.rhs.parenthesize) {
            c.emit(')');
        }
    },

    dot(c, node) {
        c.visit(node.lhs);
        c.emit('.');
        c.emit(node.fields);
    },

    unary_op(c, node) {
        c.emit(node.operator);
        c.visit(node.expr);
    },

    noop(c, node) {
    },

    var_decl(c, node) {
        if (node.qualifier) {
            c.emit(node.qualifier);
            c.emit(' ');
        }

        c.emit(node.var_type);
        c.emit(' ');
        c.visit(node.name);
    },

    ternary_op(c, node) {
        c.visit(node.condition);
        c.emit(' ? ');
        c.visit(node.tbranch);
        c.emit(' : ');
        c.visit(node.fbranch);
    },

    ident(c, node) {
        c.emit(node.name);
    },

    const(c, node) {
        c.emit(node.value.toPrecision(4));
    },

    bool(c, node) {
        c.emit(node.value ? 'true' : 'false');
    },

    return(c, node) {
        c.emit('return');
        if (node.expr) {
            c.emit(' ');
            c.visit(node.expr);
        }
    },

    function_call(c, node) {
        let first = true;
        c.emit(node.name);
        c.emit('(');
        for (let arg of node.args) {
            if (!first) c.emit(', ');
            c.visit(arg);
            first = false;
        }
        c.emit(')');
    },

    scope(c, node) {
        let first = true;
        for (let stmt of node.statements) {
            if (!first)
                c.newline();

            c.visit(stmt);

            if (!stmt.no_semicolon)
                c.emit(';');

            first = false;
        }
    },
};

export function generate(root) {
    let ilevel = 0;
    let out = [];

    let state = {
        indent() {
            ilevel++;
            this.newline();
        },
        dedent() {
            ilevel--;
            this.newline();
        },

        emit(s) {
            out.push(s);
        },

        line(s='') {
            out.push(s);
            this.newline();
        },

        newline() {
            out.push('\n');
            out.push('    '.repeat(ilevel));
        },

        visit(node) {
            generator[node.type](state, node);
        }
    };

    state.visit(root);
    return out.join('');
}
