import { NewBlock } from './storage'
import fetch, { RequestInit } from 'node-fetch'

export interface INetwork {
  broadcastNewBlock(block: NewBlock): void
}

export interface IPeer {
  origin: string
}

export class HttpNetwork implements INetwork {
  constructor(public peers: IPeer[]) {}

  broadcastNewBlock(block: NewBlock): void {
    let init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(block),
    }
    for (let peer of this.peers) {
      fetch(peer.origin + '/block', init)
    }
  }
}
