module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'google',
  globals: {
    __static: true
  },
  plugins: [
    'html',
    'import'
  ],
  'import/extensions': [
    '.js',
    '.vue'
  ],
  'rules': {
    'global-require': 0,
    'import/no-unresolved': 0,
    'import/newline-after-import': 0,
    'import/default': 2,
    'import/no-named-as-default': 2,
    'import/first': 1,
    'import/no-duplicates': 1,
    'import/newline-after-import': 1,
    'no-multi-assign': 0,
    'no-param-reassign': 0,
    'no-shadow': 2,
    'one-var': 0,
    'no-unused-vars': [1, {args: 'none', vars: 'local' }],
    'guard-for-in': 0,
    'new-cap': [1, {capIsNew: false}],
    'max-len': [1, {
      code: 100,
      tabWidth: 4,
      ignoreUrls: true,
      ignorePattern: '^import .*',
    }],
    'no-tabs': 1,
    'no-mixed-spaces-and-tabs': 1,
    'object-curly-spacing': 0,
    // 'curly': [1, 'multi', 'consistent'],
    'curly': 0,
    'brace-style': [1, '1tbs', {allowSingleLine: true}],
    'comma-dangle': 0,
    'require-jsdoc': 0,
    'camelcase': 0,
    'padded-blocks': 0,
    'no-trailing-spaces': 1,
    'spaced-comment': [1, 'always', {exceptions: ['/', '*', '+', '@']}],
    'no-multi-spaces': 0,
    'quote-props': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
