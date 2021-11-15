import type { IncomingMessage, Message, Vector3 } from '../interfaces.js'

// #region Events
// eslint-disable-next-line @typescript-eslint/ban-types
type NoArgs = []

type LocalMessageEventArgs = [
  senderUuid: string,
  worldName: string,
  position: Vector3,
  payload: MessagePayload
]

type GlobalMessageEventArgs = [
  senderUuid: string,
  worldName: string,
  payload: MessagePayload
]

export interface ClientEvents {
  ready: NoArgs
  disconnect: NoArgs
  error: [Error]
  rawMessage: [Readonly<IncomingMessage>]

  peerConnect: [uuid: string]
  peerDisconnect: [uuid: string]
  localMessage: LocalMessageEventArgs
  globalMessage: GlobalMessageEventArgs
  recordReply: NoArgs
}
// #endregion

export interface MessagePayload {
  parameter?: Message['parameter']
  flex?: Message['flex']
}
