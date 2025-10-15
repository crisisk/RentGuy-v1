import fs from 'node:fs'
import path from 'node:path'

const exactAliases = new Map([
  ['@errors', 'src/errors/index.ts'],
  ['@hooks', 'src/hooks/index.ts'],
  ['@infra/offline-queue', 'warehouse/offline-queue.js'],
  ['@router', 'src/router/index.tsx'],
  ['react-router-dom', 'src/vendor/react-router-dom.tsx'],
  ['zustand', 'src/vendor/zustand.ts'],
  ['zustand/middleware/immer', 'src/vendor/zustand-immer.ts'],
  ['vitest', 'vendor/vitest/index.js'],
  ['axios', 'vendor/axios/index.ts'],
  ['@zxing/browser', 'vendor/zxing/browser.ts'],
  ['@fullcalendar/react', 'vendor/fullcalendar/react.tsx'],
  ['@fullcalendar/daygrid', 'vendor/fullcalendar/daygrid.ts'],
  ['@fullcalendar/timegrid', 'vendor/fullcalendar/timegrid.ts'],
  ['@fullcalendar/interaction', 'vendor/fullcalendar/interaction.ts'],
  ['@fullcalendar/core', 'vendor/fullcalendar/core.ts'],
])

const prefixAliases = [
  ['@application/', 'src/application/'],
  ['@config/', 'src/config/'],
  ['@core/', 'src/core/'],
  ['@domain/', 'src/domain/'],
  ['@hooks/', 'src/hooks/'],
  ['@infra/', 'src/infrastructure/'],
  ['@router/', 'src/router/'],
  ['@stores/', 'src/stores/'],
  ['@rg-types/', 'src/types/'],
  ['@ui/', 'src/ui/'],
]

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']

function resolveWithExtensions(projectRoot, target) {
  const absolute = path.resolve(projectRoot, target)
  if (fs.existsSync(absolute)) {
    const stat = fs.statSync(absolute)
    if (stat.isDirectory()) {
      for (const extension of extensions) {
        const candidate = path.join(absolute, `index${extension}`)
        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
      return absolute
    }
    return absolute
  }
  for (const extension of extensions) {
    const candidate = `${absolute}${extension}`
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return absolute
}

export function createAliasPlugin(projectRoot) {
  return {
    name: 'rentguy-alias',
    setup(build) {
      build.onResolve({ filter: /^[^./].*/ }, args => {
        const specifier = args.path
        if (exactAliases.has(specifier)) {
          const target = exactAliases.get(specifier)
          return { path: resolveWithExtensions(projectRoot, target) }
        }

        for (const [prefix, target] of prefixAliases) {
          if (specifier.startsWith(prefix)) {
            const suffix = specifier.slice(prefix.length)
            return { path: resolveWithExtensions(projectRoot, `${target}${suffix}`) }
          }
        }

        return undefined
      })
    },
  }
}
