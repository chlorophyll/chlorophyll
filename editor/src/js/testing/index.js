import schemas from 'chl/schemas';

expect.extend({
    toMatchSchema(obj, schema) {
        const validate = schemas.getSchema(schema);
        const pass = validate(obj);
        let message;

        let out = this.utils.printReceived(obj);
        let schematext = this.utils.printExpected(schema);

        if (pass) {
            message = () => `expected:\n\t${out}\nto not match schema\n\t${schematext}\n but it did.`;
        } else {
            const errors = validate.errors;
            const errtext = schemas.errorsText(errors, { separator: '\n\t' });
            message = () => (
                `expected\n\t${out}\nto match schema for\n\t${schematext}\n`+
                `errors:\n\t${errtext}`
            );
        }

        return {
            pass,
            message,
        }

    }

});
