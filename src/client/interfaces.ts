import type {
  IncomingMessage,
  Message,
  Record,
  Vector3,
} from '../interfaces.js'

// #region Events
// eslint-disable-next-line @typescript-eslint/ban-types
type NoArgs = []

type LocalMessageEventArgs = [
  senderUuid: string,
  worldName: string,
  position: Readonly<Vector3>,
  payload: Readonly<MessagePayload>
]

type GlobalMessageEventArgs = [
  senderUuid: string,
  worldName: string,
  payload: Readonly<MessagePayload>
]

export interface ClientEvents {
  ready: NoArgs
  disconnect: NoArgs
  error: [error: Error]
  rawMessage: [message: Readonly<IncomingMessage>]

  peerConnect: [uuid: string]
  peerDisconnect: [uuid: string]
  localMessage: LocalMessageEventArgs
  globalMessage: GlobalMessageEventArgs
  recordReply: [worldName: string, records: ReadonlyArray<Readonly<Record>>]
}
// #endregion

export interface MessagePayload {
  parameter?: Message['parameter']
  flex?: Message['flex']
  records?: Message['records']
  entities?: Message['entities']
}
