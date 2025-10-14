#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const VERSION = 1

const GATES = {
  typeSafety: 95,
  errorHandling: 95,
  codeReusability: 95,
  maintainability: 95,
  documentation: 95,
  coverage: {
    lines: 90,
    branches: 90,
    functions: 90,
    statements: 90,
  },
}

const METRIC_LABELS = {
  typeSafety: 'Type Safety',
  errorHandling: 'Error Handling',
  codeReusability: 'Code Reusability',
  maintainability: 'Maintainability',
  documentation: 'Documentation',
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'vendor',
  'migrations',
  '__pycache__',
  '.husky',
])

const readJsonIfExists = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[quality-report] Unable to read ${filePath}:`, error.message)
    }
    return undefined
  }
}

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

const countLines = (content) => {
  if (!content) {
    return 0
  }
  return content.split(/\r?\n/).filter(Boolean).length
}

const clamp01 = (value) => Math.max(0, Math.min(1, value))

const sum = (values) => values.reduce((total, value) => total + value, 0)

const collectFiles = async (baseDir, extensions) => {
  const results = []

  const walk = async (currentDir) => {
    let dirEntries = []
    try {
      dirEntries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return
      }
      throw error
    }

    for (const entry of dirEntries) {
      if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
        continue
      }

      const absolutePath = path.join(currentDir, entry.name)
      const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/')

      if (entry.isDirectory()) {
        await walk(absolutePath)
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(relativePath)
      }
    }
  }

  await walk(path.join(repoRoot, baseDir))
  return results
}

const readFiles = async (files) => {
  const contents = await Promise.all(
    files.map(async (relative) => {
      const absolute = path.join(repoRoot, relative)
      const content = await fs.readFile(absolute, 'utf8')
      return { relative, content }
    }),
  )
  return contents
}

const computeTypeSafety = async () => {
  const tsFiles = await collectFiles('src', ['.ts', '.tsx'])
  const jsFiles = await collectFiles('src', ['.js', '.jsx'])

  const legacyCandidates = ['App.jsx', 'Login.jsx', 'Planner.jsx', 'OnboardingOverlay.jsx', 'RoleSelection.jsx', 'TipBanner.jsx']
  const legacyJsx = (
    await Promise.all(
      legacyCandidates.map(async (file) => {
        const exists = await fileExists(path.join(repoRoot, file))
        return exists ? file : null
      }),
    )
  ).filter(Boolean)

  const tsContents = await readFiles(tsFiles)
  const jsContents = await readFiles([...jsFiles, ...legacyJsx])

  const tsLines = sum(tsContents.map(({ content }) => countLines(content)))
  const jsLines = sum(jsContents.map(({ content }) => countLines(content)))

  const ratio = clamp01(tsLines / Math.max(tsLines + jsLines, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    details: {
      tsFiles: tsFiles.length,
      jsFiles: jsFiles.length,
      tsLines,
      jsLines,
      ratio: Number(ratio.toFixed(4)),
    },
    evidence: [
      `TypeScript LOC: ${tsLines}`,
      `JavaScript LOC: ${jsLines}`,
      `TypeScript coverage ratio: ${(ratio * 100).toFixed(2)}%`,
    ],
  }
}

const computeErrorHandling = async () => {
  const frontendFiles = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
  ]

  const backendFiles = await collectFiles('backend/app', ['.py'])

  const legacyFrontendCandidates = ['App.jsx', 'Scanner.tsx', 'Scanner.jsx', 'scanner.jsx']
  const legacyFrontend = (
    await Promise.all(
      legacyFrontendCandidates.map(async (file) => {
        const exists = await fileExists(path.join(repoRoot, file))
        return exists ? file : null
      }),
    )
  ).filter(Boolean)

  const files = [...frontendFiles, ...backendFiles, ...legacyFrontend]
  const contents = await readFiles(files)

  let riskEvents = 0
  let handledEvents = 0

  const riskPatterns = [/throw\s+new/gi, /throw\s+[^(]/gi, /raise\s+/gi]
  const handlerPatterns = [/catch\s*\(/gi, /try\s*[{:]/gi, /except\s+/gi, /AppError/gi, /Result\.fail/gi]

  for (const { content } of contents) {
    for (const pattern of riskPatterns) {
      riskEvents += (content.match(pattern) || []).length
    }
    for (const pattern of handlerPatterns) {
      handledEvents += (content.match(pattern) || []).length
    }
  }

  const ratio = clamp01(handledEvents / Math.max(riskEvents || handledEvents, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    details: {
      filesAnalysed: files.length,
      riskEvents,
      handledEvents,
    },
    evidence: [
      `Potential risk events identified: ${riskEvents}`,
      `Handling constructs detected: ${handledEvents}`,
    ],
  }
}

const computeCodeReusability = async () => {
  const reusableFiles = [
    ...(await collectFiles('src/core', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/domain', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/infrastructure', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/ui', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app/core', ['.py'])),
    ...(await collectFiles('backend/app/modules', ['.py'])),
  ]
  const allFiles = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app', ['.py'])),
  ]

  const ratio = clamp01(reusableFiles.length / Math.max(allFiles.length, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    details: {
      reusableFiles: reusableFiles.length,
      totalFiles: allFiles.length,
    },
    evidence: [
      `Reusable files analysed: ${reusableFiles.length}`,
      `Total code files: ${allFiles.length}`,
    ],
  }
}

const computeMaintainability = async () => {
  const files = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app', ['.py'])),
  ]
  const contents = await readFiles(files)

  const lineCounts = contents.map(({ content }) => countLines(content))
  const totalLines = sum(lineCounts)
  const averageLines = lineCounts.length ? totalLines / lineCounts.length : 0
  const maxLines = lineCounts.length ? Math.max(...lineCounts) : 0

  const averagePenalty = Math.max(0, (averageLines - 120) / 400)
  const maxPenalty = Math.max(0, (maxLines - 400) / 400)
  const ratio = clamp01(1 - clamp01((averagePenalty + maxPenalty) / 2))

  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    details: {
      filesAnalysed: files.length,
      averageLines: Number(averageLines.toFixed(2)),
      maxLines,
      totalLines,
    },
    evidence: [
      `Average LOC per file: ${averageLines.toFixed(2)}`,
      `Max LOC single file: ${maxLines}`,
    ],
  }
}

const computeDocumentation = async () => {
  const expectedArtifacts = [
    'docs/GETTING_STARTED.md',
    'docs/ARCHITECTURE.md',
    'docs/QUALITY_GATES.md',
    'docs/api/README.md',
    'docs/RUNBOOKS/README.md',
    'docs/quality-improvement-plan.md',
  ]

  let available = 0
  const missing = []

  for (const artifact of expectedArtifacts) {
    const present = await fileExists(path.join(repoRoot, artifact))
    if (present) {
      available += 1
    } else {
      missing.push(artifact)
    }
  }

  const ratio = clamp01(available / expectedArtifacts.length)

  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    details: {
      available,
      expected: expectedArtifacts.length,
      missing,
    },
    evidence: [
      `Documentation artifacts present: ${available}/${expectedArtifacts.length}`,
      ...(missing.length ? [`Missing: ${missing.join(', ')}`] : ['All mandatory documentation present.']),
    ],
  }
}

const computeTestCoverage = async () => {
  const coveragePath = path.join(repoRoot, 'coverage', 'coverage-summary.json')
  const coverage = await readJsonIfExists(coveragePath)

  if (!coverage) {
    return {
      score: 0,
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
      evidence: ['Coverage summary missing. Run `npm run test` to generate.'],
    }
  }

  const lines = Number((coverage.total?.lines?.pct ?? 0).toFixed(2))
  const functions = Number((coverage.total?.functions?.pct ?? 0).toFixed(2))
  const branches = Number((coverage.total?.branches?.pct ?? 0).toFixed(2))
  const statements = Number((coverage.total?.statements?.pct ?? 0).toFixed(2))

  const average = (lines + functions + branches + statements) / 4 / 100

  return {
    score: Number((average * 100).toFixed(2)),
    lines,
    functions,
    branches,
    statements,
    evidence: [
      `Lines: ${lines.toFixed(2)}%`,
      `Functions: ${functions.toFixed(2)}%`,
      `Branches: ${branches.toFixed(2)}%`,
      `Statements: ${statements.toFixed(2)}%`,
    ],
  }
}

const METRIC_COMPUTERS = {
  typeSafety: computeTypeSafety,
  errorHandling: computeErrorHandling,
  codeReusability: computeCodeReusability,
  maintainability: computeMaintainability,
  documentation: computeDocumentation,
  coverage: computeTestCoverage,
}

const buildSummaryMarkdown = (current, previous) => {
  const header = `# Quality Summary\n\nGenerated at: ${current.generatedAt}\n\n`

  const metricKeys = ['typeSafety', 'errorHandling', 'codeReusability', 'maintainability', 'documentation']

  const tableHeader = '| Metric | Previous | Current | Δ | Gate | Status |\n| --- | --- | --- | --- | --- | --- |\n'

  const rows = metricKeys
    .map((key) => {
      const metric = current.metrics[key]
      const label = METRIC_LABELS[key]
      const gate = GATES[key]
      const previousScore = previous?.metrics?.[key]?.score ?? null
      const delta = previousScore !== null ? (metric.score - previousScore).toFixed(2) : 'n/a'
      const status = metric.score >= gate ? '✅' : '⚠️'
      const previousDisplay = previousScore !== null ? previousScore.toFixed(2) : 'n/a'
      return `| ${label} | ${previousDisplay} | ${metric.score.toFixed(2)} | ${delta} | ${gate} | ${status} |`
    })
    .join('\n')

  const coverage = current.metrics.coverage
  const coverageTable = `\n\n| Coverage Metric | Value | Gate | Status |\n| --- | --- | --- | --- |\n${['lines', 'functions', 'branches', 'statements']
    .map((key) => {
      const value = coverage[key]
      const gate = GATES.coverage[key]
      const status = value >= gate ? '✅' : '⚠️'
      const label = key.charAt(0).toUpperCase() + key.slice(1)
      return `| ${label} | ${value.toFixed(2)} | ${gate.toFixed(2)} | ${status} |`
    })
    .join('\n')}`

  const overallStatus = current.overallQualityIndex >= 95 ? '✅' : '⚠️'
  const overallSection = `\n\n**Overall Quality Index:** ${current.overallQualityIndex.toFixed(2)} (${overallStatus})\n`

  const failingMetrics = metricKeys.filter((key) => current.metrics[key].score < GATES[key])
  const failingCoverage = ['lines', 'functions', 'branches', 'statements'].filter(
    (key) => coverage[key] < GATES.coverage[key],
  )

  const nextActions = [
    ...failingMetrics.map((key) => `- ${METRIC_LABELS[key]} below gate (${current.metrics[key].score.toFixed(2)}%).`),
    ...failingCoverage.map((key) => `- Coverage ${key} below gate (${coverage[key].toFixed(2)}%).`),
  ]

  const nextActionsSection = nextActions.length
    ? `\n## Next Actions\n${nextActions.join('\n')}\n`
    : '\n## Next Actions\n- All tracked metrics meet or exceed gates. Maintain guardrails.\n'

  return `${header}${tableHeader}${rows}${coverageTable}${overallSection}${nextActionsSection}`
}

const main = async () => {
  const previous = await readJsonIfExists(path.join(repoRoot, 'quality-report.json'))
  const metrics = {}

  for (const [key, calculator] of Object.entries(METRIC_COMPUTERS)) {
    // eslint-disable-next-line no-await-in-loop
    metrics[key] = await calculator()
  }

  const qualityMetricKeys = ['typeSafety', 'errorHandling', 'codeReusability', 'maintainability', 'documentation']
  const overallQualityIndex =
    qualityMetricKeys.reduce((total, key) => total + metrics[key].score, 0) / qualityMetricKeys.length

  const report = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    metrics,
    overallQualityIndex: Number(overallQualityIndex.toFixed(2)),
    gates: GATES,
  }

  await fs.writeFile(path.join(repoRoot, 'quality-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await fs.writeFile(
    path.join(repoRoot, 'docs', 'QUALITY_SUMMARY.md'),
    `${buildSummaryMarkdown(report, previous)}\n`,
  )

  console.log('[quality-report] Report generated successfully.')
}

main().catch((error) => {
  console.error('[quality-report] Failed to generate report:', error)
  process.exitCode = 1
})
