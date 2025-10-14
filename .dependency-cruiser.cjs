module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Disallow circular dependencies for maintainability.',
      severity: 'warn',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-src-outside',
      comment: 'Prevent modules in src from importing files outside allowed aliases.',
      severity: 'warn',
      from: {
        path: '^src',
      },
      to: {
        pathNot: '^(src|node_modules|@core|@domain|@infra|@ui)',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
}
