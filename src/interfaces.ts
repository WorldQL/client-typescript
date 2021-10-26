export interface Vec3d {
  x: number
  y: number
  z: number
}

export interface Record {
  uuid: string
  position: Vec3d
  worldName: string
  data?: string
  flex?: Uint8Array
}

export interface Entity {
  uuid: string
  position: Vec3d
  worldName: string
  data?: string
  flex?: Uint8Array
}

export interface Message {
  instruction: string
  worldName: string
  data?: string
  records?: Record[]
  entities?: Entity[]
  position?: Vec3d
  flex?: Uint8Array
}
