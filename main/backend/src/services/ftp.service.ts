import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {CdrServer} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class FtpService {
  constructor() {}

  private async getConfig(server: CdrServer): Promise<any> {
    let config: any = {
      host: server.address,
      port: server.port,
      username: server.username,
      retries: 5
    }

    if (server.password!=null && server.password!="")
      config.password = server.password
    else
      config.privateKey = server.public_key

    return config
  }

  async list(server: CdrServer): Promise<any> {
    return new Promise(async (resolve) => {
      const Client = require('ssh2-sftp-client')
      let client = new Client()

      const config = await this.getConfig(server)

      client.connect(config)
        .then(() => {
          return client.list(server.path)
        })
        .then((data: any) => {
          resolve({success: true, message: "Success", result: data})
        })
        .finally(() => {
          client.end()
        })
        .catch( (err: any) => {
          resolve({success: false, message: err?.message})
        })
    })
  }

  async download(server: CdrServer, file: string, localPath: string): Promise<any> {
    return new Promise(async (resolve) => {
      const Client = require('ssh2-sftp-client')
      let client = new Client()

      const config = await this.getConfig(server)

      client.connect(config)
        .then(() => {
          return client.get(server.path + "/" + file, localPath + "/" + server.table_name + "/" + file)
        })
        .finally(() => {
          client.end()
          resolve({success: true, message: "Success"})
        })
        .catch( (err: any) => {
          resolve({success: false, message: err?.message})
        })
    })
  }

}
