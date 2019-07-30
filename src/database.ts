import * as Mongo from 'mongodb'

export class Database {
  url = "";
  client: Mongo.MongoClient;

  constructor(private host: string, private port: string, private username: string, private password: string) {
    this.url = "mongodb://" + username + ":" + password + "@" + host + ":" + port
  }

  async init_client() {
    return Mongo.connect(this.url).then((client) => {
      this.client = client;
      return true
    }, (err) => {
      console.log(err);
      return false
    })
  }

  public get_collection(dbName: string, colName: string): Mongo.Collection {
    return this.client.db(dbName).collection(colName)
  }
}
