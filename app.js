//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    //预下载视频
    if (!wx.getStorageSync('videoPath')){
      wx.downloadFile({
        url: 'https://file.wh.ministudy.com/web/note-new/media/jobs-stanford.mp4?id=10',
        success: function (res) {
          if (res.statusCode === 200) {
            wx.setStorageSync('videoPath', res.tempFilePath)
          }
        }
      })
    }
    //预下载音频
    if (!wx.getStorageSync('audioPath')) {
      wx.downloadFile({
        url: 'https://file.wh.ministudy.com/web/note-new/media/jobs-stanford.mp3?id=10',
        success: function (res) {
          console.log(res)
          if (res.statusCode === 200) {
            wx.setStorageSync('audioPath', res.tempFilePath)
          }
        }
      })
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null,
  }
})
