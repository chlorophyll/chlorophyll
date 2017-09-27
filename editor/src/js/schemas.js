import fs from 'fs';
import Ajv from 'ajv';

let file = JSON.parse(fs.readFileSync(__schemas + '/chlorophyll-schema.json', 'utf8'));

let schemas = new Ajv({allErrors: true});

schemas.addSchema(file);

export default schemas;

export const SchemaDefs = {
    definition(name) {
        return `chlorophyll#/definitions/${name}`;
    },
    object(name) {
        return SchemaDefs.definition(`objects/${name}`);
    },
    type(name) {
        return SchemaDefs.definition(`types/${name}`);
    }
};
