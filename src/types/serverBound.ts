import {
  type PartialRecord,
  type Record,
  type Replication,
  type Uuid,
  type Vector3,
} from './common.js'

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
  | WorldSubscribeRequest
  | WorldUnsubscribeRequest
  | AreaSubscribeRequest
  | AreaUnsubscribeRequest
  | RecordGetRequest
  | RecordSetRequest
  | RecordDeleteRequest
  | RecordClearRequest

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

export interface WorldSubscribeRequest {
  request: 'world_subscribe'
  world_name: string
}

export interface WorldUnsubscribeRequest {
  request: 'world_unsubscribe'
  world_name: string
}

export interface AreaSubscribeRequest {
  request: 'area_subscribe'
  world_name: string
  position: Vector3
}

export interface AreaUnsubscribeRequest {
  request: 'area_unsubscribe'
  world_name: string
  position: Vector3
}

interface RecordGetRequestCommon {
  request: 'record_get'
}

export interface RecordGetRequestArea extends RecordGetRequestCommon {
  lookup: 'area'
  world_name: string
  position: Vector3
}

export interface RecordGetRequestUuid extends RecordGetRequestCommon {
  lookup: 'uuid'
  records: readonly PartialRecord[]
}

export type RecordGetRequest = RecordGetRequestArea | RecordGetRequestUuid

export interface RecordSetRequest {
  request: 'record_set'
  records: readonly Record[]
}

export interface RecordDeleteRequest {
  request: 'record_delete'
  records: readonly PartialRecord[]
}

export interface RecordClearRequest {
  request: 'record_clear'
  world_name: string
  position?: Vector3
}
