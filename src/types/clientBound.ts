import { type Uuid, type Vector3 } from './common.js'

export type ClientMessage = ClientMessageReply | ClientMessageEvent

export interface Error {
  code: number
  message: string
}

export type Status<T extends { reply: string }> =
  | ({ status: 'ok' } & T)
  | ({ status: 'error' } & Error & ClientMessageReplyCommon & Pick<T, 'reply'>)

// #region Reply
export type ClientMessageReply =
  | Status<HandshakeReply>
  | HeartbeatReply
  | Status<WorldSubscribeReply>
  | Status<WorldUnsubscribeReply>
  | Status<AreaSubscribeReply>
  | Status<AreaUnsubscribeReply>
  | Status<RecordGetReply>
  | Status<RecordSetReply>
  | Status<RecordDeleteReply>
  | Status<RecordClearReply>

interface ClientMessageReplyCommon {
  type: 'reply'
}

export interface HandshakeReply extends ClientMessageReplyCommon {
  reply: 'handshake'
  auth_token: string
}

export interface HeartbeatReply extends ClientMessageReplyCommon {
  reply: 'heartbeat'
  no_once?: string
}

export interface WorldSubscribeReply extends ClientMessageReplyCommon {
  reply: 'world_subscribe'
  updated: boolean
}

export interface WorldUnsubscribeReply extends ClientMessageReplyCommon {
  reply: 'world_unsubscribe'
  updated: boolean
}

export interface AreaSubscribeReply extends ClientMessageReplyCommon {
  reply: 'area_subscribe'
  updated: boolean
}

export interface AreaUnsubscribeReply extends ClientMessageReplyCommon {
  reply: 'area_unsubscribe'
  updated: boolean
}

export interface RecordGetReply extends ClientMessageReplyCommon {
  reply: 'record_get'
  // TODO
}

export interface RecordSetReply extends ClientMessageReplyCommon {
  reply: 'record_set'
  // TODO
}

export interface RecordDeleteReply extends ClientMessageReplyCommon {
  reply: 'record_delete'
  // TODO
}

export interface RecordClearReply extends ClientMessageReplyCommon {
  reply: 'record_clear'
  // TODO
}
// #endregion

// #region Event
export type ClientMessageEvent =
  | SystemMessageEvent
  | PeerConnectEvent
  | PeerDisconnectEvent
  | GlobalMessageEvent
  | LocalMessageEvent

interface ClientMessageEventCommon {
  type: 'event'
}

// #region System Message
interface SystemMessageEventCommon extends ClientMessageEventCommon {
  event: 'system_message'
}

export interface SystemMessageEventUnknownError
  extends SystemMessageEventCommon {
  message: 'unknown_error'
  // TODO
}

export interface SystemMessageEventDisconnect extends SystemMessageEventCommon {
  message: 'disconnect'
  reason: string
}

export type SystemMessageEvent =
  | SystemMessageEventUnknownError
  | SystemMessageEventDisconnect
// #endregion

export interface PeerConnectEvent extends ClientMessageEventCommon {
  event: 'peer_connect'
  uuid: Uuid
}

export interface PeerDisconnectEvent extends ClientMessageEventCommon {
  event: 'peer_disconnect'
  uuid: Uuid
}

export interface GlobalMessageEvent extends ClientMessageEventCommon {
  event: 'global_message'
  sender: Uuid
  world_name: string
  data: Uint8Array
}

export interface LocalMessageEvent extends ClientMessageEventCommon {
  event: 'local_message'
  sender: Uuid
  world_name: string
  position: Vector3
  data: Uint8Array
}
// #endregion
