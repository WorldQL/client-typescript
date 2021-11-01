import { EventEmitter } from 'eventemitter3'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { v4 as uuid } from 'uuid'
import { deserializeMessage, serializeMessage } from './codec.js'
import type { Message } from './interfaces.js'

interface Events {
  // eslint-disable-next-line @typescript-eslint/ban-types
  connected: []
  error: [Error]
  message: [Readonly<Message>]
}

export interface ClientOptions {
  /**
   * WorldQL WebSocket Address
   */
  ws: string

  /**
   * Connect to WebSocket automatically
   *
   * Defaults to `false`
   */
  autoconnect?: boolean
}

export class Client extends EventEmitter<Events> {
  private readonly _uuid: string
  private readonly _ws: ReconnectingWebSocket

  constructor(options: ClientOptions) {
    super()

    this._uuid = uuid()
    this._ws = new ReconnectingWebSocket(options.ws, [], { startClosed: true })

    this._ws.addEventListener('open', () => {
      this.emit('connected')
    })

    this._ws.addEventListener('error', ({ error }) => {
      this.emit('error', error)
    })

    this._ws.addEventListener('message', ev => {
      if (typeof ev.data === 'string') return
      void this._handleMessage(ev)
    })

    if (options.autoconnect) this._ws.reconnect()
  }

  public connect(): void {
    if (this._ws.readyState === ReconnectingWebSocket.OPEN) return
    this._ws.reconnect()
  }

  public disconnect(): void {
    this._ws.close()
  }

  public sendMessage(message: Readonly<Message>): void {
    const data = serializeMessage(message, this._uuid)
    this._ws.send(data)
  }

  private async _handleMessage(ev: MessageEvent): Promise<void> {
    const blob = ev.data as Blob
    const buffer = await blob.arrayBuffer()

    const message = deserializeMessage(buffer)
    this.emit('message', message)
  }
}
