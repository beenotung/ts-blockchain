import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type BlockHeader = {
  id?: number | null
  prev_block_hash: string
  content_hash: string
  nonce: number
  timestamp: number
  header_hash: string
}

export type BlockContent = {
  id?: number | null
  hash: string
  payload: string | null
}

export type Txn = {
  id?: number | null
  payload: string
  timestamp: number
  hash: string
}

export type Kv = {
  id?: number | null
  key: string
  value: string
  txn_id: number
  txn?: Txn
}

export type DBProxy = {
  block_header: BlockHeader[]
  block_content: BlockContent[]
  txn: Txn[]
  kv: Kv[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    block_header: [],
    block_content: [],
    txn: [],
    kv: [
      /* foreign references */
      ['txn', { field: 'txn_id', table: 'txn' }],
    ],
  },
})
