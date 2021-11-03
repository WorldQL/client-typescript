import EventEmitter from 'eventemitter3'
import WebSocket from 'isomorphic-ws'
import type { MessageEvent } from 'isomorphic-ws'
import type { Buffer } from 'node:buffer'
import { deserializeMessage, serializeMessage } from './codec.js'
import { Instruction } from './index.js'
import type { Message } from './interfaces.js'

/* eslint-disable @typescript-eslint/ban-types */
interface Events {
  ready: []
  disconnect: []
  error: [Error]
  message: [Readonly<Message>]
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

  public sendMessage(message: Readonly<Message>): void {
    if (!this.connected) {
      throw new Error('cannot send messages before client is connected')
    }

    if (!this.ready) {
      throw new Error('cannot send messages before client is ready')
    }

    const data = serializeMessage(message, this._uuid!)
    this._ws!.send(data)
  }

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

    this.emit('message', message)
  }

  private _handshake(message: Message) {
    if (this._uuid !== null) return
    if (message.parameter === undefined) return

    this._uuid = message.parameter
    this.sendMessage({
      instruction: Instruction.Handshake,
      // TODO: World name
      worldName: '@global',
    })

    this.emit('ready')
  }
}
