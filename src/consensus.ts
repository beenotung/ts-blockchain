import { encodeBlockContent, hashBlockHeader, hashTxn } from './hash'
import { Txn } from './proxy'
import { IStorage, NewBlock } from './storage'

export interface IConcensus {
  makeNewBlock(): NewBlock
}

export class DummyConcensus implements IConcensus {
  constructor(public storage: IStorage) {}

  makeNewBlock(): NewBlock {
    let last = this.storage.getLastBlockHeader()
    let txns: Txn[] = []
    let txn_ids: string[] = txns.map(txn => hashTxn(txn))
    let content = encodeBlockContent(txn_ids)
    let timestamp = Date.now()
    let nonce = 1
    let header_hash = hashBlockHeader({
      prev_block_hash: last.header_hash,
      content_hash: content.hash,
      timestamp,
      nonce,
    })
    return {
      height: last.height + 1,
      header: {
        prev_block_hash: last.header_hash,
        content_hash: content.hash,
        timestamp,
        nonce,
        header_hash,
      },
      content: {
        payload: content.payload,
      },
      txns,
    }
  }
}
