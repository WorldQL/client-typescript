import { parse, stringify, v4 as uuid } from 'uuid'

export type Uuid = ArrayLike<number>
export const generateUuid: () => Uuid = () => parse(uuid())
export const uuidString: (uuid: Uuid) => string = uuid => stringify(uuid)
