//index.js
//获取应用实例
let ApiNote = require('../../apis/api-note-new.js')
let Tool = require('../../utils/tool.js')
const COS = require('../../utils/cos-wx-sdk-v4.js')
const app = getApp()
const recorderManager = wx.getRecorderManager()
let videoContext = {}
let audioCtx = {}
let tempFileArr = [] //上传后台的录音数组数据
let localRecorder = [] //本地试听数组
let options = {
  // duration: 25000,//指定录音的时长，单位 ms
  sampleRate: 16000, //采样率
  numberOfChannels: 1, //录音通道数
  encodeBitRate: 32000, //编码码率
  format: 'mp3', //音频格式，有效值 aac/mp3
  // frameSize: 15,//指定帧大小，单位 KB
}
Page({
  data: {
    userInfo: {},
    myUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    videoSrc: wx.getStorageSync('videoPath') || 'https://file.wh.ministudy.com/web/note-new/media/jobs-stanford.mp4',
    videoTitle: '',
    videoData: [], //字幕数据
    challengeFlag: false, //是否有挑战对象
    challengeName: '', //被挑战者名字
    challengeFilepath: [], //被挑战者的录音
    challengePlaying: false, //是否播放被挑战者录音
    chooseFlag: false, //是否选择视频播放
    playingFlag: false, //是否正在播放视频
    recorderFlag: false, //是否正在录音
    submitFlag: false, //是否已经点击提交按钮
    couldFlag: false, //是否可以提交打分
    currentIndex: -1, //当前选中录音字幕
    tempFilePath: '', //当前录音本地地址
    tempRecorder: {},
    count: 0,
    isSelf: false
  },
  method: {},
  onLoad: function (e) {
    // 获取视频数据
    ApiNote.getVideoData({
      id: 1
    }).then((res) => {
      let tempArr = []
      tempFileArr.length = res.payload.videoTextArray.length
      for (var i = 0; i < res.payload.videoTextArray.length; i++) {
        let tempObj = {}
        tempObj.lyric = res.payload.videoTextArray[i]
        tempObj.status = false
        tempArr.push(tempObj)
      }
      this.setData({
        videoData: tempArr,
      })
      // console.log(this.data.videoData)
    })
    //如果本地有缓存个人信息，则说明已经授权个人信息
    let useinfo = wx.getStorageSync('myUserInfo')
    if (useinfo) {
      this.setData({
        myUserInfo: true
      })
    }
    //判断是否从分享的图片识别二维码进来此页面
    let params;
    let friendOpenId
    let currentScoreId
    if (e.params) {
      params = JSON.parse(e.params)
    } else {
      const scene = decodeURIComponent(e.scene)
      console.log(scene)
      if (!(scene == 'undefined')) {
        params = scene.split(',')
        friendOpenId = params[0].split(':')[1]
        currentScoreId = params[1].split(':')[1]
      }
    }
    if (JSON.stringify(e) == '{}') {
      this.setData({
        videoTitle: '乔布斯--斯坦福演讲',
        challengeFlag: false
      })
      wx.removeStorageSync('friendInfo')
    } else {
      ApiNote.getFriendinfo({
        openId: friendOpenId,
        currentScoreId: currentScoreId
      }).then((res) => {
        //自己识别自己则没有挑战者
        if (res.payload.openId == wx.getStorageSync('openId')) {
          this.setData({
            videoTitle: '乔布斯--斯坦福演讲',
            challengeName: res.payload.nickName,
            challengeFilepath: res.payload.bestScore.currentAudioUrlArray,
            challengeFlag: false,
            isSelf: true
          })
          wx.removeStorageSync('friendInfo')
        } else {
          this.setData({
            challengeName: res.payload.nickName,
            videoTitle: `来自${res.payload.nickName}的挑战`,
            challengeFlag: true
          })
          if (res.payload.bestScore) {
            this.setData({
              challengeFilepath: res.payload.bestScore.currentAudioUrlArray
            })
            console.log(res.payload)
          }
          //将被挑战者的信息缓存
          wx.setStorageSync('friendInfo', res.payload)
        }
      })
    }
    videoContext = wx.createVideoContext('targetVideo')
    this.videoStop()
    audioCtx = wx.createInnerAudioContext()
    audioCtx.obeyMuteSwitch = false
    //录音结束的回调
    recorderManager.onStop((res) => {
      console.log("结束录音")      
      let that = this
      let recorderTime = (wx.getStorageSync('endTime') - wx.getStorageSync('startTime'))
      if (recorderTime < 1500) {
        wx.showToast({
          title: '录音时长不能小于1.5s',
          icon: 'none'
        })
        that.setData({
          currentIndex: -1,
          recorderFlag: false
        })
      } else if (recorderTime > 7000) {
        wx.showToast({
          title: '录音时长不能超过7s',
          icon: 'none'
        })
        that.setData({
          currentIndex: -1,
          recorderFlag: false
        })
      } else {
        that.setData({
          tempFilePath: res.tempFilePath
        })
        localRecorder[this.data.currentIndex] = res.tempFilePath
        that.submitVideo()
      }
    })
    recorderManager.onStart((res) => {
      console.log("开始录音")
      if (this.data.recorderFlag) {
        return
      }
      this.videoStop()
      this.audioStop()
      this.setData({
        recorderFlag: true,
        playingFlag: false,
      })
    })
    recorderManager.onError((res) => {
      if ((res.errMsg).indexOf("fail") > -1 && !wx.getStorageSync('record')) {
        this.checkAuth()
      }
      console.log('录音error', res)
    })
    audioCtx.onError((res) => {
      console.log("失败fail", res)
      // 播放音频失败的回调
    })
    audioCtx.onPlay((res) => {
      console.log("播放paly", res)
    })
    audioCtx.onPause((res) => {
      console.log("暂停pause", res)
    })
    audioCtx.onEnded(() => { //结束播放监听事件
      console.log("播放结束");
      this.setData({
        listenFlag: false
    })
    if (this.data.count > 0 && this.data.count < this.data.videoData.length) {
      this.palyChallenge()
    } else {
      this.setData({
        count: 0
      })
    }
    })
  },
  onHide:function(){
    audioCtx.pause()
    videoContext.pause()
    tempFileArr = []
  },
  onUnload: function () {
    audioCtx.pause()
    videoContext.pause()
    tempFileArr = []
  },
  startVideo: function(){
      audioCtx.play()
  },
  //点击录音
  startRecord: function (e) {
    let that = this
    this.setData({
      listenFlag: false
    })
    if (wx.getStorageSync('record')) {
      //授权后再点击录音进来，则直接开始录音
      //如果正在录音或者正在提交，则不能再次发次录音
      if (this.data.recorderFlag || this.data.submitFlag) {
        return
      }
      wx.setStorageSync('startTime', e.timeStamp)
      let copyRecorder = {}
      copyRecorder.refText = e.currentTarget.dataset.lyric
      that.setData({
        currentIndex: e.currentTarget.dataset.index,
        tempRecorder: copyRecorder
      })
      recorderManager.start(options)      
    } else {
      wx.getSetting({
        success: res => {
          console.log(res)
          if (!res.authSetting['scope.record']) {
            //第一次进入调用录音权限
            wx.authorize({
              scope: "scope.record",
              success: function () {
                wx.setStorageSync('record', "ok")
              },
              fail: function () {}
            })
          } else if (res.authSetting['scope.record']) {
            wx.setStorageSync('record', "ok")
          }
        }
      })
    }

  },
  //结束录音
  endRecorder: function (e) {
    wx.setStorageSync('endTime', e.timeStamp)
    setTimeout(recorderManager.stop, 300)
  },
  checkAuth: function () {
    let that = this
    //若用户已拒绝录音
    that.setData({
      currentIndex: -1
    })
    wx.showModal({
      title: '警告',
      content: '您拒绝授权麦克风,将无法正常使用录音功能。',
      success: function (res) {
        if (res.confirm) {
          wx.hideToast()
          wx.openSetting({
            complete: (res) => {
              if (res.authSetting && res.authSetting["scope.record"]) { //如果用户重新同意了授权登录
                wx.setStorageSync('record', "ok")
              }
            }
          })
        }
      }
    })
  },
  //授权个人信息
  getUserInfo: function (e) {
    console.log(e, this.data.myUserInfo)
    if (e.detail.userInfo) {
      wx.login({
        success: (res) => {
          const code = res.code
          app.globalData.userInfo = e.detail.userInfo
          wx.getUserInfo({
            withCredentials: true, //设为true才能获取到加密数据
            success: (userInfo) => {
              wx.authorize({
                scope: "scope.record",
                success: function () {
                  wx.setStorageSync('record', "ok")
                },
                fail: function () {}
              })
              const iv = userInfo.iv
              const encryptedData = userInfo.encryptedData
              wx.setStorageSync('iv', iv);
              wx.setStorageSync('encryptedData', encryptedData);
              ApiNote.getInfo({
                encryptedData,
                iv,
                code
              }).then((loginRes) => {
                console.log(loginRes)
                if (loginRes.success) {
                  this.setData({
                    myUserInfo: true
                  })
                }
                wx.setStorageSync('myUserInfo', true)
                wx.setStorageSync('openId', loginRes.payload.openId)
                wx.setStorageSync('userinfo', loginRes.payload)
              })
            },
            fail: () => {
              console.log(res)
            }
          })
        }
      })
    }
  },
  //播放视频
  playVideo: function () {
    videoContext.play()
    if (this.data.challengePlaying) {
      videoContext.playbackRate(0.8)// 视频0.8倍速播放
    }
    this.setData({
      chooseFlag: true,
      playingFlag: true,
      listenFlag: false,
      recorderFlag:false
    })
  },
  //播放原音视频
  palyClassic: function () {
    console.log(wx.getStorageSync('videoPath'))
    if (!wx.getStorageSync('videoPath')) {
      wx.showLoading({
        title: '视频加载中',
        duration: 1500
      })
    } else {
      audioCtx.src = wx.getStorageSync('audioPath') || 'https://file.wh.ministudy.com/web/note-new/media/jobs-stanford.mp3'
      this.playVideo()
    }
  },
  //视频归零
  videoStop: function () {
    this.setData({
      chooseFlag: false,
      challengePlaying:false,
      count: 0
    })
    videoContext.pause()
    videoContext.seek(0)
  },
  //语音归零
  audioStop: function () {
    audioCtx.pause()
    audioCtx.seek(0)
  },
  //播放挑战者配音
  palyChallenge: function (e) {
    if (!wx.getStorageSync('videoPath')) {
      wx.showLoading({
        title: '视频加载中',
        duration: 1500
      })
    } else {
      this.audioStop()
      let tempPath = this.data.challengeFilepath[this.data.count]
      if (tempPath.indexOf("https") < 0) {
        tempPath = tempPath.replace("http", "https")
      }
      audioCtx.src = tempPath
      console.log('challenge audio src ==================', audioCtx.src)
      this.setData({
        chooseFlag: true,
        challengePlaying: true,
        count: this.data.count + 1
      })
      if (!this.data.playingFlag) {
        this.playVideo()
      }
      audioCtx.play()
    }
  },
  //点击屏幕暂停视频播放
  pauseVideo: function () {
    if (this.data.recorderFlag) {
      return
    }
    if (this.data.playingFlag) {
      videoContext.pause()
      audioCtx.pause()
      this.setData({
        playingFlag: false,
        chooseFlag: true
      })
    } else {
      this.playVideo()
    }
  },
  //视频播放结束
  endVideo: function () {
    if (this.data.challengePlaying) {
      challengePlaying: false
    }
    this.setData({
      chooseFlag: false,
      playingFlag: false
    })
  },
  //预览我的录音
  playMyvideo: function (e) {
    if (this.data.submitFlag) {
      return
    }
    this.videoStop()
    this.audioStop()
    let tempIndex = e.currentTarget.dataset.index
    this.setData({
      playingFlag: false,
      listenFlag: true
    })
    audioCtx.src = localRecorder[tempIndex]; // 这里是录音的临时路径
    audioCtx.seek(0)
    audioCtx.play()
    console.log('试听')
  },
  //上传录音cos
  submitVideo: function () {
    let that = this
    that.setData({
      playingFlag: false
    })
    const fileName = 'jobs-stanford' + wx.getStorageSync('openId') + new Date().getTime()+".mp3"
    if (that.data.tempFilePath) {
      ApiNote.getuploadCosSign({
        fileName: fileName
      }).then(res => {
        // console.log(res)
        const cos = new COS({
          appid: res.payload.appId, // APPID 必填参数
          bucket: res.payload.bucketName, // bucketName 必填参数
          region: res.payload.region, // 地域信息 必填参数 华南地区填 gz 华东填 sh 华北填 tj
          getAppSign: function (callback) { //获取签名 必填参数
            const sig = res.payload.sign;
            callback(sig);
          }
        });
        cos.uploadFile(
          that.successCallback,
          that.errorCallback,
          res.payload.bucketName,
          res.payload.cosPath,
          that.data.tempFilePath,
          0 // insertOnly==0 表示允许覆盖文件 1表示不允许覆盖
        );
      })
    }
  },
  successCallback(res) {
    let that = this
    let copyArr = [...that.data.videoData]
    let copyRecorder = {}
    copyRecorder = this.data.tempRecorder
    copyRecorder.voiceDataUrl = res.data.data.source_url
    // audioCtx.src = res.data.data.source_url.replace("http","https")
    // audioCtx.play()
    let copyObj = { ...that.data.videoData[that.data.currentIndex]
    }
    copyObj.status = res.data.data.source_url
    copyArr.splice(that.data.currentIndex, 1, copyObj)
    tempFileArr[that.data.currentIndex] = copyRecorder
    that.setData({
      currentIndex: -1,
      videoData: copyArr,
      recorderFlag: false
    })
    //判断是否全部都已录音
    for (var j = 0; j < tempFileArr.length;j++){
      if (!tempFileArr[j]){
        return
      }
    }
    that.setData({
      couldFlag: true
    })
    //若全部已录音，则可以提交打分
    // if (tempFileArr.filter(item => item).length === 6) {
    //   that.setData({
    //     couldFlag: true
    //   })
    // }
  },
  errorCallback(result) {
    wx.hideLoading()
    console.log('error', result);
    this.setData({
      recorderFlag: false
    })
  },
  //提交后台评分
  submitjudge: function () {
    let that = this
    if (that.data.submitFlag || !that.data.couldFlag) {
      return
    }
    that.setData({
      submitFlag: true,
    })
    that.videoStop()
    that.audioStop()
    wx.showLoading({
      title: '上传中'
    })
    ApiNote.getcore({
      openId: wx.getStorageSync('openId'),
      currentAudioData: tempFileArr,
    }).then(res => {
      that.setData({
        submitFlag: false
      })
      console.log('上传结果', res)
      if (res.success) {
        wx.hideLoading()
        wx.showToast({
          title: '上传成功',
          icon: 'none',
          duration: 2000
        })
        wx.setStorageSync('challengeResult', res.payload)
        this.setData({
          chooseFlag: false, //是否选择视频播放
        })
        wx.redirectTo({
          url: '../result/result',
        })
      } else {
        if (res.errorMessage == '你今天的挑战次数已用完，请明天再试吧') {
          wx.showToast({
            title: '你今天的挑战次数已用完，请明天再试吧',
            icon: 'none',
          })
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none',
          })
        }
      }
    })
  },
})
