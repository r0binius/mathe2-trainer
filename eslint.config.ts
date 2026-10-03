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
  group: ['vue', 'vue-router', 'pinia'],
  message: 'The domain is framework-free. Pass data in, or move this code to the shell.',
};

const namedExportsOnly = { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' };

// Fixtures (`*.fixture.*`) are test data and may import test tools; production code never uses them.
const noFixtureImports = {
  selector: 'ImportDeclaration[source.value=/\\.fixture(\\.\\w+)?$/]',
  message: 'Only tests import fixtures.',
};

const domainImports = [
  frameworkImports,
  {
    group: ['@/*', '!@/domain', '!@/domain/**'],
    message: 'The domain depends on nothing outside src/domain.',
  },
];

const config: ReturnType<typeof withVueTs> = withVueTs(
  globalIgnores(['dist/**']),

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
      // Typed props say when one is optional, and an absent one is `undefined`, which the
      // types make every use handle. A default would only restate that.
      'vue/require-default-prop': 'off',
    },
  },

  {
    name: 'mouseless/modules',
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', namedExportsOnly, noFixtureImports],
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
    name: 'mouseless/boundaries-domain',
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...domainImports,
            {
              group: ['ts-fsrs'],
              message: 'Only domain/scheduling/fsrs.ts uses ts-fsrs. Use the Scheduler port.',
            },
          ],
        },
      ],
    },
  },

  {
    // The adapter behind the Scheduler port. Rule options replace rather than merge, so this
    // repeats the domain's other restrictions.
    name: 'mouseless/boundaries-fsrs',
    files: ['src/domain/scheduling/fsrs.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: domainImports }],
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
      // Rule options replace rather than merge: this keeps named exports and allows fixtures.
      'no-restricted-syntax': ['error', namedExportsOnly],
    },
  },

  skipFormatting,
);

export default config;
