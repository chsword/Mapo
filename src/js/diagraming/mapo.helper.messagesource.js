
/**
 * 消息源对象
 * @type {}
 */
class MessageSource { }

/**
 * 是否打开批处理
 * @type {Boolean}
 */
MessageSource.batchSize = 0;
/**
 * 消息批处理对象
 * @type {}
 */
MessageSource.messages = [];
/**
 * 消息是否进入撤销堆栈
 * @type {Boolean}
 */
MessageSource.withUndo = true;
/**
 * 在发生某些变化时，是否添加消息
 * @type {Boolean}
 */
MessageSource.withMessage = true;
/**
 * 在发生某些变化时，是否修改Dock状态
 * @type {Boolean}
 */
MessageSource.withDock = true;
/**
 * 事件堆栈，即撤销堆栈，后进先出
 * @type {}
 */
MessageSource.undoStack = {
    stack: [],
    /**
     * 往撤销堆栈中添加消息
     * @param {} ele
     * @param Boolean clearRedo 是否清空恢复堆栈，新的消息都会清空；只有当进行恢复时，会像撤销堆栈中添加消息，此情况下不清空恢复堆栈
     */
    push: function (ele, clearRedo) {
        this.stack.push(ele);
        if (typeof clearRedo == "undefined") {
            clearRedo = true;
        }
        //撤销堆栈入栈，清空恢复堆栈
        if (clearRedo) {
            MessageSource.redoStack.stack = [];
        }
        //抛出堆栈变化事件
        Designer.events.push("undoStackChanged", this.stack.length);
    },
    pop: function () {
        var stackLength = this.stack.length;
        if (stackLength == 0) {
            return null;
        }
        var messages = this.stack[stackLength - 1];
        //删除
        this.stack.splice(stackLength - 1, 1);
        //压入恢复堆栈
        MessageSource.redoStack.push(messages);
        //抛出堆栈变化事件
        Designer.events.push("undoStackChanged", this.stack.length);
        return messages;
    }
};
/**
 * 恢复队列，后进先出
 * @type {}
 */
MessageSource.redoStack = {
    stack: [],
    push: function (ele) {
        this.stack.push(ele);
        //抛出堆栈变化事件
        Designer.events.push("redoStackChanged", this.stack.length);
    },
    pop: function () {
        var stackLength = this.stack.length;
        if (stackLength == 0) {
            return null;
        }
        var messages = this.stack[stackLength - 1];
        //删除
        this.stack.splice(stackLength - 1, 1);
        //压入撤销堆栈，不清空恢复堆栈
        MessageSource.undoStack.push(messages, false);
        //抛出堆栈变化事件
        Designer.events.push("redoStackChanged", this.stack.length);
        return messages;
    }
};
/**
 * 开始批处理
 */
MessageSource.beginBatch = function () {
    this.batchSize++;
};
/**
 * 提交批处理
 */
MessageSource.commit = function () {
    this.batchSize--;
    this.submit();
};
/**
 * 提交消息
 */
MessageSource.submit = function () {
    if (this.batchSize == 0 && this.messages.length != 0) {
        //更新Dock窗口
        if (this.withDock) {
            Dock.update(true);
        }
        if (this.withMessage == false) {
            //如果不需要发送消息，比如在接收别人发来的消息时
            this.messages = [];
            return;
        }
        //当没有活动的批处理时，才提交
        if (this.withUndo) {
            //将事件压入撤销堆栈
            this.undoStack.push(this.messages);
        }
        if (chartId != "") {
            //var messagesStr = JSON.stringify(this.messages);
            var msgObj = {
                action: "command",
                messages: this.messages,
                name: userName
            };
            CLB.send(msgObj);
        }
        this.messages = [];
    }
};
/**
 * 发送消息
 */
MessageSource.send = function (action, content) {
    this.messages.push({ action: action, content: content });
    this.submit();
};
/**
 * 接收消息，一次接收多个消息
 */
MessageSource.receive = function (messages) {
    this.doWithoutMessage(function () {
        //在不需要抛出消息的环境下执行
        MessageSource.executeMessages(messages, true);
        Utils.showLinkerControls();
        Utils.showLinkerCursor();
    });
};
/**
 * 执行撤销
 */
MessageSource.undo = function () {
    var messages = this.undoStack.pop();
    if (messages == null) {
        return;
    }
    this.doWithoutUndo(function () {
        MessageSource.beginBatch();
        for (var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            if (msg.action == "create") {
                //对于创建，撤销时，执行删除
                Utils.unselect();
                Model.remove(msg.content, false);
            } else if (msg.action == "update") {
                //对于更新，撤销时，执行反更新
                var shapes = msg.content.shapes;
                Model.updateMulti(shapes);
                for (var index = 0; index < shapes.length; index++) {
                    var undoShape = shapes[index];
                    Designer.painter.renderShape(undoShape);
                }
                //重新选中
                var ids = Utils.getSelectedIds();
                Utils.unselect();
                Utils.selectShape(ids, false);
            } else if (msg.action == "remove") {
                //对于删除，撤销时，执行添加
                var shapes = msg.content;
                Model.addMulti(shapes);
                for (var index = 0; index < shapes.length; index++) {
                    var undoShape = shapes[index];
                    Designer.painter.renderShape(undoShape);
                }
            } else if (msg.action == "updatePage") {
                //对于更新页面样式，撤销时，执行反更新
                Model.updatePage(msg.content.page);
            }
        }
        MessageSource.commit();
    });
},
    /**
     * 执行恢复
     */
    MessageSource.redo = function () {
        var messages = this.redoStack.pop();
        if (messages == null) {
            return;
        }
        this.doWithoutUndo(function () {
            //在不需要添加undo堆栈的环境下执行
            MessageSource.executeMessages(messages, false);
        });
    };
/**
 * 执行一组消息，会用于恢复撤销、处理接收到的后台消息
 * @param {} messages
 */
MessageSource.executeMessages = function (messages, initFunction) {
    MessageSource.beginBatch();
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        if (msg.action == "create") {
            var shapes = msg.content;
            if (initFunction) {
                for (var index = 0; index < shapes.length; index++) {
                    var undoShape = shapes[index];
                    if (undoShape.name != "linker") {
                        Schema.initShapeFunctions(undoShape);
                    }
                }
            }
            Model.addMulti(shapes);
            for (var index = 0; index < shapes.length; index++) {
                var undoShape = shapes[index];
                Designer.painter.renderShape(undoShape);
            }
            Model.build();
        } else if (msg.action == "update") {
            var updates = msg.content.updates;
            for (var index = 0; index < updates.length; index++) {
                var update = updates[index];
                if (initFunction && update.name != "linker") {
                    Schema.initShapeFunctions(update);
                }
                Designer.painter.renderShape(update);
            }
            Model.updateMulti(updates);
            //重新选中
            var ids = Utils.getSelectedIds();
            Utils.unselect();
            Utils.selectShape(ids);
        } else if (msg.action == "remove") {
            Utils.unselect();
            Model.remove(msg.content);
        } else if (msg.action == "updatePage") {
            //对于更新页面样式，撤销时，执行反更新
            Model.updatePage(msg.content.update);
        }
    }
    MessageSource.commit();
},
	/**
	 * 在不需要撤销的环境下执行修改
	 */
    MessageSource.doWithoutUndo = function (func) {
        this.withUndo = false;
        func();
        this.withUndo = true;
    },
	/**
	 * 在不需要发送消息的环境下执行修改
	 */
    MessageSource.doWithoutMessage = function (func) {
        this.withMessage = false;
        func();
        this.withMessage = true;
    },
	/**
	 * 在不需要修改Dock的环境下执行修改
	 * @param {} func
	 */
    MessageSource.doWithoutUpdateDock = function (func) {
        this.withDock = false;
        func();
        this.withDock = true;
    };