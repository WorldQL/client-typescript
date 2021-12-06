import EventEmitter from 'eventemitter3'
import WebSocket from 'isomorphic-ws'
import type { MessageEvent } from 'isomorphic-ws'
import type { Buffer } from 'node:buffer'
import type { SetOptional } from 'type-fest'
import { deserializeMessage, serializeMessage } from '../codec.js'
import { Instruction } from '../index.js'
import type { Message, Record, Vector3Arg } from '../interfaces.js'
import { Replication } from '../worldql-fb/index.js'
import type { ClientEvents as Events, MessagePayload } from './interfaces.js'

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
  private readonly _options: Readonly<ClientOptions>

  private _uuid: string | null
  private _ws: WebSocket | null

  constructor(options: Readonly<ClientOptions>) {
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

  public sendRawMessage(
    message: Readonly<SetOptional<Message, 'replication'>>
  ): void {
    if (!this.connected) {
      throw new Error('cannot send messages before client is connected')
    }

    if (!this.ready) {
      throw new Error('cannot send messages before client is ready')
    }

    const messageWithDefaults: Readonly<Message> = {
      replication: Replication.ExceptSelf,
      ...message,
    }

    const data = serializeMessage(messageWithDefaults, this._uuid!)
    this._ws!.send(data)
  }

  // #region Methods
  /**
   * Send a message to all clients which are subscribed to the given world.
   * @param worldName World Name
   * @param replication Optional Replication Strategy, defaults to `ExceptSelf`
   * @param payload Optional Message Payload
   */
  public globalMessage(
    worldName: string,
    replication = Replication.ExceptSelf,
    payload?: Readonly<MessagePayload>
  ): void {
    this.sendRawMessage({
      instruction: Instruction.GlobalMessage,
      worldName,
      replication,
      parameter: payload?.parameter,
      flex: payload?.flex,
      records: payload?.records,
      entities: payload?.entities,
    })
  }

  /**
   * Send a message to all clients which are subscribed to a certain area in the given world.
   * @param worldName World Name
   * @param position Message Position
   * @param replication Optional Replication Strategy, defaults to `ExceptSelf`
   * @param payload Optional Message Payload
   */
  public localMessage(
    worldName: string,
    position: Vector3Arg,
    replication = Replication.ExceptSelf,
    payload?: Readonly<MessagePayload>
  ): void {
    this.sendRawMessage({
      instruction: Instruction.LocalMessage,
      worldName,
      replication,
      position,
      parameter: payload?.parameter,
      flex: payload?.flex,
      records: payload?.records,
      entities: payload?.entities,
    })
  }

  public recordCreate(worldName: string, records: Iterable<Record>): void {
    this.sendRawMessage({
      instruction: Instruction.RecordCreate,
      worldName,
      records: [...records],
    })
  }

  public recordRead(worldName: string, position: Vector3Arg): void {
    this.sendRawMessage({
      instruction: Instruction.RecordRead,
      worldName,
      position,
    })
  }

  // TODO: disable for now, suppress lint errors
  // public recordUpdate(worldName: string): void {
  //   // TODO
  //   throw new Error('not implemented')
  // }

  public recordDelete(worldName: string, records: Iterable<Record>): void {
    this.sendRawMessage({
      instruction: Instruction.RecordDelete,
      worldName,
      records: [...records],
    })
  }

  /**
   * Subscribe to local messages for an area.
   * @param worldName World Name
   * @param position Area Position
   */
  public areaSubscribe(worldName: string, position: Vector3Arg): void {
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
  public areaUnsubscribe(worldName: string, position: Vector3Arg): void {
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

        this.emit(
          'localMessage',
          message.senderUuid,
          message.worldName,
          Object.freeze(message.position),
          Object.freeze({
            parameter: message.parameter,
            flex: message.flex,
            records: message.records,
            entities: message.entities,
          })
        )

        break
      }

      case Instruction.GlobalMessage: {
        this.emit(
          'globalMessage',
          message.senderUuid,
          message.worldName,
          Object.freeze({
            parameter: message.parameter,
            flex: message.flex,
            records: message.records,
            entities: message.entities,
          })
        )

        break
      }

      case Instruction.RecordReply: {
        const records = message.records ?? []
        for (const record of records) {
          Object.freeze(record)
        }

        this.emit('recordReply', message.worldName, Object.freeze(records))
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
