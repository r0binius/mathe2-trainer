import js from '@eslint/js';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript';
import { globalIgnores } from 'eslint/config';
import functional from 'eslint-plugin-functional';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginVue from 'eslint-plugin-vue';

// ESLint checks code quality; Prettier owns formatting. `skipFormatting` (last)
// turns off every rule that would overlap with Prettier.
//
// Functional programming is enforced in two zones:
// - the functional core (`src/domain`): pure functions only, no mutation,
//   no statements with side effects, no exceptions
// - the imperative shell (the rest of `src`): no classes or `this`, no `let`,
//   no mutation except of Vue refs, no loops

const frameworkImports = {
  group: ['vue', 'vue-router', 'pinia', '@tauri-apps/*'],
  message: 'The domain is framework-free. Pass data in, or move this code to the shell.',
};

const config: ReturnType<typeof withVueTs> = withVueTs(
  globalIgnores(['dist/**', 'src-tauri/**']),

  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,

  {
    name: 'mouseless/clean-code',
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      complexity: ['error', 10],
      eqeqeq: 'error',
      'func-style': ['error', 'declaration'],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-nested-ternary': 'error',
      'no-param-reassign': ['error', { props: true }],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',

      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowString: false, allowNumber: false },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: true },
      ],
    },
  },

  {
    name: 'mouseless/vue',
    files: ['src/**/*.vue'],
    rules: {
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-emits-declaration': ['error', 'type-literal'],
      'vue/define-macros-order': 'error',
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/no-required-prop-with-default': 'error',
      'vue/no-root-v-if': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/require-typed-ref': 'error',
    },
  },

  {
    name: 'mouseless/modules',
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },

  {
    ...jsdoc.configs['flat/recommended-tsdoc-error'],
    name: 'mouseless/docs',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/**/*.test.ts'],
    rules: {
      ...jsdoc.configs['flat/recommended-tsdoc-error'].rules,
      // Every export is documented, including types and constants.
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true },
          contexts: ['TSTypeAliasDeclaration', 'VariableDeclaration'],
        },
      ],
      // Types already say most of it: @param and @returns only when they add something.
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  {
    name: 'mouseless/functional-shell',
    files: ['src/**/*.{ts,vue}'],
    plugins: { functional },
    rules: {
      ...functional.configs.lite.rules,
      ...functional.configs.noOtherParadigms.rules,
      'functional/prefer-property-signatures': 'error',
      // Event handlers and lifecycle hooks return nothing by nature.
      'functional/no-return-void': 'off',
      // Writing to a Vue ref is the shell's sanctioned way to change state.
      'functional/immutable-data': ['error', { ignoreAccessorPattern: ['**.value'] }],
    },
  },

  {
    name: 'mouseless/functional-core',
    files: ['src/domain/**/*.ts'],
    rules: {
      ...functional.configs.recommended.rules,
      ...functional.configs.noExceptions.rules,
      'functional/immutable-data': 'error',
      'functional/no-this-expressions': 'error',
    },
  },

  {
    name: 'mouseless/boundaries',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/platform/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tauri-apps/*'],
              message: 'Only src/platform talks to Tauri. Import the platform facade instead.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'mouseless/boundaries-domain',
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            frameworkImports,
            {
              group: ['@/*', '!@/domain', '!@/domain/**'],
              message: 'The domain depends on nothing outside src/domain.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'mouseless/tests',
    files: ['src/**/*.test.ts'],
    rules: {
      // Test frameworks are statement-based: describe/it/expect return nothing useful.
      'functional/functional-parameters': 'off',
      'functional/no-expression-statements': 'off',
      'functional/no-return-void': 'off',
    },
  },

  skipFormatting,
);

export default config;
