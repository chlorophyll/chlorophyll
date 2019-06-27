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

  data() {
    return {
      modified: false
    }
  }

  mounted() {
    this.editor = ace.edit(this.$refs.editor.id);
    this.editor.setTheme('ace/theme/monokai');
    this.editor.session.setMode(`ace/mode/${this.format}`);
    this.editor.session.setValue(this.stringValue);

    this.editor.on('change', this.onChange);
    this.editor.on('blur', this.onBlur);
  },

  watch: {
    value() {
      if (!this.editor)
        return;

      // Don't overwrite the user's view of the data if they're currently editing.
      if (this.editor.isFocused() && this.modified)
        return;

      this.editor.session.setValue(this.stringValue);
    }
  },

  computed: {
    stringValue() {
      if (typeof this.value === 'string')
        return this.value;

      if (this.format === 'yaml')
        return yaml.safeDump(this.value);

      return JSON.stringify(this.value, null, 2);
    }
  }

  methods: {
    onChange(event) {
      this.modified = true;
      this.$emit('input', this.editor.getValue());
      const parsedObject = this.getParsed();
      if (parsedObject)
        this.$emit('parsed', parsedObject);
    },

    onBlur(event) {
      this.editor.session.setValue(this.stringValue);
      this.modified = false;
    },

    /**
     * Retrieve the current text contents from the editor and convert to a js object.
     * This isn't a computed property because the editor's state is not reactive.
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
      }

      if (this.format === 'yaml') {
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
      }

      return raw;
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
