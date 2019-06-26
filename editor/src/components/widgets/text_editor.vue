<template>
  <div class="text-editor-container">
    <div id="ace-editor" ref="editor"></div>
  </div>
</template>

<script>
import yaml from 'js-yaml';
import * as ace from 'ace-builds/src-noconflict/ace';
import 'ace-builds/webpack-resolver';

export default {
  name: 'text-editor',
  props: {
    value: {
      type: [String, Object],
      default: '',
    },
    format: {
      type: String,
      default: 'json',
    },
  },

  mounted() {
    let stringValue;
    if (typeof this.value === 'object') {
      if (this.format === 'json')
        stringValue = JSON.stringify(this.value, null, 2);
      else if (this.format === 'yaml')
        stringValue = yaml.safeDump(this.value);
    } else {
      stringValue = this.value;
    }
    //const JSONMode = ace.require('ace/mode/javascript').Mode;
    this.editor = ace.edit(this.$refs.editor.id);
    this.editor.setTheme('ace/theme/monokai');
    this.editor.session.setMode(`ace/mode/${this.format}`);
    this.editor.session.setValue(stringValue);

    this.editor.on('change', this.onChange);
  },

  methods: {
    onChange(event) {
      this.$emit('input', this.editor.getValue());
      const parsedObject = this.getParsed();
      if (parsedObject)
        this.$emit('parsed', parsedObject);
    },

    /**
     * Retrieve the current text contents from the editor and convert to a js object.
     */
    getParsed() {
      const raw = this.editor.getValue();
      let parsed;

      if (this.format === 'json') {
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          parsed = null;
        }
        return parsed;

      } else if (this.format === 'yaml') {
        try {
          parsed = yaml.safeLoad(this.editor.getValue());
          this.editor.session.clearAnnotations();
        } catch (err) {
          if (err.mark) {
            this.editor.session.setAnnotations([{
              row: err.mark.line,
              column: err.mark.column,
              text: err.reason,
              type: 'error'
            }]);
          }
          parsed = null;
        }
        return parsed;

      } else {
        return raw;
      }
    }

  }
};
</script>

<style scoped lang="scss">
#ace-editor {
  position: relative;
  width: 100%;
  height: 100%;
}

.text-editor-container {
  width: 100%;
  height: 100%;
}
</style>
