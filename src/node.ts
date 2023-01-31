import { IApplication, KVApplication } from './core/application'
import { DummyConcensus, IConcensus } from './core/consensus'
import { HttpNetwork, INetwork, IPeer } from './core/network'
import { IStorage, SqliteStorage } from './core/storage'

export interface INode {
  storage: IStorage
  application: IApplication
  consensus: IConcensus
  network: INetwork
}

export class DemoNode implements INode {
  storage: IStorage
  application: IApplication
  consensus: IConcensus
  network: INetwork

  constructor() {
    this.storage = new SqliteStorage()
    this.application = new KVApplication(this.storage)
    this.consensus = new DummyConcensus(this.storage, this.application)

    let port = 8100
    let peers: IPeer[] = []
    this.network = new HttpNetwork(port, peers)
  }

  async init() {
    await this.network.init()
  }
}
