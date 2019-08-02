export class MaxRequests {

  waitTime: number;
  prevReqTime = new Date().getTime();

  constructor(private maxReqPerHour: number) {
    this.waitTime = ((60 * 60) / maxReqPerHour) * 1000
  }

  public async waitTillReady() {
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, this.waitTime)
    })
  }
}
