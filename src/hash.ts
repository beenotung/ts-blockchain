import crypto from 'crypto'

class Hash {
  stream = crypto.createHash('sha256')
  write(chunk: string) {
    this.stream.write(chunk)
  }
  digest() {
    return 'urn:sha256:' + this.stream.digest().toString('hex')
  }
}

function encodeInt(timestamp: number): string {
  return timestamp.toString(36)
}

export function hashTxn(input: { payload: string; timestamp: number }): string {
  let hash = new Hash()
  hash.write(encodeInt(input.timestamp) + ':')
  hash.write(input.payload)
  return hash.digest()
}

export function encodeBlockContent(txn_hashes: string[]): {
  hash: string
  payload: string
} {
  let hash = new Hash()
  let payload = ''
  for (let txn_hash of txn_hashes) {
    let chunk = txn_hash + ':'
    hash.write(chunk)
    payload += chunk
  }
  return { hash: hash.digest(), payload }
}

export function hashBlockHeader(input: {
  prev_block_hash: string
  content_hash: string
  nonce: number
  timestamp: number
}): string {
  let hash = new Hash()
  hash.write(input.prev_block_hash + ':')
  hash.write(input.content_hash + ':')
  hash.write(encodeInt(input.nonce) + ':')
  hash.write(encodeInt(input.timestamp) + ':')
  return hash.digest()
}
