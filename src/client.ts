import { EventEmitter } from 'eventemitter3'
import ReconnectingWebSocket from 'reconnecting-websocket'

interface Events {
  connected: never
  error: Error
}

export class Client extends EventEmitter<Events> {
  private readonly _ws: ReconnectingWebSocket

  constructor(ws: string) {
    super()

    this._ws = new ReconnectingWebSocket(ws)
    this._ws.addEventListener('open', () => {
      this.emit('connected')
    })

    this._ws.addEventListener('error', ({ error }) => {
      this.emit('error', error)
    })
  }
}
