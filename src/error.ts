import { type Error as ErrorInterface } from './types/clientBound.js'

export class ClientError extends Error {
  public readonly code: number

  constructor(error: ErrorInterface) {
    super(error.message)
    this.code = error.code
  }
}
