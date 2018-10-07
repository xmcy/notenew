var ApiNoteNew = require('../../apis/api-note-new.js');
var Tool = require('../../utils/tool.js');
const app = getApp()
let audio = {}
let video = {}
Page({
  data: {
    Tool: Tool,
    videoSrc: wx.getStorageSync('videoPath') || Tool.baseCDNUrl + '/web/note-new/media/jobs-stanford.mp4',
    lastTime: 0,
    videoWidth: wx.getSystemInfoSync().windowWidth,
    cover: true,
    list: [],
    audioIndex: 0,
    currentItem: -1,
    userInfo: {}
  },
  onLoad: function () {
    this.setData({
      userInfo: wx.getStorageSync('userinfo') || {}
    })
  },
  onShow: function () {
    var it = this
    var openId = wx.getStorageSync('openId') || ''
    it.setData({
      openId: openId
    })
    video = wx.createVideoContext('video', it)
    video.seek(0)
    audio = wx.createAudioContext('audio')
    audio.setSrc(wx.getStorageSync('audioPath') || Tool.baseCDNUrl + '/web/note-new/media/jobs-stanford.mp3')
    // audio.onPlay((res) => {
    //   console.log("播放paly", res)
    // })
    video.pause()
    audio.pause()
    ApiNoteNew.getRanking(openId).then(function (res) {
      it.setData({
        list: res.payload || []
      })
    })
    wx.setNavigationBarTitle({
      title: '致敬乔布斯，斯坦福演讲'
    })
  },
  onHide: function () {
    video.seek(0)
    video.pause()
    this.setData({
      audioIndex: 0,
      currentItem: -1,
    })
    wx.setNavigationBarTitle({
      title: '致敬乔布斯，斯坦福演讲'
    })
  },
  goto: function (e) {
    video.pause()
    audio.pause()
    // ApiNoteNew.getUserInfo(app, e.detail.iv, e.detail.encryptedData).then(function (userInfo) {
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
    })
    // })
  },
  audioPlaying:function(e){
    console.log('音频播放中',e)
  },
  audioEnded: function (e) {
    console.log('音频播放结束', e)    
    var it = this
    if (it.data.currentItem > -1) {
      if (it.data.audioIndex < it.data.list[it.data.currentItem].currentAudioUrlArray.length - 1) {
        it.setData({
          audioIndex: it.data.audioIndex + 1
        }, () => {
          audio.setSrc(it.data.list[it.data.currentItem].currentAudioUrlArray[it.data.audioIndex])
          audio.seek(0)
          audio.play()
        })
      } else {
        it.setData({
          audioIndex: 0
        }, () => {
          audio.pause()
          audio.setSrc(it.data.list[it.data.currentItem].currentAudioUrlArray[it.data.audioIndex])
          audio.seek(0)
        })
      }
    }
  },
  onPlay: function (e) {
    video.playbackRate = 1 // 视频0.8倍速播放
    video.play()
    audio.play()
    audio.seek(0)
    this.setData({
      cover: false
    })
    console.log('音频开始播放', e)    
  },
  onPause: function (e) {
    video.pause()
    audio.pause()
    this.setData({
      cover: true
    })
    console.log('音频暂停', e)    
  },
  onVideoEnded: function (e) {
    console.log('视频播放结束', e)    
    audio.seek(0)
    audio.pause()
    // audio.pause()
    // if (this.data.currentItem > -1) {
    //   audio.setSrc(this.data.list[this.data.currentItem].currentAudioUrlArray[0])
    // }
    // audio.seek(0)
    // audio.pause()
    this.setData({
      cover: true
    })
  },
  onWaiting: function (e) {
    audio.pause()
    console.log('视频等待', e)    
  },
  onError: function (e) {
    console.log('视频播放出错', e)    
    audio.pause()
    wx.showToast({
      title: '视频加载出错',
      icon: 'none'
    })
  },
  onProgress: function (e) {
    this.setData({
      cover: false
    })
    console.log('bindtimeupdate')
    var currentTime = e.detail.currentTime
    var minTime = 3
    // video.play()
    // audio.play()
    return false
    if (currentTime > 0 && (currentTime - this.data.lastTime > minTime || currentTime - this.data.lastTime < 0 - minTime)) {
      video.seek(this.data.lastTime)
      video.play()
    } else {
      if (currentTime <= 0 && this.data.lastTime > minTime) {
        this.setData({
          lastTime: 0
        })
        audio.seek(0)
        video.play()
        audio.play()
      } else {
        this.setData({
          lastTime: currentTime
        })
      }
    }
  },
  audioPlay: function (e) {
    console.log('排行榜播放')
    video.seek(0)
    video.playbackRate = 0.8 // 视频0.8倍速播放
    video.play()
    var index = e.currentTarget.dataset.index
    audio.setSrc(this.data.list[index].currentAudioUrlArray[0])
    this.setData({
      audioIndex: 0,
      currentItem: index
    })
    let title = this.data.list[index].user.openId === this.data.userInfo.openId ? `我的斯坦福演讲` : `${this.data.list[index].user.nickName}的斯坦福演讲`
    wx.setNavigationBarTitle({
      title: title
    })
    audio.pause()
    audio.seek(0)
    audio.play()
  },
  onUnload: function () {
    video.pause()
    audio.pause()
    this.setData({
      cover: true
    })
  }
})
