import { Builder, ByteBuffer } from 'flatbuffers'
import type {
  Entity,
  IncomingMessage,
  Message,
  Record,
  Vec3d,
} from './interfaces.js'
import {
  EntityT,
  Message as MessageFB,
  MessageT,
  RecordT,
  Vec3dT,
} from './worldql-fb/index.js'

// #region Utils
const decodeString: (string: string | Uint8Array) => string = string => {
  if (typeof string === 'string') return string
  if (string instanceof Uint8Array) {
    return new TextDecoder().decode(string)
  }

  throw new TypeError('unknown string-like type')
}

const encodeFlex: (buffer: Uint8Array) => number[] = buffer => {
  return Array.from(buffer)
}

const decodeFlex: (flex: number[]) => Uint8Array = flex => {
  return Uint8Array.from(flex)
}
// #endregion

// #region Vec3d
const encodeVec3d: (vec: Vec3d) => Vec3dT = vec => {
  return new Vec3dT(vec.x, vec.y, vec.z)
}

const decodeVec3d: (vec3dT: Vec3dT) => Readonly<Vec3d> = vec3dT => {
  const vec: Vec3d = {
    x: vec3dT.x,
    y: vec3dT.x,
    z: vec3dT.x,
  }

  return Object.freeze(vec)
}
// #endregion

// #region Record
const encodeRecord: (record: Record) => RecordT = record => {
  return new RecordT(
    record.uuid,
    encodeVec3d(record.position),
    record.worldName,
    record.data,
    record.flex && encodeFlex(record.flex)
  )
}

const decodeRecord: (recordT: RecordT) => Readonly<Record> = recordT => {
  if (recordT.uuid === null) {
    throw new TypeError('record uuid should never be null')
  }

  if (recordT.position === null) {
    throw new TypeError('record position should never be null')
  }

  if (recordT.worldName === null) {
    throw new TypeError('record world_name should never be null')
  }

  const record: Record = {
    uuid: decodeString(recordT.uuid),
    position: decodeVec3d(recordT.position),
    worldName: decodeString(recordT.worldName),
    data: (recordT.data && decodeString(recordT.data)) ?? undefined,
    flex: (recordT.flex && decodeFlex(recordT.flex)) ?? undefined,
  }

  return Object.freeze(record)
}
// #endregion

// #region Entity
const encodeEntity: (entity: Entity) => EntityT = entity => {
  return new EntityT(
    entity.uuid,
    encodeVec3d(entity.position),
    entity.worldName,
    entity.data,
    entity.flex && encodeFlex(entity.flex)
  )
}

const decodeEntity: (entityT: EntityT) => Readonly<Entity> = entityT => {
  if (entityT.uuid === null) {
    throw new TypeError('entity uuid should never be null')
  }

  if (entityT.position === null) {
    throw new TypeError('entity position should never be null')
  }

  if (entityT.worldName === null) {
    throw new TypeError('entity world_name should never be null')
  }

  const entity: Entity = {
    uuid: decodeString(entityT.uuid),
    position: decodeVec3d(entityT.position),
    worldName: decodeString(entityT.worldName),
    data: (entityT.data && decodeString(entityT.data)) ?? undefined,
    flex: (entityT.flex && decodeFlex(entityT.flex)) ?? undefined,
  }

  return Object.freeze(entity)
}
// #endregion

// #region Message
const encodeMessage: (message: Message, uuid: string) => MessageT = (
  message,
  uuid
) => {
  const records = message.records?.map(x => encodeRecord(x)) ?? []
  const entities = message.entities?.map(x => encodeEntity(x)) ?? []

  const messageT = new MessageT(
    message.instruction,
    message.parameter,
    uuid,
    message.worldName,
    records,
    entities,
    (message.position && encodeVec3d(message.position)) ?? undefined,
    message.flex && encodeFlex(message.flex)
  )

  return messageT
}

const decodeMessage: (messageT: MessageT) => Readonly<IncomingMessage> =
  messageT => {
    if (messageT.instruction === null) {
      throw new TypeError('message instruction should never be null')
    }

    if (messageT.worldName === null) {
      throw new TypeError('message world_name should never be null')
    }

    if (messageT.senderUuid === null) {
      throw new TypeError('message sender_uuid should never be null')
    }

    const message: IncomingMessage = {
      instruction: messageT.instruction,
      parameter:
        (messageT.parameter && decodeString(messageT.parameter)) ?? undefined,
      worldName: decodeString(messageT.worldName),
      senderUuid: decodeString(messageT.senderUuid),
      records: messageT.records.map(x => decodeRecord(x)),
      entities: messageT.entities.map(x => decodeEntity(x)),
      position:
        (messageT.position && decodeVec3d(messageT.position)) ?? undefined,
      flex: (messageT.flex && decodeFlex(messageT.flex)) ?? undefined,
    }

    return Object.freeze(message)
  }
// #endregion

// #region (De)serialization
export const serializeMessage: (message: Message, uuid: string) => Uint8Array =
  (message, uuid) => {
    const messageT = encodeMessage(message, uuid)

    const builder = new Builder(1024)
    const offset = messageT.pack(builder)

    builder.finish(offset)
    return builder.asUint8Array()
  }

export const deserializeMessage: (
  bytes: ArrayBuffer | Uint8Array
) => Readonly<IncomingMessage> = bytes => {
  const u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
  const buf = new ByteBuffer(u8)

  const messageRaw = MessageFB.getRootAsMessage(buf)
  const messageT = messageRaw.unpack()

  return decodeMessage(messageT)
}
// #endregion
