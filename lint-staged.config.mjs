export default {
  '**/*.{js,jsx,ts,tsx}': ['eslint --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '**/*.{mjs,cjs,json,md,yml,yaml}': ['prettier --write'],
}
