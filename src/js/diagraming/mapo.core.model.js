/**
 * 对象模型
 * @type {}
 */
class Model {


}
/**
* 图形定义
* @type {}
*/
Model.define = {};
/**
	 * 持久化的图形定义
	 * @type {}
	 */
Model.persistence = {};

/**
 * 排序后的对象列表
 * @type {}
 */
Model.orderList = [];
/**
 * 最大Z轴
 * @type {Number}
 */
Model.maxZIndex = 0;
/**
 * 连接线映射，维护一个形状上连接了哪些连接线
 * @type {}
 */
Model.linkerMap = {
    map: {},
    /**
     * 添加连接线映射
     */
    add: function (shapeId, linkerId) {
        if (!this.map[shapeId]) {
            this.map[shapeId] = [];
        }
        if (this.map[shapeId].indexOf(linkerId) < 0) {
            this.map[shapeId].push(linkerId);
        }
    },
    /**
     * 删除连接线映射
     */
    remove: function (shapeId, linkerId) {
        if (this.map[shapeId]) {
            Utils.removeFromArray(this.map[shapeId], linkerId);
        }
    },
    /**
     * 清空
     */
    empty: function () {
        this.map = {};
    }
};
/**
 * 组合映射，维护一个组内包含哪些形状
 * @type {}
 */
Model.groupMap = {
    map: {},
    /**
     * 添加组合映射
     */
    add: function (groupId, shapeIds) {
        this.map[groupId] = shapeIds;
    },
    /**
     * 给一个映射中添加元素
     * @param {} groupId
     * @param {} shapeId
     */
    push: function (groupId, shapeId) {
        if (!this.map[groupId]) {
            this.map[groupId] = [];
        }
        this.map[groupId].push(shapeId);
    },
    /**
     * 删除组合
     */
    remove: function (groupId) {
        delete this.map[groupId];
    },
    /**
     * 清空
     */
    empty: function () {
        this.map = {};
    }
};
/**
 * 创建图形
 */
Model.create = function (name, x, y) {
    var newId = Utils.newId();
    var newShape = Utils.copy(Schema.shapes[name]);
    newShape.id = newId;
    newShape.props.x = x;
    newShape.props.y = y;
    newShape.props.zindex = Model.maxZIndex + 1;
    newShape.props = $.extend(true, {}, Schema.shapeDefaults.props, newShape.props);
    for (var i = 0; i < newShape.dataAttributes.length; i++) {
        var attr = newShape.dataAttributes[i];
        attr.id = Utils.newId();
    }
    Designer.events.push("create", newShape);
    return newShape;
};
/**
 * 添加形状
 * @param {} shape
 */
Model.add = function (shape, popMsg) {
    this.addMulti([shape], popMsg);
};
/**
 * 添加多个形状
 * @param {} shapes
 */
Model.addMulti = function (shapes, popMsg) {
    if (typeof popMsg == "undefined") {
        popMsg = true;
    }
    var addShapes = [];
    for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        addShapes.push(Utils.copy(shape));
        this.define.elements[shape.id] = Utils.copy(shape);
        //重新创建，以免互相影响
        this.persistence.elements[shape.id] = Utils.copy(shape);
    }
    this.build();
    if (popMsg) {
        MessageSource.send("create", addShapes);
    }
};
/**
 * 更新形状定义
 * @param {} shape
 */
Model.update = function (shape) {
    this.updateMulti([shape]);
};
/**
 * 更新多个形状定义
 * @param {} shapes
 */
Model.updateMulti = function (shapes) {
    var updateShapes = [];
    var oriShapes = [];
    for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        if (this.define.elements[shape.id]) {
            //判断更新的图形是否还存在，可能有在修改过程中被他人删除的情况
            this.define.elements[shape.id] = Utils.copy(shape);
            //添加更新以前的图形
            oriShapes.push(Utils.copy(this.getPersistenceById(shape.id)));
            //添加更新后的图形
            updateShapes.push(Utils.copy(shape));
            //持久化图形
            this.persistence.elements[shape.id] = Utils.copy(shape);
        }
    }
    this.build();
    var msgContent = { shapes: oriShapes, updates: updateShapes };
    MessageSource.send("update", msgContent);
};
/**
 * 删除形状
 * @param {} shapes
 */
Model.remove = function (shapes, removeChildren) {
    if (typeof removeChildren == "undefined") {
        removeChildren = true;
    }
    if (removeChildren) {
        shapes = Designer.events.push("beforeRemove", shapes);
    }
    var removed = [];
    var changedIds = [];
    var changed = [];
    var shapeRange = [];
    var linkerRange = [];
    if (shapes.length === 0) {
        return false;
    }
    for (var j = 0; j < shapes.length; j++) {
        var shape1 = shapes[j];
        if (shape1.name === "linker") {
            linkerRange.push(shape1.id);
        } else {
            shapeRange.push(shape1.id);
        }
    }
    for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        removed.push(Utils.copy(shape));
        $("#" + shape.id).remove();
        //从定义中删除
        delete this.define.elements[shape.id];
        delete this.persistence.elements[shape.id];
        this.groupMap.remove(shape.group);
        //从linkerMap中删除
        if (shape.name === "linker") {
            if (shape.from.id != null) {
                this.linkerMap.remove(shape.from.id, shape.id);
            }
            if (shape.to.id != null) {
                this.linkerMap.remove(shape.to.id, shape.id);
            }
        } else {
            if (shape.parent && shapeRange.indexOf(shape.parent) < 0) {
                var parent = Model.getShapeById(shape.parent);
                if (parent) {
                    Utils.removeFromArray(parent.children, shape.id);
                    if (changedIds.indexOf(shape.parent) < 0) {
                        changedIds.push(shape.parent);
                        changed.push(parent);
                    }
                }
            }
            //删除形状上连接的连接线
            var linkerIds = this.getShapeLinkers(shape.id);
            if (linkerIds && linkerIds.length > 0) {
                for (var index = 0; index < linkerIds.length; index++) {
                    var id = linkerIds[index];
                    if (linkerRange.indexOf(id) < 0) {
                        //此条连接线不包含在要删除的范围内
                        var lin = this.getShapeById(id);
                        if (lin.from.id != null && lin.from.id === shape.id) {
                            lin.from.id = null;
                            lin.from.angle = null;
                        }
                        if (lin.to.id != null && lin.to.id === shape.id) {
                            lin.to.id = null;
                            lin.to.angle = null;
                        }
                        if (changedIds.indexOf(id) < 0) {
                            changedIds.push(id);
                            changed.push(lin);
                        }
                    }
                }
            }
            delete this.linkerMap.map[shape.id];
        }
    }
    this.build();
    //发送消息
    MessageSource.beginBatch();
    MessageSource.send("remove", removed);
    //抛出事件
    if (removeChildren) {
        var related =
            Designer.events.push("removed", { shapes: shapes, changedIds: changedIds, range: shapeRange });
        if (related && related.length) {
            changed = changed.concat(related);
        }
    }
    if (changed.length > 0) {
        this.updateMulti(changed);
    }
    MessageSource.commit();
    return true;
};
/**
 * 修改页面样式
 * @param {} pageStyle
 */
Model.updatePage = function (pageStyle, current) {
    var newStyle = $.extend(Model.define.page, pageStyle);
    var msg = {
        page: Utils.copy(Model.persistence.page),
        update: Utils.copy(newStyle)
    };
    Model.persistence.page = Utils.copy(newStyle);
    MessageSource.send("updatePage", msg);
    Designer.initialize.initCanvas();
};
/**
 * 通过形状ID获取形状
 * @param {} shapeId
 */
Model.getShapeById = function (shapeId) {
    return this.define.elements[shapeId];
};
/**
 * 通过形状ID获取持久化的形状
 * @param {} shapeId
 */
Model.getPersistenceById = function (shapeId) {
    return this.persistence.elements[shapeId];
};
/**
 * 对OrderList进行重新排序
 */
Model.build = function () {
    this.orderList = [];
    this.linkerMap.empty();
    //先将图形都放到orderList中
    for (var shapeId in Model.define.elements) {
        var shape = Model.getShapeById(shapeId);
        this.orderList.push({ id: shape.id, zindex: shape.props.zindex });
        //构建linkerMap
        if (shape.name === "linker") {
            //如果是连接线，要更新连接线映射
            if (shape.from.id != null) {
                this.linkerMap.add(shape.from.id, shape.id);
            }
            if (shape.to.id != null) {
                this.linkerMap.add(shape.to.id, shape.id);
            }
        }
        //构建groupMap
        if (shape.group) {
            this.groupMap.push(shape.group, shape.id);
        }
    }
    //对orderList排序
    this.orderList.sort(function compare(a, b) {
        return a.zindex - b.zindex;
    });
    //修改形状的z-index
    for (var i = 0; i < Model.orderList.length; i++) {
        var shapeId1 = Model.orderList[i].id;
        $("#" + shapeId1).css("z-index", i);
    }
    var index = 0;
    if (this.orderList.length > 0) {
        index = this.orderList[this.orderList.length - 1].zindex;
    }
    this.maxZIndex = index;
};
/**
 * 获取形状上的连接线
 * @param {} shapeId
 * @return {}
 */
Model.getShapeLinkers = function (shapeId) {
    return this.linkerMap.map[shapeId];
};
/**
 * 获取一个组合的形状id
 * @param {} groupId
 * @return {}
 */
Model.getGroupShapes = function (groupId) {
    return this.groupMap.map[groupId];
};
/**
 * 更换图形
 * @param {} targetShape
 * @param {} shapeName
 */
Model.changeShape = function (targetShape, shapeName) {
    var schemaShape = Schema.shapes[shapeName];
    targetShape.name = shapeName;
    targetShape.title = schemaShape.shapeName;
    targetShape.attribute = schemaShape.attribute;
    targetShape.dataAttributes = schemaShape.dataAttributes;
    targetShape.path = schemaShape.path;
    targetShape.textBlock = schemaShape.textBlock;
    targetShape.anchors = schemaShape.anchors;
    Schema.initShapeFunctions(targetShape);
    Designer.painter.renderShape(targetShape);

};

