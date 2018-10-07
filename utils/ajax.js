var config = require('./config.js');

/**
 * 对象扩展
 */
function extend (target, options) {
  for (var name in options) {
    var copy = options[name];
    if (copy instanceof Array) {
      target[name] = extend([], copy);
    } else if (typeof copy == "function") {
      target[name] = options[name];
    } else if (copy instanceof Object) {
      target[name] = extend({}, copy);
    } else {
      target[name] = options[name];
    }
  }
  return target;
}

/**
 * ajax请求，不抛出
 */
function doAjax (opt, isRefash) {
  var it = this;
  // var token = wx.getStorageSync("token");
  // if (!token) {
  //   wx.redirectTo({
  //     url: '/page/home/login'
  //   });
  //   return false;
  // }
  var lepaiToken = wx.getStorageSync("lepaiToken");
  // var lepaiToken = "8727aa2b-b1e1-477a-9348-6a8808f23384"//wx.getStorageSync("lepaiToken");
  var option = {};
  option = extend(option, opt);//为了不改变opt
  option = extend(option, {
    'header': {
      'lepaiToken': lepaiToken
    }
  });
  if (!opt.url) {
    console.err("ajax请求的URL不能为空")
    return
  }
  option.url = config.apiPath + opt.url;
  // if (option.loading || option.loading == undefined) {
  //   wx.showLoading({
  //     title: "正在努力加载中"
  //   })
  //   option.complete = function (res) {
  //     // wx.hideLoading();
  //   }
  // }
  wx.request(option);
}

/**
 * get Ajax请求
 */
function get (opt) {
  opt.method = "GET";
  return new Promise(function (resolve, reject) {
    opt.success = function (res) {
      resolve(res.data);
    };
    opt.error = function (err) {
      console.log("get_err", err);
      wx.showToast({
        title: "服务器开小差了，请稍后再试。",
        icon: "none",
        duration: 3500,
        mask: true
      });
      reject(err);
    };
    doAjax(opt);
  });
}

/**
 * post Ajax请求
 */
function post (opt) {
  opt.method = "POST";
  return new Promise(function (resolve, reject) {
    opt.success = function (res) {
      resolve(res.data);
    };
    opt.error = function (err) {
      console.log("post_err", err);
      wx.showToast({
        title: "服务器开小差了，请稍后再试。",
        icon: "none",
        duration: 3500,
        mask: true
      });
      reject(err);
    };
    doAjax(opt);
  });
}

/**
 * put Ajax请求
 */
function put(opt) {
  opt.method = "PUT";
  return new Promise(function (resolve, reject) {
    opt.success = function (res) {
      resolve(res.data);
    };
    opt.error = function (err) {
      console.log("put_err", err);
      wx.showToast({
        title: "服务器开小差了，请稍后再试。",
        icon: "none",
        duration: 3500,
        mask: true
      });
      reject(err);
    };
    doAjax(opt);
  });
}

/**
 * delete Ajax请求
 */
function del(opt) {
  opt.method = "Delete";
  return new Promise(function (resolve, reject) {
    opt.success = function (res) {
      resolve(res.data);
    };
    opt.error = function (err) {
      console.log("del_err", err);
      wx.showToast({
        title: "服务器开小差了，请稍后再试。",
        icon: "none",
        duration: 3500,
        mask: true
      });
      reject(err);
    };
    doAjax(opt);
  });
}
module.exports = {
  get: get,
  post: post,
  put: put,
  del: del
};
