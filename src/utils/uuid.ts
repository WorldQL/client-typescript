import { parse, v4 as uuid } from 'uuid'

export type Uuid = ArrayLike<number>
export const generateUuid: () => Uuid = () => parse(uuid())
