module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'typescript-eslint-parser',
    sourceType: 'module',
    ecmaVersion: 2017
  },
  env: {
    browser: true,
    node: true,
    'jest/globals': true
  },
  extends: [
    'eslint:recommended',
    'google',
    'plugin:vue/essential'
  ],
  globals: {
    __static: true,
    __schemas: true
  },
  plugins: [
    'html',
    'import',
    'jest'
  ],
  settings: {
    'import/extensions': [
      '.js',
      '.vue'
    ],
  },
  'rules': {
    // Disable some of the more annoying/unneeded default rules from eslint
    'no-console': 0,
    'no-control-regex': 0,
    'no-regex-spaces': 0,
    'no-extra-semi': 0,
    'indent': 0,

    // modules & imports
    'global-require': 0,
    'import/no-unresolved': 0,
    'import/newline-after-import': 0,
    'import/default': 2,
    'import/no-named-as-default': 2,
    'import/first': 1,
    'import/no-duplicates': 1,
    'import/newline-after-import': 1,

    // vue-specfic
    'vue/require-render-return': 0,

    // variables & assignment
    'no-multi-assign': 0,
    'no-param-reassign': 0,
    'no-shadow': 2,
    'one-var': 0,
    'no-unused-vars': [1, {args: 'none', vars: 'local' }],
    'guard-for-in': 0,

    // Naming conventions
    'new-cap': [1, {capIsNew: false}],
    'camelcase': 0,

    // General style, braces, & whitespace
    'max-len': [1, {
      code: 100,
      tabWidth: 4,
      ignoreUrls: true,
      ignorePattern: '^import .*',
    }],
    'no-tabs': 1,
    'no-mixed-spaces-and-tabs': 1,
    'no-multi-spaces': 0,
    'no-trailing-spaces': 1,
    'block-spacing': [1, 'always'],
    'key-spacing': [1, {
      beforeColon: false,
      afterColon: true,
      mode: 'minimum'
    }],
    'curly': 0,
    'brace-style': [1, '1tbs', {allowSingleLine: true}],
    'padded-blocks': 0,
    'comma-dangle': 0,
    'object-curly-spacing': 0,
    'quote-props': 0,
    'arrow-parens': 0,

    // commence
    'require-jsdoc': 0,
    'spaced-comment': [1, 'always', {exceptions: ['/', '*', '+', '@']}],

    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
