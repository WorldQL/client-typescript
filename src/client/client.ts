import EventEmitter from 'eventemitter3'
import WebSocket from 'isomorphic-ws'
import type { MessageEvent } from 'isomorphic-ws'
import type { Buffer } from 'node:buffer'
import { deserializeMessage, serializeMessage } from '../codec.js'
import { Instruction } from '../index.js'
import type { IncomingMessage, Message, Vector3 } from '../interfaces.js'
import type { MessagePayload } from './methodParams.js'

/* eslint-disable @typescript-eslint/ban-types */
interface Events {
  ready: []
  disconnect: []
  error: [Error]
  rawMessage: [Readonly<IncomingMessage>]

  peerConnect: [uuid: string]
  peerDisconnect: [uuid: string]
  localMessage: [worldName: string, position: Vector3, payload: MessagePayload]
  globalMessage: [worldName: string, payload: MessagePayload]
  recordReply: []
}
/* eslint-enable @typescript-eslint/ban-types */

export interface ClientOptions {
  /**
   * WorldQL WebSocket Address
   */
  url: string

  /**
   * Connect to WebSocket automatically
   *
   * Defaults to `false`
   */
  autoconnect?: boolean
}

export class Client extends EventEmitter<Events> {
  // #region Constructor and Fields
  private readonly _options: ClientOptions

  private _uuid: string | null
  private _ws: WebSocket | null

  constructor(options: ClientOptions) {
    super()

    this._options = options
    this._uuid = null
    this._ws = null

    if (options.autoconnect) this.connect()
  }
  // #endregion

  // #region Getters
  /**
   * Current state of the underlying WebSocket Connection
   */
  public get connected(): boolean {
    if (this._ws === null) return false
    return this._ws.readyState === WebSocket.OPEN
  }

  /**
   * Whether the handshake has been completed and the client is ready to send/receive messages
   */
  public get ready(): boolean {
    if (!this.connected) return false
    if (this._uuid === null) return false

    return true
  }

  /**
   * Returns the current client UUID.
   *
   * Throws an error if read before the client is ready.
   */
  public get uuid(): string {
    if (!this.ready) throw new Error('cannot read uuid before client is ready')
    return this._uuid!
  }
  // #endregion

  // #region Lifecycle
  public connect(): void {
    if (this._ws !== null) {
      throw new Error('cannot connect if already connected')
    }

    this._ws = new WebSocket(this._options.url)

    this._ws.addEventListener('error', ({ error }) => {
      this.emit('error', error)
    })

    this._ws.addEventListener('message', ev => {
      if (typeof ev.data === 'string') return
      void this._handleMessage(ev)
    })

    this._ws.addEventListener('close', () => {
      this._uuid = null
      this._ws = null

      this.emit('disconnect')
    })
  }

  public disconnect(): void {
    if (this._ws === null) return
    this._ws.close()
  }
  // #endregion

  public sendRawMessage(message: Readonly<Message>): void {
    if (!this.connected) {
      throw new Error('cannot send messages before client is connected')
    }

    if (!this.ready) {
      throw new Error('cannot send messages before client is ready')
    }

    const data = serializeMessage(message, this._uuid!)
    this._ws!.send(data)
  }

  // #region Methods
  /**
   * Send a message to all clients which are subscribed to a certain area in the given world.
   * @param worldName World Name
   * @param position Message Position
   * @param parameters Optional Message Payload
   */
  public localMessage(
    worldName: string,
    position: Vector3,
    parameters?: MessagePayload
  ): void {
    this.sendRawMessage({
      instruction: Instruction.LocalMessage,
      worldName,
      position,
      parameter: parameters?.parameter,
      flex: parameters?.flex,
    })
  }

  /**
   * Send a message to all clients which are subscribed to the given world.
   * @param worldName World Name
   * @param parameters Optional Message Payload
   */
  public globalMessage(worldName: string, parameters?: MessagePayload): void {
    this.sendRawMessage({
      instruction: Instruction.LocalMessage,
      worldName,
      parameter: parameters?.parameter,
      flex: parameters?.flex,
    })
  }

  // Disable for now, suppress lint errors
  // public recordCreate(worldName: string): void {
  //   // TODO
  //   throw new Error('not implemented')
  // }

  // public recordRead(worldName: string): void {
  //   // TODO
  //   throw new Error('not implemented')
  // }

  // public recordUpdate(worldName: string): void {
  //   // TODO
  //   throw new Error('not implemented')
  // }

  // public recordDelete(worldName: string): void {
  //   // TODO
  //   throw new Error('not implemented')
  // }

  /**
   * Subscribe to local messages for an area.
   * @param worldName World Name
   * @param position Area Position
   */
  public areaSubscribe(worldName: string, position: Vector3): void {
    this.sendRawMessage({
      instruction: Instruction.AreaSubscribe,
      worldName,
      position,
    })
  }

  /**
   * Unsubscribe from local messages for an area.
   * @param worldName World Name
   * @param position Area Position
   */
  public areaUnsubscribe(worldName: string, position: Vector3): void {
    this.sendRawMessage({
      instruction: Instruction.AreaUnsubscribe,
      worldName,
      position,
    })
  }
  // #endregion

  // #region Internals
  private async _handleMessage(ev: MessageEvent): Promise<void> {
    if (typeof ev.data === 'string') return
    if (Array.isArray(ev.data)) return

    const buffer =
      typeof window === 'undefined'
        ? (ev.data as Buffer)
        : await (ev.data as unknown as Blob).arrayBuffer()

    const message = deserializeMessage(buffer)
    if (message.instruction === Instruction.Handshake) {
      this._handshake(message)
      return
    }

    this.emit('rawMessage', message)

    switch (message.instruction) {
      case Instruction.PeerConnect: {
        if (!message.parameter) {
          throw new Error('invalid peer connect')
        }

        this.emit('peerConnect', message.parameter)
        break
      }

      case Instruction.PeerDisconnect: {
        if (!message.parameter) {
          throw new Error('invalid peer connect')
        }

        this.emit('peerDisconnect', message.parameter)
        break
      }

      case Instruction.LocalMessage: {
        if (!message.position) {
          throw new Error('invalid local message')
        }

        this.emit('localMessage', message.worldName, message.position, {
          parameter: message.parameter,
          flex: message.flex,
        })

        break
      }

      case Instruction.GlobalMessage: {
        this.emit('globalMessage', message.worldName, {
          parameter: message.parameter,
          flex: message.flex,
        })

        break
      }

      case Instruction.RecordReply: {
        // TODO
        break
      }

      default:
        break
    }
  }

  private _handshake(message: Message) {
    if (this._uuid !== null) return
    if (message.parameter === undefined) return

    this._uuid = message.parameter
    this.sendRawMessage({
      instruction: Instruction.Handshake,
      worldName: '@global',
    })

    this.emit('ready')
  }
  // #endregion
}
