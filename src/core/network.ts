import { IStorage, NewBlock } from './storage'
import fetch, { RequestInit } from 'node-fetch'
import express from 'express'
import cors from 'cors'
import EventEmitter from 'events'
import { array, int, object, string } from 'cast.ts'
import { IConcensus } from './consensus'

export interface INetwork {
  init(): Promise<void>
  broadcastNewBlock(block: NewBlock): void
  outputStream: EventEmitter
  askBlockContent(content_hash: string): Promise<CompactBlockContent>
}

export interface IPeer {
  origin: string
}

export interface CompactBlockHeader {
  height: number
  prev_block_hash: string
  timestamp: number
  nonce: number
  content_hash: string
}

export interface CompactBlockContent {
  txns: {
    payload: string
    timestamp: number
  }[]
}

let blockHeaderParser = object({
  body: object({
    height: int({ min: 1 }),
    prev_block_hash: string(),
    timestamp: int({ min: 1 }),
    nonce: int({ min: 1 }),
    content_hash: string(),
  }),
})

let blockContentResParser = object({
  txns: array(
    object({
      payload: string(),
      timestamp: int({ min: 1 }),
    }),
  ),
})

let blockContentReqParser = object({
  params: object({ hash: string() }),
})
export class HttpNetwork implements INetwork {
  server: express.Application

  constructor(
    public storage: IStorage,
    public concensus: IConcensus,
    public port: number,
    public peers: IPeer[],
  ) {
    let app = express()
    app.use(cors())
    app.use(express.json())

    app.post('/block', (req, res, next) => {
      try {
        let blockHeader: CompactBlockHeader = blockHeaderParser.parse(req).body
        // TODO validate block header
        // TODO get block content
        // this.concensus.onBlock()
        res.json({})
      } catch (error) {
        next(error)
      }
    })

    app.get('/content', (req, res, next) => {
      try {
        let content_hash = blockContentReqParser.parse(req).params.hash
        let content: CompactBlockContent =
          this.storage.getBlockContent(content_hash)
        res.json(content)
      } catch (error) {
        next(error)
      }
    })

    this.server = app
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, resolve)
      } catch (error) {
        reject(error)
      }
    })
  }

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

  async askBlockContent(content_hash: string): Promise<CompactBlockContent> {
    let params = new URLSearchParams()
    params.set('hash', content_hash)
    let url = '/content?' + params
    for (let peer of this.peers) {
      try {
        let res = await fetch(peer.origin + url)
        let json = await res.json()
        return blockContentResParser.parse(json)
      } catch (error) {
        console.error(
          'failed to ask content content from peer:',
          peer,
          'reason:',
          error,
        )
      }
    }
    throw new Error('block content not found')
  }
}

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}
