module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
  rules: {
    // Vue specific rules
    'vue/multi-word-component-names': 'off', // Allow single-word component names
    'vue/no-mutating-props': 'warn', // Warn about mutating props
    'vue/require-default-prop': 'off', // Don't require default values for props
    
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Allow innerHTML only when using sanitization (custom rule)
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'MemberExpression[property.name="innerHTML"]',
        message: 'Direct innerHTML access detected. Consider using sanitizeHTML() from lib/safeHTML.js instead.'
      }
    ]
  },
  
  // Ignore test files and build output
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    'coverage/'
  ]
}
