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

async function copyPublicFolder() {
  const publicDir = path.resolve(projectRoot, 'public')

  try {
    const publicExists = await fs.access(publicDir).then(() => true).catch(() => false)
    if (!publicExists) {
      console.log('No public folder found, skipping copy')
      return
    }

    const items = await fs.readdir(publicDir, { withFileTypes: true })

    for (const item of items) {
      const srcPath = path.join(publicDir, item.name)
      const destPath = path.join(outputDir, item.name)

      if (item.isDirectory()) {
        await fs.cp(srcPath, destPath, { recursive: true })
        // Fix permissions for directories (755)
        await fs.chmod(destPath, 0o755)
      } else {
        await fs.copyFile(srcPath, destPath)
        // Fix permissions for files (644)
        await fs.chmod(destPath, 0o644)
      }
    }

    // Recursively fix permissions for nested items
    const fixNestedPermissions = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await fs.chmod(fullPath, 0o755)
          await fixNestedPermissions(fullPath)
        } else {
          await fs.chmod(fullPath, 0o644)
        }
      }
    }

    for (const item of items) {
      if (item.isDirectory()) {
        await fixNestedPermissions(path.join(outputDir, item.name))
      }
    }

    console.log(`✓ Copied public folder to dist/ with correct permissions`)
  } catch (error) {
    console.error('Error copying public folder:', error)
  }
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
  await copyPublicFolder()

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
