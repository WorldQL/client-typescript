export type ClientMessage = ClientMessageReply | ClientMessageEvent

export interface Error {
  code: number
  message: string
}

export type Status<T> = ({ status: 'ok' } & T) | ({ status: 'error' } & Error)

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
  // TODO
}

export interface HeartbeatReply extends ClientMessageReplyCommon {
  reply: 'heartbeat'
  // TODO
}

export interface WorldSubscribeReply extends ClientMessageReplyCommon {
  reply: 'world_subscribe'
  // TODO
}

export interface WorldUnsubscribeReply extends ClientMessageReplyCommon {
  reply: 'world_unsubscribe'
  // TODO
}

export interface AreaSubscribeReply extends ClientMessageReplyCommon {
  reply: 'area_subscribe'
  // TODO
}

export interface AreaUnsubscribeReply extends ClientMessageReplyCommon {
  reply: 'area_unsubscribe'
  // TODO
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

export interface SystemMessageEvent extends ClientMessageEventCommon {
  event: 'system_message'
  // TODO
}

export interface PeerConnectEvent extends ClientMessageEventCommon {
  event: 'peer_connect'
  // TODO
}

export interface PeerDisconnectEvent extends ClientMessageEventCommon {
  event: 'peer_disconnect'
  // TODO
}

export interface GlobalMessageEvent extends ClientMessageEventCommon {
  event: 'global_message'
  // TODO
}

export interface LocalMessageEvent extends ClientMessageEventCommon {
  event: 'local_message'
  // TODO
}
// #endregion
