const fetch = require('node-fetch')

class AlertFetcher {
  constructor(ifModifiedSince, userAgent) {
    this.isModifiedSince = ifModifiedSince
    this.userAgent = userAgent
  }

  async fetchAlerts() {
    return fetch('http://api.weather.gov/alerts?status=actual', {headers : { 'User-Agent': this.userAgent, "If-Modified-Since": this.isModifiedSince }})
      .then(res => this._parseResponse(res)).catch(errorCode => Promise.reject(new Error(errorCode.message)))
  }

  async _parseResponse(res) {
    if (Date.parse(res.headers['last-modified']) < Date.parse(this.isModifiedSince)) return Promise.reject(new Error("Returned data not newer"))
    else if (res.status !== 200) return Promise.reject(new Error('HTTP ' + res.status))
    else {
      this.isModifiedSince = res.headers.raw()['last-modified'][0]
      return res.json()
    }
  }
}

module.exports = AlertFetcher
