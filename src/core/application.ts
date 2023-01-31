import { find } from 'better-sqlite3-proxy'
import { db } from '../db'
import { proxy, Txn } from '../proxy'
import { IStorage } from './storage'

export interface IApplication {
  // throws if invalid
  onPendingTxn(txn: Txn): void
  onAcceptedTxn(txn: Txn): void
}

export class KVApplication implements IApplication {
  constructor(public storage: IStorage) {}

  onPendingTxn(txn: Txn) {
    let [cmd] = JSON.parse(txn.payload)
    switch (cmd) {
      case 'del':
      case 'set':
        return
      default:
        throw new Error('unknown cmd: ' + cmd)
    }
  }

  onAcceptedTxn = db.transaction((txn: Txn): void => {
    let [cmd, key, value] = JSON.parse(txn.payload)
    switch (cmd) {
      case 'del':
        return this.del(key)
      case 'set':
        return this.set(key, value, txn.id!)
      default:
        throw new Error('unknown cmd: ' + cmd)
    }
  })

  private del(key: string) {
    let row = find(proxy.kv, { key })
    if (row) {
      delete proxy.kv[row.id!]
    }
  }

  private set(key: string, value: string, txn_id: number) {
    let row = find(proxy.kv, { key })
    if (row) {
      row.value = value
      row.txn_id = txn_id
    } else {
      proxy.kv.push({ key, value, txn_id })
    }
  }
}
