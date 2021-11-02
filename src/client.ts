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

export class Client extends EventEmitter<Events> {
  private _uuid: string | null
  private readonly _ws: WebSocket

  constructor(url: string) {
    super()

    this._uuid = null
    this._ws = new WebSocket(url)

    this._ws.addEventListener('error', ({ error }) => {
      this.emit('error', error)
    })

    this._ws.addEventListener('message', ev => {
      if (typeof ev.data === 'string') return
      void this._handleMessage(ev)
    })

    this._ws.addEventListener('close', () => {
      this.emit('disconnect')
    })
  }

  public disconnect(): void {
    this._ws.close()
  }

  public sendMessage(message: Readonly<Message>): void {
    if (this._uuid === null) {
      throw new Error('cannot send messages before client is ready')
    }

    const data = serializeMessage(message, this._uuid)
    this._ws.send(data)
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
      worldName: 'abc',
    })

    this.emit('ready')
  }
}

const client = new Client('ws://localhost:8080')
client.on('ready', () => client.disconnect())
