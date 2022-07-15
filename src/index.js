const args = require('minimist')(process.argv.slice(2))

const { resolve, http, _2, _second } = require('./utils')
const { writeFileSync, existsSync } = require('fs')
const { basename } = require('path')
const { cid_url, aid_url, data_link } = require('./links')

class Subtitle {
  constructor(url, title = '') {
    if (title) {
      title += '.'
    }
    const [bvid, p] = url
      .split('/')
      .pop()
      .split('?')
      .map(item => {
        if (/^p=/.test(item)) {
          return parseInt(item.replace(/^p=/, ''))
        }
        return item
      })
    this.cid_path = resolve(`./data/${bvid}_cid.json`)
    this.aid_path = resolve(`./data/${bvid}_aid.json`)
    this.bvid = bvid
    this.p = p || 1
    this.cid = undefined
    this.aid = undefined
    this.title = title

    this.run()
  }

  get has_cid() {
    return existsSync(this.cid_path)
  }
  get has_aid() {
    return existsSync(this.aid_path)
  }
  get params() {
    return { bvid: this.bvid, aid: this.aid, cid: this.cid, p: this.p }
  }

  get_cid() {
    return http(cid_url(this.bvid))
      .then(res => {
        let data = JSON.parse(res.text)
        // console.log(data.data.length)
        return data ? data.data : []
      })
      .then(data => {
        this.cid = data[this.p - 1].cid
        writeFileSync(this.cid_path, JSON.stringify(data))
        return data
      })
  }

  get_aid() {
    return http(aid_url(this.bvid))
      .then(res => {
        // console.log(res.text)
        let data = JSON.parse(res.text)
        return data ? data.data : {}
      })
      .then(data => {
        this.aid = data.aid
        writeFileSync(this.aid_path, JSON.stringify(data))
        return data
      })
  }

  get_link() {
    return new Promise((_res, _rej) => {
      if (!this.has_cid) {
        this.get_cid().then(() => {
          _res(this.params)
        })
      } else {
        this.cid = require(this.cid_path)[this.p - 1].cid
        _res(this.params)
      }
    })
      .then(_data => {
        if (!this.has_aid) {
          return this.get_aid().then(() => this.params)
        } else {
          this.aid = require(this.aid_path).aid
          return this.params
        }
      })
      .then(data => {
        return data_link(data)
      })
  }

  get_json(url, name = '') {
    return http(url).then(res => {
      const data = JSON.parse(res.text)
      if (data.body) {
        let srt = this.parse_json_srt(data.body)
        // console.log(srt)
        if (!name) {
          name = 'subtitle'
        }
        name += '.srt'
        const filePath = resolve('./subtitles', name)
        writeFileSync(filePath, srt)
        console.info(basename(filePath), 'has done')
      }
    })
  }

  parse_json_srt(body) {
    return body
      .map((_, i) => {
        let from = Math.floor(_.from)
        let to = Math.floor(_.to)
        let srt = [
          i + 1,
          [
            `${_2(from / 3600)}:${_2((from % 3600) / 60)}:${_2(from % 60)},${_second(_.from)}`,
            '-->',
            `${_2(to / 3600)}:${_2((to % 3600) / 60)}:${_2(to % 60)},${_second(_.to)}`,
          ].join(' '),
          _.content,
        ].join('\n')
        return srt
      })
      .join('\n\n')
  }

  run() {
    this.get_link()
      .then(link =>
        http(link).then(res => {
          let data = JSON.parse(res.text)
          return data.data.subtitle.subtitles.map(_ => ({
            lan: _.lan,
            url: `https:${_.subtitle_url}`,
          }))
        })
      )
      .then(list => {
        list.forEach(({ lan, url }) => {
          this.get_json(url, this.title + lan)
        })
      })
      .catch(err => {
        console.log(err)
      })
  }
}

const { url, title } = args
if (!url || !title) {
  throw new TypeError('please check params')
}
new Subtitle(url, title)
