
/**
 * 右侧的Dock控件
 * @type {}
 */
var Dock = {
	init: function(){
		var layoutW = $("#designer_layout").width();
		var viewW = $("#layout_block").width();
		//总宽度减去可视区域的宽度，得到滚动条宽度
		var navRight = layoutW - viewW;
		$("#dock").css("right", navRight);
		var dockRight = navRight + $("#dock").outerWidth() - 1;
		$(".dock_view").css("right", dockRight);
		if($("#demo_signup").length){
			var signupH = $("#demo_signup").outerHeight();
			$("#dock").css("top", signupH);
			$(".dock_view").css("top", signupH + 10);
		}
		$(".ico_dock_collapse").bind("click", function(){
			$(".dock_view").hide();
			$(".dock_buttons").children().removeClass("selected");
			if(Dock.currentView == "history"){
				Dock.closeHistory();
			}
			Dock.currentView = "";
		});
		$(window).bind("resize.dock", function(){
			if(Dock.currentView == "attribute"){
				Dock.fitAttrList();
			}
		});
		//缩放
		$("#dock_zoom").spinner({
			min: 50,
			max: 200,
			unit: "%",
			step: 10,
			onChange: function(val){
				Designer.setZoomScale(val / 100);
			}
		});
		//线条颜色
		$("#dock_line_color").colorButton({
			onSelect: function(color){
				Designer.setLineStyle({lineColor: color});
			}
		});
		//线条类型
		$("#dock_line_style").button({
			onMousedown: function(){
				$("#line_style_list").dropdown({
					target: $("#dock_line_style"),
					onSelect: function(item){
						var lineStyle = item.attr("line");
						Designer.setLineStyle({lineStyle: lineStyle});
						var cls = item.children("div").attr("class");
						$("#dock_line_style").children(".linestyle").attr("class", cls);
					}
				});
				var style = Utils.getSelected()[0].lineStyle.lineStyle;
				var item = $("#line_style_list").children("li[line="+style+"]");
				$("#line_style_list").dropdown("select", item);
			}
		});
		//线条宽度
		$("#dock_line_width").spinner({
			min: 0,
			max: 10,
			unit: "px",
			step: 1,
			onChange: function(val){
				Designer.setLineStyle({lineWidth: val});
			}
		});
		//填充类型
		$("#dock_fill_type").button({
			onMousedown: function(){
				$("#dock_fill_list").dropdown({
					target: $("#dock_fill_type"),
					onSelect: function(item){
						var type = item.attr("ty");
						$("#dock_fill_type").button("setText", item.text());
						if(type == "image"){
							UI.showImageSelect(function(fileId, w, h){
								Designer.setFillStyle({
									type: "image",
									fileId: fileId,
									imageW: w,
									imageH: h
								});
							});
						}else{
							Designer.setFillStyle({type: type});
							var shapeIds = Utils.getSelectedShapeIds();
							var shape = Model.getShapeById(shapeIds[0]);
							Dock.setFillStyle(shape.fillStyle);
						}
					}
				});
				var type = $("#dock_fill_type").text();
				$("#dock_fill_list").children().each(function(){
					if($(this).text() == type){
						$("#dock_fill_list").dropdown("select", $(this));
						return false;
					}
				});
			}
		});
		//填充颜色
		$("#fill_solid_btn").colorButton({
			onSelect: function(color){
				Designer.setFillStyle({color: color});
			}
		});
		//渐变开始颜色
		$("#fill_gradient_begin").colorButton({
			onSelect: function(color){
				Designer.setFillStyle({beginColor: color});
				$("#fill_gradient_begin").attr("c", color);
			}
		});
		//渐变结束颜色
		$("#fill_gradient_end").colorButton({
			onSelect: function(color){
				Designer.setFillStyle({endColor: color});
				$("#fill_gradient_end").attr("c", color)
			}
		});
		//渐变颜色交换
		$("#gradient_swap").button({
			onClick: function(){
				var begin = $("#fill_gradient_begin").attr("c");
				var end = $("#fill_gradient_end").attr("c");
				$("#fill_gradient_begin").attr("c", end).colorButton("setColor", end);
				$("#fill_gradient_end").attr("c", begin).colorButton("setColor", begin);
				Designer.setFillStyle({beginColor: end, endColor: begin});
			}
		});
		//渐变类型
		$("#gradient_type").button({
			onMousedown: function(){
				$("#gradient_type_list").dropdown({
					target: $("#gradient_type"),
					onSelect: function(item){
						var type = item.attr("ty");
						$("#gradient_type").button("setText", item.text());
						Designer.setFillStyle({gradientType: type});
						$(".gradient_details").hide();
						$("#gradient_type_" + type).show();
						var shapeIds = Utils.getSelectedShapeIds();
						var shape = Model.getShapeById(shapeIds[0]);
						var fillStyle = shape.fillStyle;
						if(type == "linear"){
							$("#gradient_angle").spinner("setValue", Math.round(fillStyle.angle/Math.PI * 180) + "°");
						}else{
							$("#gradient_radius").spinner("setValue", Math.round(fillStyle.radius * 100) + "%");
						}
					}
				});
				var type = $("#gradient_type").text().trim();
				$("#gradient_type_list").children().each(function(){
					if($(this).text() == type){
						$("#gradient_type_list").dropdown("select", $(this));
						return false;
					}
				});
			}
		});
		//线性渐变角度
		$("#gradient_angle").spinner({
			min: 0,
			max: 360,
			unit: "°",
			step: 15,
			onChange: function(val){
				var angle = val / 180 * Math.PI;
				Designer.setFillStyle({angle: angle});
			}
		});
		//径向渐变半径
		$("#gradient_radius").spinner({
			min: 0,
			max: 100,
			unit: "%",
			step: 5,
			onChange: function(val){
				Designer.setFillStyle({radius: val/100});
			}
		});
		//改变背景图片
		$("#fill_change_img").button({
			onClick: function(){
				UI.showImageSelect(function(fileId, w, h){
					Designer.setFillStyle({
						type: "image",
						fileId: fileId,
						imageW: w,
						imageH: h
					});
				});
			}
		});
		//背景图片显示
		$("#fill_img_display").button({
			onMousedown: function(){
				$("#img_display_list").dropdown({
					target: $("#fill_img_display"),
					onSelect: function(item){
						var type = item.attr("ty");
						$("#fill_img_display").button("setText", item.text());
						Designer.setFillStyle({display: type});
					}
				});
			}
		});
		//透明度
		$("#spinner_opacity").spinner({
			min: 0,
			max: 100,
			unit: "%",
			step: 5,
			onChange: function(val){
				Designer.setShapeStyle({alpha: val/100});
			}
		});
		//X坐标
		$("#dock_metric_x").spinner({
			min: -800,
			unit: "px",
			step: 5,
			onChange: function(val){
				Designer.setShapeProps({x: val});
			}
		});
		$("#dock_metric_x").spinner("setValue", "0px");
		//宽度
		$("#dock_metric_w").spinner({
			min: 20,
			unit: "px",
			step: 5,
			onChange: function(val){
				Designer.setShapeProps({w: val});
			}
		});
		//Y坐标
		$("#dock_metric_y").spinner({
			min: -800,
			unit: "px",
			step: 5,
			onChange: function(val){
				Designer.setShapeProps({y: val});
			}
		});
		$("#dock_metric_y").spinner("setValue", "0px");
		//高度
		$("#dock_metric_h").spinner({
			min: 20,
			unit: "px",
			step: 5,
			onChange: function(val){
				Designer.setShapeProps({h: val});
			}
		});
		//角度
		$("#dock_metric_angle").spinner({
			min: 0,
			max: 360,
			unit: "°",
			step: 15,
			onChange: function(val){
				var angle = val / 180 * Math.PI;
				Designer.setShapeProps({angle: angle});
			}
		});
		//画布尺寸
		$("#dock_page_size").button({
			onMousedown: function(){
				$("#page_size_list").dropdown({
					target: $("#dock_page_size"),
					onSelect: function(item){
						var w = parseInt(item.attr("w"));
						var h = parseInt(item.attr("h"));
						Designer.setPageStyle({width: w, height: h});
						$("#dock_page_size").button("setText", item.text());
					}
				});
				var item = $("#page_size_list").children("li[w="+Model.define.page.width+"][h="+Model.define.page.height+"]");
				if(item.length > 0){
					$("#page_size_list").dropdown("select", item);
				}else{
					$("#page_size_list").dropdown("select", $("#dock_size_custom"));
				}
				$("#dock_size_w").spinner("setValue", Model.define.page.width + "px");
				$("#dock_size_h").spinner("setValue", Model.define.page.height + "px");
			}
		});
		$("#dock_size_w").spinner({
			min: 200,
			unit: "px",
			step: 100,
			onChange: function(val){
				Designer.setPageStyle({width: val});
			}
		});
		$("#dock_size_h").spinner({
			min: 200,
			unit: "px",
			step: 100,
			onChange: function(val){
				Designer.setPageStyle({height: val});
			}
		});
		//页面边距
		$("#dock_page_padding").button({
			onMousedown: function(){
				$("#page_padding_list").dropdown({
					target: $("#dock_page_padding"),
					onSelect: function(item){
						var p = parseInt(item.attr("p"));
						Designer.setPageStyle({padding: p})
						$("#dock_page_padding").button("setText", item.text());
					}
				});
				var item = $("#page_padding_list").children("li[p="+Model.define.page.padding+"]");
				$("#page_padding_list").dropdown("select", item);
			}
		});
		//画布背景颜色
		$("#dock_page_color").colorButton({
			position: "center",
			onSelect: function(color){
				Designer.setPageStyle({backgroundColor: color});
			}
		});
		//是否显示网格
		$("#dock_page_showgrid").bind("change", function(){
			var showGrid = $(this).is(":checked");
			Designer.setPageStyle({showGrid: showGrid});
			if(showGrid){
				$("#dock_gridsize_box").show();
			}else{
				$("#dock_gridsize_box").hide();
			}
		});
		//网格大小
		$("#dock_page_gridsize").button({
			onMousedown: function(){
				$("#page_gridsize_list").dropdown({
					target: $("#dock_page_gridsize"),
					onSelect: function(item){
						var s = parseInt(item.attr("s"));
						Designer.setPageStyle({gridSize: s})
						$("#dock_page_gridsize").button("setText", item.text());
					}
				});
				var item = $("#page_gridsize_list").children("li[s="+Model.define.page.gridSize+"]");
				$("#page_gridsize_list").dropdown("select", item);
			}
		});
		//播放速度
		$("#spinner_play_speed").spinner({
			min: 1,
			max: 30,
			unit: "s",
			step: 1,
			value: 5,
			onChange: function(val){
				
			}
		});
		$("#spinner_play_speed").spinner("setValue", "2s");
		//版本播放
		$("#btn_history_play").button({
			onClick: function(){
				if($("#btn_history_play").children().hasClass("ico_pause")){
					Dock.pauseVersions();
				}else{
					Dock.playVersions();
				}
			}
		});
		$("#btn_history_restore").button({
			onClick: function(){
				Dock.restoreVersion();
			}
		});
		this.showView("navigator");
	},
	/**
	 * 当前Dock窗口
	 * @type {String}
	 */
	currentView: "",
	/**
	 * 打开一个Dock窗口
	 * @param {} name
	 */
	showView: function(name){
		if($("#dock_btn_" + name).button("isDisabled")){
			return;
		}
		$(".dock_view").hide();
		$(".dock_view_" + name).show();
		$(".dock_buttons").children().removeClass("selected");
		$("#dock_btn_" + name).addClass("selected");
		if(Dock.currentView == "history" && name != "history"){
			Dock.closeHistory();
		}
		this.currentView = name;
		this.update(true);
	},
	/**
	 * 设置Dock的填充样式
	 * @param {} fillStyle
	 */
	setFillStyle: function(fillStyle){
		$("#dock_fill_type").button("setText", $("#dock_fill_list").children("li[ty="+fillStyle.type+"]").text());
		$(".fill_detail").hide();
		if(fillStyle.type == "solid"){
			$(".fill_detail_solid").show();
			$("#fill_solid_btn").colorButton("setColor", fillStyle.color);
		}else if(fillStyle.type == "gradient"){
			$(".fill_detail_gradient").show();
			//渐变颜色
			$("#fill_gradient_begin").attr("c", fillStyle.beginColor).colorButton("setColor", fillStyle.beginColor);
			$("#fill_gradient_end").attr("c", fillStyle.endColor).colorButton("setColor", fillStyle.endColor);
			//渐变类型
			$("#gradient_type").button("setText", $("#gradient_type_list").children("li[ty="+fillStyle.gradientType+"]").text());
			$(".gradient_details").hide();
			if(fillStyle.gradientType == "linear"){
				$("#gradient_type_linear").show();
				$("#gradient_angle").spinner("setValue", Math.round(fillStyle.angle/Math.PI * 180) + "°");
			}else{
				$("#gradient_type_radial").show();
				$("#gradient_radius").spinner("setValue", Math.round(fillStyle.radius * 100) + "%");
			}
		}else if(fillStyle.type == "image"){
			$(".fill_detail_image").show();
			var display = "fill";
			if(fillStyle.display){
				display = fillStyle.display;
			}
			$("#fill_img_display").button("setText", $("#img_display_list").children("li[ty="+display+"]").text());
		}
	},
	/**
	 * 更新Dock
	 */
	update: function(drawNav){
		if(this.currentView == "navigator"){
			if(drawNav){
				Navigator.draw();
			}
			$("#dock_zoom").spinner("setValue", Math.round(Designer.config.scale * 100) + "%");
		}else if(this.currentView == "graphic"){
			var selectedIds = Utils.getSelectedIds();
			var count = selectedIds.length;
			var shapeIds = Utils.getSelectedShapeIds();
			var shapeCount = shapeIds.length;
			if(count == 0){
				$("#dock_line_color").button("disable");
				$("#dock_line_style").button("disable");
				$("#dock_line_width").button("disable");
			}else{
				$("#dock_line_color").button("enable");
				$("#dock_line_style").button("enable");
				$("#dock_line_width").button("enable");
				var shape = Model.getShapeById(selectedIds[0]);
				$("#dock_line_color").colorButton("setColor", shape.lineStyle.lineColor);
				var lineStyleCls = $("#line_style_list").children("li[line="+shape.lineStyle.lineStyle+"]").children().attr("class");
				$("#dock_line_style").children(".linestyle").attr("class", lineStyleCls);
				$("#dock_line_width").spinner("setValue", shape.lineStyle.lineWidth + "px");
			}
			if(shapeCount == 0){
				$("#dock_fill_type").button("disable");
				$("#spinner_opacity").button("disable");
				Dock.setFillStyle({type: "none"});
			}else{
				$("#dock_fill_type").button("enable");
				$("#spinner_opacity").button("enable");
				var shape = Model.getShapeById(shapeIds[0]);
				Dock.setFillStyle(shape.fillStyle);
				$("#spinner_opacity").spinner("setValue", Math.round(shape.shapeStyle.alpha/1*100) + "%");
			}
		}else if(this.currentView == "metric"){
			var shapeIds = Utils.getSelectedShapeIds();
			var shapeCount = shapeIds.length;
			if(shapeCount == 0){
				$("#dock_metric_x").button("disable");
				$("#dock_metric_w").button("disable");
				$("#dock_metric_y").button("disable");
				$("#dock_metric_h").button("disable");
				$("#dock_metric_angle").button("disable");
			}else{
				var shape = Model.getShapeById(shapeIds[0]);
				$("#dock_metric_x").button("enable").spinner("setValue", Math.round(shape.props.x) + "px");
				$("#dock_metric_w").button("enable").spinner("setValue", Math.round(shape.props.w) + "px");
				$("#dock_metric_y").button("enable").spinner("setValue", Math.round(shape.props.y) + "px");
				$("#dock_metric_h").button("enable").spinner("setValue", Math.round(shape.props.h) + "px");
				$("#dock_metric_angle").button("enable").spinner("setValue", Math.round(shape.props.angle/Math.PI*180) + "°");
			}
		}else if(this.currentView == "page"){
			var page = Model.define.page;
			var w = page.width;
			var h = page.height;
			var sizeItem = $("#page_size_list").children("li[w="+w+"][h="+h+"]");
			var sizeText = "";
			if(sizeItem.length > 0){
				sizeText = sizeItem.text();
			}else{
				sizeText = $("#dock_size_custom").text();
			}
			$("#dock_page_size").button("setText", sizeText);
			$("#dock_page_padding").button("setText", page.padding + "px");
			$("#dock_page_color").colorButton("setColor", page.backgroundColor);
			$("#dock_page_showgrid").attr("checked", page.showGrid);
			if(page.showGrid){
				$("#dock_gridsize_box").show();
			}else{
				$("#dock_gridsize_box").hide();
			}
			var gridText = "";
			var gridItem = $("#page_gridsize_list").children("li[s="+page.gridSize+"]");
			if(gridItem.length > 0){
				var gridText = gridItem.text();
			}
			$("#dock_page_gridsize").button("setText", gridText);
		}else if(this.currentView == "attribute"){
			var selectedIds = Utils.getSelectedIds();
			var count = selectedIds.length;
			if(count != 1){
				$(".attr_list").html("<li class='attr_none'>选择一个图形后，在这里查看数据属性</li>");
				$(".attr_add").hide();
				this.fitAttrList();
			}else{
				this.setAttributeList();
				$(".attr_add").show();
				//初始化添加
				this.cancelAttrAdd();
			}
		}if(this.currentView == "history"){
			if(drawNav && Dock.historyVersions == null){
				this.loadHistorys();
			}
		}
	},
	/**
	 * 历史版本暂存
	 * @type {}
	 */
	historyVersions: null,
	/**
	 * 加载历史版本
	 */
	loadHistorys: function(){
		if(chartId == ""){
			$("#history_container").html("<div style='padding: 20px 10px;'>您正在试用状态，无法浏览历史版本</div>")
			return;
		}
		$.ajax({
			url: "/diagraming/history",
			data: {chartId: chartId},
			success: function(data){
				Dock.historyVersions = data;
				if(data.versions.length == 0){
					$("#history_container").html('<div style="padding: 20px 10px;">暂时没有历史版本。<br/>每次修改，都会为您保存一个新的历史版本。</div>');
				}else{
					$("#history_container").html('<ul id="history_versions"></ul>');
					var users = data.users;
					for(var i = 0; i < data.versions.length; i++){
						var v = data.versions[i];
						var newVersion = $('<li vid="'+v.versionId+'" def="'+v.definitionId+'" ind="'+i+'"><div class="version_time">'+v.updateTime+'</div><div class="version_name"></div></li>').appendTo($("#history_versions"));
						var nameContainer = newVersion.children(".version_name");
						for(var j = 0; j < v.userIds.length; j++){
							var userId = v.userIds[j];
							nameContainer.append("<div>"+users[userId]+"</div>");
						}
						var remarkContainer = $("<div class='history_remark'><div class='remark_container'><div class='remark_text'></div><a onclick='Dock.editHistoryRemark(event, \""+v.versionId+"\")' href='javascript:'>注释</a></div></div>").appendTo(newVersion);
						if(v.remark){
							remarkContainer.find(".remark_text").text(v.remark);
						}
						remarkContainer.append("<div class='edit_container'><textarea class='input_text' onclick='event.stopPropagation()'></textarea><a href='javascript:' class='save'>保存</a>&nbsp;&nbsp;<a href='javascript:' class='cancel'>取消</a></div>")
					}
					Dock.resetVersions();
				}
			}
		});
	},
	/**
	 * 重置版本历史
	 */
	resetVersions: function(){
		$("#history_versions").children("li").unbind().bind("click", function(){
			if(Dock.playingTimeout != null){
				return;
			}
			if($(this).hasClass("selected")){
				Dock.closeHistory();
			}else{
				$("#history_versions").children(".selected").removeClass("selected");
				$(this).addClass("selected");
				var defId = $(this).attr("def");
				Dock.showHistoryVersion(defId);
			}
			var current = $("#history_versions").children(".selected");
			if(current.length != 0 && current.attr("ind") != "0"){
				$("#spinner_play_speed").button("enable");
				$("#btn_history_play").button("enable");
				$("#btn_history_restore").button("enable");
			}else{
				$("#spinner_play_speed").button("disable");
				$("#btn_history_play").button("disable");
				$("#btn_history_restore").button("disable");
			}
		});
		$("#history_versions").height("auto");
		var top = $("#history_versions").offset().top;
		var bottom = top + $("#history_versions").height() + 75;
		if(bottom > $(window).height()){
			var height = $(window).height() - top - 75;
			if(height < 140){
				height = 140;
			}
			$("#history_versions").height(height);
		}else{
			$("#history_versions").height("auto");
		}
	},
	/**
	 * 编辑版本注释
	 * @param {} event
	 */
	editHistoryRemark: function(event, versionId){
		event.stopPropagation();
		var versionDom = $("#history_versions").children("li[vid="+versionId+"]");
		versionDom.find(".remark_container").hide();
		var currentRemark = versionDom.find(".remark_text").text();
		var editContainer = versionDom.find(".edit_container");
		editContainer.show();
		editContainer.children("textarea").val(currentRemark).select();
		editContainer.children(".save").bind("click", function(e){
			e.stopPropagation();
			var newRemark = editContainer.children("textarea").val();
			versionDom.find(".remark_text").text(newRemark);
			versionDom.find(".remark_container").show();
			editContainer.hide();
			if(newRemark != currentRemark){
				CLB.send({
					action: "versionRemark",
					remark: newRemark,
					versionId: versionId
				});
			}
		});
		editContainer.children(".cancel").bind("click", function(e){
			e.stopPropagation();
			Dock.cancelHistoryRemark();
		});
	},
	/**
	 * 取消版本注释的编辑
	 */
	cancelHistoryRemark: function(){
		$(".remark_container").show();
		$(".edit_container").hide();
	},
	/**
	 * 展示历史版本
	 */
	showHistoryVersion: function(defId){
		$("#spinner_play_speed").button("disable");
		$("#btn_history_play").button("disable");
		$("#btn_history_restore").button("disable");
		Dock.cancelHistoryRemark();
		$.ajax({
			url: "/diagraming/getdefinition",
			data: {definitionId: defId},
			success: function(data){
				Dock.openHistory(data.definition);
				if($("#history_versions").children(".selected").attr("ind") != "0"){
					$("#spinner_play_speed").button("enable");
					$("#btn_history_play").button("enable");
					$("#btn_history_restore").button("enable");
				}
			}
		});
	},
	/**
	 * 播放版本历史
	 */
	playVersions: function(){
		var current = $("#history_versions").children(".selected");
		if(current.length == 0){
			return;
		}
		var index = parseInt(current.attr("ind"));
		Dock.playOneVersion(--index, 0);
		$("#btn_history_play").children().attr("class", "ico ico_pause");
		$("#btn_history_play").attr("title", "暂停").trigger("mouseenter");
	},
	/**
	 * 终止播放
	 */
	pauseVersions: function(){
		if(this.playingTimeout){
			clearTimeout(this.playingTimeout);
		}
		this.playingTimeout = null;
		$("#btn_history_play").children().attr("class", "ico ico_play");
		$("#btn_history_play").attr("title", "从此版本播放");
		$(".ico_playing").remove();
		var current = $("#history_versions").children(".selected");
		$("#history_versions").children(".playing").removeClass("playing");
		if(current.length != 0 && current.attr("ind") != "0"){
			$("#spinner_play_speed").button("enable");
			$("#btn_history_play").button("enable");
			$("#btn_history_restore").button("enable");
		}else{
			$("#spinner_play_speed").button("disable");
			$("#btn_history_play").button("disable");
			$("#btn_history_restore").button("disable");
		}
	},
	playingTimeout: null,
	/**
	 * 播放一个版本
	 */
	playOneVersion: function(index, msgIndex){
		var current = $("#history_versions").children("li[ind="+index+"]");
		$("#history_versions").children(".selected").removeClass("selected");
		current.addClass("selected").addClass("playing");
		$(".ico_playing").remove();
		current.append("<div class='ico ico_playing'></div>");
		
		var version = Dock.historyVersions.versions[index];
		var messageStr = version.messages[msgIndex];
		var messages = JSON.parse(messageStr);
		MessageSource.receive(messages);
		var top = current.position().top;
		if(top < 0){
			$("#history_versions").scrollTop($("#history_versions").scrollTop() + top);
		}
		var time = $("#spinner_play_speed").spinner("getValue") * 1000;
		if(index == 0 && msgIndex == version.messages.length - 1){
			this.pauseVersions();
		}else{
			if(msgIndex < version.messages.length - 1){
				msgIndex++;
			}else{
				index = index - 1;
				msgIndex = 0;
			}
			this.playingTimeout = setTimeout(function(){
				Dock.playOneVersion(index, msgIndex);
			}, time);
		}
		
	},
	currentDefinition: null,
	/**
	 * 打开一个历史版本
	 */
	openHistory: function(definition){
		if(this.currentDefinition == null){
			this.currentDefinition = $.extend(true, {}, Model.define);
		}
		Utils.unselect();
		Designer.open(definition);
		//取消快捷键
		Designer.hotkey.cancel();
		Designer.op.cancel();
		$("#menu_bar").children().addClass("readonly");
		$(".diagram_title").addClass("readonly");
		$(".dock_buttons").children().addClass("disabled");
		$("#dock_btn_history").removeClass("disabled");
		$(".panel_box").addClass("readonly");
		//中止监听
		CLB.stopListen();
	},
	/**
	 * 关闭历史版本
	 */
	closeHistory: function(){
		if(this.currentDefinition != null){
			Designer.open(this.currentDefinition);
			this.currentDefinition = null;
			this.activeOperation();
		}
	},
	/**
	 * 激活操作
	 */
	activeOperation: function(){
		//重新初始化快捷键
		Designer.hotkey.init();
		Designer.op.init();
		$("#menu_bar").children().removeClass("readonly");
		$(".diagram_title").removeClass("readonly");
		$(".dock_buttons").children().removeClass("disabled");
		$("#dock_btn_history").removeClass("disabled");
		$(".panel_box").removeClass("readonly");
		$("#history_versions").children(".selected").removeClass("selected");
		//继续监听
		CLB.listen();
		Dock.loadHistorys();
	},
	/**
	 * 恢复版本
	 */
	restoreVersion: function(){
		var selected = $("#history_versions").children(".selected");
		if(selected.length){
			MessageSource.beginBatch();
			var elements = Dock.currentDefinition.elements;
			//删除当前的所有
			var removed = [];
			if(elements){
				for(var id in elements){
					removed.push(elements[id]);
				}
			}
			MessageSource.send("remove", removed);
			//更新画布
			var updatePageMsg = {
				page: Utils.copy(Dock.currentDefinition.page),
				update: Utils.copy(Model.define.page)
			};
			MessageSource.send("updatePage", updatePageMsg);
			//添加新图形
			var newElements = Model.define.elements;
			var added = [];
			if(newElements){
				for(var id in newElements){
					added.push(newElements[id]);
				}
			}
			MessageSource.send("create", added);
			MessageSource.commit();
			Dock.activeOperation();
		}
	},
	/**
	 * 设置数据属性列表
	 */
	setAttributeList: function(){
		var selectedIds = Utils.getSelectedIds();
		var shape = Model.getShapeById(selectedIds[0]);
		$(".attr_list").empty();
		if(shape.dataAttributes){
			for (var i = 0; i < shape.dataAttributes.length; i++) {
				var attr = shape.dataAttributes[i];
				var typeText = $("#attr_add_type").children("option[value="+attr.type+"]").text();
				var item = $("<li id='"+attr.id+"' class='attr_item attr_item_"+attr.id+"' onclick=\"Dock.editAttr('"+attr.id+"')\"><div class='attr_name'>"+attr.name+"</div><div class='attr_type'>"+typeText+"</div><div class='attr_value'>"+attr.value+"</div><div style='clear: both'></div></li>").appendTo($(".attr_list"));
				if(attr.category != "default"){
					item.append("<div class='ico ico_attr_delete' onclick=\"Dock.deleteAttr('"+attr.id+"', event)\"></div>");
				}
			}
		}
		this.fitAttrList();
	},
	/**
	 * 让数据属性列表适应
	 */
	fitAttrList: function(){
		var scroll = $(".attr_list").scrollTop();
		$(".attr_list").height("auto");
		var top = $(".attr_list").offset().top;
		var bottom = top + $(".attr_list").height() + 10;
		if(bottom > $(window).height()){
			var height = $(window).height() - top - 10;
			if(height < 140){
				height = 140;
			}
			$(".attr_list").height(height);
		}else{
			$(".attr_list").height("auto");
		}
		$(".attr_list").scrollTop(scroll);
	},
	/**
	 * 打开数据属性添加
	 */
	showAttrAdd: function(){
		$("#attr_add_btn").hide();
		$(".attr_add_items").show();
		$("#attr_add_name").val("").focus();
		$("#attr_add_type").val("string");
		$("#attr_add_type").unbind().bind("change", function(){
			Dock.setAttrValueInput(null, $(this).val());
		});
		Dock.setAttrValueInput(null, "string");
		this.fitAttrList();
	},
	/**
	 * 保存数据属性添加
	 */
	saveAttrAdd: function(){
		var name = $("#attr_add_name").val();
		if(name == ""){
			$("#attr_add_name").focus();
			return;
		}
		var type = $("#attr_add_type").val();
		var value = $("#attr_add_value_arera").children().val();
		var newAttr = {
			name: name,
			type: type,
			value: value
		};
		Designer.addDataAttribute(newAttr);
		this.setAttributeList();
		//初始化添加区域
		this.showAttrAdd();
	},
	/**
	 * 取消数据属性添加
	 */
	cancelAttrAdd: function(){
		$("#attr_add_btn").show();
		$(".attr_add_items").hide();
		this.fitAttrList();
	},
	/**
	 * 编辑数据属性
	 * @param {} attrId
	 */
	editAttr: function(attrId){
		var item = $(".attr_item_" + attrId);
		if(item.hasClass("attr_editing")){
			return;
		}
		if($(".attr_editing").length > 0){
			var editingId = $(".attr_editing").attr("id");
			this.saveAttrEdit(editingId);
		}
		item = $(".attr_item_" + attrId);
		item.addClass("attr_editing");
		var attr = Designer.getDataAttrById(attrId);
		//属性值输入
		var input = this.setAttrValueInput(attr, attr.type);
		input.val(attr.value).select();
		if(attr.category != "default"){
			//属性名和类型输入
			var nameDiv = item.children(".attr_name");
			nameDiv.empty();
			var nameInput = $("<input type='text' class='input_text' style='width: 88px'/>").appendTo(nameDiv);
			nameInput.val(attr.name).select();
			var typeDiv = item.children(".attr_type");
			typeDiv.empty();
			var select = $("<select class='input_select' style='width: 60px'></select>").appendTo(typeDiv);
			select.html($("#attr_add_type").html()).val(attr.type);
			select.bind("change", function(){
				Dock.setAttrValueInput(attr, $(this).val());
			});
		}
		//添加显示设置
		var displayArea = $("<div class='attr_edit_display'></div>").appendTo(item);
		//显示为的按钮
		displayArea.append("<div class='dock_label'>显示为：</div>");
		displayArea.append("<div id='attr_edit_showtype' class='toolbar_button active btn_inline' style='width: 75px;'><div class='text_content'></div><div class='ico ico_dropdown'></div></div>");
		displayArea.append("<div style='clear: both'></div>");
		//显示参数区域
		displayArea.append("<div class='attr_display_options'></div>");
		this.appendDisplayItems();
		var showType = "none";
		if(attr.showType){
			showType = attr.showType;
		}
		this.setAttrDisplay(showType);
		$("#attr_edit_showtype").attr("ty", showType).button({
			onMousedown: function(){
				$("#attr_display_list").dropdown({
					target: $("#attr_edit_showtype"),
					onSelect: function(item){
						var type = item.attr("ty");
						$("#attr_edit_showtype").attr("ty", type).button("setText", item.text());
						Dock.setAttrDisplay(type);
					}
				});
				var type = $("#attr_edit_showtype").text().trim();
				$("#attr_display_list").children().each(function(){
					if($(this).text() == type){
						$("#attr_display_list").dropdown("select", $(this));
						return false;
					}
				});
			}
		});
		$("#attr_edit_showtype").attr("ty", showType).button("setText", $("#attr_display_list").children("li[ty="+showType+"]").html());
		if(showType != "none"){
			$("#attr_display_name").attr("checked", attr.showName);
			if(showType == "icon"){
				this.setAttrIcon(attr.icon);
			}
		}
		var horizontal = "mostright";
		if(attr.horizontal){
			horizontal = attr.horizontal;
		}
		var vertical = "mostbottom";
		if(attr.vertical){
			vertical = attr.vertical;
		}
		$("#attr_location_h").button("setText", $("#attr_location_h_list").children("li[loc="+horizontal+"]").html());
		$("#attr_location_h").attr("loc", horizontal);
		$("#attr_location_v").button("setText", $("#attr_location_v_list").children("li[loc="+vertical+"]").html());
		$("#attr_location_v").attr("loc", vertical);
		//添加保存按钮
		item.append("<div class='attr_edit_btns'><div id='save_edit_attr' class='toolbar_button active'>确定</div><div id='cancel_edit_attr' class='toolbar_button active' style='margin-left: 5px;'>取消</div></div>");
		$("#save_edit_attr").bind("click", function(e){
			e.stopPropagation();
			Dock.saveAttrEdit(attrId);
		});
		$("#cancel_edit_attr").bind("click", function(e){
			e.stopPropagation();
			Dock.setAttributeList();
		})
	},
	/**
	 * 设置数据属性值的输入
	 * @param {} attr
	 * @param {} type
	 */
	setAttrValueInput: function(attr, type){
		var valueArea;
		if(attr != null){
			//如果为null，则是添加时调用，否则为修改
			valueArea = $(".attr_editing").children(".attr_value");
		}else{
			valueArea = $("#attr_add_value_arera");
		}
		valueArea.empty();
		var result;
		if(type == "boolean"){
			result = $("<select class='input_select'><option value=''></option><option value='true'>true</option><option value='false'>false</option></select>").appendTo(valueArea);;
		}else if(type == "list"){
			result = $("<select class='input_select'></select>").appendTo(valueArea);
			if(attr.listItems){
				for (var i = 0; i < attr.listItems.length; i++) {
					var listItem = attr.listItems[i];
					result.append("<option value='"+listItem+"'>"+listItem+"</option>");
				}
			}
		}else{
			result = $("<input type='text' class='input_text'/>").appendTo(valueArea);
		}
		if(attr == null){
			valueArea.children().css("width", "260px");
		}else{
			valueArea.children().css("width", "128px");
		}
		return result;
	},
	/**
	 * 添加数据显示的编辑项
	 */
	appendDisplayItems: function(){
		var optionsArea = $(".attr_display_options");
		//详细区域，包括是否显示name，图标
		var detailArea = $("<div class='opt_area'></div>").appendTo(optionsArea);
		detailArea.append("<input id='attr_display_name' type='checkbox'/><label for='attr_display_name'>显示属性名</label>");
		//选择图标的Button
		var iconButtonArea = $("<div id='attr_icon_area' style='padding-top:5px;'></div>").appendTo(detailArea);
		iconButtonArea.append("<div class='dock_label'>图标：</div>");
		iconButtonArea.append("<div id='attr_display_icon' ico='' class='toolbar_button active btn_inline' style='width: 50px'><div class='text_content'></div><div class='ico ico_dropdown'></div></div>");
		iconButtonArea.append("<div style='clear: both'></div>");
		if($("#attr_icon_list").children("li").html() == ""){
			//初始化图标选择
			var html = "";
			var index = 1;
			while(index <= 49 ){
				if(index == 30){
					//30时，要空出一格
					html += "<div></div>";
				}
				html += "<div onmousedown='Dock.setAttrIcon("+index+")' class='attr_icon_item'></div>";
				index++;
			}
			$("#attr_icon_list").children("li").html(html);
		}
		//位置设置区域
		var locationArea = $("<div class='opt_area location_area'></div>").appendTo(optionsArea);
		locationArea.append("<div>显示位置：</div>");
		locationArea.append("<div class='dock_label'>水平：</div>");
		locationArea.append("<div id='attr_location_h' class='toolbar_button active btn_inline' loc='mostright'><div class='text_content location_content'><div><span style='left: 11px'></span></div>Most Right</div><div class='ico ico_dropdown'></div></div>");
		locationArea.append("<div style='clear: both'></div>");
		locationArea.append("<div class='dock_label'>垂直：</div>");
		locationArea.append("<div id='attr_location_v' class='toolbar_button active btn_inline' loc='mostbottom'><div class='text_content location_content'><div><span style='top: 11px'></span></div>Most Bottom</div><div class='ico ico_dropdown'></div></div>");
		locationArea.append("<div style='clear: both'></div>");
		optionsArea.append("<div style='clear: both'></div>");
		$("#attr_display_icon").button({
			onMousedown: function(){
				$("#attr_icon_list").dropdown({
					target: $("#attr_display_icon")
				});
			}
		});
		$("#attr_location_h").button({
			onMousedown: function(){
				$("#attr_location_h_list").dropdown({
					target: $("#attr_location_h"),
					onSelect: function(item){
						$("#attr_location_h").button("setText", item.html());
						$("#attr_location_h").attr("loc", item.attr("loc"));
					}
				});
			}
		});
		$("#attr_location_v").button({
			onMousedown: function(){
				$("#attr_location_v_list").dropdown({
					target: $("#attr_location_v"),
					onSelect: function(item){
						$("#attr_location_v").button("setText", item.html());
						$("#attr_location_v").attr("loc", item.attr("loc"));
					}
				});
			}
		});
	},
	/**
	 * 根据数据属性显示类型，设置操作界面
	 * @param {} type
	 */
	setAttrDisplay: function(type){
		if(type == "none"){
			$(".attr_display_options").hide();
		}else{
			$(".attr_display_options").show();
			if(type == "icon"){
				$("#attr_icon_area").show();
			}else{
				$("#attr_icon_area").hide();
			}
		}
	},
	/**
	 * 设置数据属性的显示图标
	 * @param {} icon
	 */
	setAttrIcon: function(icon){
		$("#attr_display_icon").attr("ico", icon).button("setText", "");
		if(icon){
			$("#attr_display_icon").button("setText", "<img src='/images/data-attr/"+icon+".png'/>");
		}
	},
	/**
	 * 保存数据属性编辑
	 * @param {} attrId
	 */
	saveAttrEdit: function(attrId){
		var item = $(".attr_item_" + attrId);
		if(!item.hasClass("attr_editing")){
			return;
		}
		var attr = Designer.getDataAttrById(attrId);
		if(attr.category != "default"){
			var name = item.children(".attr_name").children("input").val();
			if(name == ""){
				item.children(".attr_name").children("input").focus();
				return;
			}
			attr.name = name;
			attr.type = item.children(".attr_type").children("select").val();
		}
		attr.value = item.children(".attr_value").children().val();
		var showType = $("#attr_edit_showtype").attr("ty");
		attr.showType = showType;
		if(showType != "none"){
			attr.showName = $("#attr_display_name").is(":checked");
			attr.horizontal = $("#attr_location_h").attr("loc");
			attr.vertical = $("#attr_location_v").attr("loc");
			if(showType == "icon"){
				attr.icon = $("#attr_display_icon").attr("ico");
			}
		}
		//BPMN数据属性规则
		var selectedIds = Utils.getSelectedIds();
		var shape = Model.getShapeById(selectedIds[0]);
		if(attr.category == "default" && shape.category == "bpmn"){
			if(!shape.attribute){
				shape.attribute = {};
			}
			if(!shape.attribute.markers){
				shape.attribute.markers = [];
			}
			var markers = shape.attribute.markers;
			if(attr.name == "loopCharacteristics"){
				Utils.removeFromArray(markers, "loop");
				Utils.removeFromArray(markers, "sequential");
				Utils.removeFromArray(markers, "parallel");
				if(attr.value == "StandardLoopCharacteristics"){
					//显示循环
					Utils.addToArray(markers, "loop");
				}else if(attr.value == "MultipleLoopCharacteristics"){
					var sequantial = Designer.getDefaultDataAttrByName("isSequantial");
					if(sequantial != null){
						if(sequantial.value == "true"){
							//显示三条横线
							Utils.addToArray(markers, "sequential");
						}else{
							//显示三条竖线
							Utils.addToArray(markers, "parallel");
						}
					}
				}
			}else if(attr.name == "isSequantial"){
				Utils.removeFromArray(markers, "sequential");
				Utils.removeFromArray(markers, "parallel");
				var loop = Designer.getDefaultDataAttrByName("loopCharacteristics");
				if(loop != null && loop.value == "MultipleLoopCharacteristics"){
					if(attr.value=="true"){
						//显示三条横线
						Utils.addToArray(markers, "sequential");
					}else{
						//显示三条竖线
						Utils.addToArray(markers, "parallel");
					}
				}
			}else if(attr.name == "isForCompensation"){
				//显示两个左箭头
				Utils.removeFromArray(markers, "compensation");
				if(attr.value=="true"){
					Utils.addToArray(markers, "compensation");
				}
			}else if(attr.name == "isCollection" || attr.name == "ParticipantMultiplicity"){
				Utils.removeFromArray(markers, "parallel");
				if(attr.value=="true"){
					//显示三条竖线
					Utils.addToArray(markers, "parallel");
				}
			}else if(attr.name == "loopType"){
				Utils.removeFromArray(markers, "loop");
				Utils.removeFromArray(markers, "sequential");
				Utils.removeFromArray(markers, "parallel");
				if(attr.value=="Standard"){
					//显示循环
					Utils.addToArray(markers, "loop");
				}else if(attr.value=="MultiInstanceSequential"){
					//显示三条横线
					Utils.addToArray(markers, "sequential");
				}else if(attr.value=="MultiInstanceParallel"){
					//显示三条竖线
					Utils.addToArray(markers, "parallel");
				}
			}
		}
		Designer.updateDataAttribute(attr);
		this.setAttributeList();
	},
	/**
	 * 删除数据属性
	 * @param {} attrId
	 */
	deleteAttr: function(attrId, event){
		event.stopPropagation();
		var item = $(".attr_item_" + attrId);
		item.remove();
		this.fitAttrList();
		Designer.deleteDataAttribute(attrId);
	},
	/**
	 * 进入全屏
	 */
	fullScreen: function(element, presentation){
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else {
			//无法进入全屏，提示错误
			if(presentation){
				$("#fullscreen_tip").find(".t").text("由于您的浏览器限制，无法进入演示视图。");
			}else{
				$("#fullscreen_tip").find(".t").text("无法进入全屏视图，您可以按(F11)进入。");
			}
			$("#fullscreen_tip").fadeIn();
		}
	},
	/**
	 * 进入演示视图
	 */
	enterPresentation: function(){
		$("#designer").bind('webkitfullscreenchange', function(e) {
			Dock.manageFullScreen();
		});
		$(document).bind('mozfullscreenchange', function(e) {
			Dock.manageFullScreen();
		}).bind('fullscreenchange', function(e) {
			Dock.manageFullScreen();
		});
		this.fullScreen(Utils.getDomById("designer"), true);
		
	},
	/**
	 * 进入全屏视图
	 */
	enterFullScreen: function(){
		this.fullScreen(document.documentElement);
	},
	manageFullScreen: function(){
		var designer = Utils.getDomById("designer");
		if(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement){
			//如果进入全屏状态
			$("#shape_panel").addClass("readonly");
			$("#designer_viewport").addClass("readonly");
			$(window).unbind("resize.designer");
			$("#designer_layout").height(window.screen.height);
			//取消快捷键
			Designer.hotkey.cancel();
			Designer.op.cancel();
			//隐藏Dock
			$("#dock").hide();
			$(".dock_view").hide();
			Designer.contextMenu.destroy();
			Designer.op.canvasFreeDraggable();
		}else{
			$("#shape_panel").removeClass("readonly");
			$("#designer_viewport").removeClass("readonly");
			Designer.initialize.initLayout();
			Designer.hotkey.init();
			Designer.op.init();
			$("#dock").show();
			if(Dock.currentView != ""){
				Dock.showView(Dock.currentView);
			}
			Designer.contextMenu.init();
			$("#designer").unbind('webkitfullscreenchange');
			$("#designer").unbind('mozfullscreenchange').unbind('fullscreenchange');
		}
	}
};

