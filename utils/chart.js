function tansferCoords(angle, radius) {
  var radian = Math.PI / 180 * (angle + 180);
  return {
    x: Math.sin(radian) * radius,
    y: Math.cos(radian) * radius
  };
}

function hex2rgba(hex, opacity) {
  hex = hex.replace("#", "");
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
}

function radar(ctx, width, height, data, labels, series, colours, options, successFn) {
  var center = {
    x: width / 2 + 100,
    y: height / 2 + 370
  }; // 雷达圆心
  var lengthOfShortSide = height > width ? width : height;
  var radius = lengthOfShortSide / 2 - (options.scaleFontSize * 2); // 雷达半径
  var factorNumber = data[0].length; // 因子数量（决定有几条边）
  var angleInterval = 360 / factorNumber; // 每个因子的间隔角度
  /* 计算区间线 */
  var scales = [];
  for (var i = 0; i < options.scaleSteps; i++) {
    var scale = [];
    var r = radius * (i + 1) / options.scaleSteps; // 当前区间线半径
    for (var j = 0; j < factorNumber; j++) {
      scale[j] = tansferCoords(angleInterval * j, r);
    }
    scales[i] = scale;
  }
  /* 计算数据的坐标 */
  options.scaleSection = options.scaleSteps * options.scaleStepWidth; // 值区间长度
  options.scaleEndValue = options.scaleStartValue + options.scaleSection; // 最大值
  var views = []; //视图值
  for (var d of data) {
    var view = [];
    for (var i = 0; i < factorNumber; i++) {
      var _data = d[i] <= options.scaleStartValue ? options.scaleStartValue : d[i]; // 数据值小于最小值则取最小值
      var _data = _data >= options.scaleEndValue ? options.scaleEndValue : _data; // 数据值大于最大值则取最大值
      var ratio = (_data - options.scaleStartValue) / options.scaleSection; // 计算数据在值区间内的比例
      view[i] = tansferCoords(angleInterval * i, radius * ratio);
    }
    views.push(view);
  }
  /* 开始绘制 */
  // var ctx = wx.createCanvasContext(canvasId);
  ctx.translate(center.x, center.y);
  ctx.setStrokeStyle("#005DE9"); // 底色暂时固定
  /* 绘制半径 */
  var border = scales[scales.length - 1];
  for (var b of border) {
    ctx.moveTo(0, 0); // 定位到圆心准备绘制半径
    ctx.lineTo(b.x, b.y); // 绘制半径
  }
  ctx.stroke();
  /* 绘制区间线 */
  for (var scale of scales) {
    ctx.moveTo(scale[0].x, scale[0].y);
    for (var s of scale) {
      ctx.lineTo(s.x, s.y); // 绘制
    }
    ctx.lineTo(scale[0].x, scale[0].y);
  }
  ctx.stroke();
  /* 绘制数据 */
  for (var i in views) {
    var view = views[i];
    /* 绘制连线 */
    ctx.beginPath();
    ctx.setStrokeStyle(hex2rgba(colours[i], 0.8));
    ctx.setLineWidth(2);
    for (var v of view) {
      ctx.lineTo(v.x, v.y);
    }
    ctx.lineTo(view[0].x, view[0].y);
    ctx.stroke();
    ctx.setFillStyle(hex2rgba(colours[i], 0.2));
    ctx.fill();
    ctx.closePath();
    /* 绘制顶点 */
    ctx.setLineWidth(3);
    for (var v of view) {
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.setStrokeStyle("#ffffff");
      ctx.arc(v.x, v.y, 3, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.setStrokeStyle(hex2rgba(colours[i], 0.8));
      ctx.arc(v.x, v.y, 2, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.closePath();
    }
  }
  /* 绘制文字标签 */
  ctx.setFillStyle("#FFFFFF");
  ctx.setFontSize(options.scaleFontSize);
  for (var i in labels) {
    var angle = angleInterval * i;
    var offset = {
      x: -1 * labels[i].length / 2 * 14
    };
    var rotAgl = null;
    var above = null;
    if (angle <= 90 || angle >= 270) {
      rotAgl = angle * Math.PI / 180;
      above = true;
      offset.y = -8;
    } else {
      rotAgl = (180 + angle) * Math.PI / 180;
      above = false;
      offset.y = options.scaleFontSize / -2 - 8;
    }
    ctx.rotate(rotAgl);
    ctx.fillText(labels[i], border[0].x + offset.x, (above ? 1 : -1) * (border[0].y + offset.y));
    ctx.rotate(-1 * rotAgl);
  }
}

module.exports = {
  radar: radar
};
