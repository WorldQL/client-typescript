import { type Replication, type Uuid, type Vector3 } from './common.js'

export interface ServerMessage {
  sender: Uuid
  token: string
  payload: ServerMessagePayload
}

export type ServerMessagePayload =
  | HandshakeRequest
  | HeartbeatRequest
  | GlobalMessageRequest
  | LocalMessageRequest
  | WorldSubscribe
  | WorldUnsubscribe
  | AreaSubscribe
  | AreaUnsubscribe
  | RecordGet
  | RecordSet
  | RecordDelete
  | RecordClear

export interface HandshakeRequest {
  request: 'handshake'
  server_auth?: string
}

export interface HeartbeatRequest {
  request: 'heartbeat'
  no_once?: string
}

export interface GlobalMessageRequest {
  request: 'global_message'
  world_name: string
  replication: Replication
  data: Uint8Array
}

export interface LocalMessageRequest {
  request: 'local_message'
  world_name: string
  position: Vector3
  replication: Replication
  data: Uint8Array
}

export interface WorldSubscribe {
  request: 'world_subscribe'
  world_name: string
}

export interface WorldUnsubscribe {
  request: 'world_unsubscribe'
  world_name: string
}

export interface AreaSubscribe {
  request: 'area_subscribe'
  world_name: string
  position: Vector3
}

export interface AreaUnsubscribe {
  request: 'area_unsubscribe'
  world_name: string
  position: Vector3
}

export interface RecordGet {
  request: 'record_get'
  // TODO
}

export interface RecordSet {
  request: 'record_set'
  // TODO
}

export interface RecordDelete {
  request: 'record_delete'
  // TODO
}

export interface RecordClear {
  request: 'record_clear'
  // TODO
}
