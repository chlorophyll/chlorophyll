
let _saveFields = null;

export function registerSaveField(field, { save, restore }) {
    if (_saveFields === null)
        _saveFields = new Map();
    _saveFields.set(field, { save, restore });
}

export function getSaveField(field) {
    return _saveFields.get(field);
}

export function createSaveObject() {
    let out = {};
    for ([field, { save }] of _saveFields) {
        out[field] = save();
    }
    return out;
}

export function restoreSaveObject(obj) {
    for ([field, { restore }] of _saveFields) {
        restore(obj[field]);
    }
}
