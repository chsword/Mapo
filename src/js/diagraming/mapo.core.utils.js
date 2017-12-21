
/**
 * 工具类
 * @type {}
 */
class Utils {
    static getDomById(id) {
        return document.getElementById(id);
    }

    static newId() {
        var random = Math.random();
        var newId = (random + new Date().getTime());
        return newId.toString(16).replace(".", "");
    }

    /**
     * 获取某一位置下的形状容器
     */
    static getShapeByPosition(x, y, findLinkpoint) {
        var focusShapes = [];
        for (var i = Model.orderList.length - 1; i >= 0; i--) {
            var shapeId = Model.orderList[i].id;
            var shapeBox = $("#" + shapeId);
            var shape = Model.getShapeById(shapeId);
            //计算出相对于图形画布的x,y坐标
            var shapeBoxPos = shapeBox.position();
            var relativeX = x - shapeBoxPos.left;
            var relativeY = y - shapeBoxPos.top;
            var canvasRect = { x: shapeBoxPos.left, y: shapeBoxPos.top, w: shapeBox.width(), h: shapeBox.height() };
            var shapeCanvas = shapeBox.find(".shape_canvas")[0];
            var shapeCtx = shapeCanvas.getContext("2d");
            var inCanvas = this.pointInRect(x, y, canvasRect);
            if (shape.name == "linker") {
                if (!inCanvas) {
                    continue;
                }
                if (findLinkpoint) {
                    continue;
                }
                //如果图形是连接线
                //先判断是否在连线的端点上
                var radius = 10;
                radius = radius.toScale();
                var rect = { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
                if (this.pointInRect(shape.to.x.toScale(), shape.to.y.toScale(), rect)) {
                    var result = { type: "linker_point", point: "end", shape: shape };
                    focusShapes.push(result);
                    continue;
                } else if (this.pointInRect(shape.from.x.toScale(), shape.from.y.toScale(), rect)) {
                    var result = { type: "linker_point", point: "from", shape: shape };
                    focusShapes.push(result);
                    continue;
                } else {
                    //判断是否在连接线的文本上
                    var textCanvas = shapeBox.find(".text_canvas");
                    var textCanvasPos = textCanvas.position();
                    var rect = {
                        x: textCanvasPos.left,
                        y: textCanvasPos.top,
                        w: textCanvas.width(),
                        h: textCanvas.height()
                    };
                    if (this.pointInRect(relativeX, relativeY, rect)) {
                        var result = { type: "linker_text", shape: shape };
                        focusShapes.push(result);
                        continue;
                    }
                    //判断是否在连接线上，判断坐标点放射出的两条直线是否与线相交
                    radius = 7;
                    radius = radius.toScale();
                    var inLinker = this.pointInLinker({ x: x.restoreScale(), y: y.restoreScale() }, shape, radius);
                    if (inLinker > -1) {
                        var result = { type: "linker", shape: shape, pointIndex: inLinker };
                        focusShapes.push(result);
                        continue;
                    }
                }
            } else {
                if (inCanvas && shape.locked && !findLinkpoint) {
                    //如果图形被锁定了，不做边界判断
                    if (shapeCtx.isPointInPath(relativeX, relativeY)) {
                        var result = { type: "shape", shape: shape };
                        focusShapes.push(result);
                    }
                    continue;
                }
                var radius = 7; //矩形放射半径
                if (inCanvas) {
                    //先判断是否在图形的锚点上
                    radius = radius.toScale();
                    var rect = { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
                    var shapeCenter = { x: shape.props.x + shape.props.w / 2, y: shape.props.y + shape.props.h / 2 };
                    var anchors = shape.getAnchors();
                    var result = null;
                    for (var ai = 0; ai < anchors.length; ai++) {
                        var an = anchors[ai];
                        an = this.getRotated(shapeCenter,
                            { x: shape.props.x + an.x, y: shape.props.y + an.y },
                            shape.props.angle);
                        //所以在判断锚点是否在鼠标矩形范围中时
                        if (Utils.pointInRect(an.x.toScale(), an.y.toScale(), rect)) {
                            var angle = Utils.getPointAngle(shapeId, an.x, an.y, radius);
                            an.angle = angle;
                            result = { type: "bounding", shape: shape, linkPoint: an };
                            if (shapeCtx.isPointInPath(relativeX, relativeY)) {
                                result.inPath = true;
                            }
                            break;
                        }
                    }
                    if (result != null) {
                        focusShapes.push(result);
                        continue;
                    }
                }
                //判断是否在数据属性上
                if (shape.dataAttributes) {
                    var result = null;
                    for (var di = 0; di < shape.dataAttributes.length; di++) {
                        var attr = shape.dataAttributes[di];
                        if (attr.type == "link" && attr.showType && attr.showType != "none") {
                            var attrCanvas = shapeBox.children("#attr_canvas_" + attr.id);
                            if (attrCanvas.length > 0) {
                                var attrPos = attrCanvas.position();
                                var relateToAttrX = relativeX - attrPos.left;
                                var relateToAttrY = relativeY - attrPos.top;
                                var attrCtx = attrCanvas[0].getContext("2d");
                                if (attrCtx.isPointInPath(relateToAttrX, relateToAttrY)) {
                                    result = { type: "dataAttribute", shape: shape, attribute: attr };
                                    break;
                                }
                            }
                        }
                    }
                    if (result != null) {
                        focusShapes.push(result);
                        continue;
                    }
                }
                if (!inCanvas) {
                    continue;
                }
                //判断是否在图形内
                if (shapeCtx.isPointInPath(relativeX, relativeY)) {
                    //如果当前坐标在形状内，显示为移动
                    if (findLinkpoint) {
                        var anchors = shape.getAnchors();
                        if (anchors && anchors.length) {
                            var result = { type: "shape", shape: shape };
                            focusShapes.push(result);
                            continue;
                        } else {
                            continue;
                        }
                    } else {
                        var result = { type: "shape", shape: shape };
                        focusShapes.push(result);
                        continue;
                    }
                } else if (!shape.attribute ||
                    typeof shape.attribute.linkable == "undefined" ||
                    shape.attribute.linkable) {
                    //判断坐标是否在图形边界上
                    //获取点相对于图形的角度
                    var angle = Utils.getPointAngle(shapeId, x.restoreScale(), y.restoreScale(), radius);
                    if (angle != null) {
                        var result = null;
                        var linkPoint = { angle: angle };
                        for (var step = 1; step <= radius; step++) {
                            //向角度相反方向，以半径为最长，逐渐移动
                            if (angle == 0) {
                                //点角度在左边
                                linkPoint.x = relativeX + step;
                                linkPoint.y = relativeY;
                            } else if (angle < Math.PI / 2) {
                                //点角度在左上角区域
                                linkPoint.x = relativeX + step * Math.cos(angle);
                                linkPoint.y = relativeY + step * Math.sin(angle);
                            } else if (angle == Math.PI / 2) {
                                //点角度在正上方
                                linkPoint.x = relativeX;
                                linkPoint.y = relativeY + step;
                            } else if (angle < Math.PI) {
                                //点角度为在右上角区域
                                linkPoint.x = relativeX - step * Math.sin(angle - Math.PI / 2);
                                linkPoint.y = relativeY + step * Math.cos(angle - Math.PI / 2);
                            } else if (angle == Math.PI / 2) {
                                //点角度在正右边
                                linkPoint.x = relativeX - step;
                                linkPoint.y = relativeY;
                            } else if (angle < Math.PI / 2 * 3) {
                                //点角度为在右下角区域
                                linkPoint.x = relativeX - step * Math.cos(angle - Math.PI);
                                linkPoint.y = relativeY - step * Math.sin(angle - Math.PI);
                            } else if (angle == Math.PI / 2 * 3) {
                                //点角度在正右边
                                linkPoint.x = relativeX;
                                linkPoint.y = relativeY - step;
                            } else {
                                //点角度为在左下角区域
                                linkPoint.x = relativeX + step * Math.sin(angle - Math.PI / 2 * 3);
                                linkPoint.y = relativeY - step * Math.cos(angle - Math.PI / 2 * 3);
                            }
                            if (shapeCtx.isPointInPath(linkPoint.x, linkPoint.y)) {
                                linkPoint.x += shapeBoxPos.left;
                                linkPoint.y += shapeBoxPos.top;
                                linkPoint.x = linkPoint.x.restoreScale();
                                linkPoint.y = linkPoint.y.restoreScale();
                                result = { type: "bounding", shape: shape, linkPoint: linkPoint };
                                break;
                            }
                        }
                        if (result != null) {
                            focusShapes.push(result);
                            continue;
                        }
                    }
                }
            }
        }
        var result = null;
        if (focusShapes.length == 1) {
            result = focusShapes[0];
        }
        if (focusShapes.length > 1 && findLinkpoint) {
            result = focusShapes[0];
        } else if (focusShapes.length > 1) {
            //鼠标在多个图形上，需要有判断规则
            var first = focusShapes[0];
            if (first.type == "bounding" && first.type != "linker_point" && first.type != "linker") {
                //鼠标在连接线端点上，并且
                return first;
            }
            var inLinker = []; //在连线上
            var endPoint = []; //在连接线端点
            var inBounding = []; //在形状边界上
            for (var i = 0; i < focusShapes.length; i++) {
                var focus = focusShapes[i];
                if (focus.type == "bounding") {
                    inBounding.push(focus);
                } else if (focus.type == "linker") {
                    inLinker.push(focus);
                } else if (focus.type == "linker_point") {
                    endPoint.push(focus);
                }
            }
            if (inBounding.length > 0 && endPoint.length > 0) {
                //在某图形的边界上，并且在某连接线的端点上，判断一下是否在形状内部
                for (var i = 0; i < inBounding.length; i++) {
                    var focus = inBounding[i];
                    if (focus.inPath) {
                        result = focus;
                        break;
                    }
                }
            }
            if (result == null && endPoint.length > 0) {
                //如果并没有在形状内部，取最上层的连接线
                endPoint.sort(function compare(a, b) {
                    if (Utils.isSelected(a.shape.id) && !Utils.isSelected(b.shape.id)) {
                        return -1;
                    } else if (!Utils.isSelected(a.shape.id) && Utils.isSelected(b.shape.id)) {
                        return 1;
                    } else {
                        return b.shape.props.zindex - a.shape.props.zindex;
                    }
                });
                result = endPoint[0];
            }
            if (result == null && inLinker.length > 0) {
                //如果并没有在形状内部，取最上层的连接线
                inLinker.sort(function compare(a, b) {
                    if (Utils.isSelected(a.shape.id) && !Utils.isSelected(b.shape.id)) {
                        return -1;
                    } else if (!Utils.isSelected(a.shape.id) && Utils.isSelected(b.shape.id)) {
                        return 1;
                    } else {
                        return b.shape.props.zindex - a.shape.props.zindex;
                    }
                });
                result = inLinker[0];
            }
            if (result == null) {
                result = focusShapes[0];
            }
        }
        return result;
    }

    /**
     * 判断两条线段是否相交
     * @param {} p1
     * @param {} p2
     * @param {} p3
     * @param {} p4
     * @return {}
     */
    static checkCross (p1, p2, p3, p4) {
        var flag = false;
        var d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (d != 0) {
            var r = ((p1.y - p3.y) * (p4.x - p3.x) - (p1.x - p3.x) * (p4.y - p3.y)) / d;
            var s = ((p1.y - p3.y) * (p2.x - p1.x) - (p1.x - p3.x) * (p2.y - p1.y)) / d;
            if ((r >= 0) && (r <= 1) && (s >= 0) && (s <= 1)) {
                flag = true;
            }
        }
        return flag;
//			var d1=((p2.x-p1.x)*(p3.y-p1.y)-(p2.y-p1.y)*(p3.x-p1.x))*((p2.x-p1.x)*(p4.y-p1.y)-(p2.y-p1.y)*(p4.x-p1.x));
//		    var d2=((p4.x-p3.x)*(p1.y-p3.y)-(p4.y-p3.y)*(p1.x-p3.x))*((p4.x-p3.x)*(p2.y-p3.y)-(p4.y-p3.y)*(p2.x-p3.x));
//		    return d1<=0&&d2<=0;
        //计算向量叉乘
//			function crossMul(v1, v2) {
//				return v1.x * v2.y - v1.y * v2.x;
//			}
//			var v1 = {x: p1.x - p3.x, y: p1.y - p3.y};
//			var v2 = {x: p2.x - p3.x, y: p2.y - p3.y};
//			var v3 = {x: p4.x - p3.x, y: p4.y - p3.y};
//			var v = crossMul(v1, v3) * crossMul(v2, v3);
//			v1 = {x: p3.x - p1.x, y: p3.y - p1.y};
//			v2 = {x: p4.x - p1.x, y: p4.y - p1.y};
//			v3 = {x: p2.x - p1.x, y: p2.y - p1.y};
//			return (v <= 0 && crossMul(v1, v3) * crossMul(v2, v3)<=0) ? true : false;
    }

    /**
     * 判断两个矩形是否重叠
     * @param {} rect1
     * @param {} rect2
     */
    static rectCross(rect1, rect2) {
        var minX1 = rect1.x;
        var maxX1 = rect1.x + rect1.w;
        var minY1 = rect1.y;
        var maxY1 = rect1.y + rect1.h;
        var minX2 = rect2.x;
        var maxX2 = rect2.x + rect2.w;
        var minY2 = rect2.y;
        var maxY2 = rect2.y + rect2.h;
        if (((minX1 < maxX2) && (minX2 < maxX1)) && ((minY1 < maxY2) && (minY2 < maxY1))) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 一个矩形是否在另一个矩形中
     * @param {} rect1
     * @param {} containerRect 容器矩形
     * @return {Boolean}
     */
    static rectInRect(rect, containerRect) {
        var p1 = { x: rect.x, y: rect.y };
        var p2 = { x: rect.x + rect.w, y: rect.y };
        var p3 = { x: rect.x + rect.w, y: rect.y + rect.h };
        var p4 = { x: rect.x, y: rect.y + rect.h };
        if (this.pointInRect(p1.x, p1.y, containerRect) &&
            this.pointInRect(p2.x, p2.y, containerRect) &&
            this.pointInRect(p3.x, p3.y, containerRect) &&
            this.pointInRect(p4.x, p4.y, containerRect)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 一个点是否在一个多边形中
     */
    static pointInPolygon(point, polygon) {
        var p3, p4;
        var p1 = point;
        var p2 = { x: - 1000000, y: point.y };
        var count = 0;
        //对每条边都和射线作对比，判断是否相交
        for (var i = 0; i < polygon.length - 1; i++) {
            p3 = polygon[i];
            p4 = polygon[i + 1];
            if (Utils.checkCross(p1, p2, p3, p4) == true) {
                count++;
            }
        }
        p3 = polygon[polygon.length - 1];
        p4 = polygon[0];
        if (Utils.checkCross(p1, p2, p3, p4) == true) {
            count++;
        }
        return (count % 2 == 0) ? false : true;
    }

    /**
     * 一个点是否在一个矩形中
     */
    static pointInRect(px, py, rect) {
        if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
            return true;
        }
        return false;
    }

    /**
     * 判断点是否在连接线上
     * @return 如果没在线上，返回-1，否则返回相交点的索引
     */
    static pointInLinker(point, linker, radius) {
        var points = this.getLinkerLinePoints(linker);
        //在x轴上放射两个点(一条线)
        var linex1 = { x: point.x - radius, y: point.y };
        var linex2 = { x: point.x + radius, y: point.y };
        //在y轴上放射两个点(一条线)
        var liney1 = { x: point.x, y: point.y - radius };
        var liney2 = { x: point.x, y: point.y + radius };
        for (var pi = 1; pi < points.length; pi++) {
            var p1 = points[pi - 1];
            var p2 = points[pi];
            var cross = this.checkCross(linex1, linex2, p1, p2);
            if (cross) {
                return pi;
            }
            cross = this.checkCross(liney1, liney2, p1, p2);
            if (cross) {
                return pi;
            }
        }
        return -1;
    }

    /**
     * 获取连接线长度
     * @param {} linker
     */
    static getLinkerLength(linker) {
        var points = this.getLinkerLinePoints(linker);
        var len = 0;
        for (var pi = 1; pi < points.length; pi++) {
            var p1 = points[pi - 1];
            var p2 = points[pi];
            //计算一段的长
            var d = Utils.measureDistance(p1, p2);
            len += d;
        }
        return len;
    }

    /**
     * 获取一个坐标范围内的形状
     */
    static getShapesByRange(range) {
        var result = [];
        for (var shapeId in Model.define.elements) {
            var shape = Model.getShapeById(shapeId);
            var p = shape.props;
            if (shape.name == "linker") {
                //如果连线的几个点都在范围内，则属于
                p = this.getLinkerBox(shape);
            } else {
                p = this.getShapeBox(shape);
            }
            if (this.pointInRect(p.x, p.y, range) &&
                this.pointInRect(p.x + p.w, p.y, range) &&
                this.pointInRect(p.x + p.w, p.y + p.h, range) &&
                this.pointInRect(p.x, p.y + p.h, range)) {
                //如果形状某个点在范围内，则属于
                result.push(shape.id);
            }
        }
        return result;
    }

    /**
     * 创建图形的轮廓
     */
    static getControlBox(shapeIds) {
        var pos = {
            x1: null,
            y1: null,
            x2: null,
            y2: null
        };
        //计算选择框的坐标与宽高
        for (var index = 0; index < shapeIds.length; index++) {
            var shapeId = shapeIds[index];
            var shape = Model.getShapeById(shapeId);
            var p;
            if (shape.name == "linker") {
                p = this.getLinkerBox(shape);
            } else {
                p = this.getShapeBox(shape);
            }
            if (pos.x1 == null || p.x < pos.x1) {
                pos.x1 = p.x;
            }
            if (pos.y1 == null || p.y < pos.y1) {
                pos.y1 = p.y;
            }
            if (pos.x2 == null || p.x + p.w > pos.x2) {
                pos.x2 = p.x + p.w;
            }
            if (pos.y2 == null || p.y + p.h > pos.y2) {
                pos.y2 = p.y + p.h;
            }
        }
        //创建选择框
        var control = {
            x: pos.x1,
            y: pos.y1,
            w: pos.x2 - pos.x1,
            h: pos.y2 - pos.y1
        }
        return control;
    }

    /**
     * 获取图形的轮廓
     */
    static getShapesBounding(shapes) {
        var pos = {
            x1: null,
            y1: null,
            x2: null,
            y2: null
        };
        //计算轮廓的坐标与宽高
        for (var index = 0; index < shapes.length; index++) {
            var shape = shapes[index];
            var p;
            if (shape.name == "linker") {
                p = this.getLinkerBox(shape);
            } else {
                p = shape.props;
            }
            if (pos.x1 == null || p.x < pos.x1) {
                pos.x1 = p.x;
            }
            if (pos.y1 == null || p.y < pos.y1) {
                pos.y1 = p.y;
            }
            if (pos.x2 == null || p.x + p.w > pos.x2) {
                pos.x2 = p.x + p.w;
            }
            if (pos.y2 == null || p.y + p.h > pos.y2) {
                pos.y2 = p.y + p.h;
            }
        }
        //创建轮廓
        var bounding = {
            x: pos.x1,
            y: pos.y1,
            w: pos.x2 - pos.x1,
            h: pos.y2 - pos.y1
        }
        return bounding;
    }

    /**
     * 获取形状的绘制上下文对象
     * @param {} shapeId
     */
    static getShapeContext(shapeId) {
        var shapeBox = Utils.getDomById(shapeId);
        return shapeBox.getElementsByTagName("canvas")[0].getContext("2d");
    }

    /**
     * 选中的图形数组
     * @type {}
     */
    static selectIds= [];

    /**
     * 选中形状
     * @param {} shapeIds 选中图形的id
     * @param {} withCallback 是否施行回调
     */
    static selectShape(shapeIds, withCallback) {
        //如果是字符串，则为选择一个
        if (typeof shapeIds == "string") {
            var shapeId = shapeIds;
            shapeIds = [];
            shapeIds.push(shapeId);
        }
        if (shapeIds.length <= 0) {
            return;
        }
        var selectIds = Utils.mergeArray([], shapeIds); //构建一个新的数组
        //先进行循环，找到与图形组合的图形，一并选中
        for (var i = 0; i < shapeIds.length; i++) {
            var shape = Model.getShapeById(shapeIds[i]);
            if (shape.group) {
                var groupedShapeIds = Model.getGroupShapes(shape.group);
                Utils.mergeArray(selectIds, groupedShapeIds);
            }
        }
        //重新构建一下，如果子元素不允许缩放，选中子元素时，让其选中父元素
        var ids = [];
        for (var i = 0; i < selectIds.length; i++) {
            var id = selectIds[i];
            var shape = Model.getShapeById(id);
            if (shape.parent && shape.resizeDir.length == 0 && ids.indexOf(shape.parent) < 0) {
                ids.push(shape.parent);
            } else if (ids.indexOf(id) < 0) {
                ids.push(id);
            }
        }
        shapeIds = ids;
        Utils.removeAnchors();
        Utils.selectIds = [];
        //设置选中状态
        for (var index = 0; index < shapeIds.length; index++) {
            var shapeId = shapeIds[index];
            var shape = Model.getShapeById(shapeId);
            Utils.selectIds.push(shapeId);
            if (shape.name == "linker") {
                if (this.isLocked(shape.id)) {
                    //锁定，显示叉号
                    Utils.showLockers(shape);
                } else {
                    Designer.painter.renderLinker(shape);
                }
            } else {
                if (this.isLocked(shape.id)) {
                    //锁定，显示叉号
                    Utils.showLockers(shape);
                } else {
                    Utils.showAnchors(shape);
                }
            }
        }
        //拿到选中的图形，不包括锁定的，给这些图形绘制控制器
        var ids = Utils.getSelectedIds();
        var onlyOneLinker = false
        if (ids.length == 1) {
            var first = Model.getShapeById(ids[0]);
            if (first.name == "linker") {
                onlyOneLinker = true;
                Utils.showLinkerControls();
            }
        }
        if (ids.length > 0 && !onlyOneLinker) {
            var control = Designer.painter.drawControls(ids);
        }
        if (typeof withCallback == "undefined") {
            withCallback = true
        }
        if (this.selectCallback && withCallback) {
            this.selectCallback();
        }
        Designer.events.push("selectChanged");
        this.showLinkerCursor();
    }

    /**
     * 选择后回调，比如格式刷
     * @type {}
     */
    static selectCallback= null;

    /**
     * 取消选择
     */
    static unselect() {
        var ids = this.selectIds;
        this.selectIds = [];
        for (var i = 0; i < ids.length; i++) {
            var shapeId = ids[i];
            var shape = Model.getShapeById(shapeId);
            if (shape.name == "linker") {
                Designer.painter.renderLinker(shape);
            }
        }
        $("#shape_controls").hide();
        Utils.removeLockers();
        Utils.removeAnchors();
        Designer.events.push("selectChanged");
        this.hideLinkerCursor();
        this.hideLinkerControls();
    }

    /**
     * 获取选中的图形定义，只获取没有被锁定的
     */
    static getSelected() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (!Utils.isLocked(shapeId)) {
                var define = Model.getShapeById(shapeId);
                result.push(define);
            }
        }
        return result;
    }

    /**
     * 获取选中的图形id，只获取没有被锁定的
     */
    static getSelectedIds() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (!Utils.isLocked(shapeId)) {
                result.push(shapeId);
            }
        }
        return result;
    }

    /**
     * 获取选中的连接线
     */
    static getSelectedLinkers() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (!Utils.isLocked(shapeId)) {
                var define = Model.getShapeById(shapeId);
                if (define.name == "linker") {
                    result.push(define);
                }
            }
        }
        return result;
    }

    /**
     * 获取选中的连接线的id
     */
    static getSelectedLinkerIds() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (!Utils.isLocked(shapeId)) {
                var define = Model.getShapeById(shapeId);
                if (define.name == "linker") {
                    result.push(shapeId);
                }
            }
        }
        return result;
    }

    /**
     * 获取选中的形状的id
     */
    static getSelectedShapeIds() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (!Utils.isLocked(shapeId)) {
                var define = Model.getShapeById(shapeId);
                if (define.name != "linker") {
                    result.push(shapeId);
                }
            }
        }
        return result;
    }

    /**
     * 获取选中的并且被锁定的的id集合
     */
    static getSelectedLockedIds() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            if (Utils.isLocked(shapeId)) {
                result.push(shapeId);
            }
        }
        return result;
    }

    /**
     * 获取选中的组
     * @return {}
     */
    static getSelectedGroups() {
        var result = [];
        for (var i = 0; i < this.selectIds.length; i++) {
            var shapeId = this.selectIds[i];
            var shape = Model.getShapeById(shapeId);
            if (shape.group && result.indexOf(shape.group) < 0) {
                result.push(shape.group);
            }
        }
        return result;
    }

    /**
     * 判断一个图形是否被选中
     * @param {} shapeId
     * @return {}
     */
    static isSelected(shapeId) {
        if (this.selectIds.indexOf(shapeId) >= 0 && !this.isLocked(shapeId)) {
            //被选中了，并且没有锁定
            return true;
        }
        return false;
    }

    /**
     * 判断一个图形是否被锁定
     * @param {} shapeId
     * @return {Boolean}
     */
    static isLocked(shapeId) {
        if (Model.getShapeById(shapeId).locked) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 连接线右边的动画计时器
     * @type {}
     */
    static linkerCursorTimer= null;

    /**
     * 显示从一个形状上连出的连接线上的游标
     */
    static showLinkerCursor() {
        this.hideLinkerCursor();
        var ids = Utils.getSelectedIds();
        if (ids.length == 1) {
            var shape = Model.getShapeById(ids[0]);
            if (shape.name != "linker") {
                //只有一个图形，并且不是连接线，显示从图形上连出来的连接线上的游标
                var linkerIds = Model.linkerMap.map[shape.id];
                if (linkerIds && linkerIds.length) {
                    var cursors = [];
                    for (var i = 0; i < linkerIds.length; i++) {
                        var linkerId = linkerIds[i];
                        var linker = Model.getShapeById(linkerId);
                        if (shape.id != linker.from.id || !linker.to.id) {
                            continue;
                        }
                        //得到连线的总长度
                        var len = this.getLinkerLength(linker).toScale();
                        var points = [];
                        if (linker.linkerType == "broken") {
                            //如果是折线，计算每一个点在整条线上的t值
                            points.push({ x: linker.from.x.toScale(), y: linker.from.y.toScale(), t: 0 });
                            for (var pi = 0; pi < linker.points.length; pi++) {
                                var p = linker.points[pi];
                                points.push({ x: p.x.toScale(), y: p.y.toScale() });
                            }
                            points.push({ x: linker.to.x.toScale(), y: linker.to.y.toScale() });
                            var d = 0;
                            for (var pi = 1; pi < points.length; pi++) {
                                var p1 = points[pi - 1];
                                var p2 = points[pi];
                                //计算一段的长，和一段在总长度上所占的t值
                                d += Utils.measureDistance(p1, p2);
                                p2.t = d / len;
                            }
                        }
                        var curCount = Math.floor(len / 120) + 1;
                        //每一帧移动1像素，除以线条长度，得到每一次移动的t值
                        var tStep = 3 / len;
                        var maxT = (Math.ceil(len / 120) * 120) / len;
                        var curPos = 0;
                        while (curPos < len) {
                            //得到连线上所有的游标对象
                            var cur = {
                                t: curPos / len,
                                step: tStep,
                                linker: linker,
                                points: points,
                                maxT: maxT
                            };
                            cursors.push(cur);
                            curPos += 120;
                        }
                    }
                    this.playLinkerCursor(cursors);
                }
            }
        }
    }

    /**
     * 移动连接线上的游标
     */
    static playLinkerCursor(cursors) {
        for (var i = 0; i < cursors.length; i++) {
            var cursor = cursors[i];
            var dom = $("<div class='linker_cursor'></div>").appendTo("#designer_canvas");
            var linker = cursor.linker;
            var size = (linker.lineStyle.lineWidth + 2).toScale();
            if (size < 5) {
                size = 5;
            }
            var half = size / 2;
            cursor.half = half;
            cursor.dom = dom;
            dom.css({
                width: size,
                height: size,
                "-webkit-border-radius": half,
                "-moz-border-radius": half,
                "-ms-border-radius": half,
                "-o-border-radius": half,
                "border-radius": half,
                "z-index": $("#" + linker.id).css("z-index")
            });
        }
        this.linkerCursorTimer = setInterval(function() {
                for (var i = 0; i < cursors.length; i++) {
                    var cursor = cursors[i];
                    var linker = cursor.linker;
                    if (cursor.t >= cursor.maxT) {
                        cursor.t = 0;
                        cursor.dom.show();
                    }
                    var t = cursor.t;
                    if (linker.linkerType == "broken") {
                        for (var pi = 1; pi < cursor.points.length; pi++) {
                            var p1 = cursor.points[pi - 1];
                            var p2 = cursor.points[pi];
                            if (t >= p1.t && t < p2.t) {
                                //游标在两点之间，计算在此条线段上的t值
                                var pt = (t - p1.t) / (p2.t - p1.t);
                                var x = (1 - pt) * p1.x + pt * p2.x;
                                var y = (1 - pt) * p1.y + pt * p2.y;
                                cursor.dom.css({
                                    left: x - cursor.half,
                                    top: y - cursor.half
                                });
                                break;
                            }
                        }
                    } else if (linker.linkerType == "curve") {
                        //曲线时，根据公式：B(t) = P0(1-t)^3 + 3P1t(1-t)^2 + 3P2t^2(1-t) + P3t^3，t=0.5时，在线中点
                        var p0 = linker.from;
                        var p1 = linker.points[0];
                        var p2 = linker.points[1];
                        var p3 = linker.to;
                        var x = p0.x.toScale() * Math.pow((1 - t), 3) +
                            p1.x.toScale() * t * Math.pow((1 - t), 2) * 3 +
                            p2.x.toScale() * Math.pow(t, 2) * (1 - t) * 3 +
                            p3.x.toScale() * Math.pow(t, 3);
                        var y = p0.y.toScale() * Math.pow((1 - t), 3) +
                            p1.y.toScale() * t * Math.pow((1 - t), 2) * 3 +
                            p2.y.toScale() * Math.pow(t, 2) * (1 - t) * 3 +
                            p3.y.toScale() * Math.pow(t, 3);
                        cursor.dom.css({
                            left: x - cursor.half,
                            top: y - cursor.half
                        });
                    } else {
                        var x = (1 - t) * linker.from.x.toScale() + t * linker.to.x.toScale();
                        var y = (1 - t) * linker.from.y.toScale() + t * linker.to.y.toScale();
                        cursor.dom.css({
                            left: x - cursor.half,
                            top: y - cursor.half
                        });
                    }
                    cursor.t += cursor.step;
                    if (cursor.t >= 1) {
                        cursor.dom.hide();
                    }
                }
            },
            30);
    }

    /**
     * 隐藏连接线游标
     */
    static hideLinkerCursor() {
        if (this.linkerCursorTimer) {
            clearInterval(this.linkerCursorTimer);
        }
        $(".linker_cursor").remove();
    }

    /**
     * 绘制连接线上的控件
     */
    static showLinkerControls() {
        this.hideLinkerControls();
        var ids = Utils.getSelectedIds();
        var linker = null;
        if (ids.length == 1) {
            var shape = Model.getShapeById(ids[0]);
            if (shape.name == "linker" && shape.linkerType == "curve") {
                linker = shape;
            }
        }
        if (linker == null) {
            return;
        }

        function createControl(linker, ty) {
            //计算点之间的距离，即为线条的长度
            var fixed = null;
            var cursor = null;
            if (ty == "from") {
                fixed = linker.from;
                cursor = linker.points[0];
            } else {
                fixed = linker.to;
                cursor = linker.points[1];
            }
            var len = Utils.measureDistance(fixed, cursor).toScale() - 6; //固定点和活动点的距离
            //两条线的中点
            var mid = {
                x: (0.5 * fixed.x + 0.5 * cursor.x).toScale(),
                y: (0.5 * fixed.y + 0.5 * cursor.y).toScale()
            };
            var angle = Utils.getAngle(fixed, cursor) + Math.PI / 2;
            var line = $("<div class='linker_control_line'></div>").appendTo("#designer_canvas");
            var point = $("<div class='linker_control_point'></div>").appendTo("#designer_canvas");
            var deg = Math.round(angle / (Math.PI * 2) * 360);
            var degStr = "rotate(" + deg + "deg)";
            line.css({
                left: mid.x,
                top: mid.y - len / 2,
                height: len,
                "z-index": Model.orderList.length,
                "-webkit-transform": degStr,
                "-ms-transform": degStr,
                "-o-transform": degStr,
                "-moz-transform": degStr,
                "transform": degStr
            });
            point.css({
                left: cursor.x.toScale() - 4,
                top: cursor.y.toScale() - 4,
                "z-index": Model.orderList.length
            });
            point.attr("ty", ty);
            point.unbind().bind("mousedown",
                function(downE) {
                    linker = Model.getShapeById(linker.id);
                    var cursor = null;
                    if (ty == "from") {
                        cursor = linker.points[0];
                    } else {
                        cursor = linker.points[1];
                    }
                    downE.stopPropagation();
                    point.addClass("moving");
                    Designer.op.changeState("changing_curve");
                    $(document).bind("mousemove.change_curve",
                        function(e) {
                            var pos = Utils.getRelativePos(e.pageX, e.pageY, $("#designer_canvas"));
                            cursor.x = pos.x;
                            cursor.y = pos.y;
                            Designer.painter.renderLinker(linker);
                            Model.define.elements[linker.id] = linker;
                            Utils.showLinkerControls();
                            $(".linker_control_point[ty=" + point.attr("ty") + "]").addClass("moving");
                            //放在mousemove中进行绑定，意义是在发生了拖动后，才会触发mouseup事件
                            $(document).unbind("mouseup.changed_curve").bind("mouseup.changed_curve",
                                function(e) {
                                    Model.update(linker);
                                    $(document).unbind("mouseup.changed_curve")
                                });
                        });
                    $(document).unbind("mouseup.change_curve").bind("mouseup.change_curve",
                        function(e) {
                            $(document).unbind("mouseup.change_curve");
                            $(document).unbind("mousemove.change_curve");
                            $(".linker_control_point").removeClass("moving");
                            Designer.op.resetState();
                        });
                });
            return point;
        }

        createControl(linker, "from");
        createControl(linker, "to");
    }

    /**
     * 隐藏连接线上的控件
     */
    static hideLinkerControls() {
        $(".linker_control_line").remove();
        $(".linker_control_point").remove();
    }

    /**
     * 显示锚点
     * @param shape 形状对象
     */
    static showAnchors(shape) {
        if ($(".shape_contour[forshape=" + shape.id + "]").length > 0) {
            return;
        }
        //创建图形的矩形轮廓
        var contour = $("<div class='shape_contour' forshape='" + shape.id + "'></div>")
            .appendTo($("#designer_canvas"));
        contour.css({
            left: shape.props.x.toScale(),
            top: shape.props.y.toScale(),
            //Z轴坐标比选择轮廓大1
            "z-index": Model.orderList.length + 1
        });
        if (!Utils.isSelected(shape.id)) {
            contour.addClass("hovered_contour");
        }
        //将锚点添加到轮廓中去
        var wh = Designer.config.anchorSize - 2;
        var anchorStyle = {
            "border-color": Designer.config.anchorColor,
            "border-radius": Designer.config.anchorSize / 2,
            width: wh,
            height: wh
        };
        var anchors = shape.getAnchors();
        var shapeCenter = { x: shape.props.w / 2, y: shape.props.h / 2 };
        var angle = shape.props.angle;
        for (var ai = 0; ai < anchors.length; ai++) {
            var an = anchors[ai];
            var anchorDom = $("<div class='shape_anchor'></div>").appendTo(contour);
            var rotated = this.getRotated(shapeCenter, an, angle);
            anchorStyle.left = rotated.x.toScale() - Designer.config.anchorSize / 2;
            anchorStyle.top = rotated.y.toScale() - Designer.config.anchorSize / 2;
            anchorDom.css(anchorStyle);
        }
    }

    /**
     * 隐藏锚点
     * 此处只隐藏鼠标悬浮时的锚点
     */
    static hideAnchors() {
        $(".hovered_contour").remove();
    }

    /**
     * 隐藏锚点
     * 隐藏所有锚点
     */
    static removeAnchors() {
        $(".shape_contour").remove();
    }

    /**
     * 对锁定的图形，显示叉号
     * @param shape 形状对象
     */
    static showLockers(shape) {
        var shapeBox = $("#" + shape.id);
        var pos = shapeBox.position();

        //创建锁定点
        function createLocker() {
            var locker = $("<canvas class='shape_locker' width='10px' height='10px'></canvas>").appendTo(shapeBox);
            var ctx = locker[0].getContext("2d");
            ctx.strokeStyle = "#777"
            ctx.lineWidth = 1;
            var w = 9;
            ctx.beginPath();
            ctx.moveTo(2, 2);
            ctx.lineTo(w, w);
            ctx.moveTo(2, w);
            ctx.lineTo(w, 2);
            ctx.stroke();
            return locker;
        }

        //设置锁定点
        function setLocker(p) {
            var locker = createLocker();
            locker.css({
                left: p.x.toScale() - pos.left - 5,
                top: p.y.toScale() - pos.top - 5
            });
        }

        if (shape.name != "linker") {
            var p = shape.props;
            var center = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
            var p1 = this.getRotated(center, { x: p.x, y: p.y }, shape.props.angle);
            setLocker(p1);
            var p2 = this.getRotated(center, { x: p.x + p.w, y: p.y }, shape.props.angle);
            setLocker(p2);
            var p3 = this.getRotated(center, { x: p.x + p.w, y: p.y + p.h }, shape.props.angle);
            setLocker(p3);
            var p4 = this.getRotated(center, { x: p.x, y: p.y + p.h }, shape.props.angle);
            setLocker(p4);
        } else {
            setLocker(shape.from);
            setLocker(shape.to);
        }
    }

    /**
     * 隐藏锚点
     * 隐藏所有锚点
     */
    static removeLockers() {
        $(".shape_locker").remove();
    }

    /**
     * 测量两点间距离
     * @param {} p1
     * @param {} p2
     * @return {}
     */
    static measureDistance(p1, p2) {
        var h = p2.y - p1.y;
        var w = p2.x - p1.x;
        return Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
    }

    /**
     * 从数组中删除一个元素
     * @param {} array
     * @param {} element
     */
    static removeFromArray(array, element) {
        var index = array.indexOf(element);
        if (index >= 0) {
            array.splice(index, 1);
        }
        return array;
    }

    /**
     * 添加到数据，不允许重复
     * @param {} array
     * @param {} element
     * @return {}
     */
    static addToArray(array, element) {
        var index = array.indexOf(element);
        if (index < 0) {
            array.push(element);
        }
        return array;
    }

    /**
     * 合并两个数组
     * @param {} arr1
     * @param {} arr2
     */
    static mergeArray(arr1, arr2) {
        for (var i = 0; i < arr2.length; i++) {
            var ele = arr2[i];
            if (arr1.indexOf(ele) < 0) {
                arr1.push(ele);
            }
        }
        return arr1;
    }

    /**
     * 获取一个点坐标外围呈圆形的N个点
     * @param {} x
     * @param {} y
     */
    static getCirclePoints(x, y, r) {
        var angle = Math.PI / 18; //每10度一个点
        var points = [];
        //从左边的点开始，顺时针方向
        for (var i = 0; i < 36; i++) {
            var pointAngle = angle * i;
            var p = {
                x: x - Math.cos(pointAngle) * r,
                y: y - Math.sin(pointAngle) * r,
                angle: pointAngle
            };
            points.push(p);
        }
        return points;
    }

    /**
     * 获取连接点相对于形状的角度
     */
    static getPointAngle(shapeId, x, y, r) {
        var shapeBoxPos = $("#" + shapeId).position();
        var shapeCtx = Utils.getShapeContext(shapeId);
        //把x, y换算成相对于画布的相对坐标
        x = x.toScale() - shapeBoxPos.left;
        y = y.toScale() - shapeBoxPos.top;
        var circle = this.getCirclePoints(x, y, r);
        var len = circle.length;
        var exists = false;
        //先循环分别判断每个点是否在图形内
        for (var i = 0; i < len; i++) {
            var p = circle[i];
            if (shapeCtx.isPointInPath(p.x, p.y)) {
                p.inPath = true;
                exists = true;
            } else {
                p.inPath = false;
            }
        }
        if (exists == false) {
            //如果没有在图形内的点，则认为当前坐标不在图形边界上，直接return null
            return null;
        }
        var begin = null;
        var end = null;
        for (var i = 0; i < len; i++) {
            var p = circle[i];
            if (!p.inPath) {
                //如果当前点不在图形内，判断旁边是否有点是在图形内的
                if (begin == null) {
                    var pre = circle[(i - 1 + len) % len];
                    if (pre.inPath) {
                        //如果此点前面的点在图形中，则此点为第一个在图形外的点
                        begin = p.angle;
                    }
                }
                if (end == null) {
                    var next = circle[(i + 1 + len) % len];
                    if (next.inPath) {
                        //如果此点前面的点在图形中，则此点为第一个在图形外的点
                        end = p.angle;
                    }
                }
                if (begin != null && end != null) {
                    break;
                }
            }
        }
        //取两个夹角的一半，由于有时end的角度要小于begin的角度，所以要加Math.PI，然后再模
        var diff = (Math.PI * 2 + end - begin) % (Math.PI * 2) / 2;
        //由于有时begin + 夹角的角度要小于begin的角度，所以要加Math.PI，然后再模
        var angle = (begin + diff) % (Math.PI * 2);
        return angle;
    }

    /**
     * 获取角度的方向，分为上1右2下3左4
     */
    static getAngleDir(angle) {
        var pi = Math.PI;
        if (angle >= pi / 4 && angle < pi / 4 * 3) {
            return 1; //上
        } else if (angle >= pi / 4 * 3 && angle < pi / 4 * 5) {
            return 2; //右
        } else if (angle >= pi / 4 * 5 && angle < pi / 4 * 7) {
            return 3; //下
        } else {
            return 4; //左
        }
    }

    /**
     * 获取连接线上的几个控制点点
     */
    static getLinkerPoints(linker) {
        var points = [];
        if (linker.linkerType == "broken") {
            var pi = Math.PI;
            var from = linker.from;
            var to = linker.to;
            var xDistance = Math.abs(to.x - from.x);
            var yDistance = Math.abs(to.y - from.y);
            var minDistance = 30; //最小距离，比如起点向上，终点在下方，则先要往上画minDistance的距离
            //折线，取折点
            if (from.id != null && to.id != null) {
                //起点和终点都连接了形状
                var fromDir = this.getAngleDir(from.angle); //起点方向
                var toDir = this.getAngleDir(to.angle); //终点方向
                var fixed, active, reverse; //固定点、移动点、是否需要逆序
                //以起点为判断依据，可以涵盖所有情况
                if (fromDir == 1 && toDir == 1) {
                    //情况1：两个点都向上
                    if (from.y < to.y) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.x >= fixedProps.x - minDistance &&
                        active.x <= fixedProps.x + fixedProps.w + minDistance) {
                        var x;
                        if (active.x < fixedProps.x + fixedProps.w / 2) {
                            x = fixedProps.x - minDistance;
                        } else {
                            x = fixedProps.x + fixedProps.w + minDistance;
                        }
                        var y = fixed.y - minDistance;
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: x, y: y });
                        y = active.y - minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var y = fixed.y - minDistance;
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if (fromDir == 3 && toDir == 3) {
                    //情况2：两个点都向下
                    if (from.y > to.y) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.x >= fixedProps.x - minDistance &&
                        active.x <= fixedProps.x + fixedProps.w + minDistance) {
                        var y = fixed.y + minDistance;
                        var x;
                        if (active.x < fixedProps.x + fixedProps.w / 2) {
                            x = fixedProps.x - minDistance;
                        } else {
                            x = fixedProps.x + fixedProps.w + minDistance;
                        }
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: x, y: y });
                        y = active.y + minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var y = fixed.y + minDistance;
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if (fromDir == 2 && toDir == 2) {
                    //情况3：两点都向右
                    if (from.x > to.x) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.y >= fixedProps.y - minDistance &&
                        active.y <= fixedProps.y + fixedProps.h + minDistance) {
                        var x = fixed.x + minDistance;
                        var y;
                        if (active.y < fixedProps.y + fixedProps.h / 2) {
                            y = fixedProps.y - minDistance;
                        } else {
                            y = fixedProps.y + fixedProps.h + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        x = active.x + minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: x, y: active.y });
                    } else {
                        var x = fixed.x + minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: active.y });
                    }
                } else if (fromDir == 4 && toDir == 4) {
                    //情况4：两点都向左
                    if (from.x < to.x) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.y >= fixedProps.y - minDistance &&
                        active.y <= fixedProps.y + fixedProps.h + minDistance) {
                        var x = fixed.x - minDistance;
                        var y;
                        if (active.y < fixedProps.y + fixedProps.h / 2) {
                            y = fixedProps.y - minDistance;
                        } else {
                            y = fixedProps.y + fixedProps.h + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        x = active.x - minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: x, y: active.y });
                    } else {
                        var x = fixed.x - minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: active.y });
                    }
                } else if ((fromDir == 1 && toDir == 3) || (fromDir == 3 && toDir == 1)) {
                    //情况5：一个点向上，一个点向下
                    if (fromDir == 1) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.y <= fixed.y) {
                        var y = fixed.y - yDistance / 2;
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var fixedRight = fixedProps.x + fixedProps.w;
                        var activeRight = activeProps.x + activeProps.w;
                        var y = fixed.y - minDistance;
                        var x;
                        if (activeRight >= fixedProps.x && activeProps.x <= fixedRight) {
                            //x轴重叠的情况
                            var half = fixedProps.x + fixedProps.w / 2;
                            if (active.x < half) {
                                //从左边绕
                                x = fixedProps.x < activeProps.x
                                    ? fixedProps.x - minDistance
                                    : activeProps.x - minDistance;
                            } else {
                                //从右边绕
                                x = fixedRight > activeRight ? fixedRight + minDistance : activeRight + minDistance;
                            }
                            if (activeProps.y < fixed.y) {
                                y = activeProps.y - minDistance;
                            }
                        } else {
                            if (active.x < fixed.x) {
                                x = activeRight + (fixedProps.x - activeRight) / 2;
                            } else {
                                x = fixedRight + (activeProps.x - fixedRight) / 2;
                            }
                        }
                        points.push({ x: fixed.x, y: y });
                        points.push({ x: x, y: y });
                        y = active.y + minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if ((fromDir == 2 && toDir == 4) || (fromDir == 4 && toDir == 2)) {
                    //情况6：一个点向右，一个点向左
                    if (fromDir == 2) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.x > fixed.x) {
                        var x = fixed.x + xDistance / 2;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: active.y });
                    } else {
                        var fixedBottom = fixedProps.y + fixedProps.h;
                        var activeBottom = activeProps.y + activeProps.h;
                        var x = fixed.x + minDistance;
                        var y;
                        if (activeBottom >= fixedProps.y && activeProps.y <= fixedBottom) {
                            //y轴重叠的情况
                            var half = fixedProps.y + fixedProps.h / 2;
                            if (active.y < half) {
                                //从上边绕
                                y = fixedProps.y < activeProps.y
                                    ? fixedProps.y - minDistance
                                    : activeProps.y - minDistance;
                            } else {
                                //从下边绕
                                y = fixedBottom > activeBottom ? fixedBottom + minDistance : activeBottom + minDistance;
                            }
                            if (activeProps.x + activeProps.w > fixed.x) {
                                x = activeProps.x + activeProps.w + minDistance;
                            }
                        } else {
                            if (active.y < fixed.y) {
                                y = activeBottom + (fixedProps.y - activeBottom) / 2;
                            } else {
                                y = fixedBottom + (activeProps.y - fixedBottom) / 2;
                            }
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        x = active.x - minDistance;
                        points.push({ x: x, y: y });
                        points.push({ x: x, y: active.y });
                    }
                } else if ((fromDir == 1 && toDir == 2) || (fromDir == 2 && toDir == 1)) {
                    //情况7：一个点向上，一个点向右
                    if (fromDir == 2) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.x > fixed.x && active.y > fixed.y) {
                        points.push({ x: active.x, y: fixed.y });
                    } else if (active.x > fixed.x && activeProps.x > fixed.x) {
                        var x;
                        if (activeProps.x - fixed.x < minDistance * 2) {
                            x = fixed.x + (activeProps.x - fixed.x) / 2;
                        } else {
                            x = fixed.x + minDistance;
                        }
                        var y = active.y - minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else if (active.x <= fixed.x && active.y > fixedProps.y + fixedProps.h) {
                        var fixedBottom = fixedProps.y + fixedProps.h;
                        var x = fixed.x + minDistance;
                        var y
                        if (active.y - fixedBottom < minDistance * 2) {
                            y = fixedBottom + (active.y - fixedBottom) / 2;
                        } else {
                            y = active.y - minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var x;
                        var activeRight = activeProps.x + activeProps.w;
                        if (activeRight > fixed.x) {
                            x = activeRight + minDistance;
                        } else {
                            x = fixed.x + minDistance;
                        }
                        var y;
                        if (active.y < fixedProps.y) {
                            y = active.y - minDistance;
                        } else {
                            y = fixedProps.y - minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if ((fromDir == 1 && toDir == 4) || (fromDir == 4 && toDir == 1)) {
                    //情况8：一个点向上，一个点向左
                    if (fromDir == 4) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    var activeRight = activeProps.x + activeProps.w;
                    if (active.x < fixed.x && active.y > fixed.y) {
                        points.push({ x: active.x, y: fixed.y });
                    } else if (active.x < fixed.x && activeRight < fixed.x) {
                        var x;
                        if (fixed.x - activeRight < minDistance * 2) {
                            x = activeRight + (fixed.x - activeRight) / 2;
                        } else {
                            x = fixed.x - minDistance;
                        }
                        var y = active.y - minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else if (active.x >= fixed.x && active.y > fixedProps.y + fixedProps.h) {
                        var fixedBottom = fixedProps.y + fixedProps.h;
                        var x = fixed.x - minDistance;
                        var y
                        if (active.y - fixedBottom < minDistance * 2) {
                            y = fixedBottom + (active.y - fixedBottom) / 2;
                        } else {
                            y = active.y - minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var x;
                        if (activeProps.x < fixed.x) {
                            x = activeProps.x - minDistance;
                        } else {
                            x = fixed.x - minDistance;
                        }
                        var y;
                        if (active.y < fixedProps.y) {
                            y = active.y - minDistance;
                        } else {
                            y = fixedProps.y - minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if ((fromDir == 2 && toDir == 3) || (fromDir == 3 && toDir == 2)) {
                    //情况9：一个点向右，一个点向下
                    if (fromDir == 2) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    if (active.x > fixed.x && active.y < fixed.y) {
                        points.push({ x: active.x, y: fixed.y });
                    } else if (active.x > fixed.x && activeProps.x > fixed.x) {
                        var x;
                        if (activeProps.x - fixed.x < minDistance * 2) {
                            x = fixed.x + (activeProps.x - fixed.x) / 2;
                        } else {
                            x = fixed.x + minDistance;
                        }
                        var y = active.y + minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else if (active.x <= fixed.x && active.y < fixedProps.y) {
                        var x = fixed.x + minDistance;
                        var y
                        if (fixedProps.y - active.y < minDistance * 2) {
                            y = active.y + (fixedProps.y - active.y) / 2;
                        } else {
                            y = active.y + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var x;
                        var activeRight = activeProps.x + activeProps.w;
                        if (activeRight > fixed.x) {
                            x = activeRight + minDistance;
                        } else {
                            x = fixed.x + minDistance;
                        }
                        var y;
                        if (active.y > fixedProps.y + fixedProps.h) {
                            y = active.y + minDistance;
                        } else {
                            y = fixedProps.y + fixedProps.h + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                } else if ((fromDir == 3 && toDir == 4) || (fromDir == 4 && toDir == 3)) {
                    //情况10：一个点向下，一个点向左
                    if (fromDir == 4) {
                        fixed = from;
                        active = to;
                        reverse = false;
                    } else {
                        fixed = to;
                        active = from;
                        reverse = true;
                    }
                    var fixedProps = Model.getShapeById(fixed.id).props;
                    var activeProps = Model.getShapeById(active.id).props;
                    var activeRight = activeProps.x + activeProps.w;
                    if (active.x < fixed.x && active.y < fixed.y) {
                        points.push({ x: active.x, y: fixed.y });
                    } else if (active.x < fixed.x && activeRight < fixed.x) {
                        var x;
                        if (fixed.x - activeRight < minDistance * 2) {
                            x = activeRight + (fixed.x - activeRight) / 2;
                        } else {
                            x = fixed.x - minDistance;
                        }
                        var y = active.y + minDistance;
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else if (active.x >= fixed.x && active.y < fixedProps.y) {
                        var x = fixed.x - minDistance;
                        var y
                        if (fixedProps.y - active.y < minDistance * 2) {
                            y = active.y + (fixedProps.y - active.y) / 2;
                        } else {
                            y = active.y + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    } else {
                        var x;
                        if (activeProps.x < fixed.x) {
                            x = activeProps.x - minDistance;
                        } else {
                            x = fixed.x - minDistance;
                        }
                        var y;
                        if (active.y > fixedProps.y + fixedProps.h) {
                            y = active.y + minDistance;
                        } else {
                            y = fixedProps.y + fixedProps.h + minDistance;
                        }
                        points.push({ x: x, y: fixed.y });
                        points.push({ x: x, y: y });
                        points.push({ x: active.x, y: y });
                    }
                }
                if (reverse) {
                    points.reverse();
                }
            } else if (from.id != null || to.id != null) {
                //只有起点或终点连接了形状
                //连接了形状的端点被认为是固定点，另一点被认为是活动的点
                var fixed, active, reverse, angle;
                if (from.id != null) {
                    fixed = from;
                    active = to;
                    reverse = false;
                    angle = from.angle
                } else {
                    fixed = to;
                    active = from;
                    reverse = true; //如果固定点是终点，需要把得到的点逆序，因为绘制时是从起点开始的，而此处计算获得的点将是从终点开始
                    angle = to.angle
                }
                var props = Model.getShapeById(fixed.id).props;
                if (angle >= pi / 4 && angle < pi / 4 * 3) {
                    //起点角度为向上
                    if (active.y < fixed.y) {
                        //终点在起点图形上方
                        if (xDistance >= yDistance) {
                            //如果终点离起点的水平距离较远，最终方向为水平，此情况下只有一个折点
                            points.push({ x: fixed.x, y: active.y });
                        } else {
                            //如果终点离起点的垂直距离较远，最终方向为向上，此情况下有两个折点
                            var half = yDistance / 2;
                            points.push({ x: fixed.x, y: fixed.y - half });
                            points.push({ x: active.x, y: fixed.y - half });
                        }
                    } else {
                        //终点在起点水平平行或下方的位置
                        points.push({ x: fixed.x, y: fixed.y - minDistance }); //先向上画一笔
                        if (xDistance >= yDistance) {
                            //如果终点离起点的水平距离较远，最终方向为水平
                            if (active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance) {
                                //如果终点在x轴上的坐标，在图形范围内，在判断终点与形状是偏左还是偏右
                                var shapeHalf = props.x + props.w / 2;
                                if (active.x < shapeHalf) {
                                    //偏左，第二点在形状左上角
                                    points.push({ x: props.x - minDistance, y: fixed.y - minDistance });
                                    points.push({ x: props.x - minDistance, y: active.y });
                                } else {
                                    points.push({ x: props.x + props.w + minDistance, y: fixed.y - minDistance });
                                    points.push({ x: props.x + props.w + minDistance, y: active.y });
                                }
                            } else {
                                //如果终点在x轴上的坐标，在图形范围外，此时有三个点
                                if (active.x < props.x) {
                                    points.push({ x: active.x + minDistance, y: fixed.y - minDistance });
                                    points.push({ x: active.x + minDistance, y: active.y });
                                } else {
                                    points.push({ x: active.x - minDistance, y: fixed.y - minDistance });
                                    points.push({ x: active.x - minDistance, y: active.y });
                                }
                            }
                        } else {
                            //如果终点离起点的垂直距离较远，最终方向为向下
                            if (active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance) {
                                //如果终点在x轴上的坐标，在图形范围内，此时有四个点
                                //在判断终点与形状是偏左还是偏右
                                var shapeHalf = props.x + props.w / 2;
                                if (active.x < shapeHalf) {
                                    //偏左，第二点在形状左上角
                                    points.push({ x: props.x - minDistance, y: fixed.y - minDistance });
                                    points.push({ x: props.x - minDistance, y: active.y - minDistance });
                                    points.push({ x: active.x, y: active.y - minDistance });
                                } else {
                                    points.push({ x: props.x + props.w + minDistance, y: fixed.y - minDistance });
                                    points.push({ x: props.x + props.w + minDistance, y: active.y - minDistance });
                                    points.push({ x: active.x, y: active.y - minDistance });
                                }
                            } else {
                                //如果终点在x轴上的坐标，在图形范围外，此时有两个点
                                points.push({ x: active.x, y: fixed.y - minDistance });
                            }
                        }
                    }
                } else if (angle >= pi / 4 * 3 && angle < pi / 4 * 5) {
                    //起点角度为向右
                    if (active.x > fixed.x) {
                        //终点在起点图形右方
                        if (xDistance >= yDistance) {
                            //如果终点离起点的水平距离较远，最终方向为水平，此情况下有两个折点
                            var half = xDistance / 2;
                            points.push({ x: fixed.x + half, y: fixed.y });
                            points.push({ x: fixed.x + half, y: active.y });
                        } else {
                            //如果终点离起点的垂直距离较远，最终方向为垂直，此情况下只有一个折点
                            points.push({ x: active.x, y: fixed.y });
                        }
                    } else {
                        points.push({ x: fixed.x + minDistance, y: fixed.y });
                        if (xDistance >= yDistance) {
                            //如果终点离起点的水平距离较远，最终方向为水平
                            if (active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance) {
                                //如果终点在y轴上的坐标，在图形范围内，在判断终点与形状是偏上还是偏下
                                var shapeHalf = props.y + props.h / 2;
                                if (active.y < shapeHalf) {
                                    //偏上，第二点在形状右上角
                                    points.push({ x: fixed.x + minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x + minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x + minDistance, y: active.y });
                                } else {
                                    points.push({ x: fixed.x + minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x + minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x + minDistance, y: active.y });
                                }
                            } else {
                                points.push({ x: fixed.x + minDistance, y: active.y });
                            }
                        } else {
                            //如果终点离起点的垂直距离较远，最终方向为向下
                            if (active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance) {
                                var shapeHalf = props.y + props.h / 2;
                                if (active.y < shapeHalf) {
                                    points.push({ x: fixed.x + minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x, y: props.y - minDistance });
                                } else {
                                    points.push({ x: fixed.x + minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x, y: props.y + props.h + minDistance });
                                }
                            } else {
                                if (active.y < fixed.y) {
                                    points.push({ x: fixed.x + minDistance, y: active.y + minDistance });
                                    points.push({ x: active.x, y: active.y + minDistance });
                                } else {
                                    points.push({ x: fixed.x + minDistance, y: active.y - minDistance });
                                    points.push({ x: active.x, y: active.y - minDistance });
                                }
                            }
                        }
                    }
                } else if (angle >= pi / 4 * 5 && angle < pi / 4 * 7) {
                    //起点角度为向下
                    if (active.y > fixed.y) {
                        if (xDistance >= yDistance) {
                            points.push({ x: fixed.x, y: active.y });
                        } else {
                            var half = yDistance / 2;
                            points.push({ x: fixed.x, y: fixed.y + half });
                            points.push({ x: active.x, y: fixed.y + half });
                        }
                    } else {
                        points.push({ x: fixed.x, y: fixed.y + minDistance });
                        if (xDistance >= yDistance) {
                            if (active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance) {
                                var shapeHalf = props.x + props.w / 2;
                                if (active.x < shapeHalf) {
                                    points.push({ x: props.x - minDistance, y: fixed.y + minDistance });
                                    points.push({ x: props.x - minDistance, y: active.y });
                                } else {
                                    points.push({ x: props.x + props.w + minDistance, y: fixed.y + minDistance });
                                    points.push({ x: props.x + props.w + minDistance, y: active.y });
                                }
                            } else {
                                if (active.x < props.x) {
                                    points.push({ x: active.x + minDistance, y: fixed.y + minDistance });
                                    points.push({ x: active.x + minDistance, y: active.y });
                                } else {
                                    points.push({ x: active.x - minDistance, y: fixed.y + minDistance });
                                    points.push({ x: active.x - minDistance, y: active.y });
                                }
                            }
                        } else {
                            if (active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance) {
                                var shapeHalf = props.x + props.w / 2;
                                if (active.x < shapeHalf) {
                                    points.push({ x: props.x - minDistance, y: fixed.y + minDistance });
                                    points.push({ x: props.x - minDistance, y: active.y + minDistance });
                                    points.push({ x: active.x, y: active.y + minDistance });
                                } else {
                                    points.push({ x: props.x + props.w + minDistance, y: fixed.y + minDistance });
                                    points.push({ x: props.x + props.w + minDistance, y: active.y + minDistance });
                                    points.push({ x: active.x, y: active.y + minDistance });
                                }
                            } else {
                                points.push({ x: active.x, y: fixed.y + minDistance });
                            }
                        }
                    }
                } else {
                    //起点角度为向左
                    if (active.x < fixed.x) {
                        if (xDistance >= yDistance) {
                            var half = xDistance / 2;
                            points.push({ x: fixed.x - half, y: fixed.y });
                            points.push({ x: fixed.x - half, y: active.y });
                        } else {
                            points.push({ x: active.x, y: fixed.y });
                        }
                    } else {
                        points.push({ x: fixed.x - minDistance, y: fixed.y });
                        if (xDistance >= yDistance) {
                            if (active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance) {
                                var shapeHalf = props.y + props.h / 2;
                                if (active.y < shapeHalf) {
                                    points.push({ x: fixed.x - minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x - minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x - minDistance, y: active.y });
                                } else {
                                    points.push({ x: fixed.x - minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x - minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x - minDistance, y: active.y });
                                }
                            } else {
                                points.push({ x: fixed.x - minDistance, y: active.y });
                            }
                        } else {
                            //如果终点离起点的垂直距离较远，最终方向为向下
                            if (active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance) {
                                var shapeHalf = props.y + props.h / 2;
                                if (active.y < shapeHalf) {
                                    points.push({ x: fixed.x - minDistance, y: props.y - minDistance });
                                    points.push({ x: active.x, y: props.y - minDistance });
                                } else {
                                    points.push({ x: fixed.x - minDistance, y: props.y + props.h + minDistance });
                                    points.push({ x: active.x, y: props.y + props.h + minDistance });
                                }
                            } else {
                                if (active.y < fixed.y) {
                                    points.push({ x: fixed.x - minDistance, y: active.y + minDistance });
                                    points.push({ x: active.x, y: active.y + minDistance });
                                } else {
                                    points.push({ x: fixed.x - minDistance, y: active.y - minDistance });
                                    points.push({ x: active.x, y: active.y - minDistance });
                                }
                            }
                        }
                    }
                }
                if (reverse) {
                    points.reverse();
                }
            } else {
                //折线的起点和终点都没有角度(没有连接形状)
                if (xDistance >= yDistance) {
                    //如果宽大于高，连接线整体方向为水平
                    var half = (to.x - from.x) / 2;
                    points.push({ x: from.x + half, y: from.y });
                    points.push({ x: from.x + half, y: to.y });
                } else {
                    //否则为垂直
                    var half = (to.y - from.y) / 2;
                    points.push({ x: from.x, y: from.y + half });
                    points.push({ x: to.x, y: from.y + half });
                }
            }
        } else if (linker.linkerType == "curve") {
            var from = linker.from;
            var to = linker.to;
            var distance = this.measureDistance(from, to);
            var cDistance = distance * 0.4; //控制点的距离，等于起始点距离的1/5

            /**
             * 获取控制点坐标
             */
            function getControlPoint(point, another) {
                if (point.id != null) {
                    return {
                        x: point.x - cDistance * Math.cos(point.angle),
                        y: point.y - cDistance * Math.sin(point.angle)
                    };
                } else {
                    var yDistance = Math.abs(point.y - another.y);
                    var xDiatance = Math.abs(point.x - another.x);
                    var curveAngle = Math.atan(yDistance / xDiatance);
                    var result = {};
                    if (point.x <= another.x) {
                        result.x = point.x + cDistance * Math.cos(curveAngle);
                    } else {
                        result.x = point.x - cDistance * Math.cos(curveAngle);
                    }
                    if (point.y <= another.y) {
                        result.y = point.y + cDistance * Math.sin(curveAngle);
                    } else {
                        result.y = point.y - cDistance * Math.sin(curveAngle);
                    }
                    return result;
                }
            }

            points.push(getControlPoint(from, to));
            points.push(getControlPoint(to, from));
        }
        return points;
    }

    /**
     * 获取连接线上的点
     * @param {} linker
     * @return {}
     */
    static getLinkerLinePoints(linker) {
        var points = [];
        if (linker.linkerType != "curve") {
            //当是直线或曲线时，判断是否相交
            points.push(linker.from);
            points = points.concat(linker.points);
        } else {
            //当连接线是曲线时的判断逻辑
            //把曲线划分成N根直线
            var step = 0.05;
            var t = 0;
            while (t <= 1) {
                var p = {
                    x: (1 - t) * (1 - t) * (1 - t) * linker.from.x +
                        3 * (1 - t) * (1 - t) * t * linker.points[0].x +
                        3 * (1 - t) * t * t * linker.points[1].x +
                        t * t * t * linker.to.x,
                    y: (1 - t) * (1 - t) * (1 - t) * linker.from.y +
                        3 * (1 - t) * (1 - t) * t * linker.points[0].y +
                        3 * (1 - t) * t * t * linker.points[1].y +
                        t * t * t * linker.to.y
                }
                points.push(p);
                t += step;
            }
        }
        points.push(linker.to);
        return points;
    }

    /**
     * 获取连接线的边界
     * @param {} linker
     */
    static getLinkerBox(linker) {
        var points = this.getLinkerLinePoints(linker);
        var minX = points[0].x;
        var minY = points[0].y;
        var maxX = points[0].x;
        var maxY = points[0].y;
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            if (point.x < minX) {
                minX = point.x;
            } else if (point.x > maxX) {
                maxX = point.x;
            }
            if (point.y < minY) {
                minY = point.y;
            } else if (point.y > maxY) {
                maxY = point.y;
            }
        }
        var box = {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
        }
        return box;
    }

    /**
     * 获取形状的边界
     */
    static getShapeBox(shape) {
        var props = shape.props;
        var angle = shape.props.angle;
        return this.getRotatedBox(props, angle);
    }

    /**
     * 获取一个矩形旋转一定角度后的边界容器
     * @param {} pos 控制器的坐标信息{x, y, w, h}
     * @param {} angle 旋转角度
     * @param {} center 旋转围绕的中心点，选填，如果不设置，默认人为pos中心点
     */
    static getRotatedBox(pos, angle, center) {
        if (angle == 0) {
            return pos;
        } else {
            //没有设置中心点，取形状的中心点
            if (!center) {
                center = {
                    x: pos.x + pos.w / 2,
                    y: pos.y + pos.h / 2
                };
            }
            var p1 = this.getRotated(center, { x: pos.x, y: pos.y }, angle);
            var p2 = this.getRotated(center, { x: pos.x + pos.w, y: pos.y }, angle);
            var p3 = this.getRotated(center, { x: pos.x + pos.w, y: pos.y + pos.h }, angle);
            var p4 = this.getRotated(center, { x: pos.x, y: pos.y + pos.h }, angle);
            var minX = Math.min(p1.x, p2.x, p3.x, p4.x);
            var maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
            var minY = Math.min(p1.y, p2.y, p3.y, p4.y);
            var maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
            return {
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY
            };
        }
    }

    /**
     * 获取一个点围绕某一个点旋转一定角度后的坐标
     * @param {} center 中心点、固定点
     * @param {} point 被旋转的点
     * @param {} angle 旋转的角度
     */
    static getRotated(center, point, angle) {
        //先得到两点的距离，即圆形运动的半径
        var r = this.measureDistance(center, point);
        if (r == 0 || angle == 0) {
            //半径为0，则两点共点，不计算
            return point;
        }
        //获取此点与过中心的垂直线的角度
        var pointAngle = Math.atan(Math.abs(point.x - center.x) / Math.abs(center.y - point.y));
        if (point.x >= center.x && point.y >= center.y) {
            pointAngle = Math.PI - pointAngle;
        } else if (point.x <= center.x && point.y >= center.y) {
            pointAngle = Math.PI + pointAngle;
        } else if (point.x <= center.x && point.y <= center.y) {
            pointAngle = Math.PI * 2 - pointAngle;
        }
        pointAngle = pointAngle % (Math.PI * 2);
        //计算相对于过中心的垂直线的旋转角度
        var rotateAngle = (pointAngle + angle) % (Math.PI * 2);
        var result = {
            x: center.x + Math.sin(rotateAngle) * r,
            y: center.y - Math.cos(rotateAngle) * r
        };
        return result;
    }

    /**
     * 获取图形的锚点在连接线上的集合
     * @param {} shape
     */
    static getShapeAnchorInLinker(shape) {
        var anchors = shape.getAnchors();
        var anchorPoints = [];
        var center = { x: shape.props.x + shape.props.w / 2, y: shape.props.y + shape.props.h / 2 };
        for (var ai = 0; ai < anchors.length; ai++) {
            var an = anchors[ai];
            var point = {
                x: an.x + shape.props.x,
                y: an.y + shape.props.y
            };
            var rotated = this.getRotated(center, point, shape.props.angle);
            anchorPoints.push(rotated);
        }
        var result = [];
        var radius = 2;
        for (var i = Model.orderList.length - 1; i >= 0; i--) {
            //先循环所有的图形，拿到Linker，逐一进行判断
            var id = Model.orderList[i].id;
            var modelShape = Model.getShapeById(id);
            if (modelShape.name != "linker") {
                continue;
            }
            var linker = modelShape;
            var item = null;
            //先判断是否有锚点在连接线的端点上，前提是此端点未连接形状
            radius = 3;
            for (var ai = 0; ai < anchorPoints.length; ai++) {
                var anchorPoint = anchorPoints[ai];
                var rect = { x: anchorPoint.x - radius, y: anchorPoint.y - radius, w: radius * 2, h: radius * 2 };
                if (linker.from.id == null && this.pointInRect(linker.from.x, linker.from.y, rect)) {
                    item = { linker: linker, anchors: [anchorPoint], type: "from" };
                    break;
                }
                if (linker.to.id == null && this.pointInRect(linker.to.x, linker.to.y, rect)) {
                    item = { linker: linker, anchors: [anchorPoint], type: "to" };
                    break;
                }
            }
            radius = 2;
            if (item == null) {
                //如果没有锚点在连接线的端点上
                //再判断是否有锚点在连接线的线上
                for (var ai = 0; ai < anchorPoints.length; ai++) {
                    var anchorPoint = anchorPoints[ai];
                    var inLinker = Utils.pointInLinker(anchorPoint, linker, radius);
                    if (inLinker > -1) {
                        //此锚点在连接线上
                        if (item == null) {
                            item = { linker: linker, anchors: [], type: "line" };
                        }
                        item.anchors.push(anchorPoint);
                    }
                }
            }
            if (item != null) {
                result.push(item);
            }
        }
        return result;
    }

    /**
     * 获取连接线端点的角度，计算是线自身，用于绘制箭头
     * @param {} linker
     * @param {} pointType
     * @return {}
     */
    static getEndpointAngle(linker, pointType) {
        var point;
        if (pointType == "from") {
            point = linker.from;
        } else {
            point = linker.to;
        }
        var last; //连线的最后一点，以此点和端点来绘制箭头
        if (linker.linkerType == "normal") {
            if (pointType == "from") {
                last = linker.to;
            } else {
                last = linker.from;
            }
        } else if (linker.linkerType == "broken") {
            if (pointType == "from") {
                last = linker.points[0];
            } else {
                last = linker.points[linker.points.length - 1];
            }
        } else {
            var arrowLength = 12;
            var t;
            var distance = Utils.measureDistance(linker.from, linker.to);
            if (pointType == "from") {
                t = arrowLength / distance;
            } else {
                t = 1 - arrowLength / distance;
            }
            last = {
                x: (1 - t) * (1 - t) * (1 - t) * linker.from.x +
                    3 * (1 - t) * (1 - t) * t * linker.points[0].x +
                    3 * (1 - t) * t * t * linker.points[1].x +
                    t * t * t * linker.to.x,
                y: (1 - t) * (1 - t) * (1 - t) * linker.from.y +
                    3 * (1 - t) * (1 - t) * t * linker.points[0].y +
                    3 * (1 - t) * t * t * linker.points[1].y +
                    t * t * t * linker.to.y
            }
        }
        return this.getAngle(last, point);
    }

    /**
     * 获取两点的角度
     * @param {} last
     * @param {} point
     */
    static getAngle(last, point) {
        var pointAngle = Math.atan(Math.abs(last.y - point.y) / Math.abs(last.x - point.x)); //线的角度
        if (point.x <= last.x && point.y > last.y) {
            pointAngle = Math.PI - pointAngle;
        } else if (point.x < last.x && point.y <= last.y) {
            pointAngle = Math.PI + pointAngle;
        } else if (point.x >= last.x && point.y < last.y) {
            pointAngle = Math.PI * 2 - pointAngle;
        }
        return pointAngle;
    }

    /**
     * 获取较深一级的颜色
     * @param {} rgbStr r,g,b
     * @return {}
     */
    static getDarkerColor(rgbStr, change) {
        if (!change) {
            change = 13;
        }
        var rgb = rgbStr.split(",");
        var r = parseInt(rgb[0]);
        var g = parseInt(rgb[1]);
        var b = parseInt(rgb[2]);
        var newR = Math.round(r - r / 255 * change);
        if (newR < 0) {
            newR = 0;
        }
        var newG = Math.round(g - g / 255 * change);
        if (newG < 0) {
            newG = 0;
        }
        var newB = Math.round(b - b / 255 * change);
        if (newB < 0) {
            newB = 0;
        }
        return newR + "," + newG + "," + newB;
    }

    /**
     * 获取更深一级的颜色
     * @param {} rgbStr r,g,b
     * @return {}
     */
    static getDarkestColor(rgbStr) {
        return this.getDarkerColor(rgbStr, 26);
    }

    /**
     * 把一个对象的数值属性缩放
     */
    static toScale(obj) {
        var result = {};
        for (var key in obj) {
            result[key] = obj[key]
            if (typeof obj[key] == "number") {
                result[key] = result[key].toScale();
            }
        }
        return result;
    }

    /**
     * 把一个对象的数值属性按缩放比例恢复
     */
    static restoreScale(obj) {
        var result = {};
        for (var key in obj) {
            result[key] = obj[key]
            if (typeof obj[key] == "number") {
                result[key] = result[key].restoreScale();
            }
        }
        return result;
    }

    /**
     * 获取选中图形以外的连接线
     */
    static getOutlinkers(shapes) {
        var outlinkers = [];
        var outlinkerIds = [];
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            if (shape.name != "linker") {
                //从linkerMap中取到形状上的连接线
                var linkerIds = Model.getShapeLinkers(shape.id);
                if (linkerIds && linkerIds.length > 0) {
                    for (var index = 0; index < linkerIds.length; index++) {
                        var id = linkerIds[index];
                        if (!this.isSelected(id) && outlinkerIds.indexOf(id) < 0) {
                            //只获取未选中的
                            outlinkers.push(Model.getShapeById(id));
                            outlinkerIds.push(id);
                        }
                    }
                }
            }
        }
        return outlinkers;
    }

    /**
     * 获取图形的父级、子级、兄弟图形（未选中的）
     * @param {} shapes
     * @return {}
     */
    static getFamilyShapes(shapes) {
        var familyShapes = [];
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            if (shape.name != "linker") {
                if (shape.parent) {
                    var parent = Model.getShapeById(shape.parent);
                    if (!Utils.isSelected(shape.parent)) {
                        //父图形
                        familyShapes.push(parent);
                    }
                    //兄弟图形
                    var brothers = this.getChildrenShapes(parent);
                    familyShapes = familyShapes.concat(brothers);
                }
                //子级的
                var childrenShapes = this.getChildrenShapes(shape);
                familyShapes = familyShapes.concat(childrenShapes);
            }
        }
        return familyShapes;
    }

    /**
     * 获取图形子级的图形（未选中的）
     * @param {} shape
     */
    static getChildrenShapes(shape) {
        var childrenShapes = [];
        if (shape.children && shape.children.length > 0) {
            for (var i = 0; i < shape.children.length; i++) {
                var childId = shape.children[i];
                if (!Utils.isSelected(childId)) {
                    childrenShapes.push(Model.getShapeById(childId));
                }
            }
        }
        return childrenShapes;
    }

    /**
     * 判断两个图形是否是家族图形
     * @param {} shape1
     * @param {} shape2
     */
    static isFamilyShape(shape1, shape2) {
        if (shape1.parent == shape2.id) {
            return true;
        } else if (shape1.id == shape2.parent) {
            return true;
        } else if (shape1.parent && shape1.parent == shape2.parent) {
            return true;
        }
        return false;
    }

    /**
     * 获取容器图形中包含的图形（未选中的）
     * @param {} shapes
     */
    static getContainedShapes(shapes) {
        var containedShapes = [];
        var containedIds = [];
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            if (shape.name != "linker" && shape.attribute && shape.attribute.container) {
                var shapeContained = getContained(shape);
                containedShapes = containedShapes.concat(shapeContained);
            }
        }

        /**
         * 获取一个容器图形包含的图形
         */
        function getContained(shape) {
            var contained = [];
            for (var i = Model.orderList.length - 1; i >= 0; i--) {
                var shapeId = Model.orderList[i].id;
                //不是自己，并且没有选中，并且不是容器
                if (shape.id != shapeId && !Utils.isSelected(shapeId) && containedIds.indexOf(shapeId) < 0) {
                    var testShape = Model.getShapeById(shapeId);
                    //并且不是容器
                    if (!testShape.attribute ||
                        typeof testShape.attribute.container == "undefined" ||
                        testShape.attribute.container == false) {
                        //并且不是家族图形
                        if (!Utils.isFamilyShape(testShape, shape)) {
                            //被判断图形的中心为依据
                            var rotatedProps = Utils.getShapeBox(testShape);
                            if (Utils.rectInRect(rotatedProps, shape.props)) {
                                contained.push(testShape);
                                containedIds.push(shapeId);
                            }
                        }
                    }
                }
            }
            return contained;
        }

        return containedShapes;
    }

    /**
     * 获取BPMN吸附的图形（未选中的）
     */
    static getAttachedShapes(shapes) {
        var ids = [];
        for (var i = 0; i < shapes.length; i++) {
            ids.push(shapes[i].id);
        }
        var attachedShapes = [];
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            if (shape.groupName == "task" || shape.groupName == "callActivity" || shape.groupName == "subProcess") {
                var attached = [];
                for (var j = Model.orderList.length - 1; j >= 0; j--) {
                    var shapeId = Model.orderList[j].id;
                    var testShape = Model.getShapeById(shapeId);
                    if (testShape.attachTo == shape.id && !Utils.isSelected(shapeId) && ids.indexOf(shapeId) < 0) {
                        attached.push(testShape);
                    }
                }
                attachedShapes = attachedShapes.concat(attached);
            }
        }
        return attachedShapes;
    }

    /**
     * 复制一个对象
     * @param {} obj
     */
    static copy(obj) {
        return $.extend(true, {}, obj);
    }

    /**
     * 排列图形的子图形
     * 创建子图形，缩放子图形，删除子图形时会用到
     */
    static rangeChildren(shape) {
        var changed = [];
        if (shape.children && shape.children.length > 0) {
            if (shape.name == "verticalPool") {
                var changeChild = [];
                var serparators = [];
                for (var i = 0; i < shape.children.length; i++) {
                    var childId = shape.children[i];
                    var child = Model.getShapeById(childId);
                    if (child.name == "horizontalSeparator") {
                        serparators.push(child);
                    } else {
                        changeChild.push(child);
                    }
                }
                //进行排序
                changeChild.sort(function(a, b) {
                    return a.props.x - b.props.x;
                });
                var x = shape.props.x;
                for (var i = 0; i < changeChild.length; i++) {
                    var child = changeChild[i];
                    child.props.x = x;
                    Designer.painter.renderShape(child);
                    changed.push(child);
                    x += child.props.w;
                }
                //排列分隔符
                serparators.sort(function(a, b) {
                    return a.props.y - b.props.y;
                });
                var y = shape.props.y + 40;
                for (var i = 0; i < serparators.length; i++) {
                    var child = serparators[i];
                    var bottom = child.props.y + child.props.h;
                    child.props.w = shape.props.w;
                    child.props.y = y;
                    var h = bottom - y;
                    child.props.h = h;
                    Designer.painter.renderShape(child);
                    changed.push(child);
                    y += h;
                }
            } else if (shape.name == "horizontalPool") {
                var changeChild = [];
                var serparators = [];
                for (var i = 0; i < shape.children.length; i++) {
                    var childId = shape.children[i];
                    var child = Model.getShapeById(childId);
                    if (child.name == "verticalSeparator") {
                        serparators.push(child);
                    } else {
                        changeChild.push(child);
                    }
                }
                //进行排序
                changeChild.sort(function(a, b) {
                    return a.props.y - b.props.y;
                });
                var y = shape.props.y;
                for (var i = 0; i < changeChild.length; i++) {
                    var child = changeChild[i];
                    child.props.y = y;
                    Designer.painter.renderShape(child);
                    changed.push(child);
                    y += child.props.h;
                }
                //排列分隔符
                serparators.sort(function(a, b) {
                    return a.props.x - b.props.x;
                });
                var x = shape.props.x + 40;
                for (var i = 0; i < serparators.length; i++) {
                    var child = serparators[i];
                    var right = child.props.x + child.props.w;
                    child.props.h = shape.props.h;
                    child.props.x = x;
                    var w = right - x;
                    child.props.w = w;
                    Designer.painter.renderShape(child);
                    changed.push(child);
                    x += w;
                }
            }
        }
        return changed;
    }

    /**
     * 绝对坐标转为相对坐标
     * @param {} pageX
     * @param {} pageY
     * @param {} related
     * @return {}
     */
    static getRelativePos(pageX, pageY, related) {
        var relatedOffset = related.offset();
        if (relatedOffset == null) {
            relatedOffset = { left: 0, top: 0 };
        }
        return {
            x: pageX - relatedOffset.left + related.scrollLeft(),
            y: pageY - relatedOffset.top + related.scrollTop()
        };
    }
}
