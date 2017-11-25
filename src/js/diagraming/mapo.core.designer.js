
/**
 * 核心JS
 */


var Designer = {
	/**
	 * 配置信息
	 */
	config: {
		//图形面板图形宽高
		panelItemWidth: 30,
		panelItemHeight: 30,
		//画布相对于画布容器的margin值
		pageMargin: 1000,
		//锚点尺寸
		anchorSize: 8,
		//旋转点尺寸
		rotaterSize: 9, 
		//锚点边框颜色
		anchorColor: "#833",
		//选择器边框颜色
		selectorColor: "#833",
		//默认缩放值
		scale: 1
	},
	/**
	 * 设计器状态，值包括：demo | readonly | presentation
	 * @type {String}
	 */
	status: "",
	/**
	 * 初始化
	 */
	initialize: {
		/**
		 * 是否初始化完成
		 * @type {Boolean}
		 */
		initialized: false,
		/**
		 * 初始化布局
		 */
		initLayout: function(){
			//Init designer layout.
			$(window).bind("resize.designer", function(){
				var height = $(window).height() - $("#designer_header").outerHeight() - $("#designer_footer").outerHeight();
				$(".layout").height(height);
				if($("#demo_signup").length){
					$("#designer_layout").height(height - $("#demo_signup").outerHeight());
				}
			});
			$(window).trigger("resize.designer");
		},
		/**
		 * 初始化对象
		 */
		initModel: function(){
			Model.define = {
				page: Utils.copy(Schema.pageDefaults),
				elements: {}
			};
			Model.persistence = {
				page: Utils.copy(Schema.pageDefaults),
				elements: {}
			};
		},
		/**
		 * 初始化画布
		 */
		initCanvas: function(){
			var w = Model.define.page.width.toScale();
			var h = Model.define.page.height.toScale();
			var pageColor = Model.define.page.backgroundColor;
			var darker = Utils.getDarkerColor(pageColor); //较深一级的颜色，为画布外围颜色、网格浅色线条
			var darkest = Utils.getDarkestColor(pageColor); //更深一级的颜色，为网格深色线条颜色
			//图形画布容器
			$("#designer_canvas").css({
				"background-color": "rgb("+darker+")"
			});
			//网布网格
			var grids = $("#designer_grids");
			grids.attr({
				width: w,
				height: h
			});
			var ctx = grids[0].getContext("2d");
			ctx.clearRect(0,0,w,h);
			var padding = Model.define.page.padding.toScale();
			var gridsW = w - padding*2;
			var gridsH = h - padding*2;
			//绘制网格
			ctx.fillStyle = "rgb(" + pageColor + ")";
			ctx.beginPath();
			ctx.rect(padding, padding, gridsW, gridsH);
			ctx.fill();
			var gridSize = Math.round(Model.define.page.gridSize.toScale());
			if(gridSize < 10){
				gridSize = 10;
			}
			if(Model.define.page.showGrid){
				ctx.translate(padding, padding);
				ctx.lineWidth = 1;
				ctx.save();
				var current = 0.5;
				var index = 0;
				//画横线
				while(current <= gridsH){
					ctx.restore();
					if(index % 4 == 0){
						//画深色线条
						ctx.strokeStyle = "rgb(" + darkest + ")";
					}else{
						//浅色线条
						ctx.strokeStyle = "rgb("+darker+")";
					}
					ctx.beginPath();
					ctx.moveTo(0, current);
					ctx.lineTo(gridsW, current);
					current += gridSize;
					index ++;
					ctx.stroke();
				}
				current = 0.5;
				index = 0;
				//画竖线
				while(current <= gridsW){
					ctx.restore();
					if(index % 4 == 0){
						//画深色线条
						ctx.strokeStyle = "rgb(" + darkest + ")";
					}else{
						//浅色线条
						ctx.strokeStyle = "rgb("+darker+")";
					}
					ctx.beginPath();
					ctx.moveTo(current, 0);
					ctx.lineTo(current, gridsH);
					current += gridSize;
					index ++;
					ctx.stroke();
				}
			}
			//画布的容器区域
			$("#canvas_container").css({
				width: w,
				height: h,
				padding: Designer.config.pageMargin
			});
			if(!this.initialized){
				//如果没有初始化完毕，即第一次初始化，调整滚动条
				$("#designer_layout").scrollTop(Designer.config.pageMargin - 10);
				$("#designer_layout").scrollLeft(Designer.config.pageMargin - 10);
			}
			var domShowGrid = $("#bar_list_page").children("li[ac=set_page_showgrid]");
			domShowGrid.menuitem().unselect();
			if(Model.define.page.showGrid){
				domShowGrid.menuitem().select();
			}
		},
		/**
		 * 初始化形状
		 */
		initShapes: function(){
			//Init shape panel.
			$("#shape_panel").empty();
			for(var i = 0; i < Schema.categories.length; i++){
				var cate = Schema.categories[i];
				if(cate.name == "standard"){
					continue;
				}
				$("#shape_panel").append("<div class='panel_container'><h3 class='panel_title'><div class='ico ico_accordion'></div>" + cate.text + "</h3><div id='panel_" + cate.name + "' class='content'></div></div>");
			}
			$(".panel_title").unbind().bind("click", function(){
				$(this).parent().toggleClass("panel_collapsed");
			});
			//Init schema items.
			for(var name in Schema.shapes){
				var shape = Schema.shapes[name];
				if(shape.attribute.visible && shape.category != "standard"){
					if(!shape.groupName){
						appendPanelItem(shape);
					}else{
						var groupShapes = SchemaGroup.getGroup(shape.groupName);
						if(groupShapes[0] == name){
							appendPanelItem(shape, shape.groupName);
						}
					}
				}
			}
			/**
			 * 添加图形DOM元素
			 */
			function appendPanelItem(shape, group){
				shape = Utils.copy(shape);
				var html = "<div class='panel_box' shapeName='" + shape.name + "'><canvas class='panel_item' width='"+(Designer.config.panelItemWidth)+"' height='"+(Designer.config.panelItemHeight)+"'></canvas></div>";
				var panelBox = $(html).appendTo("#panel_" + shape.category);
				if(group){
					panelBox.append("<div class='group_icon' onmousedown='Designer.op.showPanelGroup(\""+group+"\", event, this)'></div>")
				}
				var canvas = panelBox.children()[0];
				//绑定鼠标悬浮时，显示大图
				panelBox.bind("mouseenter", function(){
					if($(this).hasClass("readonly")){
						return;
					}
					var thumb = $("#shape_thumb");
					thumb.children("div").text(shape.title);
					var ctx = thumb.children("canvas")[0].getContext("2d");
					thumb.attr("current", shape.name);
					var props = {
						x: 0,
						y: 0,
						w: shape.props.w,
						h: shape.props.h,
						angle: shape.props.angle
					};
					var maxWidth = 160;
					var maxHeight = 160;
					ctx.clearRect(0, 0, maxWidth, maxHeight);
					//计算图标的宽高以及位移
					if(shape.props.w >= shape.props.h){
						if(shape.props.w > maxWidth){
							props.w = maxWidth;
							props.h = parseInt(shape.props.h / shape.props.w * props.w);
						}
					}else{
						if(shape.props.h > maxHeight){
							props.h = maxHeight;
							props.w = parseInt(shape.props.w / shape.props.h * props.h);
						}
					}
					thumb.children("canvas").attr({
						"width": maxWidth + 20,
						height: props.h + 20
					});
					thumb.show();
					shape.props = props;
					ctx.save();
					ctx.lineJoin = "round";
					ctx.globalAlpha = shape.shapeStyle.alpha;
					var translateX = (maxWidth + 20 - props.w)/2;
					var translateY = 10;
					ctx.translate(translateX, translateY);
					ctx.translate(props.w/2, props.h/2);
					ctx.rotate(props.angle);
					ctx.translate(-(props.w/2), -(props.h/2));
					Designer.painter.renderShapePath(ctx, shape, false, function(){
						if($("#shape_thumb[current="+shape.name+"]:visible").length > 0){
							panelBox.trigger("mouseenter");
						}
					});
					//绘制BPMN Marker
					Designer.painter.renderMarkers(ctx, shape, false);
					ctx.restore();
					ctx.translate(translateX, translateY);
					//控制坐标
					var top = panelBox.offset().top - $("#designer_header").outerHeight() + panelBox.height()/2 - thumb.outerHeight()/2;
					if(top < 5){
						top = 5;
					}else if(top + thumb.outerHeight() > $("#designer_viewport").height() - 5){
						top = $("#designer_viewport").height() - 5 - thumb.outerHeight();
					}
					thumb.css("top", top);
				}).bind("mouseleave", function(){
					$("#shape_thumb").hide();
				});
				//绘制图形
				Designer.painter.drawPanelItem(canvas, shape.name);
			}
			//Draw panel node items
			initPanelShapes();
			/**
			 * 绘制图形面板
			 */
			function initPanelShapes(){
				$(".panel_box").die().live("mousedown", function(downE){
					var currentShape = $(this);
					if(currentShape.hasClass("readonly")){
						return;
					}
					var name = currentShape.attr("shapeName");
					//给图片面板绑定Draggable，可创建图形
					var anchorInLinkers = [];
					Designer.op.changeState("creating_from_panel");
					//currentShape.css("position", "absolute");
					var createdShape = null;
					var createdBox = null;
					var designer_canvas = $("#designer_canvas");
					var creatingCanvas = getCreatingCanvas(name);
					$("#designer").bind("mousemove.creating", function(moveE){
						setCreatingCanvas(creatingCanvas, moveE);
					});
					$("#canvas_container").bind("mousemove.create", function(e){
						var location = Utils.getRelativePos(e.pageX, e.pageY, designer_canvas);
						if(createdShape == null){
							createdShape = createShape(name, location.x, location.y);
							createdBox = $("#" + createdShape.id);
							createdBox.attr("class", "shape_box_creating");
						}
						createdBox.css({
							left: location.x - createdBox.width()/2 + "px",
							top: location.y - createdBox.height()/2 + "px",
							"z-index": Model.orderList.length
						});
						createdShape.props.x = location.x.restoreScale() - createdShape.props.w/2;
						createdShape.props.y = location.y.restoreScale() - createdShape.props.h/2;
						//显示对齐线
						var p = createdShape.props;
						var snaped = Designer.op.snapLine(p, [createdShape.id], true, createdShape);
						if(snaped.attach){
							createdShape.attachTo = snaped.attach.id;
						}else{
							delete createdShape.attachTo;
						}
						createdBox.css({
							left: (createdShape.props.x - 10).toScale() + "px",
							top: (createdShape.props.y - 10).toScale() + "px",
							"z-index": Model.orderList.length
						});
						//判断是否有锚点在连接线上
						anchorInLinkers = Utils.getShapeAnchorInLinker(createdShape);
						Designer.op.hideLinkPoint();
						for(var i = 0; i < anchorInLinkers.length; i++){
							var anchorInLinker = anchorInLinkers[i];
							for ( var ai = 0; ai < anchorInLinker.anchors.length; ai++) {
								var an = anchorInLinker.anchors[ai];
								Designer.op.showLinkPoint(Utils.toScale(an));
							}
						}
					});
					var created = false;
					//判断mouseup是否发生在了画布上
					$("#canvas_container").bind("mouseup.create", function(e){
						created = true;
					});
					$(document).bind("mouseup.create", function(){
						$(this).unbind("mouseup.create");
						$("#designer").unbind("mousemove.creating");
						$("#creating_shape_container").hide();
						Designer.op.hideLinkPoint();
						Designer.op.hideSnapLine();
						$("#canvas_container").unbind("mouseup.create").unbind("mousemove.create");
						if(createdShape != null){
							if(created == false){
								createdBox.remove();
							}else{
								//创建成功
								MessageSource.beginBatch();
								//发送形状创建事件
								if(createdShape.onCreated){
									var result = createdShape.onCreated();
									if(result == false){
										createdBox.remove();
										MessageSource.commit();
										return;
									}
								}
								createdBox.attr("class", "shape_box");
								Designer.events.push("created", createdShape);
								Model.add(createdShape);
								//如果形状锚点有落在连接线上的情况，则要自动连接
								var shapeCtx = Utils.getShapeContext(createdShape.id);
								var shapeBoxPos = createdBox.position();
								var radius = 7;
								for(var i = 0; i < anchorInLinkers.length; i++){
									var anchorInLinker = anchorInLinkers[i];
									var linker = anchorInLinker.linker;
									if(anchorInLinker.type == "line"){
										//锚点落在了连接线的线上，这时候要创建出一条连接线
										var oriLinker = Utils.copy(linker);
										var newLinker = Utils.copy(linker);
										newLinker.id = Utils.newId();
										if(anchorInLinker.anchors.length == 1){
											//如果有一个锚点落在了连接线上
											var anchor = anchorInLinker.anchors[0];
											var angle = Utils.getPointAngle(createdShape.id, anchor.x, anchor.y, radius);
											linker.to = {id: createdShape.id, x: anchor.x, y: anchor.y, angle: angle};
											newLinker.from = {id: createdShape.id, x: anchor.x, y: anchor.y, angle: angle};
										}else if(anchorInLinker.anchors.length == 2){
											//有两个锚点落在了连接线上
											var anchor1 = anchorInLinker.anchors[0];
											var anchor2 = anchorInLinker.anchors[1];
											//判断两个锚点哪个距离连接线的起点距离较近，则作为以前连线的终点
											var distance1 = Utils.measureDistance(linker.from, anchor1);
											var distance2 = Utils.measureDistance(linker.from, anchor2);
											var toAnchor, fromAnchor;
											if(distance1 < distance2){
												toAnchor = anchor1;
												fromAnchor = anchor2;
											}else{
												toAnchor = anchor2;
												fromAnchor = anchor1;
											}
											var angle = Utils.getPointAngle(createdShape.id, toAnchor.x, toAnchor.y, radius);
											linker.to = {id: createdShape.id, x: toAnchor.x, y: toAnchor.y, angle: angle};
											//计算新创建的连接线
											angle = Utils.getPointAngle(createdShape.id, fromAnchor.x, fromAnchor.y, radius);
											newLinker.from = {id: createdShape.id, x: fromAnchor.x, y: fromAnchor.y, angle: angle};
										}
										if(anchorInLinker.anchors.length <= 2){
											//最多支持两个点落在连接线上的情况
											Designer.painter.renderLinker(linker, true);
											Model.update(linker);
											Designer.painter.renderLinker(newLinker, true);
											newLinker.props.zindex = Model.maxZIndex + 1;
											Model.add(newLinker);
											//抛出事件
											Designer.events.push("linkerCreated", newLinker);
										}
									}else{
										var anchor = anchorInLinker.anchors[0];
										var angle = Utils.getPointAngle(createdShape.id, anchor.x, anchor.y, radius);
										if(anchorInLinker.type == "from"){
											linker.from = {id: createdShape.id, x: anchor.x, y: anchor.y, angle: angle};
										}else{
											linker.to = {id: createdShape.id, x: anchor.x, y: anchor.y, angle: angle};
										}
										Designer.painter.renderLinker(linker, true);
										Model.update(linker);
									}
								}
								Utils.unselect();
								Utils.selectShape(createdShape.id);
								MessageSource.commit();
								Designer.op.editShapeText(createdShape);
							}
						}
						currentShape.css({
							left: "0px",
							top: "0px"
						});
						Designer.op.resetState();
					});
				});
			}
			/**
			 * 创建一个所创建图形的画布，并在上边绘制图形
			 */
			function getCreatingCanvas(name){
				var canvas = $("#creating_shape_canvas");
				var container = $("#creating_shape_container");
				if(canvas.length == 0){
					container = $("<div id='creating_shape_container'></div>").appendTo("#designer");
					canvas = $("<canvas id='creating_shape_canvas' width='"+(Designer.config.panelItemWidth)+"' height='"+(Designer.config.panelItemHeight)+"'></canvas>").appendTo(container);
				}
				container.css({
					left: "0px",
					top: "0px",
					width: $(".panel_container").width(),
					height: $("#shape_panel").outerHeight()
				});
				Designer.painter.drawPanelItem(canvas[0], name);
				return canvas;
			}
			/**
			 * 设置创建时图形的坐标
			 */
			function setCreatingCanvas(canvas, e){
				$("#creating_shape_container").show();
				var location = Utils.getRelativePos(e.pageX, e.pageY, $("#creating_shape_container"));
				canvas.css({
					left: location.x - Designer.config.panelItemWidth/2,
					top: location.y - Designer.config.panelItemHeight/2
				});
			}
			/**
			 * 创建形状
			 * @param schemaName
			 * @param centerX
			 * @param centerY
			 * @returns
			 */
			function createShape(shapeName, centerX, centerY){
				var newId = Utils.newId();
				var shape = Schema.shapes[shapeName];
				var x = centerX.restoreScale() - shape.props.w / 2;
				var y = centerY.restoreScale() - shape.props.h / 2;
				var newShape = Model.create(shapeName, x, y);
				Designer.painter.renderShape(newShape);
				return newShape;
			}
		}
	},
	/**
	 * 快捷键
	 * @type {}
	 */
	hotkey: {
		/**
		 * 初始化快捷键
		 */
		init: function(){
			//初始化快捷键
			var movingShapes = null; //在外围定义movingShapes变量，目的是在移动形状时，不重复获取
			$(document).unbind("keydown.hotkey").bind("keydown.hotkey", function(e){
				if(e.ctrlKey && e.keyCode == 65){
					//全选ctrl+a
					Designer.selectAll();
					e.preventDefault();
				}else if(e.keyCode == 46 || e.keyCode == 8){
					//删除 Delete或者Backspace
					Designer.op.removeShape();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 90){
					//撤销ctrl+z
					MessageSource.undo();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 89){
					//恢复ctrl+y
					MessageSource.redo();
					e.preventDefault();
				}else if(e.ctrlKey && !e.shiftKey && e.keyCode == 67){
					//复制ctrl+c
					Designer.clipboard.copy();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 88){
					//剪切ctrl+x
					Designer.clipboard.cut();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 86){
					//粘贴ctrl+v
					Designer.clipboard.paste();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 68){
					//复用ctrl+d
					Designer.clipboard.duplicate();
					e.preventDefault();
				}else if(e.ctrlKey && e.shiftKey && e.keyCode == 66){
					//格式刷ctrl+b
					Designer.clipboard.brush();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 190){
					//放大ctrl+ >
					Designer.zoomIn();
					e.preventDefault();
				}else if(e.ctrlKey && e.keyCode == 188){
					//缩小ctrl+ <
					Designer.zoomOut();
					e.preventDefault();
				}else if(e.keyCode >= 37 && e.keyCode <= 40){
					//移动选中的图形，上下左右
					if(movingShapes == null){
						var selected = Utils.getSelected();
						//先获取形状的家族图形，一起移动，父级、子级、兄弟
						var familyShapes = Utils.getFamilyShapes(selected);
						selected = selected.concat(familyShapes);
						//获取包含的图形，一起移动
						var containedShapes = Utils.getContainedShapes(selected);
						selected = selected.concat(containedShapes);
						//获取吸附的图形，一起移动
						var attachedShapes = Utils.getAttachedShapes(selected);
						selected = selected.concat(attachedShapes);
						//获取选中形状上的连接线
						var outlinkers = Utils.getOutlinkers(selected);
						movingShapes = selected.concat(outlinkers);
					}
					if(movingShapes.length > 0){
						e.preventDefault();
						//步长为10，如果按着ctrl，为微调，步长为1
						var step = 10;
						if(e.ctrlKey){
							step = 1;
						}
						Utils.hideLinkerCursor();
						UI.hideShapeOptions();
						if(e.keyCode == 37){
							//左移
							Designer.op.moveShape(movingShapes, {x: -step, y: 0});
						}else if(e.keyCode == 38){
							//上移
							Designer.op.moveShape(movingShapes, {x: 0, y: -step});
						}else if(e.keyCode == 39){
							//右移
							Designer.op.moveShape(movingShapes, {x: step, y: 0});
						}else if(e.keyCode == 40){
							//下移
							Designer.op.moveShape(movingShapes, {x: 0, y: step});
						}
						$(document).unbind("keyup.moveshape").bind("keyup.moveshape", function(){
							//发生了拖动，修改定义
							Model.updateMulti(movingShapes);
							movingShapes = null;
							$(document).unbind("keyup.moveshape");
							Designer.op.hideTip();
							Utils.showLinkerCursor();
							UI.showShapeOptions();
						});
					}
				}else if(e.keyCode == 221 && e.ctrlKey){
					//顶层、上移一层ctrl+]
					var type = "front";
					if(e.shiftKey){
						type = "forward";
					}
					Designer.layerShapes(type);
				}else if(e.keyCode == 219 && e.ctrlKey){
					//底层、下移一层ctrl+[
					var type = "back";
					if(e.shiftKey){
						type = "backward";
					}
					Designer.layerShapes(type);
				}else if(e.keyCode == 71 && e.ctrlKey){
					e.preventDefault();
					//组合、取消组合ctrl+G
					if(e.shiftKey){
						Designer.ungroup();
					}else{
						Designer.group();
					}
				}else if(e.keyCode == 76 && e.ctrlKey){
					e.preventDefault();
					//锁定、解锁ctrl+L
					if(e.shiftKey){
						Designer.unlockShapes();
					}else{
						Designer.lockShapes();
					}
				}else if(e.keyCode == 18){
					//Alt，可拖动画布
					Designer.op.changeState("drag_canvas");
				}else if(e.keyCode == 27){
					//Esc
					if(!Designer.op.state){
						Utils.unselect();
						$(".menu.list").hide();
						$(".menu").hide();
						$(".color_picker").hide();
					}else if(Designer.op.state == "creating_free_text" || Designer.op.state == "creating_free_linker"){
						Designer.op.resetState();
					}
				}else if(e.keyCode == 84 && !e.ctrlKey){
					//T，插入文本
					$(".menu.list").hide();
					Designer.op.changeState("creating_free_text");
				}else if(e.keyCode == 73 && !e.ctrlKey){
					//I，插入图片
					$(".menu.list").hide();
					UI.showImageSelect(function(fileId, w, h){
						UI.insertImage(fileId, w, h);
					});
					$("#designer_contextmenu").hide();
				}else if(e.keyCode == 76 && !e.ctrlKey){
					//T，插入文本
					$(".menu.list").hide();
					Designer.op.changeState("creating_free_linker");
					$("#designer_contextmenu").hide();
				}else if(e.keyCode == 66 && e.ctrlKey){
					//Ctrl + B，加粗
					var selectedIds = Utils.getSelectedIds();
					if(selectedIds.length > 0){
						var shape = Model.getShapeById(selectedIds[0]);
						Designer.setFontStyle({bold: !shape.fontStyle.bold});
						UI.update();
					}
				}else if(e.keyCode == 73 && e.ctrlKey){
					//Ctrl + I，斜体
					var selectedIds = Utils.getSelectedIds();
					if(selectedIds.length > 0){
						var shape = Model.getShapeById(selectedIds[0]);
						Designer.setFontStyle({italic: !shape.fontStyle.italic});
						UI.update();
					}
				}else if(e.keyCode == 85 && e.ctrlKey){
					//Ctrl + U，下划线
					var selectedIds = Utils.getSelectedIds();
					if(selectedIds.length > 0){
						var shape = Model.getShapeById(selectedIds[0]);
						Designer.setFontStyle({underline: !shape.fontStyle.underline});
						UI.update();
					}
					e.preventDefault();
				}else if(e.keyCode == 32 && !e.ctrlKey){
					//空格，编辑文本
					var selectedIds = Utils.getSelectedIds();
					if(selectedIds.length == 1){
						var shape = Model.getShapeById(selectedIds[0]);
						Designer.op.editShapeText(shape);
					}
					e.preventDefault();
				}else if(e.keyCode == 121){
					//F10，进入演示视图
					e.preventDefault();
					Dock.enterPresentation();
				}
			});
			$("input,textarea,select").die().live("keydown.hotkey", function(e){
				//阻止冒泡
				e.stopPropagation();
			});
		},
		/**
		 * 取消快捷键
		 */
		cancel: function(){
			$(document).unbind("keydown.hotkey");
		}
	},
	/**
	 * 右键菜单
	 * @type {}
	 */
	contextMenu: {
		init: function(){
			$("#designer_contextmenu").unbind("mousedown").bind("mousedown", function(e){
				e.stopPropagation();
			});
			$("#designer_contextmenu").find("li:not(.devider)").unbind("click").bind("click", function(){
				var item = $(this);
				if(!item.menuitem().isDisabled() && item.children(".extend_menu").length == 0){
					Designer.contextMenu.execAction(item);
					Designer.contextMenu.hide();
				}
			});
			$("#canvas_container").unbind("contextmenu").bind("contextmenu", function(e){
				e.preventDefault();
				var canvas = $("#designer_canvas");
				var pos = Utils.getRelativePos(e.pageX, e.pageY, canvas);
				Designer.contextMenu.show(pos.x, pos.y);
			});
		},
		/**
		 * 取消右键菜单
		 */
		destroy: function(){
			$("#canvas_container").unbind("contextmenu");
			this.hide();
		},
		/**
		 * 记录菜单位置
		 * @type {}
		 */
		menuPos: {x: 0, y: 0, shape: null},
		/**
		 * 打开右键菜单
		 * @param {} x
		 * @param {} y
		 */
		show: function(x, y){
			this.menuPos.x = x;
			this.menuPos.y = y;
			var menu = $("#designer_contextmenu");
			var currentFocus = Utils.getShapeByPosition(x, y, false);
			menu.children().hide();
			menu.children("li[ac=selectall]").show();
			menu.children(".devi_selectall").show();
			menu.children("li[ac=drawline]").show();
			var clipLen = Designer.clipboard.elements.length;
			if(currentFocus == null){
				//画布
				if(clipLen > 0){
					menu.children("li[ac=paste]").show();
					menu.children(".devi_clip").show();
				}
			}else{
				var shape = currentFocus.shape;
				this.menuPos.shape = shape;
				//形状
				if(shape.locked){
					//如果形状是锁定的
					if(clipLen > 0){
						menu.children("li[ac=paste]").show();
						menu.children(".devi_clip").show();
					}
					menu.children("li[ac=unlock]").show();
					menu.children(".devi_shape").show();
				}else{
					menu.children("li[ac=cut]").show();
					menu.children("li[ac=copy]").show();
					menu.children("li[ac=duplicate]").show();
					if(clipLen > 0){
						menu.children("li[ac=paste]").show();
					}
					menu.children(".devi_clip").show();
					menu.children("li[ac=front]").show();
					menu.children("li[ac=back]").show();
					menu.children("li[ac=lock]").show();
					var selectedIds = Utils.getSelectedIds();
					var count = selectedIds.length;
					if(count >= 2){
						menu.children("li[ac=group]").show();
						$("#ctxmenu_align").show();
					}
					var groupCount = Utils.getSelectedGroups().length;
					if(groupCount >= 1){
						menu.children("li[ac=ungroup]").show();
					}
					menu.children(".devi_shape").show();
					if(count == 1 && shape.name != "linker" && shape.link){
						menu.children("li[ac=changelink]").show();
					}
					if(shape.name == "linker" || (shape.textBlock && shape.textBlock.length > 0)){
						menu.children("li[ac=edit]").show();
					}
					menu.children("li[ac=delete]").show();
					menu.children(".devi_del").show();
				}
			}
			menu.css({
				display: "block",
				"z-index": Model.orderList.length + 3,
				left: x,
				top: y
			});
			$(document).bind("mousedown.ctxmenu", function(){
				Designer.contextMenu.hide();
			});
		},
		/**
		 * 隐藏右键菜单
		 */
		hide: function(){
			$("#designer_contextmenu").hide();
			$(document).unbind("mousedown.ctxmenu");
		},
		/**
		 * 执行一个右键菜单指令
		 * @param {} cmd
		 */
		execAction: function(item){
			var action = item.attr("ac");
			if(action == "cut"){
				Designer.clipboard.cut();
			}else if(action == "copy"){
				Designer.clipboard.copy();
			}else if(action == "paste"){
				Designer.clipboard.paste(this.menuPos.x, this.menuPos.y);
			}else if(action == "duplicate"){
				Designer.clipboard.duplicate();
			}else if(action == "front"){
				Designer.layerShapes("front");
			}else if(action == "back"){
				Designer.layerShapes("back");
			}else if(action == "lock"){
				Designer.lockShapes();
			}else if(action == "unlock"){
				Designer.unlockShapes();
			}else if(action == "group"){
				Designer.group();
			}else if(action == "ungroup"){
				Designer.ungroup();
			}else if(action == "align_shape"){
				var align = item.attr("al");
				Designer.alignShapes(align);
			}else if(action == "edit"){
				Designer.op.editShapeText(this.menuPos.shape, this.menuPos);
			}else if(action == "delete"){
				Designer.op.removeShape();
			}else if(action == "selectall"){
				Designer.selectAll();
			}else if(action == "drawline"){
				Designer.op.changeState("creating_free_linker");
			}else if(action == "changelink"){
				UI.showInsertLink();
			}
		}
	},
	/**
	 * 初始化入口
	 */
	init: function(){
		this.initialize.initLayout();
		this.initialize.initModel();
		this.initialize.initCanvas();
		this.initialize.initShapes();
		this.hotkey.init();
		this.contextMenu.init();
		//初始化图形操作
		Designer.op.init();
		this.initialize.initialized = true;
		//发送初始化完毕事件
		Designer.events.push("initialized");
	},
	/**
	 * 用户操作类
	 * @type {}
	 */
	op: {
		/**
		 * 初始化用户操作
		 */
		init: function(){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			//绑定在画布上鼠标移动时，显示移动、连线，还是框选
			container.unbind("mousemove.operate").bind("mousemove.operate", function(hoverEvent){
				if(Designer.op.state != null){
					return;
				}
				//鼠标移动一下，就重新初始化鼠标操作
				Designer.op.destroy();
				var relativePos = Utils.getRelativePos(hoverEvent.pageX, hoverEvent.pageY, canvas);
				var focus = Utils.getShapeByPosition(relativePos.x, relativePos.y);
				if(focus != null){
					if(focus.type == "dataAttribute"){
						Designer.op.linkClickable(focus.attribute.value, relativePos);
					}else if(focus.type == "linker"){
						container.css("cursor", "pointer");
						Designer.op.shapeSelectable(focus.shape);
						var linker = focus.shape;
						var index = focus.pointIndex; //鼠标在第几个拐点之间，由此来判断是否可重置折线
						if(linker.linkerType == "broken" && index > 1 && index <= linker.points.length){
							//在折线拐线上，可以拖动
							Designer.op.brokenLinkerChangable(linker, index - 1);
						}else if(linker.from.id == null && linker.to.id == null){
							container.css("cursor", "move");
							Designer.op.shapeDraggable();
						}
						Designer.op.linkerEditable(linker);
					}else if(focus.type == "linker_point"){
						container.css("cursor", "move");
						Designer.op.shapeSelectable(focus.shape);
						Designer.op.linkerDraggable(focus.shape, focus.point);
						Designer.op.linkerEditable(focus.shape);
					}else if(focus.type == "linker_text"){
						container.css("cursor", "text");
						Designer.op.shapeSelectable(focus.shape);
						Designer.op.linkerEditable(focus.shape);
					}else{
						if(focus.type == "shape"){
							if(focus.shape.locked){
								container.css("cursor", "default");
								Designer.op.shapeSelectable(focus.shape);
							}else{
								container.css("cursor", "move");
								Designer.op.shapeSelectable(focus.shape);
								Designer.op.shapeEditable(focus.shape);
								Designer.op.shapeDraggable();
								if(focus.shape.link){
									Designer.op.linkClickable(focus.shape.link, relativePos);
								}
							}
						}else{
							//在边界上，可连线 
							container.css("cursor", "crosshair");
							Designer.op.shapeSelectable(focus.shape);
							Designer.op.shapeLinkable(focus.shape, focus.linkPoint);
						}
						if(focus.shape.parent){
							Utils.showAnchors(Model.getShapeById(focus.shape.parent));
						}else{
							Utils.showAnchors(focus.shape);
						}
					}
				}else{
					//如果鼠标坐标下没有图形，则可以进行多图形的选择
					container.css("cursor", "default");
					Designer.op.shapeMultiSelectable();
				}
			});
		},
		/**
		 * 取消用户操作
		 */
		cancel: function(){
			$("#canvas_container").unbind("mousemove.operate").css("cursor", "default");
			this.destroy();
		},
		/**
		 * 销毁操作状态
		 */
		destroy: function(){
			$("#designer_canvas").unbind("mousedown.drag").unbind("dblclick.edit")
				.unbind("mousedown.draglinker").unbind("mousedown.select").unbind("mousedown.brokenLinker")
				.unbind("dblclick.edit_linker");
			$("#canvas_container").unbind("mousedown.link").unbind("mousedown.create_text")
				.unbind("mousedown.drag_canvas");
			$("#designer_layout").unbind("mousedown.multiselect");
			Utils.hideAnchors();
			$("#link_spot").hide();
		},
		/**
		 * 操作状态
		 * @type {String}
		 */
		state: null,
		/**
		 * 修改操作状态
		 * @param {} state
		 */
		changeState: function(state){
			this.state = state;
			if(state == "creating_free_text"){
				//创建自由文本
				this.destroy();
				$("#canvas_container").css("cursor", "crosshair");
				this.textCreatable();
			}else if(state == "creating_free_linker"){
				//创建自由连接线
				this.destroy();
				$("#canvas_container").css("cursor", "crosshair");
				this.shapeLinkable();
			}else if(state == "drag_canvas"){
				this.destroy();
				this.canvasDraggable();
			}else if(state == "changing_curve"){
				this.destroy();
			}
		},
		/**
		 * 重置操作状态
		 */
		resetState: function(){
			this.state = null;
			$("#canvas_container").css("cursor", "default");
		},
		/**
		 * 选中图形
		 */
		shapeSelectable: function(shape){
			var canvas = $("#designer_canvas");
			canvas.bind("mousedown.select", function(downE){
				Designer.op.changeState("seelcting_shapes");
				var shapeId = shape.id;
				var selectIds = [];
				if(downE.ctrlKey){
					//如果按着ctrl，可以多选
					var selectIds = Utils.getSelectedIds();
					if(Utils.isSelected(shapeId)){
						//如果选中了，取消选择
						Utils.removeFromArray(selectIds, shapeId);
					}else{
						selectIds.push(shapeId);
					}
					Utils.unselect();
					if(selectIds.length > 0){
						Utils.selectShape(selectIds);
					}
				}else if(Utils.selectIds.indexOf(shapeId) < 0){
					Utils.unselect();
					Utils.selectShape(shapeId);
				}
				$(document).bind("mouseup.select", function(){
					Designer.op.resetState();
					canvas.unbind("mousedown.select");
					$(document).unbind("mouseup.select");
				});
			});
		},
		/**
		 * 形状拖动
		 */
		shapeDraggable: function(){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			canvas.bind("mousedown.drag", function(downE){
				Utils.hideLinkerCursor();
				Utils.hideLinkerControls();
				Designer.op.changeState("dragging");
				//初始坐标，要取相对画布的坐标
				var begin = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var selected = Utils.getSelected();
				//拖动图形时，是否显示对齐线
				var snap = true;
				if(selected.length == 1 && selected[0].name == "linker"){
					snap = false;
				}
				var bounding = null;
				if(snap){
					bounding = Utils.getShapesBounding(selected);
				}
				//先获取形状的家族图形，一起移动，父级、子级、兄弟
				var familyShapes = Utils.getFamilyShapes(selected);
				selected = selected.concat(familyShapes);
				//获取包含的图形，一起移动
				var containedShapes = Utils.getContainedShapes(selected);
				selected = selected.concat(containedShapes);
				//获取吸附的图形，一起移动
				var attachedShapes = Utils.getAttachedShapes(selected);
				selected = selected.concat(attachedShapes);
				var exclude = []; //对齐时需要排除的id
				if(snap){
					for(var i = 0; i < selected.length; i++){
						var shape = selected[i];
						if(shape.name == "linker"){
							if(shape.from.id && exclude.indexOf(shape.from.id) < 0){
								exclude.push(shape.from.id);
							}
							if(shape.to.id && exclude.indexOf(shape.to.id) < 0){
								exclude.push(shape.to.id);
							}
						}
						if(exclude.indexOf(shape.id) < 0){
							exclude.push(shape.id);
						}
					}
				}
				var selectedShape = selected;
				//获取选中形状上的连接线
				var outlinkers = Utils.getOutlinkers(selected);
				selected = selected.concat(outlinkers);
				container.bind("mousemove.drag", function(moveE){
					$("#link_spot").hide();
					UI.hideShapeOptions();
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					//计算和开始时候的偏移量
					var offset = {
						x: now.x - begin.x, y: now.y - begin.y
					};
					if(snap){
						var copy = Utils.copy(bounding);
						copy.x += offset.x;
						copy.y += offset.y;
						var snaped = Designer.op.snapLine(copy, exclude);
						offset = {
							x: copy.x - bounding.x, y: copy.y - bounding.y 
						};
						now = {
							x: begin.x + offset.x, y: begin.y + offset.y
						};
						bounding.x += offset.x;
						bounding.y += offset.y;
						if(selectedShape.length == 1 && selectedShape[0].groupName == "boundaryEvent"){
							if(snaped.attach){
								selectedShape[0].attachTo = snaped.attach.id;
							}else{
								delete selected[0].attachTo;
							}
						}
					}
					if(offset.x == 0 && offset.y == 0){
						return;
					}
					Designer.op.moveShape(selected, offset);
					begin = now;
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.drop").bind("mouseup.drop", function(){
						//发生了拖动，修改定义
						Model.updateMulti(selected);
						$(document).unbind("mouseup.drop");
					});
				});
				$(document).bind("mouseup.drag", function(){
					UI.showShapeOptions();
					Designer.op.resetState();
					container.unbind("mousemove.drag");
					canvas.unbind("mousedown.drag");
					$(document).unbind("mouseup.drag");
					Designer.op.hideTip();
					Designer.op.hideSnapLine();
					Utils.showLinkerCursor();
					Utils.showLinkerControls();
				});
			});
		},
		/**
		 * 形状缩放
		 */
		shapeResizable: function(){
			$(".shape_controller").bind("mousedown", function(downE){
				Utils.hideLinkerCursor();
				if($("#shape_text_edit").length){
					$("#shape_text_edit").trigger("blur");
				}
				var container = $("#canvas_container");
				var canvas = $("#designer_canvas");
				//首先四个控制点上，阻止事件冒泡
				downE.stopPropagation();
				//初始坐标，要取相对画布的坐标
				var begin = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var controller = $(this);
				Designer.op.changeState("resizing");
				var selectedIds = Utils.getSelectedIds();
				var selected = Utils.getSelected();
				var p;
				if(selectedIds.length == 1){
					//如果只有一个图形（有一个图形时，此图形不会是连接线，在调用时都做了判断）
					var shape = Model.getShapeById(selectedIds[0]);
					//选中的为一个图形时，开始角度为此形状的角度
					p = Utils.copy(shape.props);
				}else{
					p = Utils.getControlBox(selectedIds);
					p.angle = 0; //选中的为多个图形时，开始角度为0
				}
				var center = {x: p.x + p.w/2, y: p.y + p.h/2};
				//缩放的方向
				var resizeDir = controller.attr("resizeDir");
				var fixedPoint = {}; //相对与活动点，固定的点坐标
				if(resizeDir.indexOf("l") >= 0){
					fixedPoint.x = p.x + p.w;
				}else if(resizeDir.indexOf("r") >= 0){
					fixedPoint.x = p.x;
				}else{
					fixedPoint.x = p.x + p.w/2;
				}
				if(resizeDir.indexOf("t") >= 0){
					fixedPoint.y = p.y + p.h;
				}else if(resizeDir.indexOf("b") >= 0){
					fixedPoint.y = p.y;
				}else{
					fixedPoint.y = p.y + p.h/2;
				}
				//根据旋转情况，获得当前旋转后的坐标
				fixedPoint = Utils.getRotated(center, fixedPoint, p.angle);
				/**
				 * 得到连接线端点的变化形式
				 */
				function getLinkerPointMode(point, selected){
					if(point.id == null){
						//端点未连接形状
						if(selected){
							return {
								type: "box",
								x: (point.x - p.x) / p.w,
								y: (point.y - p.y) / p.h
							};
						}else{
							return {type: "fixed"};
						}
					}else if(Utils.isSelected(point.id)){
						//端点连接了形状，随形状的变化而变化
						var shape = Model.getShapeById(point.id);
						//得到图形的中心点
						var shapeCenter = {
							x: shape.props.x + shape.props.w/2,
							y: shape.props.y + shape.props.h/2
						};
						//得到未旋转情况下，连接线端点与图形的比例，即把坐标先旋转回去
						var rotateBack = Utils.getRotated(shapeCenter, point, -shape.props.angle);
						return {
							type: "shape",
							x: (rotateBack.x - shape.props.x) / shape.props.w,
							y: (rotateBack.y - shape.props.y) / shape.props.h
						};
					}else{
						//端点连接了形状，但形状没有被选中，不移动
						return {
							type: "fixed"
						};
					}
				}
				//定义都哪些图形会发生变化
				var changedShapes = [];
				//先定义changeMode变量，保存每个图形的变化形式
				var changeMode = {};
				var linkerIds = []; //定义linkerIds变量，保存会变化的连接线id，随后再逐一进行计算
				//先计算 形状
				var attachedShapes = Utils.getAttachedShapes(selected);
				selected = selected.concat(attachedShapes);
				//所有需要变化的图形的id集合
				var ids = [];
				for(var i = 0; i < selected.length; i++){
					var shape = selected[i];
					ids.push(shape.id);
					if(shape.parent){
						ids.push(shape.parent);
					}
					if(shape.name == "linker"){
						if(linkerIds.indexOf(shape.id) == -1){
							//添加到连接线集合中
							linkerIds.push(shape.id);
						}
					}else{
						changedShapes.push(shape);
						if(shape.attachTo && !Utils.isSelected(shape.id)){
							changeMode[shape.id] = {
								type: "attached",
								x: (shape.props.x + shape.props.w/2 - p.x) / p.w,
								y: (shape.props.y + shape.props.h/2 - p.y) / p.h
							};
						}else{
							changeMode[shape.id] = {
								x: (shape.props.x - p.x) / p.w,
								y: (shape.props.y - p.y) / p.h,
								w: shape.props.w / p.w,
								h: shape.props.h / p.h
							};
						
						}
						//从linkerMap中取到形状上的连接线，这些未选中的连接线也会随图形变化而发生变化
						var shapeLinkers = Model.getShapeLinkers(shape.id);
						if(shapeLinkers && shapeLinkers.length > 0){
							for(var index = 0; index < shapeLinkers.length; index++){
								var id = shapeLinkers[index];
								if(linkerIds.indexOf(id) == -1){
									//添加到连接线集合中
									linkerIds.push(id);
								}
							}
						}
					}
				}
				//再计算连接线，因为有些连接线的坐标计算相对于 图形，所以放在最后
				for(var i = 0; i < linkerIds.length; i++){
					var id = linkerIds[i];
					var linker = Model.getShapeById(id);
					changedShapes.push(linker);
					var selected = Utils.isSelected(id);
					changeMode[linker.id] = {
						from: getLinkerPointMode(linker.from, selected),
						to: getLinkerPointMode(linker.to, selected)
					};
				}
				var cursor = controller.css("cursor");
				container.css("cursor", cursor);
				var movingRelated = []; //缩放时，可能会引起其他图形的变化，在事件处理中会返回
				var minSize = {w: 20, h: 20};
				Designer.events.push("beforeResize", {minSize: minSize, shapes: changedShapes, dir: resizeDir});
				container.bind("mousemove.resize", function(moveE){
					UI.hideShapeOptions();
					movingRelated = [];
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					now = Utils.restoreScale(now);
					//把当前点围绕固定点旋转回去
					var nowRotateBack = Utils.getRotated(fixedPoint, now, -p.angle);
					var newP = Utils.copy(p);
					//旋转回来之后，相减，即可得到宽高
					if(resizeDir.indexOf("r") >= 0){
						newP.w = nowRotateBack.x - fixedPoint.x;
					}else if(resizeDir.indexOf("l") >= 0){
						newP.w = fixedPoint.x - nowRotateBack.x;
					}
					if(resizeDir.indexOf("b") >= 0){
						newP.h = nowRotateBack.y - fixedPoint.y;
					}else if(resizeDir.indexOf("t") >= 0){
						newP.h = fixedPoint.y - nowRotateBack.y;
					}
					if(moveE.ctrlKey && resizeDir.length == 2){
						//如果拖动时按着ctrl，并且缩放点为四个角的某一点，为等比缩放，宽、高，哪个大，则以哪个为基准
						if(p.w >= p.h){
							newP.h = p.h / p.w * newP.w;
							if(newP.h < minSize.h){
								newP.h = minSize.h;
								newP.w = p.w / p.h * newP.h;
							}
						}else{
							newP.w = p.w / p.h * newP.h;
							if(newP.w < minSize.w){
								newP.w = minSize.w;
								newP.h = p.h / p.w * newP.w;
							}
						}
					}else{
						//限制宽高最小为20*20
						if(newP.w < minSize.w){
							newP.w = minSize.w;
						}
						if(newP.h < minSize.h){
							newP.h = minSize.h;
						}
					}
					//宽高经过计算后，重新计算活动点的坐标，得到旋转回去时的坐标
					var nowCalculated = {};
					if(resizeDir.indexOf("r") >= 0){
						nowCalculated.x = fixedPoint.x + newP.w;
					}else if(resizeDir.indexOf("l") >= 0){
						nowCalculated.x = fixedPoint.x - newP.w;
					}else{
						nowCalculated.x = fixedPoint.x;
					}
					if(resizeDir.indexOf("b") >= 0){
						nowCalculated.y = fixedPoint.y + newP.h;
					}else if(resizeDir.indexOf("t") >= 0){
						nowCalculated.y = fixedPoint.y - newP.h;
					}else{
						nowCalculated.y = fixedPoint.y;
					}
					//再旋转
					var nowReal = Utils.getRotated(fixedPoint, nowCalculated, p.angle);
					//根据公式：B(t) = (1-t)P0 + tP1，t=0.5，取线中点，即当前缩放程度，围绕此点旋转
					var midPoint = {
						x: 0.5*fixedPoint.x + 0.5*nowReal.x,
						y: 0.5*fixedPoint.y + 0.5*nowReal.y
					};
					//再把固定点、活动点，根据旋转情况，旋转回去，得到两点的真实坐标，进而得到x, y, w, h
					var fixedBack = Utils.getRotated(midPoint, fixedPoint, -p.angle);
					if(resizeDir.indexOf("r") >= 0){
						newP.x = fixedBack.x;
					}else if(resizeDir.indexOf("l") >= 0){
						newP.x = fixedBack.x - newP.w;
					}else{
						newP.x = fixedBack.x - newP.w/2;
					}
					if(resizeDir.indexOf("b") >= 0){
						newP.y = fixedBack.y;
					}else if(resizeDir.indexOf("t") >= 0){
						newP.y = fixedBack.y - newP.h;
					}else{
						newP.y = fixedBack.y - newP.h/2
					}
					if(newP.angle == 0){
						//计算缩放对齐线
						var shapeObj = changedShapes[0];
						var snap = Designer.op.snapResizeLine(newP, ids, resizeDir);
					}
					Utils.removeAnchors();
					for(var i = 0; i < changedShapes.length; i++){
						var shape = changedShapes[i];
						var mode = changeMode[shape.id]; //得到变化形式
						if(shape.name == "linker"){
							if(mode.from.type == "box"){
								//按容器比例变化
								shape.from.x = newP.x + newP.w * mode.from.x;
								shape.from.y = newP.y + newP.h * mode.from.y;
							}else if(mode.from.type == "shape"){
								var linked = Model.getShapeById(shape.from.id);
								var point = {
									x: linked.props.x + linked.props.w * mode.from.x,
									y: linked.props.y + linked.props.h * mode.from.y
								};
								var shapeCenter = {
									x: linked.props.x + linked.props.w/2,
									y: linked.props.y + linked.props.h/2
								};
								var rotated = Utils.getRotated(shapeCenter, point, linked.props.angle);
								shape.from.x = rotated.x;
								shape.from.y = rotated.y;
							}
							if(mode.to.type == "box"){
								//按容器比例变化
								shape.to.x = newP.x + newP.w * mode.to.x;
								shape.to.y = newP.y + newP.h * mode.to.y;
							}else if(mode.to.type == "shape"){
								var linked = Model.getShapeById(shape.to.id);
								var point = {
									x: linked.props.x + linked.props.w * mode.to.x,
									y: linked.props.y + linked.props.h * mode.to.y
								};
								var shapeCenter = {
									x: linked.props.x + linked.props.w/2,
									y: linked.props.y + linked.props.h/2
								};
								var rotated = Utils.getRotated(shapeCenter, point, linked.props.angle);
								shape.to.x = rotated.x;
								shape.to.y = rotated.y;
							}
							Designer.painter.renderLinker(shape, true);
						}else{
							if(mode.type == "attached"){
								shape.props.x = newP.x + newP.w * mode.x - shape.props.w/2;
								shape.props.y = newP.y + newP.h * mode.y - shape.props.h/2;
							}else{
								var old = Utils.copy(shape.props);
								shape.props.x = newP.x + newP.w * mode.x;
								shape.props.y = newP.y + newP.h * mode.y;
								shape.props.w = newP.w * mode.w;
								shape.props.h = newP.h * mode.h;
								//更新一下Model对象中的图形定义，因为在编辑文本状态下，对图形做缩放的话，先执行缩放的mousedown事件，才执行文本编辑输入框的blur事件进行保存
								//所以，当前的shape对象，已经和Model的这个shape不是一个对象，而绘制选择框是根据Model中的对象进行绘制，就会出现选择框与图形不一致的情况
								var modelProps = Model.getShapeById(shape.id).props;
								modelProps.x = newP.x + newP.w * mode.x;
								modelProps.y = newP.y + newP.h * mode.y;
								modelProps.w = newP.w * mode.w;
								modelProps.h = newP.h * mode.h;
								var offset = {
									x: shape.props.x - old.x,
									y: shape.props.y - old.y,
									w: shape.props.w - old.w,
									h: shape.props.h - old.h
								};
								var eventContent = {shape: shape, offset: offset, dir: resizeDir};
								var shapeRelated = Designer.events.push("resizing", eventContent);
								if(shapeRelated){
									movingRelated = movingRelated.concat(shapeRelated);
								}
							}
							Designer.painter.renderShape(shape);
							Utils.showAnchors(shape);
						}
					}
					Designer.painter.drawControls(selectedIds);
					var tipText = "W: " + Math.round(newP.w) + "&nbsp;&nbsp;H: " + Math.round(newP.h);
					if(newP.x != p.x){
						tipText =  "X: " + Math.round(newP.x) + "&nbsp;&nbsp;Y: " + Math.round(newP.y) + "<br/>" + tipText;
					}
					Designer.op.showTip(tipText);
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了缩放事件
					$(document).unbind("mouseup.resize_ok").bind("mouseup.resize_ok", function(){
						if(movingRelated.length > 0){
							changedShapes = changedShapes.concat(movingRelated);
						}
						Model.updateMulti(changedShapes);
						$(document).unbind("mouseup.resize_ok");
					});
				});
				$(document).bind("mouseup.resize", function(){
					UI.showShapeOptions();
					container.css("cursor", "default");
					Designer.op.resetState();
					container.unbind("mousemove.resize");
					$(document).unbind("mouseup.resize");
					Designer.op.hideTip();
					Utils.showLinkerCursor();
					Designer.op.hideSnapLine();
				});
			});
		},
		/**
		 * 形状旋转
		 */
		shapeRotatable: function(){
			$(".shape_rotater").bind("mousemove", function(e){
				var box = $(this);
				var x = e.pageX - box.offset().left;
				var y = e.pageY - box.offset().top;
				var ctx = box[0].getContext("2d");
				box.unbind("mousedown");
				box.removeClass("rotate_enable");
				if(ctx.isPointInPath(x, y)){
					box.addClass("rotate_enable");
					box.bind("mousedown", function(downE){
						Utils.hideLinkerCursor();
						if($("#shape_text_edit").length){
							$("#shape_text_edit").trigger("blur");
						}
						downE.stopPropagation();
						Designer.op.changeState("rotating");
						var selectedIds = Utils.getSelectedIds();
						//旋转开始时候的选择框的坐标信息
						var selectorPos;
						var startAngle; //旋转开始时的角度
						if(selectedIds.length == 1){
							//如果只有一个图形（有一个图形时，此图形不会是连接线，在调用时都做了判断）
							var shape = Model.getShapeById(selectedIds[0]);
							selectorPos = shape.props;
							startAngle = shape.props.angle; //选中的为一个图形时，开始角度为此形状的角度
						}else{
							selectorPos = Utils.getControlBox(selectedIds);
							startAngle = 0; //选中的为多个图形时，开始角度为0
						}
						//获取旋转的基准点，即选择控件的中心点
						var center = {
							x: selectorPos.x + selectorPos.w/2,
							y: selectorPos.y + selectorPos.h/2
						};
						var scaledCenter = Utils.toScale(center);
						var canvas = $("#designer_canvas");
						var selected = Utils.getSelected();
						//获取吸附的图形，一起旋转
						var attachedShapes = Utils.getAttachedShapes(selected);
						selected = selected.concat(attachedShapes);
						var outlinkers = Utils.getOutlinkers(selected);
						selected = selected.concat(outlinkers);
						var lastAngle = startAngle; //记录上一次旋转的角度
						$(document).bind("mousemove.rotate", function(moveE){
							UI.hideShapeOptions();
							var pos = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
							//计算旋转角度
							var angle = Math.atan(Math.abs(pos.x - scaledCenter.x)/Math.abs(scaledCenter.y - pos.y));
							if(pos.x >= scaledCenter.x && pos.y >= scaledCenter.y){
								angle = Math.PI - angle;
							}else if(pos.x <= scaledCenter.x && pos.y >= scaledCenter.y){
								angle = Math.PI + angle;
							}else if(pos.x <= scaledCenter.x && pos.y <= scaledCenter.y){
								angle = Math.PI*2 - angle;
							}
							angle = angle % (Math.PI*2);
							//每5度为一个单位
							var unit = Math.PI/36;
							var unitCount = Math.round(angle/unit);
							angle = unit * unitCount;
							if(angle == lastAngle){
								return;
							}
							lastAngle = angle;
							//打开提示
							Designer.op.showTip(unitCount*5%360 + "°");
							//旋转控件
							Designer.painter.rotateControls(selectorPos, angle);
							Utils.removeAnchors();
							var changedAngle = angle - startAngle;
							for (var i = 0; i < selected.length; i++) {
								var shape = selected[i];
								//获取持久化的对象，与旋转情况做对比
								var persis = Model.getPersistenceById(shape.id);
								if(shape.name != "linker"){
									//旋转形状
									shape.props.angle = Math.abs((changedAngle + persis.props.angle) % (Math.PI*2));
									var shapeCenter = {
										x: persis.props.x + persis.props.w/2,
										y: persis.props.y + persis.props.h/2
									};
									var shapeRotated = Utils.getRotated(center, shapeCenter, changedAngle);
									shape.props.x = shapeRotated.x - shape.props.w/2;
									shape.props.y = shapeRotated.y - shape.props.h/2;
									Designer.painter.renderShape(shape);
									Utils.showAnchors(shape);
								}else{
									//旋转连接线
									var fromChanged = false;
									if((Utils.isSelected(shape.id) && shape.from.id == null) || Utils.isSelected(shape.from.id)){
										var rotated = Utils.getRotated(center, persis.from, changedAngle);
										shape.from.x = rotated.x;
										shape.from.y = rotated.y;
										if(shape.from.angle != null){
											shape.from.angle = Math.abs((persis.from.angle + changedAngle) % (Math.PI*2));
										}
										fromChanged = true;
									}
									var toChanged = false;
									if((Utils.isSelected(shape.id) && shape.to.id == null) || Utils.isSelected(shape.to.id)){
										var rotated = Utils.getRotated(center, persis.to, changedAngle);
										shape.to.x = rotated.x;
										shape.to.y = rotated.y;
										if(shape.to.angle != null){
											shape.to.angle = Math.abs((persis.to.angle + changedAngle) % (Math.PI*2));
										}
										toChanged = true;
									}
									if(fromChanged || toChanged){
										Designer.painter.renderLinker(shape, true);
									}
								}
							}
						}).bind("mouseup.rotate", function(){
							UI.showShapeOptions();
							$(document).unbind("mousemove.rotate").unbind("mouseup.rotate");
							Designer.op.resetState();
							Model.updateMulti(selected);
							Designer.painter.drawControls(selectedIds);
							Designer.op.hideTip();
							Utils.showLinkerCursor();
						});
					});
				}else{
					box.removeClass("rotate_enable");
					box.unbind("mousedown");
				}
			});
		},
		/**
		 * 切换分组的图形
		 */
		groupShapeChangable: function(){
			$(".change_shape_icon").bind("mousedown", function(e){
				e.stopPropagation();
				var targetShape = Utils.getSelected()[0];
				var groupName = targetShape.groupName;
				var target = $(this).parent();
				var pos = target.position();
				var left = pos.left + target.width();
				var top = pos.top + target.height() + 10;
				Designer.op.groupDashboard(groupName, left, top, function(shapeName){
					if(targetShape.name != shapeName){
						var related = Designer.events.push("shapeChanged", {shape: targetShape, name: shapeName});
						Model.changeShape(targetShape, shapeName);
						var changed = [targetShape];
						if(related && related.length > 0){
							changed = changed.concat(related);
						}
						Model.updateMulti(changed);
					}
				});
			});
		},
		/**
		 * 形状选择
		 */
		shapeMultiSelectable: function(){
			var canvas = $("#designer_canvas");
			var layout = $("#designer_layout");
			layout.unbind("mousedown.multiselect").bind("mousedown.multiselect", function(downE){
				var selector = null;
				if(!downE.ctrlKey){
					Utils.unselect();
				}
				var dLocation = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				Designer.op.changeState("multi_selecting");
				layout.bind("mousemove.multiselect", function(moveE){
					if(selector == null){
						selector = $("<div id='selecting_box'></div>").appendTo(canvas);
					}
					var location = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					var style = {
						"z-index": Model.orderList.length,
						left: location.x,
						top: location.y
					};
					if(location.x > dLocation.x){
						style.left = dLocation.x;
					}
					if(location.y > dLocation.y){
						style.top = dLocation.y;
					}
					style.width = Math.abs(location.x - dLocation.x);
					style.height = Math.abs(location.y - dLocation.y);
					selector.css(style);
				});
				$(document).unbind("mouseup.multiselect").bind("mouseup.multiselect", function(upE){
					if(selector != null){
						//判断选取范围内的图形
						var range = {
							x: selector.position().left.restoreScale(),
							y: selector.position().top.restoreScale(),
							w: selector.width().restoreScale(),
							h: selector.height().restoreScale()
						};
						var shapeIds = Utils.getShapesByRange(range);
						if(upE.ctrlKey){
							var selected = Utils.getSelectedIds();
							Utils.mergeArray(shapeIds, selected);
						}
						Utils.unselect();
						Utils.selectShape(shapeIds);
						selector.remove();
					}
					Designer.op.resetState();
					$(document).unbind("mouseup.multiselect");
					layout.unbind("mousemove.multiselect");
				});
				layout.unbind("mousedown.multiselect");
			});
		},
		/**
		 * 编辑形状文本
		 */
		shapeEditable: function(shape){
			var canvas = $("#designer_canvas");
			canvas.unbind("dblclick.edit").bind("dblclick.edit", function(e){
				//计算点击位置在图形的哪个文本区域上
				canvas.unbind("dblclick.edit");
				var pos = Utils.getRelativePos(e.pageX, e.pageY, canvas);
				Designer.op.editShapeText(shape, pos);
			});
		},
		/**
		 * 编辑图形的文本
		 * @param {} pos 点击位置信息
		 * @param {} shape
		 */
		editShapeText: function(shape, pos){
			if(shape.name == "linker"){
				this.editLinkerText(shape);
				return;
			}
			if(!shape.textBlock || shape.textBlock.length == 0){
				return;
			}
			var textBlocks = shape.getTextBlock();
			var index = 0;
			if(pos){
				//转为没有缩放情况下的坐标
				pos.x = pos.x.restoreScale();
				pos.y = pos.y.restoreScale();
				if(shape.props.angle != 0){
					var center = {x: shape.props.x + shape.props.w/2, y: shape.props.y + shape.props.h/2};
					//把图形旋转回去
					pos = Utils.getRotated(center, pos, -shape.props.angle);
				}
				//计算相对于图形的坐标
				var rx = pos.x - shape.props.x;
				var ry = pos.y - shape.props.y;
				for(var i = 0; i < textBlocks.length; i++){
					var block = textBlocks[i];
					if(Utils.pointInRect(rx, ry, block.position)){
						index = i;
						break;
					}
				}
			}
			Designer.contextMenu.hide();
			var textarea = $("#shape_text_edit");
			if(textarea.length == 0){
				textarea = $("<textarea id='shape_text_edit'></textarea>").appendTo("#designer_canvas");
			}
			var ruler = $("#shape_text_ruler");
			if(ruler.length == 0){
				ruler = $("<textarea id='shape_text_ruler'></textarea>").appendTo("#designer_canvas");
			}
			//隐藏原有文本
			$(".text_canvas[forshape="+shape.id+"][ind="+index+"]").hide();
			var textBlock = textBlocks[index];
			var blockEntity = shape.textBlock[index]; //对象中的textBlock定义
			var fontStyle = $.extend({}, shape.fontStyle, textBlock.fontStyle);
			var textPos = textBlock.position;
			if(fontStyle.orientation == "horizontal"){
				var blockCenter = {
					x: textPos.x + textPos.w/2,
					y: textPos.y + textPos.h/2
				};
				textPos = {
					x: blockCenter.x - textPos.h/2,
					y: blockCenter.y - textPos.w/2,
					w: textPos.h,
					h: textPos.w
				};
			}
			//给输入框设置一些基本样式
			var style = {
				"width": textPos.w + "px",
				"z-index": Model.orderList.length+2, //要大于锚点的z-index
				"line-height": Math.round(fontStyle.size * 1.25) + "px",
				"font-size": fontStyle.size + "px",
				"font-family": fontStyle.fontFamily,
				"font-weight": fontStyle.bold ? "bold" : "normal",
				"font-style": fontStyle.italic ? "italic" : "normal",
				"text-align": fontStyle.textAlign,
				"color": "rgb(" + fontStyle.color + ")",
				"text-decoration": fontStyle.underline ? "underline" : "none"
			};
			textarea.css(style);
			ruler.css(style);
			textarea.show();
			//计算得到textBlock的中心坐标
			textPos.x += shape.props.x;
			textPos.y += shape.props.y;
			textarea.val(textBlock.text);
			//绑定事件
			$("#shape_text_edit").unbind().bind("keyup", function(){
				//得到文本的高度
				var text = $(this).val();
				ruler.val(text);
				ruler.scrollTop(99999);
				var textH = ruler.scrollTop();
				textarea.css({
					height: textH
				});
				var blockCenter = {
					x: textPos.x + textPos.w/2,
					y: textPos.y + textPos.h/2
				};
				var top = 0;
				var padding = 0;
				var height = textPos.h;
				if(fontStyle.vAlign == "middle"){
					if(textH > height){
						height = textH;
						top = (blockCenter.y - height/2);
						padding = 0;
					}else{
						top = (blockCenter.y - textPos.h/2);
						padding = (textPos.h - textH)/2;
						height = textPos.h - padding;
					}
				}else if(fontStyle.vAlign == "bottom"){
					if(textH > height){
						height = textH;
						top = (blockCenter.y + textPos.h/2 - height);
						padding = 0;
					}else{
						top = (blockCenter.y - textPos.h/2);
						padding = textPos.h - textH;
						height = textPos.h - padding;
					}
				}else{
					top = (blockCenter.y - textPos.h/2);
					padding = 0;
					if(textH > height){
						height = textH;
					}else{
						height = textPos.h;
					}
				}
				var areaH = padding + height;
				var textCenter = {
					x: textPos.x + textPos.w/2,
					y: top + areaH/2
				};
				var textAngle = shape.props.angle;
				if(textAngle != 0){
					var center = {x: shape.props.x + shape.props.w/2, y: shape.props.y + shape.props.h/2};
					textCenter = Utils.getRotated(center, textCenter, textAngle);
				}
				if(fontStyle.orientation == "horizontal"){
					textAngle = (Math.PI * 1.5 + textAngle) % (Math.PI * 2);
				}
				var deg = Math.round(textAngle / (Math.PI*2) * 360);
				var degStr = "rotate(" + deg + "deg) scale("+Designer.config.scale+")";
				textarea.css({
					width: textPos.w,
					height: height,
					"padding-top": padding,
					left: textCenter.x.toScale() - textPos.w/2 - 2,
					top: textCenter.y.toScale() - areaH/2 - 2,
					"-webkit-transform": degStr,
					"-ms-transform": degStr,
					"-o-transform": degStr,
					"-moz-transform": degStr,
					"transform": degStr
				});
			}).bind("keydown", function(e){
				//Enter保存， Ctrl + Enter换行
				var input = $(this);
				if(e.keyCode == 13 && e.ctrlKey){
					//执行保存
					saveText();
					return false;
				}else if(e.keyCode == 27){
					//Esc取消
					input.unbind().remove();
					$(".text_canvas[forshape="+shape.id+"][ind="+index+"]").show();
				}else if(e.keyCode == 66 && e.ctrlKey){
					//Ctrl + B，加粗
					var newVal = !fontStyle.bold;
					if(shape.textBlock.length == 1){
						shape.fontStyle.bold = newVal;
					}else{
						blockEntity.fontStyle = $.extend(blockEntity.fontStyle, {bold: newVal});
					}
					Model.update(shape);
					var css = newVal ? "bold" : "normal";
					$(this).css("font-weight", css);
					ruler.css("font-weight", css);
					UI.update();
				}else if(e.keyCode == 73 && e.ctrlKey){
					//Ctrl + I，斜体
					var newVal = !fontStyle.italic;
					if(shape.textBlock.length == 1){
						shape.fontStyle.italic = newVal;
					}else{
						blockEntity.fontStyle = $.extend(blockEntity.fontStyle, {italic: newVal});
					}
					Model.update(shape);
					var css = newVal ? "italic" : "normal";
					$(this).css("font-style", css);
					ruler.css("font-style", css);
					UI.update();
				}else if(e.keyCode == 85 && e.ctrlKey){
					//Ctrl + U，下划线
					var newVal = !fontStyle.underline;
					if(shape.textBlock.length == 1){
						shape.fontStyle.underline = newVal;
					}else{
						blockEntity.fontStyle = $.extend(blockEntity.fontStyle, {underline: newVal});
					}
					Model.update(shape);
					var css = newVal ? "underline" : "none";
					$(this).css("text-decoration", css);
					ruler.css("text-decoration", css);
					e.preventDefault();
					UI.update();
				}
			}).bind("blur", function(e){
				saveText();
			}).bind("mousemove", function(e){
				e.stopPropagation();
			}).bind("mousedown", function(e){
				e.stopPropagation();
			}).bind("mouseenter", function(e){
				Designer.op.destroy();
			});
			$("#shape_text_edit").trigger("keyup");
			textarea.select();
			/**
			 * 保存文本编辑
			 */
			function saveText(){
				var newText = $("#shape_text_edit").val();
				if($("#shape_text_edit").length && $("#shape_text_edit").is(":visible")){
					if(newText != blockEntity.text){
						blockEntity.text = newText;
						Model.update(shape);
					}
					Designer.painter.renderShape(shape);
					$("#shape_text_edit").remove();
				}
			}
		},
		/**
		 * 从图形上画线
		 */
		shapeLinkable: function(shape, linkPoint){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			container.unbind("mousedown.link").bind("mousedown.link", function(downE){
				Designer.op.changeState("linking_from_shape");
				var linkCanvas = null;
				var createdLinker = null;
				var from;
				if(!shape){
					//当不存在shape的情况，为创建自由连接线
					var pos = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
					from = {
						x: pos.x.restoreScale(),
						y: pos.y.restoreScale(),
						id: null,
						angle: null
					};
				}else{
					from = linkPoint;
					from.id = shape.id;
				}
				//计算连接点的角度
				container.bind("mousemove.link", function(moveE){
					container.css("cursor", "default");
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					if(createdLinker == null){
						createdLinker = createLinker(from, now);
						Designer.events.push("linkerCreating", createdLinker);
					}
					Designer.op.moveLinker(createdLinker, "to", now.x, now.y);
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.droplinker").bind("mouseup.droplinker", function(){
						//发生了拖动，修改定义
						if(Math.abs(now.x - from.x) > 20 || Math.abs(now.y - from.y) > 20){
							Model.add(createdLinker);
							Designer.events.push("linkerCreated", createdLinker);
							//连线创建后，是否应该选中
//							Utils.unselect();
//							Utils.selectShape(createdLinker.id);
							if(createdLinker.to.id == null && createdLinker.from.id != null){
								//如果创建的连接线，终点没有连接形状，则显示出画板
								Designer.op.linkDashboard(createdLinker);
							}
							Utils.showLinkerCursor();
						}else{
							//拖动没超过20*20，删除
							$("#" + createdLinker.id).remove();
						}
						$(document).unbind("mouseup.droplinker");
					});
				});
				$(document).bind("mouseup.link", function(){
					Designer.op.hideLinkPoint();
					Designer.op.resetState();
					container.unbind("mousedown.link");
					container.unbind("mousemove.link");
					$(document).unbind("mouseup.link");
				});
			});
			
			/**
			 * 创建形状
			 * @param schemaName
			 * @param centerX
			 * @param centerY
			 * @returns
			 */
			function createLinker(from, to){
				var newId = Utils.newId();
				var linker = Utils.copy(Schema.linkerDefaults);
				linker.from = from;
				linker.to = {
					id: null,
					x: to.x,
					y: to.y,
					angle: null
				};
				linker.props = {
					zindex: Model.maxZIndex + 1
				};
				linker.id = newId;
				return linker;
			}
		},
		/**
		 * 编辑连接线文本
		 * @param {} linker
		 */
		linkerEditable: function(linker){
			var canvas = $("#designer_canvas");
			canvas.unbind("dblclick.edit_linker").bind("dblclick.edit_linker", function(){
				Designer.op.editLinkerText(linker);
				canvas.unbind("dblclick.edit_linker");
			});
		},
		/**
		 * 编辑连接线的文本
		 */
		editLinkerText: function(linker){
			Designer.contextMenu.hide();
			var midpoint = Designer.painter.getLinkerMidpoint(linker);
			var ruler = $("#" + linker.id).find(".text_canvas");
			var textarea = $("#linker_text_edit");
			if(textarea.length == 0){
				textarea = $("<textarea id='linker_text_edit'></textarea>").appendTo("#designer_canvas");
			}
			//隐藏原有文本，全透明
			$("#" + linker.id).find(".text_canvas").hide();
			var fontStyle = linker.fontStyle;
			var scale = "scale("+Designer.config.scale+")";
			var lineH = Math.round(fontStyle.size * 1.25);
			//先给输入框设置一些基本样式
			textarea.css({
				"z-index": Model.orderList.length,
				"line-height": lineH + "px",
				"font-size": fontStyle.size + "px",
				"font-family": fontStyle.fontFamily,
				"font-weight": fontStyle.bold ? "bold" : "normal",
				"font-style": fontStyle.italic ? "italic" : "normal",
				"text-align": fontStyle.textAlign,
				"color": "rgb(" + fontStyle.color + ")",
				"text-decoration": fontStyle.underline ? "underline" : "none",
				"-webkit-transform": scale,
				"-ms-transform": scale,
				"-o-transform": scale,
				"-moz-transform": scale,
				"transform": scale
			});
			//修改坐标
			textarea.val(linker.text).show().select();
			textarea.unbind().bind("keyup", function(){
				var newText = $(this).val();
				var text = newText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
				ruler.html(text + "<br/>");
				var textW = ruler.width();
				if(textW < 50){
					textW = 50;
				}
				var textH = ruler.height();
				if(textH < lineH){
					textH = lineH;
				}
				textarea.css({
					left: midpoint.x.toScale() - textW/2 - 2,
					top: midpoint.y.toScale() - textH/2 - 2,
					width: textW,
					height: textH
				});
			}).bind("mousedown", function(e){
				e.stopPropagation();
			}).bind("keydown", function(e){
				if(e.keyCode == 13 && e.ctrlKey){
					//执行保存
					saveText();
					return false;
				}else if(e.keyCode == 27){
					//Esc取消
					textarea.unbind().remove();
					Designer.painter.renderLinkerText(linker);
				}else if(e.keyCode == 66 && e.ctrlKey){
					//Ctrl + B，加粗
					var newVal = !linker.fontStyle.bold;
					linker.fontStyle.bold = newVal;
					Model.update(linker);
					var css = newVal ? "bold" : "normal";
					$(this).css("font-weight", css);
					ruler.css("font-weight", css);
					UI.update();
				}else if(e.keyCode == 73 && e.ctrlKey){
					//Ctrl + I，斜体
					var newVal = !linker.fontStyle.italic;
					linker.fontStyle.italic = newVal;
					Model.update(linker);
					var css = newVal ? "italic" : "normal";
					$(this).css("font-style", css);
					ruler.css("font-style", css);
					UI.update();
				}else if(e.keyCode == 85 && e.ctrlKey){
					//Ctrl + U，下划线
					var newVal = !linker.fontStyle.underline;
					linker.fontStyle.underline = newVal;
					Model.update(linker);
					var css = newVal ? "underline" : "none";
					$(this).css("text-decoration", css);
					ruler.css("text-decoration", css);
					e.preventDefault();
					UI.update();
				}
			}).bind("blur", function(){
				saveText();
			});
			textarea.trigger("keyup");
			/**
			 * 保存文本
			 */
			function saveText(){
				var textarea = $("#linker_text_edit");
				if(textarea.length && textarea.is(":visible")){
					var newText = textarea.val();
					if(newText != linker.text){
						linker.text = newText;
						Model.update(linker);
					}
					Designer.painter.renderLinker(linker);
					textarea.remove();
				}
				
			}
		},
		/**
		 * 拖动连接线
		 */
		linkerDraggable: function(linker, point){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			canvas.bind("mousedown.draglinker", function(downE){
				Utils.hideLinkerControls();
				Designer.op.changeState("dragging_linker");
				var selectedIds = Utils.getSelectedIds();
				var redrawControls = false;
				if(selectedIds.length > 1){
					redrawControls = true;
				}
				container.bind("mousemove.draglinker", function(moveE){
					container.css("cursor", "default");
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					Designer.op.moveLinker(linker, point, now.x, now.y);
					if(redrawControls){
						Designer.painter.drawControls(selectedIds);
					}
					$(document).unbind("mouseup.droplinker").bind("mouseup.droplinker", function(){
						$(document).unbind("mouseup.droplinker");
						Model.update(linker);
						Utils.showLinkerControls();
					});
				});
				$(document).bind("mouseup.draglinker", function(){
					Designer.op.hideLinkPoint();
					Designer.op.resetState();
					canvas.unbind("mousedown.draglinker");
					container.unbind("mousemove.draglinker");
					$(document).unbind("mouseup.draglinker");
					Utils.showLinkerControls();
				});
			});
		},
		/**
		 * 链接可以点击
		 */
		linkClickable: function(url, pos){
			var spot = $("#link_spot");
			if(spot.length == 0){
				spot = $("<a id='link_spot' target='_blank'></a>").appendTo("#designer_canvas");
			}
			if(url.trim().toLowerCase().indexOf("http") == -1){
				url = "http://" + url;
			}
			spot.attr("href", url);
			spot.show().css({
				left: pos.x - 50,
				top: pos.y - 50,
				"z-index": Model.orderList.length + 1
			});
		},
		/**
		 * 创建自由的文本
		 */
		textCreatable: function(){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			container.unbind("mousedown.create_text").bind("mousedown.create_text", function(downE){
				var selector = null;
				if(!downE.ctrlKey){
					Utils.unselect();
				}
				var dLocation = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var location = null;
				container.bind("mousemove.create_text", function(moveE){
					if(selector == null){
						selector = $("<div id='texting_box'></div>").appendTo(canvas);
					}
					var mLocation = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					location = {
						"z-index": Model.orderList.length,
						left: mLocation.x - 1,
						top: mLocation.y - 1
					};
					if(mLocation.x > dLocation.x){
						location.left = dLocation.x - 1;
					}
					if(mLocation.y > dLocation.y){
						location.top = dLocation.y - 1;
					}
					location.width = Math.abs(mLocation.x - dLocation.x - 2);
					location.height = Math.abs(mLocation.y - dLocation.y - 2);
					selector.css(location);
				});
				$(document).unbind("mouseup.create_text").bind("mouseup.create_text", function(upE){
					if(location != null && location.width >= 20 && location.height >= 20){
						//判断选取范围内的图形
						var shape = Model.create("standardText", location.left.restoreScale(), location.top.restoreScale());
						shape.props.w = location.width.restoreScale();
						shape.props.h = location.height.restoreScale();
						Model.add(shape);
						Designer.painter.renderShape(shape);
						Designer.op.editShapeText(shape);
						Utils.unselect();
						Utils.selectShape(shape.id);
					}
					selector.remove();
					Designer.op.resetState();
					$(document).unbind("mouseup.create_text");
					container.unbind("mousemove.create_text");
				});
				container.unbind("mousedown.create_text");
			});
		},
		canvasDragTimeout: null,
		/**
		 * 拖动画布
		 */
		canvasDraggable: function(){
			var container = $("#canvas_container");
			container.css("cursor", "url(/themes/default/images/diagraming/cursor_hand.png) 8 8, auto");
			if(this.canvasDragTimeout){
				clearTimeout(this.canvasDragTimeout);
			}
			this.canvasDragTimeout = setTimeout(function(){
				container.unbind("mousedown.drag_canvas");
				Designer.op.resetState();
				container.unbind("mousemove.drag_canvas");
				$(document).unbind("mouseup.drag_canvas");
			}, 500);
			container.unbind("mousedown.drag_canvas").bind("mousedown.drag_canvas", function(downE){
				var beginTop = $("#designer_layout").scrollTop();
				var beginLeft = $("#designer_layout").scrollLeft();
				container.bind("mousemove.drag_canvas", function(moveE){
					var offsetX = moveE.pageX - downE.pageX;
					var offsetY = moveE.pageY - downE.pageY;
					$("#designer_layout").scrollLeft(beginLeft - offsetX);
					$("#designer_layout").scrollTop(beginTop - offsetY);
				});
				$(document).unbind("mouseup.drag_canvas").bind("mouseup.drag_canvas", function(upE){
					container.unbind("mousemove.drag_canvas");
					$(document).unbind("mouseup.drag_canvas");
				});
			});
			$(document).unbind("keyup.drag_canvas").bind("keyup.drag_canvas", function(e){
				//放alt键后，取消
				container.unbind("mousedown.drag_canvas");
				Designer.op.resetState();
				$(document).unbind("mouseup.drag_canvas");
				e.preventDefault();
				clearTimeout(this.canvasDragTimeout);
				container.unbind("mousemove.drag_canvas");
			});
		},
		/**
		 * 画布可以随意拖动，不需要Alt键盘
		 */
		canvasFreeDraggable: function(){
			var container = $("#canvas_container");
			container.css("cursor", "url(/themes/default/images/diagraming/cursor_hand.png) 8 8, auto");
			container.unbind("mousedown.drag_canvas").bind("mousedown.drag_canvas", function(downE){
				var beginTop = $("#designer_layout").scrollTop();
				var beginLeft = $("#designer_layout").scrollLeft();
				container.bind("mousemove.drag_canvas", function(moveE){
					var offsetX = moveE.pageX - downE.pageX;
					var offsetY = moveE.pageY - downE.pageY;
					$("#designer_layout").scrollLeft(beginLeft - offsetX);
					$("#designer_layout").scrollTop(beginTop - offsetY);
				});
				$(document).unbind("mouseup.drag_canvas").bind("mouseup.drag_canvas", function(upE){
					container.unbind("mousemove.drag_canvas");
					$(document).unbind("mouseup.drag_canvas");
				});
			});
		},
		/**
		 * 移动图形
		 * @param {} offset 偏移量
		 */
		moveShape: function(shapes, offset){
			var ids = [];
			for(var i = 0; i < shapes.length; i++){
				var shape = shapes[i];
				ids.push(shape.id);
			}
			var restored = Utils.restoreScale(offset);
			for(var i = 0; i < shapes.length; i++){
				var shape = shapes[i];
				if(shape.name == "linker"){
					var linker = shape;
					var from = linker.from;
					var to = linker.to;
					var fromChanged = false;
					var toChanged = false;
					if(!Utils.isSelected(linker.id)){
						if(from.id != null && ids.indexOf(from.id) >= 0){
							//当起点无连接，或者起点形状也被选中了
							linker.from.x += restored.x;
							linker.from.y += restored.y;
							fromChanged = true;
						}
						if(to.id != null && ids.indexOf(to.id) >= 0){
							linker.to.x += restored.x;
							linker.to.y += restored.y;
							toChanged = true;
						}
					}else{
						if(from.id == null || ids.indexOf(from.id) >= 0){
							//当起点无连接，或者起点形状也被选中了
							linker.from.x += restored.x;
							linker.from.y += restored.y;
							fromChanged = true;
						}
						if(to.id == null || ids.indexOf(to.id) >= 0){
							linker.to.x += restored.x;
							linker.to.y += restored.y;
							toChanged = true;
						}
					}
					if(fromChanged && toChanged){
						for(var pi = 0; pi < linker.points.length; pi++){
							var p = linker.points[pi];
							p.x += restored.x;
							p.y += restored.y;
						}
						var shapeBox = $("#" + shape.id);
						var oriPos = shapeBox.position();
						shapeBox.css({
							left: oriPos.left += offset.x,
							top: oriPos.top += offset.y
						});
					}else if(fromChanged || toChanged){
						Designer.painter.renderLinker(linker, true);
					}
				}else{
					relocateShape(shape);
					$(".shape_contour[forshape="+shape.id+"]").css({
						left: shape.props.x.toScale(),
						top: shape.props.y.toScale()
					});
				}
			}
			var linkerIds = Utils.getSelectedLinkerIds();
			//如果选择中只包含一个连接线，不移动选择框
			if(shapes.length == 1 && linkerIds.length == 1){
				return;
			}
			if(linkerIds.length > 0){
				var selectedIds = Utils.getSelectedIds();
				Designer.painter.drawControls(selectedIds);
			}else{
				var controls = $("#shape_controls");
				controls.css({
					left: parseFloat(controls.css("left")) + offset.x,
					top: parseFloat(controls.css("top")) + offset.y
				});
			}
			var controlPos = $("#shape_controls").position();
			Designer.op.showTip("X: " + Math.round(controlPos.left.restoreScale()) + "&nbsp;&nbsp;Y: " + Math.round(controlPos.top.restoreScale()));
			/**
			 * 重新放置图形
			 */
			function relocateShape(shape){
				shape.props.x += restored.x;
				shape.props.y += restored.y;
				var shapeBox = $("#" + shape.id);
				shapeBox.css({
					left: parseFloat(shapeBox.css("left")) + offset.x,
					top: parseFloat(shapeBox.css("top")) + offset.y
				});
			}
		},
		/**
		 * 移动连接线，拖动端点
		 * @param {} linker
		 * @param {} point
		 * @param {} pageX
		 * @param {} pageY
		 */
		moveLinker: function(linker, point, x, y){
			var newPos = null;
			var linkedShape = null;
			var focus = Utils.getShapeByPosition(x, y, true);
			Designer.op.hideLinkPoint();
			if(focus != null){
				var shape = focus.shape;
				Utils.showAnchors(shape);
				linkedShape = shape.id;
				if(focus.type == "bounding"){
					newPos = focus.linkPoint;
					Designer.op.showLinkPoint(Utils.toScale(newPos));
				}else if(focus.type == "shape"){
					//如果鼠标移动到了某一个图形上
					var fixedPoint; //固定点，起点or终点
					var fixedId;
					if(point == "from"){
						fixedPoint = {x: linker.to.x, y: linker.to.y};
						fixedId = linker.to.id;
					}else{
						fixedPoint = {x: linker.from.x, y: linker.from.y};
						fixedId = linker.from.id;
					}
					if(shape.id == fixedId){
						//如果鼠标悬浮的形状为另一端点连接的图形，不自动连接
						Designer.op.hideLinkPoint();
						newPos = {x: x.restoreScale(), y: y.restoreScale()};
						newPos.angle = null;
						linkedShape = null;
					}else{
						var anchors = shape.getAnchors();
						var minDistance = -1;
						var nearestAnchor;
						var shapeCenter = {x: shape.props.x + shape.props.w/2, y: shape.props.y + shape.props.h/2};
						//循环所有锚点，取距离固定点最近的一点
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							var anchorPos = Utils.getRotated(shapeCenter, {x: shape.props.x + an.x, y: shape.props.y + an.y}, shape.props.angle);
							var anchorDistance = Utils.measureDistance(anchorPos, fixedPoint);
							if(minDistance == -1 || anchorDistance < minDistance){
								minDistance = anchorDistance;
								nearestAnchor = anchorPos;
							}
						}
						var anchorAngle = Utils.getPointAngle(shape.id, nearestAnchor.x, nearestAnchor.y, 7);
						newPos = {
							x: nearestAnchor.x,
							y: nearestAnchor.y,
							angle: anchorAngle
						};
						Designer.op.showLinkPoint(Utils.toScale(newPos));
					}
				}
			}else{
				Designer.op.hideLinkPoint();
				Utils.hideAnchors();
				newPos = {x: x.restoreScale(), y: y.restoreScale()};
				newPos.angle = null;
				linkedShape = null;
			}
			if(point == "from"){
				linker.from.id = linkedShape;
				linker.from.x = newPos.x;
				linker.from.y = newPos.y;
				linker.from.angle = newPos.angle;
				if(linkedShape == null){
					if(newPos.x >= linker.to.x -6 && newPos.x <= linker.to.x + 6){
						linker.from.x = linker.to.x;
					}
					if(newPos.y >= linker.to.y -6 && newPos.y <= linker.to.y + 6){
						linker.from.y = linker.to.y;
					}
				}
			}else{
				linker.to.x = newPos.x;
				linker.to.y = newPos.y;
				linker.to.id = linkedShape;
				linker.to.angle = newPos.angle;
				if(linkedShape == null){
					if(newPos.x >= linker.from.x -6 && newPos.x <= linker.from.x + 6){
						linker.to.x = linker.from.x;
					}
					if(newPos.y >= linker.from.y -6 && newPos.y <= linker.from.y + 6){
						linker.to.y = linker.from.y;
					}
				}
			}
			Designer.painter.renderLinker(linker, true);
		},
		/**
		 * 向一个形状连线时，显示锚点示意
		 */
		showLinkPoint: function(point){
			var canvas = $("<canvas class='link_point_canvas' width=32 height=32></canvas>").appendTo($("#designer_canvas"));
			var ctx = canvas[0].getContext("2d");
			ctx.translate(1, 1);
			ctx.lineWidth = 1;
			ctx.globalAlpha = 0.3;
			ctx.strokeStyle = Designer.config.anchorColor;
			ctx.fillStyle = Designer.config.anchorColor;
			ctx.beginPath();
			ctx.moveTo(0, 15);
			ctx.bezierCurveTo(0, -5, 30, -5, 30, 15);
			ctx.bezierCurveTo(30, 35, 0, 35, 0, 15);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			canvas.css({
				left: point.x - 16,
				top: point.y - 16,
				"z-index": Model.orderList.length
			}).show();
		},
		/**
		 * 隐藏锚点示意
		 */
		hideLinkPoint: function(){
			$(".link_point_canvas").hide();
		},
		/**
		 * 折线可以拖动
		 */
		brokenLinkerChangable: function(linker, index){
			var container = $("#canvas_container");
			var canvas = $("#designer_canvas");
			var p1 = linker.points[index - 1];
			var p2 = linker.points[index];
			if(p1.x == p2.x){
				container.css("cursor", "e-resize");
				//可左右拖动
			}else{
				container.css("cursor", "n-resize");
				//可上下拖动
			}
			canvas.bind("mousedown.brokenLinker", function(downE){
				Designer.op.changeState("changing_broken_linker");
				//初始坐标，要取相对画布的坐标
				var begin = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var selectedIds = Utils.getSelectedIds();
				container.bind("mousemove.brokenLinker", function(moveE){
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					//计算和开始时候的偏移量
					var offset = {
						x: now.x - begin.x, y: now.y - begin.y
					};
					offset = Utils.restoreScale(offset);
					if(p1.x == p2.x){
						p1.x += offset.x;
						p2.x += offset.x;
					}else{
						p1.y += offset.y;
						p2.y += offset.y;
					}
					Designer.painter.renderLinker(linker);
					if(selectedIds.length > 1){
						Designer.painter.drawControls(selectedIds);
					}
					begin = now;
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.changed").bind("mouseup.changed", function(){
						Model.update(linker);
						$(document).unbind("mouseup.changed");
					});
				});
				$(document).bind("mouseup.brokenLinker", function(){
					Designer.op.resetState();
					container.unbind("mousemove.brokenLinker");
					canvas.unbind("mousedown.brokenLinker");
					$(document).unbind("mouseup.brokenLinker");
				});
			});
		},
		/**
		 * 删除图形
		 */
		removeShape: function(){
			var selected = Utils.getSelected();
			if(selected.length > 0){
				Utils.unselect();
				//获取吸附的图形，一起删除
				var attachedShapes = Utils.getAttachedShapes(selected);
				selected = selected.concat(attachedShapes);
				var childrenShapes = [];
				for (var i = 0; i < selected.length; i++) {
					var children = Utils.getChildrenShapes(selected[i]);
					childrenShapes = childrenShapes.concat(children);
				}
				selected = selected.concat(childrenShapes);
				Model.remove(selected);
			}
		},
		/**
		 * 打开操作提示
		 * @param {} text
		 */
		showTip: function(text){
			var tip = $("#designer_op_tip");
			if(tip.length == 0){
				tip = $("<div id='designer_op_tip'></div>").appendTo("#designer_canvas");
			}
			tip.stop().html(text);
			var control = $("#shape_controls");
			var pos = control.position();
			tip.css({
				top: pos.top + control.height() + 5,
				left: pos.left + control.width()/2 - tip.outerWidth()/2,
				"z-index": Model.orderList.length
			}).show();
		},
		/**
		 * 隐藏操作提示
		 */
		hideTip: function(){
			$("#designer_op_tip").fadeOut(100);
		},
		/**
		 * 在移动图形过程中，显示对齐线
		 * @param {} p 缩放图形的位置信息
		 * @param {} ids 缩放图形的id集合
		 * @return {} 对齐线的集合
		 */
		snapLine: function(p, ids, isCreate, createdShape){
			var top = p.y;
			var middle = p.y + p.h/2;
			var bottom = p.y + p.h;
			var left = p.x;
			var center = p.x + p.w/2;
			var right = p.x + p.w;
			var radius = 2; //偏移半径
			var result = {v: null, h: null, attach: null};
			var boundaryEvent = null;
			if(isCreate){
				boundaryEvent = createdShape;
			}else{
				boundaryEvent = Model.getShapeById(ids[0]);
			}
			if(ids.length == 1 && boundaryEvent.groupName == "boundaryEvent"){
				//如果是边界事件，就要先寻找可以吸附上的形状
				for(var i = Model.orderList.length - 1; i >= 0; i--){
					var shapeId = Model.orderList[i].id;
					var shape = Model.getShapeById(shapeId);
					if(shape.name != "linker" && shape.id != boundaryEvent.id){
						var shapep = shape.props;
						if(result.attach == null && shapep.angle == 0 
							&& (shape.groupName == "task" || shape.groupName == "callActivity" || shape.groupName == "subProcess")){
							//如果是BPMN边界事件，可以吸附，那么此图形中心和task图形的边界重合时，可吸附
							var shapeRect = {
								x: shapep.x - radius, y: shapep.y - radius,
								w: shapep.w + radius*2, h: shapep.h + radius*2
							};
							if(Utils.pointInRect(center, middle, shapeRect)){
								var shapeTop = shapep.y;
								var shapeBottom = shapep.y + shapep.h;
								var shapeLeft = shapep.x;
								var shapeRight = shapep.x + shapep.w;
								var xAttach = false;
								var yAttach = false;
								if(shapeTop >= middle - radius && shapeTop <= middle + radius){
									p.y = shapeTop - p.h/2;
									yAttach = true;
								}else if(shapeBottom >= middle - radius && shapeBottom <= middle + radius){
									p.y = shapeBottom - p.h/2;
									yAttach = true;
								}
								if(shapeLeft >= center - radius && shapeLeft <= center + radius){
									p.x = shapeLeft - p.w/2;
									xAttach = true;
								}else if(shapeRight >= center - radius && shapeRight <= center + radius){
									p.x = shapeRight - p.w/2;
									xAttach = true;
								}
								if(xAttach || yAttach){
									result.attach = shape;
								}
							}
						}
					}
				}
			}
			if(result.attach == null){
				//如果没有找到可以吸附的图形，则开始寻找可以对齐的图形
				for(var i = Model.orderList.length - 1; i >= 0; i--){
					var shapeId = Model.orderList[i].id;
					var shape = Model.getShapeById(shapeId);
					if(shape.name == "linker" || ids.indexOf(shapeId) >=0
						|| shape.parent){
						continue;
						//排除连接线、已选图形、子图形
					}
					var shapep = shape.props;
					if(result.h == null){
						var shapeTop = shapep.y;
						var shapeMiddle = shapep.y + shapep.h/2;
						var shapeBottom = shapep.y + shapep.h;
						if(shapeMiddle >= middle - radius && shapeMiddle <= middle + radius){
							//水平居中
							result.h = {type: "middle", y: shapeMiddle};
							p.y = shapeMiddle - p.h/2;
						}else if(shapeTop >= top - radius && shapeTop <= top + radius){
							//顶端
							result.h = {type: "top", y: shapeTop};
							p.y = shapeTop;
						}else if(shapeBottom >= bottom - radius && shapeBottom <= bottom + radius){
							//底部
							result.h = {type: "bottom", y: shapeBottom};
							p.y = shapeBottom - p.h;
						}else if(shapeBottom >= top - radius && shapeBottom <= top + radius){
							//目标图形底部和移动图形顶部对齐
							result.h = {type: "top", y: shapeBottom};
							p.y = shapeBottom;
						}else if(shapeTop >= bottom - radius && shapeTop <= bottom + radius){
							//目标图形顶部和移动图形底部对齐
							result.h = {type: "bottom", y: shapeTop};
							p.y = shapeTop - p.h;
						}
					}
					if(result.v == null){
						var shapeLeft = shapep.x;
						var shapeCenter = shapep.x + shapep.w/2;
						var shapeRight = shapep.x + shapep.w;
						if(shapeCenter >= center - radius && shapeCenter <= center + radius){
							//垂直居中
							result.v = {type: "center", x: shapeCenter};
							p.x = shapeCenter - p.w/2;
						}else if(shapeLeft >= left - radius && shapeLeft <= left + radius){
							//左
							result.v = {type: "left", x: shapeLeft};
							p.x = shapeLeft;
						}else if(shapeRight >= right - radius && shapeRight <= right + radius){
							//右
							result.v = {type: "right", x: shapeRight};
							p.x = shapeRight - p.w;
						}else if(shapeRight >= left - radius && shapeRight <= left + radius){
							//目标图形右边和移动图形左边对齐
							result.v = {type: "left", x: shapeRight};
							p.x = shapeRight;
						}else if(shapeLeft >= right - radius && shapeLeft <= right + radius){
							//目标图形顶部和移动图形底部对齐
							result.v = {type: "right", x: shapeLeft};
							p.x = shapeLeft - p.w;
						}
					}
					if(result.h != null && result.v != null){
						break;
					}
				}
			}
			this.hideSnapLine();
			var canvas = $("#designer_canvas");
			if(result.attach != null){
				//如果有可以吸附的图形，在被吸附图形上显示轮廓
				var tip = $("#designer_op_snapline_attach");
				if(tip.length == 0){
					tip = $("<div id='designer_op_snapline_attach'></div>").appendTo(canvas);
				}
				var attach = result.attach;
				var lineWidth = attach.lineStyle.lineWidth;
				tip.css({
					width: (attach.props.w + lineWidth).toScale(),
					height:(attach.props.h + lineWidth).toScale(),
					left: (attach.props.x - lineWidth/2).toScale() - 2,
					top: (attach.props.y - lineWidth/2).toScale() - 2,
					"z-index": $("#" + attach.id).css("z-index")
				}).show();
			}
			if(result.h != null){
				var hLine = $("#designer_op_snapline_h");
				if(hLine.length == 0){
					hLine = $("<div id='designer_op_snapline_h'></div>").appendTo(canvas);
				}
				hLine.css({
					width: canvas.width() + Designer.config.pageMargin * 2,
					left: -Designer.config.pageMargin,
					top: Math.round(result.h.y.toScale()),
					"z-index": Model.orderList.length + 1
				}).show();
			}
			if(result.v != null){
				var vLine = $("#designer_op_snapline_v");
				if(vLine.length == 0){
					vLine = $("<div id='designer_op_snapline_v'></div>").appendTo(canvas);
				}
				vLine.css({
					height: canvas.height() + Designer.config.pageMargin * 2,
					top: -Designer.config.pageMargin,
					left: Math.round(result.v.x.toScale()),
					"z-index": Model.orderList.length + 1
				}).show();
			}
			return result;
		},
		/**
		 * 在缩放图形过程中，显示对齐线
		 * @param {} p 缩放图形的位置信息
		 * @param {} ids 缩放图形的id集合
		 * @param {} dir 缩放的方向
		 * @return {} 对齐线的集合
		 */
		snapResizeLine: function(p, ids, dir){
			var top = p.y;
			var middle = p.y + p.h/2;
			var bottom = p.y + p.h;
			var left = p.x;
			var center = p.x + p.w/2;
			var right = p.x + p.w;
			var radius = 2; //偏移半径
			var result = {v: null, h: null};
			//开始寻找可以对齐的图形
			for(var i = Model.orderList.length - 1; i >= 0; i--){
				var shapeId = Model.orderList[i].id;
				var shape = Model.getShapeById(shapeId);
				if(shape.name == "linker" || ids.indexOf(shapeId) >=0
					|| shape.parent){
					continue;
					//排除连接线、已选图形、子图形
				}
				var shapep = shape.props;
				if(result.h == null && (dir.indexOf("t") >= 0 || dir.indexOf("b") >= 0)){
					var shapeTop = shapep.y;
					var shapeMiddle = shapep.y + shapep.h/2;
					var shapeBottom = shapep.y + shapep.h;
					if(shapeMiddle >= middle - radius && shapeMiddle <= middle + radius){
						//水平居中
						result.h = {type: "middle", y: shapeMiddle};
						if(dir.indexOf("t") >= 0){
							p.h = (bottom - shapeMiddle) * 2;
							p.y = bottom - p.h;
						}else{
							p.h = (shapeMiddle - p.y) * 2;
						}
					}else if(dir.indexOf("t") >= 0 && shapeTop >= top - radius && shapeTop <= top + radius){
						//顶端
						result.h = {type: "top", y: shapeTop};
						p.y = shapeTop;
						p.h = bottom - shapeTop;
					}else if(dir.indexOf("b") >= 0 && shapeBottom >= bottom - radius && shapeBottom <= bottom + radius){
						//底部
						result.h = {type: "bottom", y: shapeBottom};
						p.h = shapeBottom - top;
					}else if(dir.indexOf("t") >= 0 && shapeBottom >= top - radius && shapeBottom <= top + radius){
						//目标图形底部和移动图形顶部对齐
						result.h = {type: "top", y: shapeBottom};
						p.y = shapeBottom;
						p.h = bottom - shapeBottom;
					}else if(dir.indexOf("b") >= 0 && shapeTop >= bottom - radius && shapeTop <= bottom + radius){
						//目标图形顶部和移动图形底部对齐
						result.h = {type: "bottom", y: shapeTop};
						p.h = shapeTop - p.y;
					}
				}
				if(result.v == null && (dir.indexOf("l") >= 0 || dir.indexOf("r") >= 0)){
					var shapeLeft = shapep.x;
					var shapeCenter = shapep.x + shapep.w/2;
					var shapeRight = shapep.x + shapep.w;
					if(shapeCenter >= center - radius && shapeCenter <= center + radius){
						//垂直居中
						result.v = {type: "center", x: shapeCenter};
						if(dir.indexOf("l") >= 0){
							p.w = (right - shapeCenter) * 2;
							p.x = right - p.w;
						}else{
							p.w = (shapeCenter - p.x) * 2;
						}
					}else if(dir.indexOf("l") >= 0 && shapeLeft >= left - radius && shapeLeft <= left + radius){
						//左
						result.v = {type: "left", x: shapeLeft};
						p.x = shapeLeft;
						p.w = right - shapeLeft;
					}else if(dir.indexOf("r") >= 0 && shapeRight >= right - radius && shapeRight <= right + radius){
						//右
						result.v = {type: "right", x: shapeRight};
						p.w = shapeRight - p.x;
					}else if(dir.indexOf("l") >= 0 && shapeRight >= left - radius && shapeRight <= left + radius){
						//目标图形右边和移动图形左边对齐
						result.v = {type: "left", x: shapeRight};
						p.x = shapeRight;
						p.w = right - shapeRight;
					}else if(dir.indexOf("r") >= 0 && shapeLeft >= right - radius && shapeLeft <= right + radius){
						//目标图形顶部和移动图形底部对齐
						result.v = {type: "right", x: shapeLeft};
						p.w = shapeLeft - p.x;
					}
				}
				if(result.h != null && result.v != null){
					break;
				}
			}
			this.hideSnapLine();
			var canvas = $("#designer_canvas");
			if(result.h != null){
				var hLine = $("#designer_op_snapline_h");
				if(hLine.length == 0){
					hLine = $("<div id='designer_op_snapline_h'></div>").appendTo(canvas);
				}
				hLine.css({
					width: canvas.width() + Designer.config.pageMargin * 2,
					left: -Designer.config.pageMargin,
					top: Math.round(result.h.y.toScale()),
					"z-index": Model.orderList.length + 1
				}).show();
			}
			if(result.v != null){
				var vLine = $("#designer_op_snapline_v");
				if(vLine.length == 0){
					vLine = $("<div id='designer_op_snapline_v'></div>").appendTo(canvas);
				}
				vLine.css({
					height: canvas.height() + Designer.config.pageMargin * 2,
					top: -Designer.config.pageMargin,
					left: Math.round(result.v.x.toScale()),
					"z-index": Model.orderList.length + 1
				}).show();
			}
			return result;
		},
		/**
		 * 隐藏对齐线
		 */
		hideSnapLine: function(){
			$("#designer_op_snapline_h").hide();
			$("#designer_op_snapline_v").hide();
			$("#designer_op_snapline_attach").hide();
		},
		/**
		 * 打开连接图形的画板
		 * @param {} x X坐标
		 * @param {} y Y坐标
		 * @param {} category 分类
		 */
		linkDashboard: function(linker){
			var fromShape = Model.getShapeById(linker.from.id); //拿到起点形状
			var category = fromShape.category; //拿到起点形状的分类
			if($("#panel_" + category).length != 0){
				//如果此分类在当前形状面板中，则可以带出此分类的画板
				var board = $("#shape_dashboard_" + category);
				if(board.length == 0){
					//此分类的画板不存在，则初始化
					board = $("<div id='shape_dashboard_"+category+"' class='shape_dashboard menu'></div>").appendTo("#designer_canvas");
					/**
					 * 添加图形DOM元素
					 */
					function appendPanelItem(shape, group){
						var html = "<div class='dashboard_box' shapeName='" + shape.name + "'><canvas title='"+shape.title+"' title_pos='right' class='panel_item' width='"+(Designer.config.panelItemWidth)+"' height='"+(Designer.config.panelItemHeight)+"'></canvas></div>";
						var panelBox = $(html).appendTo(board);
						if(group){
							panelBox.append("<div class='group_icon link_shape_icon' group='"+group+"'></div>");
						}
						var canvas = panelBox.children()[0];
						//绘制图形
						Designer.painter.drawPanelItem(canvas, shape.name);
					}
					for(var key in Schema.shapes){
						var shape = Schema.shapes[key];
						if(shape.category == category){
							var attribute = shape.attribute;
							if(attribute.visible && attribute.linkable){
								//图形是可见的，并且是可以连线的
								if(!shape.groupName){
									appendPanelItem(shape);
								}else{
									var groupShapes = SchemaGroup.getGroup(shape.groupName);
									if(groupShapes[0] == shape.name){
										appendPanelItem(shape, shape.groupName);
									}
								}
							}
						}
					}
					board.bind("mousemove", function(e){
						e.stopPropagation();
					}).bind("mousedown", function(e){
						e.stopPropagation();
					});
				}
				board.css({
					left: linker.to.x.toScale(),
					top: linker.to.y.toScale(),
					"z-index": Model.orderList.length
				}).show();
				board.find(".link_shape_icon").unbind().bind("mousedown", function(e){
					e.stopPropagation();
					var group = $(this).attr("group");
					var pos = $(this).parent().position();
					var boardPos = board.position();
					var left = pos.left + boardPos.left + $(this).parent().outerWidth() - 10;
					var top = pos.top + boardPos.top + $(this).parent().outerHeight();
					Designer.op.groupDashboard(group, left, top, function(name){
						linkShape(name);
						board.hide();
						$(document).unbind("mousedown.dashboard");
					});
				}).bind("click", function(e){
					e.stopPropagation();
				});
				board.children(".dashboard_box").unbind().bind("click", function(){
					board.hide();
					$(document).unbind("mousedown.dashboard");
					var current = $(this);
					var name = current.attr("shapeName");
					linkShape(name);
				});
				$(document).bind("mousedown.dashboard", function(){
					board.hide();
					$(document).unbind("mousedown.dashboard");
				});
				/**
				 * 链接一个形状
				 */
				function linkShape(name){
					var shape = Schema.shapes[name];
					var toAngle = Utils.getEndpointAngle(linker, "to");
					var dir = Utils.getAngleDir(toAngle);
					var anchors = shape.getAnchors();
					var anchor;
					if(dir == 1){
						//箭头向下，连接图形上方
						var minY = null;
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							if(minY == null || an.y < minY){
								minY = an.y;
								anchor = an;
							}
						}
					}else if(dir == 2){
						//箭头向左，连接图形右方
						var maxX = null;
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							if(maxX == null || an.x > maxX){
								maxX = an.x;
								anchor = an;
							}
						}
					}else if(dir == 3){
						//箭头向上，连接图形下方
						var maxY = null;
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							if(maxY == null || an.y > maxY){
								maxY = an.y;
								anchor = an;
							}
						}
					}else if(dir == 4){
						//箭头向右，连接图形左方
						var minX = null;
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							if(minX == null || an.x < minX){
								minX = an.x;
								anchor = an;
							}
						}
					}
					var newShape = Model.create(name, linker.to.x - anchor.x, linker.to.y - anchor.y);
					Designer.painter.renderShape(newShape);
					MessageSource.beginBatch();
					//发送形状创建事件
					if(newShape.onCreated){
						newShape.onCreated();
					}
					Designer.events.push("created", newShape);
					Model.add(newShape);
					//重构连接线
					var anchorAngle = Utils.getPointAngle(newShape.id, linker.to.x, linker.to.y, 7);
					linker.to.id = newShape.id;
					linker.to.angle = anchorAngle;
					Designer.painter.renderLinker(linker, true);
					Model.update(linker);
					MessageSource.commit();
					Utils.unselect();
					Utils.selectShape(newShape.id);
					Designer.op.editShapeText(newShape);
				}
			}
		},
		/**
		 * 打开分组面板
		 */
		groupDashboard: function(groupName, left, top, onSelected){
			$(".group_dashboard").hide();
			var board = $("#shape_group_dashboard_" + groupName);
			if(board.length == 0){
				//此分类的画板不存在，则初始化
				board = $("<div id='shape_group_dashboard_"+groupName+"' class='group_dashboard menu'></div>").appendTo("#designer_canvas");
				var groupShapes = SchemaGroup.getGroup(groupName);
				for (var i = 0; i < groupShapes.length; i++) {
					var name = groupShapes[i];
					var shape = Schema.shapes[name];
					if(shape.attribute.visible){
						var box = $("<div class='dashboard_box' shapeName='" + name + "'><canvas title='"+shape.title+"' title_pos='right' width='"+(Designer.config.panelItemWidth)+"' height='"+(Designer.config.panelItemHeight)+"'></canvas></div>").appendTo(board);
						var canvas = box.children("canvas")[0];
						Designer.painter.drawPanelItem(canvas, shape.name);
					}
				}
				board.bind("mousedown", function(e){
					e.stopPropagation();
				});
			}
			board.css({
				left: left,
				top: top,
				"z-index": Model.orderList.length + 1
			}).show();
			$(".dashboard_box").unbind().bind("click", function(){
				var shapeName = $(this).attr("shapeName");
				onSelected(shapeName);
				board.hide();
				$(document).unbind("mousedown.group_dashboard");
			});
			$(document).bind("mousedown.group_dashboard", function(){
				board.hide();
				$(document).unbind("mousedown.group_dashboard");
			});
			return board;
		},
		/**
		 * 打开一个图形分组，用于创建图形
		 * @param {} groupName
		 * @param {} event
		 */
		showPanelGroup: function(groupName, event, target){
			event.stopPropagation();
			var board = $("#group_dashboard_" + groupName);
			$(".group_dashboard").hide();
			if(board.length == 0){
				//此分类的画板不存在，则初始化
				board = $("<div id='group_dashboard_"+groupName+"' class='group_dashboard menu'></div>").appendTo("#designer");
				var groupShapes = SchemaGroup.getGroup(groupName);
				for (var i = 0; i < groupShapes.length; i++) {
					var name = groupShapes[i];
					var shape = Schema.shapes[name];
					if(shape.attribute.visible){
						var box = $("<div class='panel_box' shapeName='" + name + "'><canvas title='"+shape.title+"' title_pos='right' width='"+(Designer.config.panelItemWidth)+"' height='"+(Designer.config.panelItemHeight)+"'></canvas></div>").appendTo(board);
						var canvas = box.children("canvas")[0];
						Designer.painter.drawPanelItem(canvas, shape.name);
					}
				}
				board.css("position", "fixed");
			}
			var shapeBox = $(target).parent();
			var offset = shapeBox.offset();
			board.show();
			var top = offset.top + shapeBox.height();
			if(top + board.outerHeight() > $(window).height()){
				top = $(window).height() - board.outerHeight();
			}
			board.css({
				left: offset.left - 7,
				top: top
			});
			$(document).bind("mousedown.group_board", function(){
				board.hide();
				$(document).unbind("mousedown.group_board");
			});
		},
		/**
		 * 修改形状的属性
		 */
		changeShapeProps: function(shape, props){
			function changeLinkerPoint(point){
				if(typeof props.x != "undefined"){
					point.x += (props.x - shape.props.x);
				}
				if(typeof props.y != "undefined"){
					point.y += (props.y - shape.props.y);
				}
				if(typeof props.w != "undefined" || typeof props.h != "undefined" || typeof props.angle != "undefined"){
					var p = $.extend({}, shape.props, props);
					//得到图形原始的中心点
					var shapeCenter = {
						x: shape.props.x + shape.props.w/2,
						y: shape.props.y + shape.props.h/2
					};
					//得到未旋转情况下，连接线端点与图形的比例，即把坐标先旋转回去
					var rotateBack = Utils.getRotated(shapeCenter, point, -shape.props.angle);
					var w = shape.props.w;
					var h = shape.props.h;
					if(typeof props.w != "undefined"){
						point.x = shape.props.x + (rotateBack.x - shape.props.x) / shape.props.w * props.w;
						w = props.w;
					}else{
						point.x = rotateBack.x;
					}
					if(typeof props.h != "undefined"){
						point.y = shape.props.y + (rotateBack.y - shape.props.y) / shape.props.h * props.h;
						h = props.h;
					}else{
						point.y = rotateBack.y;
					}
					var newCenter = {
						x: shape.props.x + w/2,
						y: shape.props.y + h/2
					};
					var rotated = Utils.getRotated(newCenter, point, p.angle);
					point.x = rotated.x;
					point.y = rotated.y;
				}
				if(typeof props.angle != "undefined"){
					point.angle += props.angle - shape.props.angle;
				}
			}
			var changedlinkers = [];
			var shapeLinkers = Model.getShapeLinkers(shape.id);
			if(shapeLinkers && shapeLinkers.length > 0){
				for(var index = 0; index < shapeLinkers.length; index++){
					var id = shapeLinkers[index];
					var linker = Model.getShapeById(id);
					if(shape.id == linker.from.id){
						changeLinkerPoint(linker.from);
					}
					if(shape.id == linker.to.id){
						changeLinkerPoint(linker.to);
					}
				}
				changedlinkers =  shapeLinkers;
			}
			$.extend(shape.props, props);
			Designer.painter.renderShape(shape);
			Utils.showLinkerCursor();
			UI.showShapeOptions();
			return changedlinkers;
		}
	},
	/**
	 * 事件对象以及处理函数
	 * @type {}
	 */
	events: {
		push: function(eventName, eventObject){
			var eventListener = this.listeners[eventName];
			if(eventListener){
				return eventListener(eventObject);
			}
			return null;
		},
		listeners: {},
		addEventListener: function(listenEventName, execCallback){
			this.listeners[listenEventName] = execCallback;
		}
	},
	/**
	 * 剪贴板
	 * @type {}
	 */
	clipboard: {
		/**
		 * 剪贴板存储对象
		 * @type {}
		 */
		elements: [],
		/**
		 * 预置的id映射，在copy之后，预置paste时会使用的新id，控制连接线所需
		 * @type {}
		 */
		presetedIds: {},
		/**
		 * 预置id映射
		 */
		presetIds: function(){
			this.presetedIds = {};
			for(var i = 0; i < this.elements.length; i++){
				//初始化一些属性为默认值
				var shape = this.elements[i];
				this.presetedIds[shape.id] = Utils.newId();
				//建立新的group映射
				if(shape.group && !this.presetedIds[shape.group]){
					this.presetedIds[shape.group] = Utils.newId();
				}
			}
		},
		/**
		 * 状态标识，标识在粘贴时，是否需要改变位置
		 * @type {Boolean}
		 */
		plus: true,
		/**
		 * 复制，copy一份存到剪贴板中
		 */
		copy: function(){
			this.elements = [];
			var selected = Utils.getSelected();
			var familyShapes = Utils.getFamilyShapes(selected);
			selected = selected.concat(familyShapes);
			selected.sort(function compare(a, b){
		 		return a.props.zindex - b.props.zindex;
		 	});
			for(var i = 0; i < selected.length; i++){
				var shape = Utils.copy(selected[i]);
				if(shape.name == "linker"){
					//如果是连接线，要处理一下端点连接的图形
					if(shape.from.id != null){
						if(!Utils.isSelected(shape.from.id)){
							shape.from.id = null;
							shape.from.angle = null;
						}
					}
					if(shape.to.id != null){
						if(!Utils.isSelected(shape.to.id)){
							shape.to.id = null;
							shape.to.angle = null;
						}
					}
				}
				this.elements.push(shape);
			}
			this.elements.sort(function compare(a, b){
		 		return a.props.zindex - b.props.zindex;
		 	});
			this.presetIds();
			this.plus = true;
			Designer.events.push("clipboardChanged", this.elements.length);
		},
		/**
		 * 复制，copy一份存到剪贴板中
		 */
		cut: function(){
			this.copy();
			Designer.op.removeShape();
			this.plus = false; //如果是cut操作，第一次粘贴，不改变位置
		},
		/**
		 * 粘贴
		 */
		paste: function(x, y){
			if(this.elements.length == 0){
				return;
			}
			var offsetX = 20;
			var offsetY = 20;
			if(typeof x != "undefined"){
				var bounding = Utils.getShapesBounding(this.elements);
				offsetX = x - bounding.x - bounding.w/2;
				offsetY = y - bounding.y - bounding.h/2;
			}
			var changedShapes = [];
			var changedIds = [];
			//先创建图形，再创建连接线，因为连接线可能会依赖图形
			for(var i = 0; i < this.elements.length; i++){
				var shape = this.elements[i];
				if(shape.name != "linker"){
					var newShape;
					//初始化一些属性为默认值
					var shape = this.elements[i];
					shape.props.zindex = Model.maxZIndex + (i+1);
					var newId = this.presetedIds[shape.id];
					if(this.plus || typeof x != "undefined"){
						shape.props.x += offsetX;
						shape.props.y += offsetY;
					}
					newShape = Utils.copy(shape);
					for (var j = 0; j < newShape.dataAttributes.length; j++) {
						var attr = newShape.dataAttributes[j];
						attr.id = Utils.newId();
					}
					newShape.id = newId;
					//构建新的children和parent关联
					if(newShape.children){
						for(var ci = 0; ci < newShape.children.length; ci++){
							var childId = newShape.children[ci];
							newShape.children[ci] = this.presetedIds[childId];
						}
					}
					if(newShape.parent){
						newShape.parent = this.presetedIds[newShape.parent];
					}
					changedShapes.push(newShape);
					changedIds.push(newId);
					if(shape.group){
						var newGroup = this.presetedIds[shape.group];
						newShape.group = newGroup;
					}
				}
			}
			for(var i = 0; i < this.elements.length; i++){
				var shape = this.elements[i];
				if(shape.name == "linker"){
					var newShape;
					//初始化一些属性为默认值
					shape.props.zindex = Model.maxZIndex + (i+1);
					var newId = this.presetedIds[shape.id];
					if(this.plus || typeof x != "undefined"){
						shape.from.x += offsetX;
						shape.from.y += offsetY;
						shape.to.x += offsetX;
						shape.to.y += offsetY;
						for(var pi = 0; pi < shape.points.length; pi++){
							var p = shape.points[pi];
							p.x += offsetX;
							p.y += offsetY;
						}
					}
					newShape = Utils.copy(shape);
					if(!newShape.dataAttributes){
						newShape.dataAttributes = [];
					}
					for (var j = 0; j < newShape.dataAttributes.length; j++) {
						var attr = newShape.dataAttributes[j];
						attr.id = Utils.newId();
					}
					if(shape.from.id != null){
						newShape.from.id = this.presetedIds[shape.from.id];
					}
					if(shape.to.id != null){
						newShape.to.id = this.presetedIds[shape.to.id];
					}
					newShape.id = newId;
					changedShapes.push(newShape);
					changedIds.push(newId);
					if(shape.group){
						var newGroup = this.presetedIds[shape.group];
						newShape.group = newGroup;
					}
				}
			}
			Model.addMulti(changedShapes);
			for(var i = 0; i < changedShapes.length; i++){
				var shape = changedShapes[i];
				Designer.painter.renderShape(shape);
			}
			Model.build();
			//重新内置一下id
			this.presetIds();
			Utils.unselect();
			Utils.selectShape(changedIds);
			this.plus = true;
		},
		/**
		 * 复用
		 */
		duplicate: function(){
			this.copy();
			this.paste();
		},
		/**
		 * copy样式到格式刷
		 */
		brush: function(){
			var selected = Utils.getSelected();
			if(selected.length == 0){
				return;
			}
			//格式刷中的样式，把连接线与形状样式区分开
			var brushStyles = {
				fontStyle: {},
				lineStyle: {},
				fillStyle: null,
				shapeStyle: null
			};
			for(var i = 0; i < selected.length; i++){
				var shape = selected[i];
				if(shape.name == "linker"){
					$.extend(brushStyles.lineStyle, shape.lineStyle);
					$.extend(brushStyles.fontStyle, shape.fontStyle);
				}else{
					if(brushStyles.fillStyle == null){
						brushStyles.fillStyle = {};
					}
					if(brushStyles.shapeStyle == null){
						brushStyles.shapeStyle = {};
					}
					$.extend(brushStyles.lineStyle, shape.lineStyle);
					$.extend(brushStyles.fontStyle, shape.fontStyle);
					$.extend(brushStyles.shapeStyle, shape.shapeStyle);
					$.extend(brushStyles.fillStyle, shape.fillStyle);
				}
			}
			$("#bar_brush").button().select();
			//打开帮助
			var help = $("#designer_op_help");
			if(help.length == 0){
				help = $("<div id='designer_op_help'></div>").appendTo("#designer_viewport");
			}
			help.html("选择目标图形并使用格式刷样式<br/>Esc取消").show();
			$(document).unbind("keydown.cancelbrush").bind("keydown.cancelbrush", function(e){
				//按Esc取消，并且停止brush
				if(e.keyCode == 27){
					$("#bar_brush").button().unselect();
					help.hide();
					$(document).unbind("keydown.cancelbrush");
					Utils.selectCallback = null;
					$("#bar_brush").button().disable();
				}
			});
			//设置选择后的回调事件，设置样式
			Utils.selectCallback = function(){
				var copyTo = Utils.getSelected();
				for(var i = 0; i < copyTo.length; i++){
					var shape = copyTo[i];
					var textOrientation = shape.fontStyle.orientation;
					$.extend(shape.lineStyle, brushStyles.lineStyle);
					$.extend(shape.fontStyle, brushStyles.fontStyle);
					if(shape.name != "linker"){
						shape.lineStyle = brushStyles.lineStyle;
						delete shape.lineStyle.beginArrowStyle;
						delete shape.lineStyle.endArrowStyle;
						shape.fontStyle.orientation = textOrientation; //orientation属性是不允许修改的
						if(brushStyles.fillStyle != null){
							shape.fillStyle = brushStyles.fillStyle;
						}
						if(brushStyles.shapeStyle != null){
							shape.shapeStyle = brushStyles.shapeStyle;
						}
					}else{
						delete shape.fontStyle.orientation;
						delete shape.fontStyle.vAlign;
					}
					Designer.painter.renderShape(shape);
				}
				Model.updateMulti(copyTo);
			}
		}
	},
	/**
	 * 方法定义
	 */
	addFunction: function(fnName, fnBody){
		if(Designer[fnName]){
			throw "Duplicate function name!";
		}else{
			this[fnName] = fnBody;
		}
	},
	/**
	 * 绘制器
	 */
	painter: {
		/**
		 * 绘制器动作处理定义
		 */
		actions: {
			move: function(data){
				this.moveTo(data.x, data.y);
			},
			line: function(data){
				this.lineTo(data.x, data.y);
			},
			curve: function(data){
				this.bezierCurveTo(data.x1, data.y1, data.x2, data.y2, data.x, data.y);
			},
			quadraticCurve: function(data){
				this.quadraticCurveTo(data.x1, data.y1, data.x, data.y);
			},
			close: function(){
				this.closePath();
			}
		},
		/**
		 * 设置虚线段
		 */
		setLineDash: function(ctx, segments){
			if (!ctx.setLineDash) {
			    ctx.setLineDash = function(){}
			}
			ctx.setLineDash(segments);
			ctx.mozDash = segments;
			ctx.webkitLineDash = segments;
		},
		/**
		 * 绘制路径
		 * @param {} 画布上下文
		 * @param {} shape 图形完整定义
		 * @param {} shape 是否是要绘制图形面板的图形
		 */
		renderShapePath: function(ctx, shape, isPanelIcon, delayCallback){
			var paths;
			if(isPanelIcon && shape.drawIcon){
				paths = shape.drawIcon(shape.props.w, shape.props.h);
			}else{
				paths = shape.getPath();
			}
			this.renderPath(ctx, shape, paths, isPanelIcon, delayCallback);
		},
		/**
		 * 绘制路径
		 * @param {} ctx
		 * @param {} shape
		 * @param {} paths
		 * @param {} delayCallback 填充回调函数，用于在图片延迟加载之后
		 */
		renderPath: function(ctx, shape, paths, isPanelIcon, delayCallback){
			for(var i = 0; i < paths.length; i++){
				var cmd = paths[i];
				ctx.save();
				ctx.beginPath();
				var lineStyle = $.extend({}, shape.lineStyle, cmd.lineStyle);
				var fillStyle = $.extend({}, shape.fillStyle, cmd.fillStyle);
				for (var j = 0; j < cmd.actions.length; j++) {
					var cmdAction = cmd.actions[j];
					this.actions[cmdAction.action].call(ctx, cmdAction);
				}
				//填充
				this.fillShape(shape, ctx, fillStyle, delayCallback);
				//画线
				if(lineStyle.lineWidth){
					ctx.lineWidth = lineStyle.lineWidth;
					ctx.strokeStyle = "rgb("+lineStyle.lineColor+")";
					if(lineStyle.lineStyle == "dashed"){
						//虚线
						if(isPanelIcon){
							this.setLineDash(ctx, [lineStyle.lineWidth * 4, lineStyle.lineWidth * 2])
						}else{
							this.setLineDash(ctx, [lineStyle.lineWidth * 6, lineStyle.lineWidth * 3]);
						}
					}else if(lineStyle.lineStyle == "dot"){
						//点线
						this.setLineDash(ctx, [lineStyle.lineWidth, lineStyle.lineWidth * 2]);
					}else if(lineStyle.lineStyle == "dashdot"){
						//点线
						this.setLineDash(ctx, [lineStyle.lineWidth * 6, lineStyle.lineWidth * 2, lineStyle.lineWidth, lineStyle.lineWidth * 2]);
					}
					ctx.stroke();				
				}
				ctx.restore();
			}
		},
		drawImage: function(ctx, cmd){
			var image = $(".shape_img[src='" + cmd.image + "']");
			if(image.length == 0){
				image = $("<img class='shape_img' loaded='0' src=''/>").appendTo("#shape_img_container");
				image.bind("load.drawshape", function(){
					//如果图片不存在，需要在图片加载完后，回调
					ctx.drawImage(image[0], cmd.x ,cmd.y, cmd.w, cmd.h);
					$(this).attr("loaded", "1");
				});
				image.attr("src", cmd.image);
			}else if(image.attr("loaded") == "0"){
				image.bind("load.drawshape", function(){
					//如果图片不存在，需要在图片加载完后，回调
					ctx.drawImage(image[0], cmd.x ,cmd.y, cmd.w, cmd.h);
				});
			}else{
				ctx.drawImage(image[0], cmd.x ,cmd.y, cmd.w, cmd.h);
			}
		},
		/**
		 * 绘制图形面板图形
		 * @param canvas
		 * @param schemeName
		 */
		drawPanelItem: function(canvas, shapeName){
			var ctx = canvas.getContext("2d");
			var shape = Utils.copy(Schema.shapes[shapeName]);
			var props = {
				x: 0,
				y: 0,
				w: shape.props.w,
				h: shape.props.h,
				angle: shape.props.angle
			};
			ctx.clearRect(0, 0, Designer.config.panelItemWidth, Designer.config.panelItemHeight);
			//计算图标的宽高以及位移
			if(props.w >= Designer.config.panelItemWidth || props.h >= Designer.config.panelItemWidth){
				if(shape.props.w >= shape.props.h){
					props.w = Designer.config.panelItemWidth - shape.lineStyle.lineWidth * 2;
					props.h = parseInt(shape.props.h / shape.props.w * props.w);
				}else{
					props.h = Designer.config.panelItemHeight - shape.lineStyle.lineWidth * 2;
					props.w = parseInt(shape.props.w / shape.props.h * props.h);
				}
			}
			shape.props = props;
			ctx.save();
			ctx.lineJoin = "round";
			ctx.globalAlpha = shape.shapeStyle.alpha;
			var translateX = (Designer.config.panelItemWidth - props.w)/2;
			var translateY = (Designer.config.panelItemHeight - props.h)/2;
			ctx.translate(translateX, translateY);
			ctx.translate(props.w/2, props.h/2);
			ctx.rotate(props.angle);
			ctx.translate(-(props.w/2), -(props.h/2));
			this.renderShapePath(ctx, shape, true, function(){
				Designer.painter.drawPanelItem(canvas, shapeName);
			});
			//绘制BPMN Marker
			this.renderMarkers(ctx, shape, true);
			ctx.restore();
		},
		/**
		 * 绘制形状
		 * 顺序：背景 -> 文字 -> 边框
		 * @param {} shapeObj
		 */
		renderShape: function(shape){
			if(shape.name == "linker"){
				this.renderLinker(shape);
				return;
			}
			var shapeBox = $("#" + shape.id);
			if(shapeBox.length == 0){
				//如果不存在，要执行创建
				var superCanvas = $("#designer_canvas");
				shapeBox = $("<div id='"+shape.id+"' class='shape_box'><canvas class='shape_canvas'></canvas></div>").appendTo(superCanvas);
			}
			//得到图形旋转后的矩形边界
			var box = Utils.getShapeBox(shape);
			//修改图形画布的宽高，坐标等信息
			var canvasWidth = (box.w + 20).toScale();
			var canvasHeight = (box.h + 20).toScale();
			shapeBox.find(".shape_canvas").attr({
				width: canvasWidth,
				height: canvasHeight
			});
			shapeBox.css({
				left: (box.x - 10).toScale() + "px",
				top: (box.y - 10).toScale() + "px",
				width: canvasWidth,
				height: canvasHeight
			});
			//对图形执行绘制
			var ctx = shapeBox.find(".shape_canvas")[0].getContext("2d");
			ctx.clearRect(0, 0, shape.props.w + 20, shape.props.h + 20);
			ctx.scale(Designer.config.scale, Designer.config.scale);
			ctx.translate(10, 10);
			ctx.translate(shape.props.x - box.x, shape.props.y - box.y);
			ctx.translate(shape.props.w/2, shape.props.h/2);
			ctx.rotate(shape.props.angle);
			ctx.translate(-(shape.props.w/2), -(shape.props.h/2));
			var style = shape.lineStyle;
			ctx.globalAlpha = shape.shapeStyle.alpha;
			ctx.lineJoin = "round";
			this.renderShapePath(ctx, shape, false, function(){
				var sid = shape.id;
				var s = Model.getShapeById(sid);
				Designer.painter.renderShape(s);
			});
			//绘制BPMN Marker
			this.renderMarkers(ctx, shape);
//			//再绘制一节，用来响应鼠标，默认为画法最后一节
			var paths = shape.getPath();
			var respondPath = Utils.copy(paths[paths.length - 1]);
			respondPath.fillStyle = {type: "none"};
			respondPath.lineStyle = {lineWidth: 0};
			var respondPaths = [respondPath];
			this.renderPath(ctx, shape, respondPaths);
			//绘制文本
			this.renderText(shape, box);
			this.renderDataAttributes(shape, box);
		},
		/**
		 * 填充图形
		 */
		fillShape: function(shape, ctx, fillStyle, delayCallback){
			ctx.save();
			//填充
			if(fillStyle.type != "none" && typeof fillStyle.alpha != "undefined"){
				ctx.globalAlpha = fillStyle.alpha;
			}
			if(fillStyle.type == "solid"){
				ctx.fillStyle = "rgb("+fillStyle.color+")";
				ctx.fill();
			}else if(fillStyle.type == "gradient"){
				var gradient;
				if(fillStyle.gradientType == "linear"){
					//创建线性渐变
					gradient = GradientHelper.createLinearGradient(shape, ctx, fillStyle);
				}else{
					//创建径向渐变
					gradient = GradientHelper.createRadialGradient(shape, ctx, fillStyle);
				}
				ctx.fillStyle = gradient;
				ctx.fill();
			}else if(fillStyle.type == "image"){
				var url;
				if(fillStyle.fileId.indexOf("/images/") >= 0){
					url = fillStyle.fileId;
				}else{
					url = "/file/id/"+fillStyle.fileId+"/diagram_user_image";
				}
				var image = $(".shape_img[src='" + url + "']");
				if(image.length == 0){
					image = $("<img class='shape_img' loaded='0' src=''/>").appendTo("#shape_img_container");
					image.bind("load.drawshape", function(){
						//如果图片不存在，需要在图片加载完后，回调
						$(this).attr("loaded", "1");
						if(delayCallback){
							delayCallback();
						}
					});
					image.attr("src", url);
				}else if(image.attr("loaded") == "0"){
					image.bind("load.drawshape", function(){
						//如果图片不存在，需要在图片加载完后，回调
						if(delayCallback){
							delayCallback();
						}
					});
				}else{
					drawImage(image);
				}
			}
			ctx.restore();
			function drawImage(image){
				ctx.save();
				ctx.clip();
//				ctx.globalCompositeOperation = "destination-over";
				if(fillStyle.display == "fit"){
					//自适应
					var imgW = image.width();
					var imgH = image.height();
					var imgScale = imgW/imgH;
					var shapeScale = shape.props.w/shape.props.h;
					if(imgScale > shapeScale){
						var drawW = shape.props.w;
						var x = 0;
						var drawH = drawW / imgScale;
						var y = shape.props.h/2 - drawH/2;
						ctx.drawImage(image[0], x ,y, drawW, drawH);
					}else{
						var drawH = shape.props.h;
						var y = 0;
						var drawW = drawH * imgScale;
						var x = shape.props.w/2 - drawW/2;
						ctx.drawImage(image[0], x ,y, drawW, drawH);
					}
				}else if(fillStyle.display == "stretch"){
					//铺满
					ctx.drawImage(image[0], 0 ,0, shape.props.w, shape.props.h);
				}else if(fillStyle.display == "original"){
					//原始尺寸
					var imgW = image.width();
					var imgH = image.height();
					var x = shape.props.w/2 - imgW/2;
					var y = shape.props.h/2 - imgH/2;
					ctx.drawImage(image[0], x ,y, imgW, imgH);
				}else if(fillStyle.display == "tile"){
					//平铺
					var x = 0;
					var imgW = image.width();
					var imgH = image.height();
					while(x < shape.props.w){
						var y = 0;
						while(y < shape.props.h){
							ctx.drawImage(image[0], x ,y, imgW, imgH);
							y += imgH;
						}
						x += imgW;
					}
				}else if(fillStyle.display == "static"){
					//静态定位
					var x = 0;
					var imgW = image.width();
					var imgH = image.height();
					ctx.drawImage(image[0], fillStyle.imageX , fillStyle.imageY, imgW, imgH);
				}else{
					//fill，默认，等比填充
					var imgW = image.width();
					var imgH = image.height();
					var imgScale = imgW/imgH;
					var shapeScale = shape.props.w/shape.props.h;
					if(imgScale > shapeScale){
						//图片的宽高比例大于图形的，及图形相对于图片，高比较小，以高为基准
						var drawH = shape.props.h;
						var y = 0;
						var drawW = drawH * imgScale;
						var x = shape.props.w/2 - drawW/2;
						ctx.drawImage(image[0], x ,y, drawW, drawH);
					}else{
						var drawW = shape.props.w;
						var x = 0;
						var drawH = drawW / imgScale;
						var y = shape.props.h/2 - drawH/2;
						ctx.drawImage(image[0], x ,y, drawW, drawH);
					}
				}
				ctx.restore();
			}
		},
		/**
		 * 绘制图形上的文本
		 * @param {} shape
		 */
		renderText: function(shape, shapeBox){
			var shapeContainer = $("#" + shape.id);
			var tbs = shape.getTextBlock();
			shapeContainer.find(".text_canvas").remove();
			for(var i = 0; i < tbs.length; i++){
				var textBlock = tbs[i];
				var textarea = shapeContainer.find(".text_canvas[ind="+i+"]");
				if(textarea.length == 0){
					textarea = $("<textarea class='text_canvas' forshape='"+shape.id+"' ind='"+i+"'></textarea>").appendTo(shapeContainer);
					textarea.bind("focus", function(){
						$(this).blur();
					});
				}
				textarea.attr("readonly", "readonly");
				if(!textBlock.text || textBlock.text.trim() == ""){
					textarea.css({
						height: "0px",
						width: "0px"
					}).hide();
					continue;
				}
				var fontStyle = $.extend({}, shape.fontStyle, textBlock.fontStyle);
				var style = {
					"line-height": Math.round(fontStyle.size * 1.25) + "px",
					"font-size": fontStyle.size + "px",
					"font-family": fontStyle.fontFamily,
					"font-weight": fontStyle.bold ? "bold" : "normal",
					"font-style": fontStyle.italic ? "italic" : "normal",
					"text-align": fontStyle.textAlign,
					"color": "rgb(" + fontStyle.color + ")",
					"text-decoration": fontStyle.underline ? "underline" : "none",
					"opacity": shape.shapeStyle.alpha
				};
				textarea.css(style);
				//设置位置
				textarea.show();
				var pos = textBlock.position;
				//计算文本内容的高度
				if(fontStyle.orientation == "horizontal"){
					//如果水平显示文本，做一次宽高颠倒，实质上是逆时针旋转45度
					var blockCenter = {
						x: pos.x + pos.w/2,
						y: pos.y + pos.h/2
					};
					pos = {
						x: blockCenter.x - pos.h/2,
						y: blockCenter.y - pos.w/2,
						w: pos.h,
						h: pos.w
					};
				}
				textarea.css({width: pos.w});
				//得到文本的高度
				textarea.height(0);
				textarea.val(textBlock.text);
				textarea.scrollTop(99999);
				var textH = textarea.scrollTop();
				var top = 0;
				if(fontStyle.vAlign == "middle"){
					top = (pos.y + pos.h/2 - textH/2);
				}else if(shape.fontStyle.vAlign == "bottom"){
					top = (pos.y + pos.h - textH);
				}else{
					top = pos.y;
				}
				var textCenter = {
					x: pos.x + pos.w/2,
					y: top + textH/2
				};
				var textAngle = shape.props.angle;
				if(textAngle != 0){
					var center = {x: shape.props.w/2, y: shape.props.h/2};
					textCenter = Utils.getRotated(center, textCenter, textAngle);
				}
				if(fontStyle.orientation == "horizontal"){
					textAngle = (Math.PI * 1.5 + textAngle) % (Math.PI * 2);
				}
				var deg = Math.round(textAngle / (Math.PI*2) * 360);
				var degStr = "rotate(" + deg + "deg) scale("+Designer.config.scale+")";
				var tWidth = pos.w;
				var tHeight = textH;
				textarea.css({
					width: tWidth,
					height: tHeight,
					left: (textCenter.x + (shape.props.x - shapeBox.x) + 10).toScale() - pos.w/2,
					top: (textCenter.y + (shape.props.y - shapeBox.y) + 10).toScale() - textH/2,
					"-webkit-transform": degStr,
					"-ms-transform": degStr,
					"-o-transform": degStr,
					"-moz-transform": degStr,
					"transform": degStr
				});
			}
		},
		/**
		 * 计算文本有多少行
		 * @param {} text
		 */
		calculateTextLines: function(text, textBlock, ctx){
			//先以\n划分段落
			var w = textBlock.w;
			var h = textBlock.h;
			var lines = [];
			var paragraphs = text.split(/\n/);
			for(var i = 0; i < paragraphs.length; i++){
				var p = paragraphs[i];
				var metric = ctx.measureText(p);
				if(metric.width <= w){
					//如果一个段落一行可以显示
					lines.push(p);
				}else{
					//如果一个段落一行不可以显示，以空格划分，并换行
					var words = p.split(/\s/);
					var line = "";
					for(var j = 0; j < words.length; j++){
						var word = words[j];
						if(j != words.length - 1){
							word += " ";
						}
						//如果一个词一行会超出，则强制换行
						var wordWidth = ctx.measureText(word).width;
						if(wordWidth > w){
							for(var wi = 0; wi < word.length; wi++){
								var testLine = line + word[wi];
								var testWidth = ctx.measureText(testLine).width;
								//如果内容超过了，就计算下一行
								if(testWidth > w){
									lines.push(line);
									line = word[wi];
								}else{
									line = testLine;
								}
							}
						}else{
							var testLine = line + word;
							var testWidth = ctx.measureText(testLine).width;
							//如果内容超过了，就计算下一行
							if(testWidth > w){
								lines.push(line);
								line = word;
							}else{
								line = testLine;
							}
						}
					}
					if(line != ""){
						lines.push(line);
					}
				}
			}
			return lines;
		},
		/**
		 * 绘制图形上的Marker
		 * @param {} ctx
		 * @param {} shape
		 */
		renderMarkers: function(ctx, shape, isPanelIcon){
			if(shape.attribute && shape.attribute.markers && shape.attribute.markers.length > 0){
				var markers = shape.attribute.markers;
				var size = Schema.config.markerSize;
				var spacing = 4;
				if(isPanelIcon){
					size = 10;
				}
				var offset = shape.attribute.markerOffset;
				if(isPanelIcon){
					offset = 5;
				}
				//绘制Marker的开始x坐标
				var markersWidth = markers.length * size + (markers.length - 1) * spacing;
				var x = shape.props.w / 2 - markersWidth / 2;
				for (var i = 0; i < markers.length; i++) {
					var markerName = markers[i];
					ctx.save();
					ctx.translate(x, shape.props.h - size - offset);
					var markerPaths = Schema.markers[markerName].call(shape, size);
					this.renderPath(ctx, shape, markerPaths);
					ctx.restore();
					x += size + spacing;
				}
			}
		},
		/**
		 * 绘制图形的数据属性
		 */
		renderDataAttributes: function(shape, shapeBox){
			$("#" + shape.id).children(".attr_canvas").remove();
			if(!shape.dataAttributes || shape.dataAttributes.length == 0){
				return;
			}
			var shapeCenter = {
				x: shape.props.w/2,
				y: shape.props.h/2
			};
			for (var i = 0; i < shape.dataAttributes.length; i++) {
				var attr = shape.dataAttributes[i];
				if(attr.showType == "none"){
					continue;
				}
				var text = "";
				var icon = "";
				if(attr.showName){
					text = attr.name + ": ";
				}
				if(attr.showType == "text"){
					text += attr.value;
				}else if(attr.showType == "icon"){
					icon = attr.icon;
				}
				if(text == "" && icon == ""){
					continue;
				}
				renderAttribute(attr, text, icon);
			}
			function renderAttribute(attr, text, icon){
				var horizontal = attr.horizontal;
				var vertical = attr.vertical;
				var canvas = $("<canvas id='attr_canvas_"+attr.id+"' class='attr_canvas'></canvas>").appendTo($("#" + shape.id));
				var ctx = canvas[0].getContext("2d");
				var font = "12px ";
				font += shape.fontStyle.fontFamily;
				ctx.font = font;
				var w = ctx.measureText(text).width;
				var h = 20;
				if(icon != ""){
					w += 20;
				}
				var x, y;
				//给x坐标加上2像素的偏移量，离线条有2像素的间隙
				if(horizontal == "mostleft"){
					x = -w - 2;
				}else if(horizontal == "leftedge"){
					x = -w / 2;
				}else if(horizontal == "left"){
					x = 2;
				}else if(horizontal == "center"){
					x = (shape.props.w - w)/2;
				}else if(horizontal == "right"){
					x = shape.props.w - w - 2;
				}else if(horizontal == "rightedge"){
					x = shape.props.w - w/2;
				}else{
					x = shape.props.w + 2;
				}
				if(vertical == "mosttop"){
					y = -h;
				}else if(vertical == "topedge"){
					y = -h / 2;
				}else if(vertical == "top"){
					y = 0;
				}else if(vertical == "middle"){
					y = (shape.props.h - h)/2;
				}else if(vertical == "bottom"){
					y = shape.props.h - h;
				}else if(vertical == "bottomedge"){
					y = shape.props.h - h/2;
				}else{
					y = shape.props.h;
				}
				//文本的坐标信息
				var textBox = {
					x: x,
					y: y,
					w: w,
					h: h
				};
				//旋转后的坐标信息
				var rotated = Utils.getRotatedBox(textBox, shape.props.angle, shapeCenter);
				canvas.attr({
					width: rotated.w.toScale(), height: rotated.h.toScale()
				});
				ctx.font = font;
				//相对于图形容器的坐标，因为之前的坐标都是相对于图形的，所以要加上图形与图形容器的偏移量
				var relativeX = (rotated.x+(shape.props.x - shapeBox.x)+10).toScale();
				var relativeY = (rotated.y+(shape.props.y - shapeBox.y)+10).toScale();
				canvas.css({
					left: relativeX, top: relativeY
				});
				ctx.scale(Designer.config.scale, Designer.config.scale);
				//围绕画布中心做旋转
				ctx.translate(rotated.w/2, rotated.h/2);
				ctx.rotate(shape.props.angle);
				ctx.translate(-rotated.w/2, -rotated.h/2);
				ctx.translate((rotated.w - textBox.w)/2, (rotated.h - textBox.h)/2);
				ctx.globalAlpha = shape.shapeStyle.alpha;
				if(attr.type == "link"){
					ctx.fillStyle = "#4183C4";
				}else{
					ctx.fillStyle = "#333";
				}
				ctx.textBaseline = "middle";
				ctx.fillText(text, 0, h/2);
				if(icon != ""){
					var location = "/images/data-attr/"+icon+".png";
					var image = $(".shape_img[src='" + location + "']");
					if(image.length == 0){
						image = $("<img class='shape_img' loaded='false' src='"+location+"'/>").appendTo("#shape_img_container");
					}
					if(image.attr("loaded") == "true"){
						//如果图片没加载完，不执行重绘
						ctx.drawImage(image[0], textBox.w-20 ,0, 20, 20);
					}else{
						image.bind("load.drawshape", function(){
							//如果图片没加载完，需要在图片加载完后，回调
							$(this).attr("loaded", "true");
							ctx.drawImage(image[0], textBox.w-20 ,0, 20, 20);
						});
					}
				}
				ctx.beginPath();
				ctx.rect(0, 0, w, h);
				ctx.closePath();
			}
		},
		/**
		 * 绘制连接线
		 * @param {} linker 连接线对象
		 */
		renderLinker: function(linker, pointChanged){
			if(pointChanged){
				//如果渲染时，连接线的点发成了改变，重新查找
				linker.points = Utils.getLinkerPoints(linker);
			}
			//重新获取一下points，有些错误图形可能没有points
			if(linker.linkerType == "curve" || linker.linkerType == "broken"){
				if(!linker.points || linker.points.length == 0){
					linker.points = Utils.getLinkerPoints(linker);
				}
			}
			//找到连接线上的点
			var points = linker.points;
			var from = linker.from;
			var to = linker.to;
			//先决定矩形容器的坐标、宽高信息
			var minX = to.x;
			var minY = to.y;
			var maxX = from.x;
			var maxY = from.y;
			if(to.x < from.x){
				minX = to.x;
				maxX = from.x;
			}else{
				minX = from.x;;
				maxX = to.x;
			}
			if(to.y < from.y){
				minY = to.y;
				maxY = from.y;
			}else{
				minY = from.y;;
				maxY = to.y;
			}
			for(var i = 0; i < points.length; i++){
				var point = points[i];
				if(point.x < minX){
					minX = point.x;
				}else if(point.x > maxX){
					maxX = point.x;
				}
				if(point.y < minY){
					minY = point.y;
				}else if(point.y > maxY){
					maxY = point.y;
				}
			}
			var box = {
				x: minX,
				y: minY,
				w: maxX - minX,
				h: maxY - minY
			}
			var linkerBox = $("#" + linker.id);
			if(linkerBox.length == 0){
				//如果不存在，要执行创建
				var superCanvas = $("#designer_canvas");
				linkerBox = $("<div id='"+linker.id+"' class='shape_box linker_box'><canvas class='shape_canvas'></canvas></div>").appendTo(superCanvas);
			}
			var linkerCanvas = linkerBox.find(".shape_canvas");
			linkerCanvas.attr({
				width: (box.w + 20).toScale(),
				height: (box.h + 20).toScale()
			});
			linkerBox.css({
				left: (box.x - 10).toScale(),
				top: (box.y - 10).toScale(),
				width: (box.w + 20).toScale(),
				height: (box.h + 20).toScale()
			});
			//执行绘制连线
			var ctx = linkerCanvas[0].getContext("2d");
			ctx.scale(Designer.config.scale, Designer.config.scale);
			ctx.translate(10, 10);
			//定义绘制样式
			var style = linker.lineStyle;
			ctx.lineWidth = style.lineWidth;
			ctx.strokeStyle = "rgb("+style.lineColor+")";
			ctx.fillStyle = "rgb("+style.lineColor+")";
			ctx.save();
			var begin = {x: from.x - box.x, y: from.y - box.y};
			var end = {x: to.x - box.x, y: to.y - box.y};
			ctx.save();
			//开始绘制连线
			if(style.lineStyle == "dashed"){
				//虚线
				this.setLineDash(ctx, [style.lineWidth * 8, style.lineWidth * 4]);
			}else if(style.lineStyle == "dot"){
				//点线
				this.setLineDash(ctx, [style.lineWidth, style.lineWidth * 2]);
			}else if(style.lineStyle == "dashdot"){
				//点线
				this.setLineDash(ctx, [style.lineWidth * 8, style.lineWidth * 3, style.lineWidth, style.lineWidth * 3]);
			}
			ctx.beginPath();
			ctx.moveTo(begin.x, begin.y);
			if(linker.linkerType == "curve"){
				var cp1 = points[0];
				var cp2 = points[1];
				ctx.bezierCurveTo(cp1.x - box.x, cp1.y - box.y, cp2.x - box.x, cp2.y - box.y, end.x, end.y);
			}else{
				for(var i = 0; i < points.length; i++){
					//如果是折线，会有折点
					var linkerPoint = points[i];
					ctx.lineTo(linkerPoint.x - box.x, linkerPoint.y - box.y);
				}
				ctx.lineTo(end.x, end.y);
			}
			var selected = Utils.isSelected(linker.id);
			if(selected){
				//如果是选中了，绘制阴影
				ctx.shadowBlur = 4;
				ctx.shadowColor = "#833";
				if(linker.linkerType == "curve" && Utils.getSelectedIds().length == 1){
					//连接线为曲线，并且只选中了一条
				}
			}
			ctx.stroke();
			ctx.restore(); //还原虚线样式和阴影
			//开始绘制箭头
			var fromAngle = Utils.getEndpointAngle(linker, "from");
			drawArrow(begin, fromAngle, from.id, style.beginArrowStyle, linker, from.angle);
			var toAngle = Utils.getEndpointAngle(linker, "end");
			drawArrow(end, toAngle, to.id, style.endArrowStyle, linker, to.angle);
			ctx.restore();
			//绘制文字
			this.renderLinkerText(linker);
			/**
			 * 绘制箭头
			 */
			function drawArrow(point, pointAngle, linkShapeId, style, linker, linkerAngle){
				if(style == "normal"){
					//箭头
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 5;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(leftArrowX, leftArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.stroke();
				}else if(style == "solidArrow"){
					//实心箭头
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 10;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
				}else if(style == "dashedArrow"){
					//空心箭头
					ctx.save();
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 10;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "solidCircle"){
					//实心圆
					ctx.save();
					var circleRadius = 4;
					var circleX = point.x - circleRadius * Math.cos(pointAngle);
					var circleY = point.y - circleRadius * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, false);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "dashedCircle"){
					//空心圆
					ctx.save();
					var circleRadius = 4;
					var circleX = point.x - circleRadius * Math.cos(pointAngle);
					var circleY = point.y - circleRadius * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, false);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "solidDiamond"){
					//实心菱形
					ctx.save();
					var arrowLength = 8; //箭头长度
					var arrowAngle = Math.PI / 7;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					//菱形在线上的一点的坐标
					var lineX = point.x - arrowLength * 2 * Math.cos(pointAngle);
					var lineY = point.y - arrowLength * 2 * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(lineX, lineY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "dashedDiamond"){
					//空心菱形
					ctx.save();
					var arrowLength = 8; //箭头长度
					var arrowAngle = Math.PI / 7;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					//菱形在线上的一点的坐标
					var lineX = point.x - arrowLength * 2 * Math.cos(pointAngle);
					var lineY = point.y - arrowLength * 2 * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(lineX, lineY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "cross"){
					//交叉
					var arrowW = 6; //交叉线的宽度
					var arrowL = 14;
					var offsetX = arrowW * Math.cos(Math.PI / 2 - pointAngle);
					var offsetY = arrowW * Math.sin(Math.PI / 2 - pointAngle);
					var x1 = point.x + offsetX;
					var y1 = point.y - offsetY;
					var lineX = point.x - arrowL * Math.cos(pointAngle);
					var lineY = point.y - arrowL * Math.sin(pointAngle);
					var x2 = lineX - offsetX;
					var y2 = lineY + offsetY;
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}
				if(linkShapeId && style != "solidCircle" && style != "dashedCircle"){
					var linkShape = Model.getShapeById(linkShapeId);
					if(linkShape){
						ctx.save();
						ctx.translate(point.x, point.y);
						ctx.rotate(linkerAngle);
						ctx.translate(-point.x, -point.y);
						var clearX = point.x - linkShape.lineStyle.lineWidth/2;
						var clearY = point.y - linker.lineStyle.lineWidth*1.2;
						var clearW = linker.lineStyle.lineWidth * 2;
						var clearH = linker.lineStyle.lineWidth * 1.8;
						var clearSize = 1;
						var clearingX = clearX;
						while(clearingX <= clearX + clearW){
							var clearingY = clearY;
							while(clearingY <= clearY + clearH){
								ctx.clearRect(clearingX, clearingY, 1.5, 1.5);
								clearingY += clearSize;
							}
							clearingX += clearSize;
						}
						ctx.restore();
					}
				}
			}
		},
		/**
		 * 绘制连接线的文本
		 * @param {} linker
		 */
		renderLinkerText: function(linker){
			var linkerContainer = $("#" + linker.id);
			var canvas = linkerContainer.find(".text_canvas");
			if(canvas.length == 0){
				canvas = $("<div class='text_canvas linker_text'></div>").appendTo(linkerContainer);
			}
			var fontStyle = linker.fontStyle;
			var scale = "scale("+Designer.config.scale+")";
			var style = {
				"line-height": Math.round(fontStyle.size * 1.25) + "px",
				"font-size": fontStyle.size + "px",
				"font-family": fontStyle.fontFamily,
				"font-weight": fontStyle.bold ? "bold" : "normal",
				"font-style": fontStyle.italic ? "italic" : "normal",
				"text-align": fontStyle.textAlign,
				"color": "rgb(" + fontStyle.color + ")",
				"text-decoration": fontStyle.underline ? "underline" : "none",
				"-webkit-transform": scale,
				"-ms-transform": scale,
				"-o-transform": scale,
				"-moz-transform": scale,
				"transform": scale
			};
			canvas.css(style);
			if(linker.text == null || linker.text == ""){
				canvas.hide();
				return;
			}
			//设置位置
			canvas.show();
			var text = linker.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
			canvas.html(text + "<br/>");
			var midpoint = this.getLinkerMidpoint(linker);
			var containerPos = linkerContainer.position();
			canvas.css({
				left: midpoint.x.toScale() - containerPos.left - canvas.width()/2,
				top: midpoint.y.toScale() - containerPos.top - canvas.height()/2
			});
		},
		/**
		 * 获取到连接线的中点坐标
		 * @param {} linker
		 */
		getLinkerMidpoint: function(linker){
			var point = {};
			if(linker.linkerType == "normal"){
				//直线时，根据公式：B(t) = (1-t)P0 + tP1，t=0.5时，在线中点
				point = {
					x: 0.5*linker.from.x + 0.5*linker.to.x,
					y: 0.5*linker.from.y + 0.5*linker.to.y
				}
			}else if(linker.linkerType == "curve"){
				//曲线时，根据公式：B(t) = P0(1-t)^3 + 3P1t(1-t)^2 + 3P2t^2(1-t) + P3t^3，t=0.5时，在线中点
				var p0 = linker.from;
				var p1 = linker.points[0];
				var p2 = linker.points[1];
				var p3 = linker.to;
				point = {
					x: p0.x*0.125 + p1.x*0.375 + p2.x*0.375 + p3.x*0.125,
					y: p0.y*0.125 + p1.y*0.375 + p2.y*0.375 + p3.y*0.125
				}
			}else{
				//折线时，计算每一笔的长度，找中点
				var points = [];
				points.push(linker.from);
				points = points.concat(linker.points);
				points.push(linker.to);
				//先求连接线的全长
				var totalLength = 0;
				for(var pi = 1; pi < points.length; pi++){
					var p1 = points[pi - 1];
					var p2 = points[pi];
					//计算一段的长
					var d = Utils.measureDistance(p1, p2);
					totalLength += d;
				}
				var halfLength = totalLength / 2; //连接线长度的一半
				var growLength = 0;
				for(var pi = 1; pi < points.length; pi++){
					var p1 = points[pi - 1];
					var p2 = points[pi];
					//计算一段的长
					var d = Utils.measureDistance(p1, p2);
					var temp = growLength + d;
					if(temp > halfLength){
						//如果某一段的长度大于一半了，则中点在此段上
						var t = (halfLength - growLength) / d;
						point = {
							x: (1-t)*p1.x + t*p2.x,
							y: (1-t)*p1.y + t*p2.y
						}
						break;
					}
					growLength = temp;
				}
			}
			return point;
		},
		/**
		 * 保存控件的状态
		 * @type {}
		 */
		controlStatus: {
			resizeDir: [],
			rotatable: true
		},
		/**
		 * 绘制图形控制框
		 */
		drawControls: function(shapeIds){
			var control = $("#shape_controls");
			if(control.length == 0){
				//创建控件容器
				var canvas = $("#designer_canvas");
				//如果第一次选择框不存在，进行绘制，执行绑定事件等初始化
				control = $("<div id='shape_controls'></div>").appendTo(canvas);
				//添加选择区域的画布
				control.append("<canvas id='controls_bounding'></canvas>");
				//添加上下左右四个控制点
				control.append("<div class='shape_controller' index='0' resizeDir='tl'></div>");
				control.append("<div class='shape_controller' index='1' resizeDir='tr'></div>");
				control.append("<div class='shape_controller' index='2' resizeDir='br'></div>");
				control.append("<div class='shape_controller' index='3' resizeDir='bl'></div>");
				control.append("<div class='shape_controller' resizeDir='l'></div>");
				control.append("<div class='shape_controller' resizeDir='t'></div>");
				control.append("<div class='shape_controller' resizeDir='r'></div>");
				control.append("<div class='shape_controller' resizeDir='b'></div>");
				Designer.op.shapeResizable();
				//添加旋转控制点
				control.append("<canvas class='shape_rotater' width='41px' height='40px'></canvas>");
				Designer.op.shapeRotatable();
				//分组图形切换箭头
				control.append("<div class='group_icon change_shape_icon'></div>");
				Designer.op.groupShapeChangable();
				$(".shape_controller").css({
					"border-color": Designer.config.anchorColor,
					width: Designer.config.anchorSize - 2,
					height: Designer.config.anchorSize - 2
				});
			}
			$(".shape_controller").css({
				//Z轴坐标比选择轮廓大1
				"z-index": Model.orderList.length
			});
			$(".change_shape_icon").hide();
			control.show();
			var angle = 0;
			var pos;
			var dir;
			if(shapeIds.length == 1){
				//如果只有一个图形（有一个图形时，此图形不会是连接线，在调用时都做了判断）
				var shape = Model.getShapeById(shapeIds[0]);
				pos = shape.props;
				angle = shape.props.angle;
				//只有一个图形时，根据图形配置决定缩放方向
				dir = shape.resizeDir;
				if(shape.groupName && SchemaGroup.groupExists(shape.groupName)){
					$(".change_shape_icon").show();
				}
			}else{
				pos = Utils.getControlBox(shapeIds);
				dir = ["tl", "tr", "br", "bl"];
			}
			var rotatable = true;
			for (var i = 0; i < shapeIds.length; i++) {
				var id = shapeIds[i];
				var shape = Model.getShapeById(id);
				if(shape.attribute && shape.attribute.rotatable == false){
					//如果有一个图形不允许旋转，则整体都不允许
					rotatable = false;
				}
				if((shape.resizeDir && shape.resizeDir.length == 0) || (shape.parent && shapeIds.length > 1)){
					//如果有图形不能缩放，或者如果包含子图形，不允许缩放
					dir = [];
				}
			}
			this.controlStatus.rotatable = rotatable;
			this.controlStatus.resizeDir = dir;
			this.rotateControls(pos, angle);
			return control;
		},
		/**
		 * 旋转控制器
		 * @param {} pos 控制器的坐标信息{x, y, w, h}
		 * @param {} angle 旋转角度
		 */
		rotateControls: function(pos, angle){
			var control = $("#shape_controls");
			var box = Utils.getRotatedBox(pos, angle);
			var boxW = box.w.toScale();
			var boxH = box.h.toScale();
			control.css({
				left: box.x.toScale(),
				top: box.y.toScale(),
				width: boxW,
				height: boxH,
				//Z轴坐标为当前最大
				"z-index": Model.orderList.length
			});
			var canvasW = boxW + 20;
			var canvasH = boxH + 20;
			var bounding = $("#controls_bounding");
			bounding.attr({
				width: canvasW,
				height: canvasH
			});
			var ctx = bounding[0].getContext("2d");
			ctx.lineJoin = "round";
			if(this.controlStatus.resizeDir.length == 0){
				//没有缩放点，要加粗选择器边框，以用来示意选中
				ctx.lineWidth = 2;
				ctx.strokeStyle = Designer.config.selectorColor;
				ctx.globalAlpha = 0.8;
			}else{
				ctx.lineWidth = 1;
				ctx.strokeStyle = Designer.config.selectorColor;
				ctx.globalAlpha = 0.5;
			}
			ctx.save();
			ctx.clearRect(0, 0, canvasW, canvasH);
			ctx.translate(canvasW/2, canvasH/2);
			ctx.rotate(angle);
			ctx.translate(-canvasW/2, -canvasH/2);
			ctx.translate(9.5, 9.5);
			var rect = {
				x: Math.round((pos.x - box.x).toScale()),
				y: Math.round((pos.y - box.y).toScale()),
				w: Math.floor(pos.w.toScale() + 1),
				h: Math.floor(pos.h.toScale() + 1)
			};
			ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
			ctx.restore();
			/**顺时针控制四个缩放控制点*/
			var origin = 0 - Designer.config.anchorSize / 2;
			var style = {};
			pos = Utils.toScale(pos);
			box = Utils.toScale(box);
			var selectorCenter = {
				x: (pos.x + pos.w/2), y: pos.y + pos.h/2
			};
			control.children(".shape_controller").hide(); //先全部隐藏
			for (var i = 0; i < this.controlStatus.resizeDir.length; i++) {
				var dir = this.controlStatus.resizeDir[i];
				var dirDom = $(".shape_controller[resizeDir="+dir+"]");
				dirDom.show();
				var controlX, controlY;
				if(dir.indexOf("l") >= 0){
					controlX = pos.x;
				}else if(dir.indexOf("r") >= 0){
					controlX = pos.x + pos.w;
				}else{
					controlX = pos.x + pos.w/2;
				}
				if(dir.indexOf("t") >= 0){
					controlY = pos.y;
				}else if(dir.indexOf("b") >= 0){
					controlY = pos.y + pos.h;
				}else{
					controlY = pos.y + pos.h/2;
				}
				var rotated = Utils.getRotated(selectorCenter, {x: controlX, y: controlY}, angle);
				dirDom.css({
					left: rotated.x - box.x + origin,
					top: rotated.y - box.y + origin
				});
			}
			//控制四个缩放控制点的缩放形式
			var unit = Math.PI/8;
			//根据角度判断鼠标显示形式，每45度一个范围
			control.children(".shape_controller").removeClass("s n e w");
			if(angle > unit && angle <= unit*3){
				//右上方范围内
				control.children("div[resizeDir=tl]").addClass("n");
				control.children("div[resizeDir=tr]").addClass("e");
				control.children("div[resizeDir=br]").addClass("s");
				control.children("div[resizeDir=bl]").addClass("w");
				control.children("div[resizeDir=l]").addClass("n w");
				control.children("div[resizeDir=r]").addClass("s e");
				control.children("div[resizeDir=b]").addClass("s w");
				control.children("div[resizeDir=t]").addClass("n e");
			}else if(angle > unit*3 && angle <= unit*5){
				//右方范围内
				control.children("div[resizeDir=tl]").addClass("n e");
				control.children("div[resizeDir=tr]").addClass("s e");
				control.children("div[resizeDir=br]").addClass("s w");
				control.children("div[resizeDir=bl]").addClass("n w");
				control.children("div[resizeDir=l]").addClass("n");
				control.children("div[resizeDir=r]").addClass("s");
				control.children("div[resizeDir=b]").addClass("w");
				control.children("div[resizeDir=t]").addClass("e");
			}else if(angle > unit*5 && angle <= unit*7){
				//右下方范围
				control.children("div[resizeDir=tl]").addClass("e");
				control.children("div[resizeDir=tr]").addClass("s");
				control.children("div[resizeDir=br]").addClass("w");
				control.children("div[resizeDir=bl]").addClass("n");
				control.children("div[resizeDir=l]").addClass("n e");
				control.children("div[resizeDir=r]").addClass("s w");
				control.children("div[resizeDir=b]").addClass("n w");
				control.children("div[resizeDir=t]").addClass("s e");
			}else if(angle > unit*7 && angle <= unit*9){
				//下方范围
				control.children("div[resizeDir=tl]").addClass("s e");
				control.children("div[resizeDir=tr]").addClass("s w");
				control.children("div[resizeDir=br]").addClass("n w");
				control.children("div[resizeDir=bl]").addClass("n e");
				control.children("div[resizeDir=l]").addClass("e");
				control.children("div[resizeDir=r]").addClass("w");
				control.children("div[resizeDir=b]").addClass("n");
				control.children("div[resizeDir=t]").addClass("s");
			}else if(angle > unit*9 && angle <= unit*11){
				//左下方范围
				control.children("div[resizeDir=tl]").addClass("s");
				control.children("div[resizeDir=tr]").addClass("w");
				control.children("div[resizeDir=br]").addClass("n");
				control.children("div[resizeDir=bl]").addClass("e");
				control.children("div[resizeDir=l]").addClass("s e");
				control.children("div[resizeDir=r]").addClass("n w");
				control.children("div[resizeDir=b]").addClass("n e");
				control.children("div[resizeDir=t]").addClass("s w");
			}else if(angle > unit*11 && angle <= unit*13){
				//左方范围
				control.children("div[resizeDir=tl]").addClass("s w");
				control.children("div[resizeDir=tr]").addClass("n w");
				control.children("div[resizeDir=br]").addClass("n e");
				control.children("div[resizeDir=bl]").addClass("s e");
				control.children("div[resizeDir=l]").addClass("s");
				control.children("div[resizeDir=r]").addClass("n");
				control.children("div[resizeDir=b]").addClass("e");
				control.children("div[resizeDir=t]").addClass("w");
			}else if(angle > unit*13 && angle <= unit*15){
				//左上方范围
				control.children("div[resizeDir=tl]").addClass("w");
				control.children("div[resizeDir=tr]").addClass("n");
				control.children("div[resizeDir=br]").addClass("e");
				control.children("div[resizeDir=bl]").addClass("s");
				control.children("div[resizeDir=l]").addClass("s w");
				control.children("div[resizeDir=r]").addClass("n e");
				control.children("div[resizeDir=b]").addClass("s e");
				control.children("div[resizeDir=t]").addClass("n w");
			}else{
				control.children("div[resizeDir=tl]").addClass("n w");
				control.children("div[resizeDir=tr]").addClass("n e");
				control.children("div[resizeDir=br]").addClass("s e");
				control.children("div[resizeDir=bl]").addClass("s w");
				control.children("div[resizeDir=l]").addClass("w");
				control.children("div[resizeDir=r]").addClass("e");
				control.children("div[resizeDir=b]").addClass("s");
				control.children("div[resizeDir=t]").addClass("n");
			}
			/**设置旋转点*/
			if(this.controlStatus.rotatable){
				var rotater = control.find(".shape_rotater");
				rotater.show();
				//计算旋转点的坐标
				var rotaterCenter = {
					x: pos.x + pos.w/2, y: pos.y - 20
				};
				//得到按一定角度旋转后的中心坐标
				var rotatedCenter = Utils.getRotated(selectorCenter, rotaterCenter, angle);
				//设置坐标，相对于容器
				rotater.css({
					top: rotatedCenter.y - 20 - box.y,
					left: rotatedCenter.x - 20.5 - box.x
				});
				var rotaterCtx = rotater[0].getContext("2d");
				rotaterCtx.lineWidth = 1;
				rotaterCtx.strokeStyle = Designer.config.selectorColor;
				rotaterCtx.fillStyle = "white";
				rotaterCtx.save();
				rotaterCtx.clearRect(0, 0, 41, 40);
				//旋转
				rotaterCtx.translate(20.5, 20);
				rotaterCtx.rotate(angle);
				rotaterCtx.translate(-20.5, -20);
				rotaterCtx.beginPath();
				rotaterCtx.moveTo(20.5, 20);
				rotaterCtx.lineTo(20.5, 40);
				rotaterCtx.stroke();
				rotaterCtx.beginPath();
				rotaterCtx.arc(20.5, 20, Designer.config.rotaterSize/2, 0, Math.PI*2);
				rotaterCtx.closePath();
				rotaterCtx.fill();
				rotaterCtx.stroke();
				rotaterCtx.restore();
			}else{
				control.find(".shape_rotater").hide();
			}
		}
	}
};



/**
 * 给数值类型扩展
 */
Number.prototype.toScale = function(){
	//把数值按缩放比例计算
	return this * Designer.config.scale;
};

Number.prototype.restoreScale = function(){
	//把数值按缩放比例恢复
	return this / Designer.config.scale;
};

