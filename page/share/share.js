const chart = require('../../utils/chart.js')
const Tool = require('../../utils/tool.js')
const Config = require('../../utils/config.js')
const map = {
  '低低低': {
    typeCn: '街头流浪汉',
    typeEn: 'england street people',
    desc: '未来堪忧，继续在街头抽你的二手烟吧',
    tag: ['poor', 'lazy', 'plain', 'friendly', 'honest']
  },
  '低高高': {
    typeCn: '白宫政客',
    typeEn: 'White House Administration',
    desc: '可以和特朗普同看一份报纸哟',
    tag: ['friendly', 'traditonal', 'able', 'adroit', 'loyal']
  },
  '高低高': {
    typeCn: '大学教授',
    typeEn: 'english teacher',
    desc: '桃李满天下，Justin Biber也是你的学生呢',
    tag: ['kind', 'punctual', 'patient', 'reliable', 'gentle']
  },
  '高高高': {
    typeCn: '科技公司CEO',
    typeEn: 'company CEO',
    desc: '马斯克喊你一起试驾最新款特斯拉',
    tag: ['expressive', 'kind', 'creative', 'confident', 'friendly']
  },
  '高高低': {
    typeCn: '华尔街大咖',
    typeEn: 'The Wolf of Wall Street',
    desc: '比尔盖茨说要约你喝杯coffee',
    tag: ['open-minded', 'analytical', 'efficient', 'gentle', 'patient']
  },
  '低低高': {
    typeCn: '码头搬运工',
    typeEn: 'porter',
    desc: '码头的货都搬完了吗',
    tag: ['patient', 'loyal', 'friendly', 'strong', 'humorous']
  },
  '高低低': {
    typeCn: '外科医生',
    typeEn: 'docotor',
    desc: '掐指一算，你怕是白求恩的徒弟吧',
    tag: ['creative', 'friendly', 'kind', 'reliable', 'handsome']
  },
  '低高低': {
    typeCn: '金牌大律师',
    typeEn: 'lawyer',
    desc: '黑白颠倒呼风唤雨的律政精英',
    tag: ['confident', 'handsome', 'reliable', 'smart', 'knowledgeble']
  }
}
Page({
  data: {
    openId: '',
    screenHeight: '',
    screenWidth: '',
    radarCanvas: {
      width: 300,
      height: 300
    },
    radarPath: '',
    highScore: 70,
    typeCn: '',
    typeEn: '',
    desc: '',
    tagArray: [],
    isError: false,
    showImg: false,
    canvasBgPath: '',
    quoteUpPath: '',
    quoteDownPath: '',
    qrPath: '',
    avatarPath: '',
    canvasImgUrl: '',
    pronAccuracy: 0,
    pronFluency: 0,
    pronCompletion: 0,
    isSaveBtnShow: true
  },
  onLoad: function (options) {
    const self = this
    const challengeResult = wx.getStorageSync('challengeResult')
    wx.getSystemInfo({
      success: function (res) {
        self.setData({
          openId: wx.getStorageSync('openId') || '',
          screenHeight: res.windowHeight,
          screenWidth: res.windowWidth,
          radarCanvas: {
            width: res.windowWidth / 2,
            height: res.windowWidth / 2
          },
          pronAccuracy: challengeResult.pronAccuracy,
          pronCompletion: challengeResult.pronCompletion,
          pronFluency: challengeResult.pronFluency
        }, () => {
          const result = [self.data.pronAccuracy, self.data.pronCompletion, self.data.pronFluency].map(item => {
            return item > self.data.highScore ? '高' : '低'
          }).join('')
          self.setData({
            typeCn: map[result].typeCn,
            typeEn: map[result].typeEn,
            desc: map[result].desc,
            tagArray: map[result].tag
          })
          self.getImg()
        });
      }
    })
  },
  getImg: function () {
    wx.showLoading({
      title: '图片加载中...',
    })
    const promise1 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: Tool.baseCDNUrl + '/web/note-new/share_canvas_bg.png',
        success: res => {
          this.setData({
            canvasBgPath: res.path
          }, () => resolve(true))
        },
        fail: err => reject(false)
      })
    })
    const promise2 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: Tool.baseCDNUrl + '/web/note-new/quote_up.png',
        success: res => {
          this.setData({
            quoteUpPath: res.path
          }, () => resolve(true))
        },
        fail: err => reject(false)
      })
    })
    const promise3 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: Tool.baseCDNUrl + '/web/note-new/quote_down.png',
        success: res => {
          this.setData({
            quoteDownPath: res.path
          }, () => resolve(true))
        },
        fail: err => reject(false)
      })
    })
    const promise4 = new Promise((resolve, reject) => {
      const openId = this.data.openId
      const page = 'page/recorder/recorder'
      const currentScoreId = wx.getStorageSync('challengeResult').id
      wx.getImageInfo({
        src: `${Config.apiPath}/api/notenew/ai-english/qrcode?openId=${openId}&page=${page}&currentScoreId=${currentScoreId}`,
        success: res => {
          this.setData({
            qrPath: res.path
          }, () => resolve(true))
        },
        fail: err => reject(false)
      })
    })
    const promise5 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: wx.getStorageSync('userinfo').avatarUrl,
        success: res => {
          this.setData({
            avatarPath: res.path
          }, () => resolve(true))
        },
        fail: err => {
          console.log(err)
          reject(false)
        }
      })
    })

    Promise.all([promise5, promise1, promise2, promise3, promise4]).then(
      values => {
        this.onImgLoaded()
      },
      err => {
        wx.hideLoading()
        this.setData({
          isError: true
        })
      }
    )
  },
  onImgLoaded: function () {
    const self = this
    const ctx = wx.createCanvasContext('shareCanvas')
    ctx.drawImage(self.data.canvasBgPath, 0, 0, 414, 672)
    ctx.drawImage(self.data.quoteUpPath, 27, 50, 20, 20)
    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(48)
    ctx.fillText(self.data.typeCn, 50, 100)
    ctx.drawImage(self.data.quoteDownPath, 46 + self.data.typeCn.length * 50, 94, 20, 20)
    ctx.setFontSize(18)
    ctx.fillText(self.data.typeEn, 50, 130)
    ctx.setFillStyle('rgba(232, 232, 232, 0.6)')
    ctx.fillText(self.data.desc, 50, 154)
    const leftArray = [0, 95, 38, 90, 0]
    const drawTag = (tagText, left, index) => {
      ctx.setFillStyle('#FFFFFF')
      ctx.fillText(tagText, 40 + left, 183 + index * 33.6)
    }
    self.data.tagArray.forEach((tag, index) => {
      drawTag(tag, leftArray[index], index)
    })
    ctx.drawImage(self.data.qrPath, 297, 550, 94, 94)
    ctx.drawImage(self.data.avatarPath, 30, 625, 44, 44)
    chart.radar(ctx, self.data.radarCanvas.width, self.data.radarCanvas.height,
      [
        [
          self.data.pronAccuracy / 20, // 准确
          (self.data.pronAccuracy + self.data.pronCompletion) / 40, // 智慧
          self.data.pronCompletion / 20, // 完整
          (self.data.pronCompletion + self.data.pronFluency) / 40, // 魅力
          self.data.pronFluency / 20, // 流利
          (self.data.pronAccuracy + self.data.pronFluency) / 40 // 心态
        ]
      ],
      ['准确', '心态', '流利', '魅力', '完整', '智慧'],
      ['参考值', '我的'], ['#CA293C', '#16A085'], {
        scaleSteps: 5,
        scaleStepWidth: 1,
        scaleStartValue: 0,
        scaleFontSize: 14
      }
    )
    ctx.draw(false, () => {
      //将canvas画图转成一张图片
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 414,
        height: 672,
        destWidth: 414 * 2,
        destHeight: 672 * 2,
        canvasId: 'shareCanvas',
        success: res => {
          /* 这里 就可以显示之前写的 预览区域了 把生成的图片url给image的src */
          wx.hideLoading()
          this.setData({
            showImg: true,
            canvasImgUrl: res.tempFilePath
          })
        },
        fail: function (res) {
          wx.hideLoading()
          console.log(res)
        }
      })
    })
  },
  previewImg: function (e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.src]
    })
  },
  //点击保存
  saveImg: function (e) {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting["scope.writePhotosAlbum"]) {
          this.exportImg()
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: (res) => {
              this.exportImg()
            },
            fail: (err) => {
              // wx.showToast({
              //   title: '您已拒绝授权，将无法保存到相册',
              //   icon: 'none',
              //   duration: 3000
              // })
              wx.showModal({
                title: '温馨提示',
                content: '拒绝授权将无法保存图片，重新打开授权？',
                success: function (res) {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (res) => {
                        if (res.authSetting["scope.writePhotosAlbum"]) {
                          wx.navigateBack({
                            delta: 1
                          })
                        }
                      }
                    })
                  }
                }
              })
            }
          })
        }
      }
    })
  },
  //长按导出到相册
  exportImg: function () {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.canvasImgUrl,
      success: res => {
        if (res.errMsg === 'saveImageToPhotosAlbum:ok') {
          wx.showToast({
            title: '保存到本地相册成功',
            icon: 'none',
            duration: 3000
          })
          this.setData({
            isSaveBtnShow: false
          })
        }
      },
      fail(err) {
        console.log(err)
      }
    })
  }
})
