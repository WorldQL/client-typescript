import type { IncomingMessage, Message, Vector3 } from '../interfaces.js'

// #region Events
// eslint-disable-next-line @typescript-eslint/ban-types
type NoArgs = readonly []

type LocalMessageEventArgs = readonly [
  senderUuid: string,
  worldName: string,
  position: Readonly<Vector3>,
  payload: Readonly<MessagePayload>
]

type GlobalMessageEventArgs = readonly [
  senderUuid: string,
  worldName: string,
  payload: Readonly<MessagePayload>
]

export interface ClientEvents {
  ready: NoArgs
  disconnect: NoArgs
  error: readonly [Error]
  rawMessage: readonly [Readonly<IncomingMessage>]

  peerConnect: readonly [uuid: string]
  peerDisconnect: readonly [uuid: string]
  localMessage: LocalMessageEventArgs
  globalMessage: GlobalMessageEventArgs
  recordReply: NoArgs
}
// #endregion

export interface MessagePayload {
  parameter?: Message['parameter']
  flex?: Message['flex']
  records?: Message['records']
  entities?: Message['entities']
}
