import { type Uuid } from '../utils/uuid.js'

export { type Uuid } from '../utils/uuid.js'

export type Vector3 = readonly [x: number, y: number, z: number]

export enum Replication {
  ExceptSelf = 'except_self',
  IncludingSelf = 'including_self',
  OnlySelf = 'only_self',
}

export interface PartialRecord {
  uuid: Uuid
  world_name: string
  position: Vector3
}

export interface Record extends PartialRecord {
  data?: Uint8Array
}
