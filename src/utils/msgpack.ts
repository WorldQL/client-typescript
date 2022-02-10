import { Decoder, Encoder } from '@msgpack/msgpack'

const encoder = new Encoder()
const decoder = new Decoder()

export const encode: typeof encoder.encode = object => {
  return encoder.encode(object)
}

export const decode: typeof decoder.decode = buffer => {
  return decoder.decode(buffer)
}
