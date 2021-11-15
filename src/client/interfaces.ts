import type { Message } from '../interfaces.js'

export interface MessagePayload {
  parameter?: Message['parameter']
  flex?: Message['flex']
}
