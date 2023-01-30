import crypto from 'crypto'

function createHash() {
  return crypto.createHash('sha256')
}

function encodeInt(timestamp: number): string {
  return timestamp.toString(36)
}

function encodeHash(hash: crypto.Hash): string {
  return hash.digest().toString('hex')
}

export function hashTxn(input: { payload: string; timestamp: number }): string {
  let hash = createHash()
  hash.write(encodeInt(input.timestamp) + ':')
  hash.write(input.payload)
  return encodeHash(hash)
}

export function encodeBlockContent(txn_hashes: string[]): {
  hash: string
  payload: string
} {
  let hash = createHash()
  let payload = ''
  for (let txn_hash of txn_hashes) {
    let chunk = txn_hash + ':'
    hash.write(chunk)
    payload += chunk
  }
  return { hash: encodeHash(hash), payload }
}

export function hashBlockHeader(input: {
  prev_block_hash: string
  content_hash: string
  nonce: number
  timestamp: number
}): string {
  let hash = createHash()
  hash.write(input.prev_block_hash + ':')
  hash.write(input.content_hash + ':')
  hash.write(encodeInt(input.nonce) + ':')
  hash.write(encodeInt(input.timestamp) + ':')
  return encodeHash(hash)
}
