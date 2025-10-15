import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createAliasPlugin } from './lib/esbuild-alias-plugin.mjs'
import { createEsbuildDefine } from './lib/env-utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(__filename), '..')
const testsRoot = path.resolve(projectRoot, 'src')

const requireFromFrontend = createRequire(path.resolve(projectRoot, 'rentguy/frontend/package.json'))
const esbuild = requireFromFrontend('esbuild')

async function collectTestFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue
    }
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        continue
      }
      files.push(...(await collectTestFiles(fullPath)))
    } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/u.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function logResult(result) {
  if (result.status === 'passed') {
    console.log(`  ✓ ${result.title}`)
  } else {
    console.log(`  ✗ ${result.title}`)
    if (result.error) {
      if (result.error instanceof Error) {
        console.log(`    ${result.error.message}`)
        if (result.error.stack) {
          const stackLines = result.error.stack.split('\n').slice(1)
          stackLines.forEach(line => console.log(`    ${line.trim()}`))
        }
      } else {
        console.log(`    ${String(result.error)}`)
      }
    }
  }
}

async function runTestFile(filePath, aliasPlugin) {
  globalThis.__vitestRuntime = undefined

  const define = createEsbuildDefine('test')
  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: 'inline',
    target: ['es2022'],
    write: false,
    absWorkingDir: projectRoot,
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    nodePaths: [path.resolve(projectRoot, 'rentguy/frontend/node_modules')],
    plugins: [aliasPlugin],
    define,
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.js': 'js',
      '.jsx': 'jsx',
    },
    logLevel: 'silent',
  })

  const output = result.outputFiles.find(file => file.path.endsWith('.js')) ?? result.outputFiles[0]
  if (!output) {
    throw new Error(`No compiled output generated for ${filePath}`)
  }

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.text, 'utf8').toString('base64')}`
  await import(moduleUrl)

  const runtime = globalThis.__vitestRuntime
  if (!runtime) {
    throw new Error('Vitest runtime did not initialise correctly')
  }

  const summary = await runtime.run()
  return summary.tests
}

async function main() {
  const aliasPlugin = createAliasPlugin(projectRoot)
  const testFiles = await collectTestFiles(testsRoot)

  if (testFiles.length === 0) {
    console.log('No test files found.')
    return
  }

  console.log(`Running ${testFiles.length} test file${testFiles.length === 1 ? '' : 's'}...`)
  let total = 0
  let failed = 0

  for (const file of testFiles) {
    const relative = path.relative(projectRoot, file)
    console.log(`\n${relative}`)
    try {
      const results = await runTestFile(file, aliasPlugin)
      for (const result of results) {
        total += 1
        logResult(result)
        if (result.status === 'failed') {
          failed += 1
        }
      }
    } catch (error) {
      failed += 1
      console.log(`  ✗ Failed to execute ${relative}`)
      console.log(`    ${(error instanceof Error ? error.message : String(error))}`)
    }
  }

  if (failed > 0) {
    console.log(`\n${failed} of ${total} tests failed.`)
    process.exitCode = 1
  } else {
    console.log(`\nAll ${total} tests passed.`)
  }
}

main().catch(error => {
  console.error('Test runner crashed:', error)
  process.exitCode = 1
})
