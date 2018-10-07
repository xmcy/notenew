var Ajax = require('../utils/ajax.js');
module.exports = {
  getUserInfoByButton (code, iv, encryptedData) {
    return Ajax.post({
      url: '/api/notenew/authorization',
      data: {code, iv, encryptedData}
    })
  },
  getUserInfo (app, iv, encryptedData) {
    var it = this
    return new Promise(function (resolve, reject) {
      if (app.globalData.userInfo) {
        resolve(app.globalData.userInfo)
      } else {
        wx.login({
          success: res => {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            console.log('app login', res)
            it.getUserInfoByButton(res.code, iv, encryptedData).then(res2 => {
              console.log(res2)
              app.globalData.userInfo = res2.payload
              resolve(app.globalData.userInfo)
            })
          },
          error: err => {
            reject(err)
          }
        })
      }
    })
  },
  getRanking (openId) {
    return Ajax.get({
      url: `/api/notenew/ai-english/ranking?openId=${openId}`
    })
  },

  //登录授权
  getInfo({encryptedData, iv, code}) {
    return Ajax.post({
      url: '/api/notenew/authorization',
      data: {
        encryptedData,
        iv,
        code
      }
    })
  },
  //上传视频数据
  getVideoData({ id }) {
    return Ajax.get({
      url: `/api/notenew/ai-english/video/${id}`
    })
  },
  //上传录音签名
  getuploadCosSign({ fileName }) {
    return Ajax.get({
      url: `/api/notenew/upload/sign?fileName=${fileName}`
    })
  },
  //获取好友信息
  getFriendinfo({ openId, currentScoreId}) {
    return Ajax.get({
      url: `/api/notenew/ai-english/user?openId=${openId}&&currentScoreId=${currentScoreId}`
    })
  },

//后台打分
  getcore({ openId, currentAudioData}) {
    return Ajax.post({
      url: `/api/notenew/ai-english/frequency`,
      data: {
        openId,
        currentAudioData
      }
    })
  },
};

