import * as assert from 'assert';
import * as T from 'common/types';

const tags = {};

export function addSerializableType(typeConstructor, tag?: string) {
    const tagKey: string = tag ? tag : typeConstructor._tag;
    tags[tagKey] = typeConstructor;
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

    const tag = obj._tag || obj.constructor._tag;
    if (obj.serialize && tag) {
        return {
            _tag: tag,
            value: obj.serialize()
        };
    }

    if (typeof obj !== 'object')
        return obj;

    const ret = {}
    Object.entries(obj).forEach(([key, value]) => {
        ret[key] = save(value);
    });
    
    return JSON.parse(JSON.stringify(ret));
}

export function restore(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object')
        return obj;

    if (Array.isArray(obj))
        return obj.map(restore);

    const ret = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let val = obj[key];

            if (val instanceof Object)
                val = restore(val);

            let result = reviver(key, val);

            ret[key] = result;
        }
    }
    return ret;
}

