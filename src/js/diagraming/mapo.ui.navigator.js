/**
 * 鹰眼导航
 * @type {}
 */

var Navigator = {
	/**
	 * 初始化
	 */
	init: function () {
		$("#designer_layout").bind("scroll", function () {
			Navigator.setView();
		});
		//绑定拖动
		$("#navigation_eye").bind("mousedown", function (downE) {
			var eye = $(this);
			var beginPos = eye.position();
			//先取消滚动事件
			$("#designer_layout").unbind("scroll");
			var layout = $("#designer_layout");
			var beginTop = layout.scrollTop();
			var beginLeft = layout.scrollLeft();
			//设计器画布
			var designerCanvas = $("#designer_canvas");
			var canvasW = designerCanvas.width();
			var canvasH = designerCanvas.height();
			//鹰眼视图画布
			var canvas = $("#navigation_canvas");
			var navW = canvas.width();
			var navH = canvas.height();
			//宽高比例
			var scaleW = canvasW / navW;
			var scaleH = canvasH / navH;
			$(document).bind("mousemove.navigator", function (moveE) {
				var offsetX = moveE.pageX - downE.pageX;
				var offsetY = moveE.pageY - downE.pageY;
				var newLeft = beginLeft + offsetX * scaleW;
				layout.scrollLeft(newLeft);
				var newTop = beginTop + offsetY * scaleH;
				layout.scrollTop(newTop);
				eye.css({
					left: beginPos.left + offsetX,
					top: beginPos.top + offsetY
				});
			});
			$(document).bind("mouseup.navigator", function (moveE) {
				$(document).unbind("mousemove.navigator");
				$(document).unbind("mouseup.navigator");
				Navigator.setView();
				//重新绑定
				$("#designer_layout").bind("scroll", function () {
					Navigator.setView();
				});
			});
		});
		$("#navigation_canvas").bind("click", function (e) {
			var pos = Utils.getRelativePos(e.pageX, e.pageY, $(this));
			//设计器画布
			var designerCanvas = $("#designer_canvas");
			var canvasW = designerCanvas.width();
			var canvasH = designerCanvas.height();
			//鹰眼视图画布
			var canvas = $("#navigation_canvas");
			var navW = canvas.width();
			var navH = canvas.height();
			//宽高比例
			var scaleW = canvasW / navW;
			var scaleH = canvasH / navH;
			//得到点击位置，相对于设计器画布的坐标
			var canvasX = pos.x * scaleW;
			var canvasY = pos.y * scaleH;
			//把点击坐标，置于屏幕中心
			var layout = $("#designer_layout");
			var margin = Designer.config.pageMargin;
			layout.scrollLeft(canvasX + margin - layout.width() / 2);
			layout.scrollTop(canvasY + margin - layout.height() / 2);
		});
		this.setView();
	},
	/**
	 * 绘制鹰眼视图
	 */
	draw: function () {
		if (this.drawNavigationTimeout) {
			window.clearTimeout(this.drawNavigationTimeout);
		}
		this.drawNavigationTimeout = setTimeout(function () {
			var canvas = $("#navigation_canvas");
			var ctx = canvas[0].getContext("2d");
			ctx.save();
			ctx.clearRect(0, 0, canvas.width(), canvas.height());
			ctx.scale(canvas.width() / Model.define.page.width, canvas.height() / Model.define.page.height);
			//从最底层开始绘制图形
			for (var i = 0; i < Model.orderList.length; i++) {
				var shapeId = Model.orderList[i].id;
				var shape = Model.getShapeById(shapeId);
				ctx.save();
				if (shape.name != "linker") {
					//对图形执行绘制
					var p = shape.props;
					var style = shape.lineStyle;
					ctx.translate(p.x, p.y);
					ctx.translate(p.w / 2, p.h / 2);
					ctx.rotate(p.angle);
					ctx.translate(-(p.w / 2), -(p.h / 2));
					ctx.globalAlpha = shape.shapeStyle.alpha;
					Designer.painter.renderShapePath(ctx, shape);
				} else {
					var linker = shape;
					var style = linker.lineStyle;
					var points = linker.points;
					var from = linker.from;
					var to = linker.to;
					ctx.beginPath();
					ctx.moveTo(from.x, from.y);
					if (linker.linkerType == "curve") {
						var cp1 = points[0];
						var cp2 = points[1];
						ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
					} else {
						for (var j = 0; j < points.length; j++) {
							//如果是折线，会有折点
							var linkerPoint = points[j];
							ctx.lineTo(linkerPoint.x, linkerPoint.y);
						}
						ctx.lineTo(to.x, to.y);
					}
					ctx.lineWidth = style.lineWidth;
					ctx.strokeStyle = "rgb(" + style.lineColor + ")";
					ctx.stroke();
				}
				ctx.restore();
			}
			ctx.restore();
			Navigator.setView();
			this.drawNavigationTimeout = null;
		}, 100);
	},
	/**
	 * 设置鹰眼视图
	 */
	setView: function () {
		var navigator = $("#navigation_eye");
		//设计器可见视图
		var layout = $("#designer_layout");
		var viewW = layout.width();
		var viewH = layout.height();
		//鹰眼视图画布
		var canvas = $("#navigation_canvas");
		var navW = canvas.width();
		var navH = canvas.height();
		//设计器画布
		var designerCanvas = $("#designer_canvas");
		var canvasW = designerCanvas.width();
		var canvasH = designerCanvas.height();
		var margin = Designer.config.pageMargin;
		//得到设计器画布在可视窗口中的left, top
		var visibleLeft = margin - layout.scrollLeft();
		var visibleRight = visibleLeft + canvasW;
		if (visibleLeft < 0) {
			visibleLeft = 0;
		} else if (visibleLeft > viewW) {
			visibleLeft = viewW;
		}
		if (visibleRight > viewW) {
			visibleRight = viewW;
		} else if (visibleRight < 0) {
			visibleRight = 0;
		}
		var visibleTop = margin - layout.scrollTop();
		var visibleBottom = visibleTop + canvasH;
		if (visibleTop < 0) {
			visibleTop = 0;
		} else if (visibleTop > viewH) {
			visibleTop = viewH;
		}
		if (visibleBottom > viewH) {
			visibleBottom = viewH;
		} else if (visibleBottom < 0) {
			visibleBottom = 0;
		}
		var visibleW = visibleRight - visibleLeft;
		var visibleH = visibleBottom - visibleTop;
		if (visibleW == 0 || visibleH == 0) {
			//画布已经不可见
			navigator.hide();
		} else {
			//换算成鹰眼视图中的left, top
			var navLeft = layout.scrollLeft() - margin;
			if (navLeft < 0) {
				navLeft = 0;
			}
			navLeft = navLeft * (navW / canvasW);
			var navTop = layout.scrollTop() - margin;
			if (navTop < 0) {
				navTop = 0;
			}
			navTop = navTop * (navH / canvasH);
			var navViewW = visibleW * (navW / canvasW);
			var navViewH = visibleH * (navH / canvasH);
			navigator.css({
				left: navLeft - 1,
				top: navTop - 1,
				width: navViewW,
				height: navViewH
			}).show();
		}
	}
};