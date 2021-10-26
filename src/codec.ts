import { Builder, ByteBuffer } from 'flatbuffers'
import type { Entity, Message, Record, Vec3d } from './interfaces.js'
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
    [] // Record.flex
  )
}

const decodeRecord: (recordT: RecordT) => Readonly<Record> = recordT => {
  // TODO: data, flex
  const record: Record = {
    uuid: decodeString(recordT.uuid),
    position: decodeVec3d(recordT.position),
    worldName: decodeString(recordT.worldName),
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
    [] // Entity.flex
  )
}

const decodeEntity: (entityT: EntityT) => Readonly<Entity> = entityT => {
  // TODO: data, flex
  const entity: Entity = {
    uuid: decodeString(entityT.uuid),
    position: decodeVec3d(entityT.position),
    worldName: decodeString(entityT.worldName),
  }

  return Object.freeze(entity)
}
// #endregion

// #region Message
const encodeMessage: (message: Message) => MessageT = message => {
  const records = message.records?.map(x => encodeRecord(x)) ?? []
  const entities = message.entities?.map(x => encodeEntity(x)) ?? []

  const messageT = new MessageT(
    message.instruction,
    message.senderUuid,
    message.worldName,
    message.data,
    records,
    entities,
    encodeVec3d(message.position),
    [] // Msg.flex
  )

  return messageT
}

const decodeMessage: (messageT: MessageT) => Readonly<Message> = messageT => {
  // TODO: data, flex
  const message: Message = {
    instruction: decodeString(messageT.instruction),
    senderUuid: decodeString(messageT.senderUuid),
    worldName: decodeString(messageT.worldName),

    records: messageT.records.map(x => decodeRecord(x)),
    entities: messageT.entities.map(x => decodeEntity(x)),
    position: decodeVec3d(messageT.position),
  }

  return Object.freeze(message)
}
// #endregion

// #region (De)serialization
export const serializeMessage: (message: Message) => Uint8Array = message_ => {
  const message = encodeMessage(message_)

  const builder = new Builder(1024)
  const offset = message.pack(builder)

  builder.finish(offset)
  return builder.asUint8Array()
}

export const deserializeMessage: (
  bytes: ArrayBuffer | Uint8Array
) => Readonly<Message> = bytes => {
  const u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
  const buf = new ByteBuffer(u8)

  const messageRaw = MessageFB.getRootAsMessage(buf)
  const messageT = messageRaw.unpack()

  return decodeMessage(messageT)
}
// #endregion
