const { resolve: ____res } = require('path')
const resolve = (...args) => ____res(__dirname, ...args)

const options = require('./options')

const request = require('superagent')
require('superagent-proxy')(request)

const parseUrl = url => ({
  url: url.split('?')[0],
  query: url.split('?')[1] || '',
})

const http = _url => {
  const { url, query } = parseUrl(_url)
  // console.log(url, query)
  return request.get(url).query(query).set(options).proxy('http://127.0.0.1:1082')
}

const reg = /.*?"subtitle":(?<res>\{.*?\}),"user_garb".*?/

const _2 = num => String(Math.floor(num)).padStart(2, '0')
const _second = num => `${(num % 1).toFixed(3)}`.replace(/^0\./, '')

module.exports = {
  resolve,
  request,
  http,
  parseUrl,
  _2,
  _second,
}
