export interface ZodIssue {
  path: Array<string | number>
  message: string
}

export class ZodError extends Error {
  constructor(public issues: ZodIssue[]) {
    super('Invalid input')
    this.name = 'ZodError'
  }

  format(): Record<string, { _errors: string[] }> {
    const grouped: Record<string, { _errors: string[] }> = {}
    for (const issue of this.issues) {
      const key = issue.path.length ? issue.path.join('.') : '_root'
      if (!grouped[key]) {
        grouped[key] = { _errors: [] }
      }
      grouped[key]._errors.push(issue.message)
    }
    return grouped
  }
}

type ParseResult<T> = { success: true; data: T } | { success: false; issues: ZodIssue[] }

type SafeParseSuccess<T> = { success: true; data: T }
type SafeParseFailure = { success: false; error: ZodError }
export type SafeParseReturnType<T> = SafeParseSuccess<T> | SafeParseFailure

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

export abstract class ZodType<T> {
  abstract _parse(value: unknown, path: Array<string | number>): ParseResult<T>

  parse(value: unknown): T {
    const result = this.safeParse(value)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }

  safeParse(value: unknown): SafeParseReturnType<T> {
    const result = this._parse(value, [])
    if (result.success) {
      return { success: true, data: result.data }
    }
    return { success: false, error: new ZodError(result.issues) }
  }

  optional(): ZodOptional<T> {
    return new ZodOptional(this)
  }
}

class ZodOptional<T> extends ZodType<T | undefined> {
  constructor(private inner: ZodType<T>) {
    super()
  }

  _parse(value: unknown, path: Array<string | number>): ParseResult<T | undefined> {
    if (value === undefined || value === null) {
      return { success: true, data: undefined }
    }
    return this.inner._parse(value, path)
  }
}

type StringValidator = (value: string) => string | null

class ZodString extends ZodType<string> {
  private validators: StringValidator[] = []

  _parse(value: unknown, path: Array<string | number>): ParseResult<string> {
    if (typeof value !== 'string') {
      return { success: false, issues: [{ path, message: 'Expected string' }] }
    }
    for (const validator of this.validators) {
      const error = validator(value)
      if (error) {
        return { success: false, issues: [{ path, message: error }] }
      }
    }
    return { success: true, data: value }
  }

  url(): ZodString {
    this.validators.push(value => {
      try {
        // eslint-disable-next-line no-new
        new URL(value)
        return null
      } catch (error) {
        return 'Invalid URL'
      }
    })
    return this
  }
}

class ZodEnum<T extends string> extends ZodType<T> {
  private readonly options: Set<T>

  constructor(values: readonly T[]) {
    super()
    this.options = new Set(values)
  }

  _parse(value: unknown, path: Array<string | number>): ParseResult<T> {
    if (typeof value !== 'string') {
      return { success: false, issues: [{ path, message: 'Expected string' }] }
    }
    if (!this.options.has(value as T)) {
      return { success: false, issues: [{ path, message: `Expected one of: ${Array.from(this.options).join(', ')}` }] }
    }
    return { success: true, data: value as T }
  }
}

type ObjectShape = Record<string, ZodType<any>>

class ZodObject<Shape extends ObjectShape> extends ZodType<{ [K in keyof Shape]?: ReturnType<Shape[K]['parse']> }> {
  constructor(private readonly shape: Shape) {
    super()
  }

  _parse(value: unknown, path: Array<string | number>): ParseResult<{ [K in keyof Shape]?: ReturnType<Shape[K]['parse']> }> {
    if (!isPlainObject(value)) {
      return { success: false, issues: [{ path, message: 'Expected object' }] }
    }

    const result: Record<string, unknown> = {}
    const issues: ZodIssue[] = []

    for (const key of Object.keys(this.shape) as Array<keyof Shape>) {
      const schema = this.shape[key]!
      const keyName = key as string
      const childValue = (value as Record<string, unknown>)[keyName]
      const childResult = schema._parse(childValue, [...path, keyName])
      if (childResult.success) {
        if (childResult.data !== undefined) {
          result[keyName] = childResult.data
        }
      } else {
        issues.push(...childResult.issues)
      }
    }

    if (issues.length > 0) {
      return { success: false, issues }
    }

    return { success: true, data: result as { [K in keyof Shape]?: ReturnType<Shape[K]['parse']> } }
  }

  strip(): this {
    return this
  }
}

export type ZodInfer<T extends ZodType<any>> = T extends ZodType<infer Output> ? Output : never

export const z = {
  string(): ZodString {
    return new ZodString()
  },
  enum<const T extends [string, ...string[]]>(values: T): ZodEnum<T[number]> {
    return new ZodEnum(values)
  },
  object<Shape extends ObjectShape>(shape: Shape): ZodObject<Shape> {
    return new ZodObject(shape)
  },
}

export namespace z {
  export type infer<T extends ZodType<any>> = ZodInfer<T>
}

export default z
