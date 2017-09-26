import fs from 'fs';
import Ajv from 'ajv';

let file = JSON.parse(fs.readFileSync(__schemas + '/chlorophyll-schema.json', 'utf8'));

let schemas = new Ajv({allErrors: true});

schemas.addSchema(file);

export default schemas;

export const SchemaDefs = {
    object(name) {
        return `chlorophyll#/definitions/objects/${name}`
    },
    type(name) {
        return `chlorophyll#/definitions/types/${name}`
    }
};
