export default {
  '**/*.{js,jsx,ts,tsx}': [
    'eslint --max-warnings=0',
    'prettier --write'
  ],
  '**/*.{mjs,cjs,json,md,yml,yaml}': ['prettier --write']
}
