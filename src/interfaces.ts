import { Instruction, Replication } from './worldql-fb/index.js'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Record {
  uuid: string
  position: Vector3
  worldName: string
  data?: string
  flex?: Uint8Array
}

export interface Entity {
  uuid: string
  position: Vector3
  worldName: string
  data?: string
  flex?: Uint8Array
}

export interface Message {
  instruction: Instruction
  parameter?: string
  worldName: string
  replication: Replication
  records?: Record[]
  entities?: Entity[]
  position?: Vector3
  flex?: Uint8Array
}

export interface IncomingMessage extends Message {
  senderUuid: string
}
