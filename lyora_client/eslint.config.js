import { sharedEslintConfig } from '../lyora_web_shared/eslint.config.js';

export default [
  ...sharedEslintConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Client-specific ESLint overrides if any
    },
  },
];

