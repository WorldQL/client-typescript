import { EventEmitter } from 'eventemitter3'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { deserializeMessage, serializeMessage } from './codec.js'
import type { Message } from './interfaces.js'

interface Events {
  connected: never
  error: Error
  message: Message
}

export class Client extends EventEmitter<Events> {
  private readonly _ws: ReconnectingWebSocket

  constructor(ws: string) {
    super()
    this._ws = new ReconnectingWebSocket(ws, [], { startClosed: true })

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
  }

  public connect(): void {
    if (this._ws.readyState === ReconnectingWebSocket.OPEN) return
    this._ws.reconnect()
  }

  public disconnect(): void {
    this._ws.close()
  }

  public sendMessage(message: Readonly<Message>): void {
    const data = serializeMessage(message)
    this._ws.send(data)
  }

  private async _handleMessage(ev: MessageEvent): Promise<void> {
    const blob = ev.data as Blob
    const buffer = await blob.arrayBuffer()

    const message = deserializeMessage(buffer)
    this.emit('message', message)
  }
}