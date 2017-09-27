let _saveFields = null;

export function registerSaveField(field, fn) {
    if (_saveFields === null)
        _saveFields = new Map();
    _saveFields.set(field, fn);
}

export function getSaveField(field) {
    return _saveFields.get(field);
}

export function createSaveObject() {
    let out = {};
    for ([field, fn] of _saveFields) {
        out[field] = fn();
    }
    return out;
}
