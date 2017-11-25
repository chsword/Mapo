/**
 * 渐变帮助类
 * @type {}
 */
var GradientHelper = {
	/**
	 * 创建渐变
	 * @param {} shape
	 * @param {} ctx
	 */
	createLinearGradient: function(shape, ctx, fillStyle){
		var p = shape.props;
		//线性渐变
		var begin;
		var end;
		var angle;
		if(p.w > p.h){
			begin = {x: 0, y: p.h/2};
			end = {x: p.w, y: p.h/2};
			angle = (fillStyle.angle + Math.PI/2) % (Math.PI*2);
		}else{
			begin = {x: p.w/2, y: 0};
			end = {x: p.w/2, y: p.h};
			angle = fillStyle.angle;
		}
		if(angle != 0){
			var center = {x: p.w/2, y: p.h/2};
			begin = Utils.getRotated(center, begin, angle);
			end = Utils.getRotated(center, end, angle);
			if(begin.x < 0){
				begin.x = 0;
			}
			if(begin.x > shape.props.w){
				begin.x = shape.props.w;
			}
			if(begin.y < 0){
				begin.y = 0;
			}
			if(begin.y > shape.props.h){
				begin.y = shape.props.h;
			}
			if(end.x < 0){
				end.x = 0;
			}
			if(end.x > shape.props.w){
				end.x = shape.props.w;
			}
			if(end.y < 0){
				end.y = 0;
			}
			if(end.y > shape.props.h){
				end.y = shape.props.h;
			}
		}
		var gradient = ctx.createLinearGradient(begin.x, begin.y, end.x, end.y);
		gradient.addColorStop(0, "rgb(" + fillStyle.beginColor + ")");
		gradient.addColorStop(1,"rgb(" + fillStyle.endColor + ")");
		return gradient;
	},
	/**
	 * 创建径向渐变
	 * @param {} shape
	 * @param {} ctx
	 */
	createRadialGradient: function(shape, ctx, fillStyle){
		var p = shape.props;
		var length = p.h;
		if(p.w < p.h){
			length = p.w;
		}
		var gradient = ctx.createRadialGradient(p.w/2, p.h/2, 10, p.w/2, p.h/2, length*fillStyle.radius);
		gradient.addColorStop(0, "rgb(" + fillStyle.beginColor + ")");
		gradient.addColorStop(1,"rgb(" + fillStyle.endColor + ")");
		return gradient;
	},
	/**
	 * 获取较淡的颜色
	 */
	getLighterColor: function(rgbStr){
		var change = 60;
		var rgb = rgbStr.split(",");
		var r = parseInt(rgb[0]);
		var g = parseInt(rgb[1]);
		var b = parseInt(rgb[2]);
		var newR = Math.round(r + (255-r)/255 * change);
		if(newR > 255){
			newR = 255;
		}
		var newG = Math.round(g + (255-g)/255 * change);
		if(newG > 255){
			newG = 255;
		}
		var newB = Math.round(b + (255-b)/255 * change);
		if(newB > 255){
			newB = 255;
		}
		return newR + "," + newG + "," + newB;
	},
	/**
	 * 获取较深的颜色
	 * @param {} rgbStr
	 * @return {}
	 */
	getDarkerColor: function(rgbStr){
		var change = 60;
		var rgb = rgbStr.split(",");
		var r = parseInt(rgb[0]);
		var g = parseInt(rgb[1]);
		var b = parseInt(rgb[2]);
		var newR = Math.round(r - r/255 * change);
		if(newR < 0){
			newR = 0;
		}
		var newG = Math.round(g - g/255 * change);
		if(newG < 0){
			newG = 0;
		}
		var newB = Math.round(b - b/255 * change);
		if(newB < 0){
			newB = 0;
		}
		return newR + "," + newG + "," + newB;
	}
};
