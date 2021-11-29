import { Instruction, Replication } from './worldql-fb/index.js'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export type Vector3Tuple = [x: number, y: number, z: number]
export type Vector3Arg = Vector3 | Vector3Tuple

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
  position?: Vector3Arg
  flex?: Uint8Array
}

export interface IncomingMessage extends Message {
  senderUuid: string
  position?: Vector3
}
