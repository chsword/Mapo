/**
 *  新版图形设计器聊天窗口-（协作）-JS
 */
$(function(){
	if(chartId == "" || userId == ""){
		return;
	}
	CLB.init();
});

/**
 * 协作对象
 * @type {}
 */
var CLB = {
	/**
	 * WebSocket对象
	 * @type {}
	 */
	socket: null,
	/**
	 * 客户端ID
	 * @type {}
	 */
	clientId: null,
	/**
	 * Socket连接的地址
	 * @type {String}
	 */
	url: "",
	/**
	 * 监听的时间
	 * @type {String}
	 */
	listenTime: "",
	/**
	 * 浏览器关闭
	 */
	unloaded: false,
	
	/**
	 * 初始化
	 */
	init: function(){
		//随机一个clientId
		var random = Math.random();
		var newId = (random + new Date().getTime());
		this.clientId = newId.toString(16).replace(".", "");
		this.listenTime = time;
//		this.url = "ws://" + window.location.host + "/collaboration/msg?subject=" + chartId + "&clientId=" + this.clientId + "&userId=" + userId;
		this.listen();
//		//发送心跳消息
//	    setInterval(function(){
//	    	CLB.send({"action": "heardbeat"});
//	    }, 30 * 1000);
		window.onbeforeunload = function(){
			try{
				if(CLB.sending || CLB.messageQueue.length > 0){
					return "您的修改尚未保存，如果离开，您的编辑可能会丢失！";
				}
			}catch(e){}
			CLB.unloaded = true;
		};
	},
	connection: null,
	/**
	 * 连接
	 */
	listen: function(onError){
		if(CLB.connection != null){
			return;
		}
		CLB.connection = $.ajax({
			url: "/diagraming/listen",
			data: {
				clientId: CLB.clientId,
				userId: userId,
				name: userName,
				subject: chartId,
				listenTime: CLB.listenTime
			},
			type: "get",
			success: function(data){
				CLB.connection = null;
				CLB.onMessage(data.events);
				if(typeof data.onlineUsers != "undefined"){
					CLB.manageOnlineUsers(data.onlineUsers)
				}
			},
			error: function(e){
				CLB.connection = null;
				//发生错误，断开了，重连一次，如果连不上，提示错误
				if(CLB.unloaded == false){
					if(onError){
						onError();
					}else{
						CLB.listen(function(){
							CLB.showDisconnected();
						});
					}
				}
			}
		});
//		//基于websocket的实现方案
//		var skt = null;
//		if ('WebSocket' in window) {
//            skt = new WebSocket(this.url);
//        } else if ('MozWebSocket' in window) {
//            skt = new MozWebSocket(this.url);
//        } else {
//            window.location.href = "/diagraming/not_support";
//            return;
//        }
//		CLB.socket = null;
//	   	skt.onopen = function(){
//	    	CLB.socket = skt;
//	    	if(console){
//	    		console.log("Connection opened.");
//	    	}
//	    };
//	   	skt.onmessage = function(message){
//	    	CLB.onMessage(message.data);
//	    };
//	    skt.onclose = function(){
//	    	if(CLB.socket != null){
//	    		//如果上次连接可以打开，那么断开后，自动重连
//	    		CLB.connect();
//	    	}else{
//	    		//如果上次连接没有打开，那么客户端无法连接，断开
//	    		CLB.showDisconnected();
//	    	}
//	    	//断开了，立刻重连
//	    	if(console){
//	    		console.log("Connection closed.");
//	    	}
//	    	CLB.socket = null;
//	    };
	},
	/**
	 * 停止监听
	 */
	stopListen: function(){
		if(CLB.connection){
			CLB.connection.abort();
		}
		CLB.connection = null;
	},
	/**
	 * 消息是否在发送状态
	 * @type {Boolean}
	 */
	sending: false,
	/**
	 * 消息队列
	 * @type {}
	 */
	messageQueue: [],
	/**
	 * 发送消息
	 * @param {} msg
	 * @param {} 是否进入消息队列，进行等待处理
	 */
	send: function(msg, enterQueue){
		var params = {
			userId: userId,
			clientId: CLB.clientId,
			subject: chartId
		};
		var data = $.extend(params, msg);
		if(enterQueue == false){
			//如果不需要进入队列处理，直接发送，例如聊天的请求
			this.doSend([data]);
		}else{
			this.messageQueue.push(data);
			if(this.sending == false){
				//如果没有正在发送，立即发送，否则先阻塞一下，进入消息队列中等待
				this.doSend();
			}
		}
	},
	/**
	 * 执行发送，单通道
	 * @param {} messages 发送的消息，如果不存在此参数，发送messageQueue中的消息，存在的话直接发送
	 */
	doSend: function(messages){
		var msgStr;
		if(typeof messages == "undefined"){
			if(this.messageQueue.length == 0){
				return;
			}
			msgStr = JSON.stringify(this.messageQueue);
			this.messageQueue = [];
		}else{
			msgStr = JSON.stringify(messages);
		}
		this.sending = true;
		if(typeof messages == "undefined"){
			$("#saving_tip").text("正在保存...");
		}
		Util.ajax({
			url: "/diagraming/msg",
			data: {msgStr: msgStr, ignore: "msgStr", chartId: chartId},
			success: function(){
				CLB.sending = false;
				//再次继续发送新产生的消息
				CLB.doSend();
				if(typeof messages == "undefined"){
					$("#saving_tip").text("所有更改已保存");
				}
			},error: function(){
				CLB.showDisconnected();
			}
		});
	},
	/**
	 * 处理消息
	 * @param {} msg
	 */
	onMessage: function(messages){
		for(var i = 0; i < messages.length; i++){
			var msg = messages[i];
			var action = msg.action;
			if(action == "refresh"){
				CLB.listenTime = msg.listenTime;
				CLB.listen();
			}else if(action == "join"){
				//加入的消息
				if($("#chat_user_" + msg.userId).length == 0){
					$("#collaborators").append("<img id='chat_user_" + msg.userId + "' src='" + msg.photoUrl + "' class='' title='" + msg.name + "'/>");
				}
			}else if(action == "leave"){
				if(msg.userId != userId){
					$("#chat_user_" + msg.userId).remove();
				}
			}else if(action == "changeTitle"){
				if(msg.clientId != this.clientId){
					$(".diagram_title").text(msg.title);
				}
			}else if(action == "chat"){
				if(msg.clientId != this.clientId){
					this.appendChatMsg(msg.name, msg.message, true);
				}
			}else if(action == "changeSchema"){
				if(msg.clientId != this.clientId){
					if(msg.categories == ""){
						Designer.setSchema([]);
					}else{
						Designer.setSchema(msg.categories.split(","));
					}
				}
			}else if(action == "command"){
				if(msg.clientId != this.clientId){
					MessageSource.receive(msg.messages);
				}
				if(Dock.historyVersions != null){
					//更新右侧Dock的版本历史
					if(msg.newVersion){
						//如果有新的版本生成
						Dock.loadHistorys(true);
					}else{
						//修改版本时间，并添加消息
						var firstVersion = $("#history_versions").children("li:eq(0)");
						firstVersion.attr("def", msg.definitionId);
						firstVersion.children(".version_time").text(msg.time);
						Dock.historyVersions.versions[0].messages.push(msg.messages);
					}
				}
			}else if(action == "versionRemark"){
				if(Dock.historyVersions != null && msg.clientId != this.clientId){
					//修改版本的备注
					var versionDom = $("#history_versions").children("li[vid="+msg.versionId+"]");
					versionDom.find(".remark_text").text(msg.remark);
				}
			}
		}
	},
	/**
	 * 提醒用户连接已断开
	 */
	showDisconnected: function(){
		$("#disconnected").dlg({closable: false});
	},
	/**
	 * 管理在线用户
	 */
	manageOnlineUsers: function(onlineUsers){
		$("#collaborators").children().attr("class", "");
		for(var i = 0; i < onlineUsers.length; i++){
			var online = onlineUsers[i];
			if($("#chat_user_" + online.userId).length == 0){
				$("#collaborators").append("<img id='chat_user_" + online.userId + "' src='" + online.photoUrl + "' title='" + online.name + "' title_pos='top'/>");
			}
			$("#chat_user_" + online.userId).attr("class", "online");
		}
		$("#collaborators").children("img[class!=online]").remove();
	},
	/**
	 * 打开聊天
	 */
	showChatWin: function(){
		if($("#open_chat_btn").button("isSelected")){
			CLB.closeChatWin();
			return;
		}
		$("#open_chat_btn").button("select");
		$("#chattingbox").css("left", $("#shape_panel").outerWidth()).show();
		$("#chatting_edit").focus().unbind().bind("keydown", function(e){
			if(e.ctrlKey && e.keyCode == 13){
				CLB.sendChatMsg();
			}
		});
		$("#chat_prompt").hide().text("0");
	},
	/**
	 * 关闭聊天
	 */
	closeChatWin: function(){
		$("#chattingbox").hide();
		$("#open_chat_btn").button("unselect");
	},
	/**
	 * 发送聊天消息
	 */
	sendChatMsg: function(){
		var msg = $("#chatting_edit").val();
		if(msg == ""){
			$("#chatting_edit").focus();
			return;
		}
		var msgObj = {
			action: "chat",
			message: msg,
			name: userName
		};
		CLB.send(msgObj, false);
		this.appendChatMsg(userName, msg, false);
		$("#chatting_edit").val("").focus();
	},
	/**
	 * 向聊天窗口添加聊天信息
	 * @param {} name
	 * @param {} msg
	 * @param {} isOther 是否是别人发的
	 */
	appendChatMsg: function(name, msg, isOther){
		msg = msg.replace(/\n/g, "<br/>")
		$("#chat_messages").append("<li><span>"+name+"</span>:&nbsp;"+msg+"</li>");
		$("#chat_messages").scrollTop(9999999);
		if(isOther && !$("#open_chat_btn").button("isSelected")){
			//如果是别人发的消息，并且没有打开聊天窗口
			var unread = parseInt($("#chat_prompt").text()) + 1;
			$("#chat_prompt")
				.show()
				.text(unread)
				.animate({"top": "-15px"}, 200)
				.animate({"top": "-9px"}, 200);
		}
	}
};

