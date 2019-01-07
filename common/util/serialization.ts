import * as assert from 'assert';
import * as T from '../types';

const tags = {};

export function addSerializableType(typeConstructor) {
    const tag: string = typeConstructor._tag;
    tags[tag] = typeConstructor;
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
    if (!obj)
        return obj;

    if (Array.isArray(obj))
        return obj.map(save);

    if (obj.serialize && obj._tag) {
        return {
            _tag: obj._tag,
            value: obj.serialize()
        };
    }

    const ret = {}
    Object.entries(obj).forEach(([key, value]) => {
        ret[key] = save(value);
    });
    
    return JSON.parse(JSON.stringify(ret));
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

