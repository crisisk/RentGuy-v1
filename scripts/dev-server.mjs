import fs from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createAliasPlugin } from './lib/esbuild-alias-plugin.mjs'
import { createEsbuildDefine } from './lib/env-utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(__filename), '..')
const outputDir = path.resolve(projectRoot, 'dist')
const assetsDir = path.join(outputDir, 'assets')
const indexHtmlPath = path.resolve(projectRoot, 'index.html')
const port = Number(process.env.PORT ?? 5175)

const requireFromRoot = createRequire(path.resolve(projectRoot, 'package.json'))
const esbuild = requireFromRoot('esbuild')

async function ensureIndexHtml() {
  const template = await fs.readFile(indexHtmlPath, 'utf8')
  const rewritten = template.replace('/src/main.tsx', '/assets/main.js')
  await fs.writeFile(path.join(outputDir, 'index.html'), rewritten, 'utf8')
}

async function prepareOutput() {
  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(assetsDir, { recursive: true })
  await ensureIndexHtml()
}

async function start() {
  await prepareOutput()

  const define = createEsbuildDefine('development')
  const aliasPlugin = createAliasPlugin(projectRoot)
  const entry = path.resolve(projectRoot, 'src/main.tsx')

  const ctx = await esbuild.context({
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
  })

  await ctx.watch()

  const server = await ctx.serve({
    host: '0.0.0.0',
    servedir: outputDir,
    port,
  })

  console.log(`RentGuy dev server running at http://localhost:${server.port}`)

  const watcher = watch(indexHtmlPath, async eventType => {
    if (eventType === 'change') {
      try {
        await ensureIndexHtml()
        console.log('Updated dist/index.html')
      } catch (error) {
        console.warn('Failed to refresh index.html:', error)
      }
    }
  })

  const shutdown = async () => {
    watcher.close()
    await ctx.dispose()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await new Promise(() => {})
}

start().catch(error => {
  console.error('Dev server failed to start:', error)
  process.exitCode = 1
})
