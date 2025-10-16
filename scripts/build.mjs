import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createAliasPlugin } from './lib/esbuild-alias-plugin.mjs'
import { createClientEnv, createEsbuildDefine } from './lib/env-utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(__filename), '..')
const outputDir = path.resolve(projectRoot, 'dist')
const assetsDir = path.join(outputDir, 'assets')
const indexHtmlPath = path.resolve(projectRoot, 'index.html')

const requireFromRoot = createRequire(path.resolve(projectRoot, 'package.json'))
const esbuild = requireFromRoot('esbuild')

async function ensureOutputDirs() {
  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(assetsDir, { recursive: true })
}

async function writeIndexHtml() {
  const template = await fs.readFile(indexHtmlPath, 'utf8')
  const rewritten = template.replace('/src/main.tsx', '/assets/main.js')
  await fs.writeFile(path.join(outputDir, 'index.html'), rewritten, 'utf8')
}

async function build() {
  await ensureOutputDirs()

  const define = createEsbuildDefine('production')
  const aliasPlugin = createAliasPlugin(projectRoot)
  const entry = path.resolve(projectRoot, 'src/main.tsx')

  const buildResult = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    splitting: true,
    sourcemap: true,
    target: ['es2022'],
    jsx: 'automatic',
    outdir: assetsDir,
    absWorkingDir: projectRoot,
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    nodePaths: [path.resolve(projectRoot, 'node_modules')],
    plugins: [aliasPlugin],
    define,
    logLevel: 'info',
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.js': 'js',
      '.jsx': 'jsx',
    },
    metafile: true,
    minify: false,
    treeShaking: true,
  })

  await writeIndexHtml()

  const clientEnv = createClientEnv('production')
  const manifest = {
    entry: 'assets/main.js',
    environment: clientEnv,
    outputs: Object.keys(buildResult.metafile?.outputs ?? {}),
  }
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
}

build().catch(error => {
  console.error('Build failed:', error)
  process.exitCode = 1
})
