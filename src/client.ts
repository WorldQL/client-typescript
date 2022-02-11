import EventEmitter from 'eventemitter3'
import WebSocket from 'isomorphic-ws'
import { type Buffer } from 'node:buffer'
import { ClientError } from './error.js'
import {
  type ClientMessage,
  type ClientMessageEvent,
  type ClientMessageReply,
} from './types/clientBound.js'
import { type Uuid, type Vector3 } from './types/common.js'
import {
  type HandshakeRequest,
  type ServerMessage,
  type ServerMessagePayload,
  type WorldSubscribeRequest,
} from './types/serverBound.js'
import { decode, encode } from './utils/msgpack.js'
import { generateUuid, uuidString } from './utils/uuid.js'

export interface ClientOptions {
  /**
   * WorldQL WebSocket Address
   */
  url: string

  /**
   * Server Auth Token
   */
  auth?: string

  /**
   * Connect to WebSocket automatically
   *
   * Defaults to `false`
   */
  autoconnect?: boolean
}

// #region Events
// eslint-disable-next-line @typescript-eslint/ban-types
type NoArgs = []

interface ClientEvents {
  ready: NoArgs
  error: [error: Error]
  disconnect: [reason: string]

  peerConnect: [uuid: string]
  peerDisconnect: [uuid: string]
  globalMessage: [sender: string, world: string, data: Uint8Array]
  localMessage: [
    sender: string,
    world: string,
    position: Vector3,
    data: Uint8Array
  ]
}
// #endregion

// #region Connection
interface PartialConnection {
  uuid: Uuid
  ws: WebSocket
}

interface Connection extends PartialConnection {
  token: string
}

// @ts-expect-error Type Predicate
const isFullyConnected: (
  connection: Connection | PartialConnection | undefined
) => connection is Connection = connection => {
  if (connection === undefined) return false
  if ('token' in connection) {
    return connection.token !== ''
  }

  return false
}
// #endregion

type SendCallback = (message: ClientMessageReply) => void
type SendQueueItem = readonly [message: ServerMessage, callback: SendCallback]

export class Client extends EventEmitter<ClientEvents> {
  private readonly _options: Readonly<ClientOptions>
  private readonly _sendQueue: SendQueueItem[]

  private _connection: PartialConnection | Connection | undefined
  private _inFlight: SendQueueItem | undefined

  constructor(options: Readonly<ClientOptions>) {
    super()

    this._options = options
    this._sendQueue = []

    if (options.autoconnect) this.connect()
  }

  // #region Public Properties
  /**
   * Whether or not the connection has been established and the handshake completed
   */
  public get connected(): boolean {
    return isFullyConnected(this._connection)
  }

  /**
   * The Client's current UUID
   *
   * Throws an error if read before the client is ready
   */
  public get uuid(): string {
    if (this._connection === undefined) {
      throw new Error('cannot read UUID before the client is ready')
    }

    return uuidString(this._connection.uuid)
  }
  // #endregion

  // #region Lifecycle
  public connect(): void {
    if (this._connection !== undefined) {
      throw new Error('cannot connect if already connected')
    }

    const uuid = generateUuid()
    const ws = new WebSocket(this._options.url)

    const connection: PartialConnection = { uuid, ws }
    this._connection = connection

    ws.addEventListener('error', ({ error }) => {
      this.emit('error', error)
    })

    ws.addEventListener('open', () => {
      this._onOpen()
    })

    ws.addEventListener('message', async ({ data }) => {
      if (typeof data === 'string') return
      if (Array.isArray(data)) return

      const buffer =
        typeof window === 'undefined'
          ? (data as Buffer)
          : await (data as unknown as Blob).arrayBuffer()

      this._onMessage(buffer)
    })
  }

  public disconnect(): void {
    if (this._connection !== undefined) {
      this._connection.ws.close()
    }

    this._connection = undefined
  }
  // #endregion

  // #region Public Methods
  public async worldSubscribe(world: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const payload: WorldSubscribeRequest = {
        request: 'world_subscribe',
        world_name: world,
      }

      this._sendMessage(payload, reply => {
        if (reply.reply !== 'world_subscribe') {
          const message = `invalid reply: expected world_subscribe, got ${reply.reply}`
          reject(new Error(message))

          return
        }

        if (reply.status === 'error') {
          const error = new ClientError(reply)
          reject(error)

          return
        }

        resolve(reply.updated)
      })
    })
  }
  // #endregion

  // #region WebSocket Handlers
  private _onOpen(): void {
    if (this._connection === undefined) {
      throw new Error('_onOpen called with no connection')
    }

    const handshake: HandshakeRequest = {
      request: 'handshake',
      server_auth: this._options.auth,
    }

    const message: ServerMessage = {
      sender: this._connection.uuid,
      token: '',
      payload: handshake,
    }

    const encoded = encode(message)
    this._connection.ws.send(encoded)
  }

  private _onMessage(data: ArrayBuffer): void {
    const decoded = decode(data) as ClientMessage

    switch (decoded.type) {
      case 'event': {
        this._handleEvent(decoded)
        break
      }

      case 'reply': {
        this._handleReply(decoded)
        break
      }

      default:
        console.warn('unhandled message type')
        console.log(decoded)

        break
    }
  }

  private _handleEvent(message: ClientMessageEvent): void {
    if (this._connection === undefined) {
      throw new Error('_handleEvent called with no connection')
    }

    switch (message.event) {
      case 'system_message': {
        if (message.message === 'disconnect') {
          this.emit('disconnect', message.reason)
        } else if (message.message === 'unknown_error') {
          // TODO
        }

        break
      }

      case 'peer_connect': {
        this.emit('peerConnect', uuidString(message.uuid))
        break
      }

      case 'peer_disconnect': {
        this.emit('peerDisconnect', uuidString(message.uuid))
        break
      }

      case 'global_message': {
        this.emit(
          'globalMessage',
          uuidString(message.sender),
          message.world_name,
          message.data
        )

        break
      }

      case 'local_message': {
        this.emit(
          'localMessage',
          uuidString(message.sender),
          message.world_name,
          message.position,
          message.data
        )

        break
      }

      default:
        console.warn('unhandled event type')
        console.log(message)

        break
    }
  }

  private _handleReply(message: ClientMessageReply): void {
    if (this._connection === undefined) {
      throw new Error('_handleReply called with no connection')
    }

    // Handle Handshakes
    if (message.reply === 'handshake') {
      if (message.status === 'error') {
        throw new ClientError(message)
      }

      const connection: Connection = {
        ...this._connection,
        token: message.auth_token,
      }

      this._connection = connection
      this.emit('ready')

      return
    }

    if (this._inFlight === undefined) {
      throw new Error(
        'Client._inFlight is undefined when a reply is being processed'
      )
    }

    // Reset in-flight status
    const [, callback] = this._inFlight
    this._inFlight = undefined

    callback(message)
    this._checkQueue()
  }
  // #endregion

  // #region Sending and Receiving
  private _sendMessage(
    payload: ServerMessagePayload,
    callback: SendCallback
  ): void {
    if (!isFullyConnected(this._connection)) {
      throw new Error('_sendMessage called while not being fully connected')
    }

    const message: ServerMessage = {
      sender: this._connection.uuid,
      token: this._connection.token,
      payload,
    }

    this._sendQueue.push([message, callback])
    this._checkQueue()
  }

  private _checkQueue(): void {
    // Ensure connection
    if (!isFullyConnected(this._connection)) {
      throw new Error('_checkQueue called while not being fully connected')
    }

    // Don't send new messages while a message is in-flight
    if (this._inFlight !== undefined) {
      return
    }

    // Pop element from start of queue
    const item = this._sendQueue.shift()
    if (item === undefined) {
      return
    }

    const [message] = item
    const encoded = encode(message)

    this._inFlight = item
    this._connection.ws.send(encoded)
  }
  // Endregion
}
