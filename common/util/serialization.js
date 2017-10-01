const tags = {};

export function addSerializableType(tag, constructor) {
    tags[tag] = constructor;

    constructor.toJSON = function() {
        return {'_tag': tag};
    };

    constructor.prototype.toJSON = function() {
        return {'_tag': tag, value: this.serialize()};
    };
}

function reviver(key, val) {
    if (val instanceof Object && val._tag) {
        if (val.value !== undefined) {
            return tags[val._tag].deserialize(val.value);
        } else {
            return tags[val._tag];
        }
    } else {
        return val;
    }
}

export function save(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function restore(obj) {
    if (null == obj || 'object' != typeof obj) return obj;
    let ret = {};
    if (obj instanceof Array) {
        ret = obj.map(restore);
    } else {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let val = obj[key];

                if (val instanceof Object)
                    val = restore(val);

                let result = reviver(key, val);

                ret[key] = result;
            }
        }
    }
    return ret;
}

