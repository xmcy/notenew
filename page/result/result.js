const Tool = require('../../utils/tool.js');
Page({
  data: {
    baseCDNUrl: Tool.baseCDNUrl,
    result: '', // win, lost, tie, self
    resultTextMap: {
      win: ['恭喜您', '获得本次胜利！'],
      lose: ['很遗憾', '本次挑战失败'],
      tie: ['打成平局', '实力旗鼓相当！'],
      self: ['邀请朋友进行PK吧！']
    },
    screenHeight: '',
    scoreType: 'my',
    challengeResult: {}, // 个人挑战结果
    myTotalPoints: 0,
    myPronAccuracy: 0,
    myPronFluency: 0,
    myPronCompletion: 0,
    myWrongWords: [],
    friendInfo: null, // 朋友信息，可为null，为null时则是自己挑战
    friendTotalPoints: 0,
    friendPronAccuracy: 0,
    friendPronFluency: 0,
    friendPronCompletion: 0,
    friendWrongWords: []
  },
  onLoad: function (options) {
    const challengeResult = wx.getStorageSync('challengeResult')
    const friendInfo = wx.getStorageSync('friendInfo') || null
    const myWrongWords = challengeResult.evalWordsArray.filter(item => (item.MatchTag == 2 || item.PronAccuracy < 50) && item.Word != '*')
    const friendWrongWords = friendInfo ? friendInfo.bestScore.evalWordsArray.filter(item => (item.MatchTag == 2 || item.PronAccuracy < 50) && item.Word != '*') : []
    this.setData({
      result: friendInfo === null ? 'self' : challengeResult.totalPoints > friendInfo.bestScore.totalPoints ? 'win' : challengeResult.totalPoints < friendInfo.bestScore.totalPoints ? 'lose' : 'tie',
      challengeResult: challengeResult,
      myTotalPoints: Number(challengeResult.totalPoints).toFixed(2),
      myPronAccuracy: Number(challengeResult.pronAccuracy).toFixed(2),
      myPronFluency: Number(challengeResult.pronFluency).toFixed(2),
      myPronCompletion: Number(challengeResult.pronCompletion).toFixed(2),
      myWrongWords: myWrongWords,
      friendInfo: friendInfo,
      friendTotalPoints: friendInfo ? Number(friendInfo.bestScore.totalPoints).toFixed(2) : 0,
      friendPronAccuracy: friendInfo ? Number(friendInfo.bestScore.pronAccuracy).toFixed(2) : 0,
      friendPronFluency: friendInfo ? Number(friendInfo.bestScore.pronFluency).toFixed(2) : 0,
      friendPronCompletion: friendInfo ? Number(friendInfo.bestScore.pronCompletion).toFixed(2) : 0,
      friendWrongWords: friendWrongWords
    })
  },
  onShow: function () {
    const _this = this
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          screenHeight: res.windowHeight
        });
      }
    })
  },
  changeScoreType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      scoreType: type
    })
  },
  goToSharePage: function () {
    wx.navigateTo({
      url: '../share/share'
    })
  }
})
