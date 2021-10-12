exports.cid_url = bvid => `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}&jsonp=jsonp`

exports.aid_url = bvid => `https://api.bilibili.com/x/web-interface/archive/stat?bvid=${bvid}`

exports.data_link = ({ cid, aid, bvid }) =>
  `https://api.bilibili.com/x/player/v2?cid=${cid}&aid=${aid}&bvid=${bvid}`
