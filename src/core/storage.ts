import { find } from 'better-sqlite3-proxy'
import { db } from '../db'
import { proxy } from '../proxy'
import { CompactBlockContent, HttpError } from './network'

export interface NewBlock {
  height: number
  header: {
    prev_block_hash: string
    content_hash: string
    timestamp: number
    nonce: number
    header_hash: string
  }
  content: {
    payload: string
  }
  txns: {
    payload: string
    timestamp: number
    hash: string
  }[]
}

export interface LastBlockHeader {
  height: number
  header_hash: string
}

export interface IStorage {
  getLastBlockHeight(): number

  getLastBlockHeader(): LastBlockHeader

  storeBlock(block: NewBlock): void

  getBlockContent(content_hash: string): CompactBlockContent
}

let select_hash_block_header = db.prepare(/* sql */ `
select
  id as height
, header_hash
from block_header
order by id desc
limit 1
`)

export class SqliteStorage implements IStorage {
  getLastBlockHeight(): number {
    return proxy.block_header.length
  }

  getLastBlockHeader(): LastBlockHeader {
    let row = select_hash_block_header.get()
    return row
  }

  getBlockContent = db.transaction((hash: string): CompactBlockContent => {
    let content = find(proxy.block_content, { hash })
    if (!content) throw new HttpError(404, 'block content not found')
    if (!content.payload) return { txns: [] }
    return {
      txns: content.payload.split(',').map(hash => {
        let txn = find(proxy.txn, { hash })
        if (!txn) throw new HttpError(404, 'missing txn, hash: ' + hash)
        return {
          payload: txn.payload,
          timestamp: txn.timestamp,
        }
      }),
    }
  })

  storeBlock = db.transaction((block: NewBlock): void => {
    proxy.txn.push(...block.txns)
    proxy.block_content[block.height] = {
      hash: block.header.content_hash,
      payload: block.content.payload,
    }
    proxy.block_header[block.height] = {
      prev_block_hash: block.header.prev_block_hash,
      content_hash: block.header.content_hash,
      nonce: block.header.nonce,
      timestamp: block.header.timestamp,
      header_hash: block.header.header_hash,
    }
  })
}
