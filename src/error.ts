import { type Error as ErrorInterface } from './types/clientBound.js'

export const errorSymbol = Symbol('ClientError')
// @ts-expect-error Type Predicate
export const isClientError: (
  error: unknown
) => error is ClientError = error => {
  // Check primitive types
  if (error === undefined) return false
  if (error === null) return false
  if (typeof error !== 'object') return false

  // Check it inherits Error
  if (!(error instanceof Error)) return false
  if (!(error instanceof ClientError)) return false

  // Check symbol exists
  return error[errorSymbol]
}

export class ClientError extends Error {
  public readonly code: number

  public get [errorSymbol]() {
    return true
  }

  constructor(error: ErrorInterface) {
    super(error.message)
    this.code = error.code
  }
}
