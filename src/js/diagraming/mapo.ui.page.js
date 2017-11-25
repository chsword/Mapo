/**
* 用户界面JS
*/

var UI = {
	init: function () {
		//修改标题
		$(".diagram_title").bind("click", function () {
			if ($(this).hasClass("readonly")) {
				return;
			}
			var title = $(this).text();
			$(this).hide();
			$("#title_container").append("<input type='text'/>");
			$("#title_container").children("input").val(title).select();
			$("#title_container").children("input").bind("blur", function () {
				changeTitle();
			}).bind("keydown", function (e) {
				if (e.keyCode == 13) {
					changeTitle();
				}
			});
		});
		function changeTitle() {
			var newTitle = $.trim($("#title_container").children("input").val());
			var oldTitle = $(".diagram_title").text();
			if (newTitle != oldTitle && chartId != "") {
				var msgObj = {
					action: "changeTitle",
					title: newTitle
				};
				CLB.send(msgObj);
			}
			var title = newTitle != "" ? newTitle : oldTitle;
			$("title").text(title + " - ProcessOn");
			$(".diagram_title").text(title).show();
			$("#title_container").children("input").remove();
		}
		/** ############################Toolbar列表############################ */
		//撤销
		$("#bar_undo").button({
			onClick: function () {
				MessageSource.undo();
			}
		});
		//恢复
		$("#bar_redo").button({
			onClick: function () {
				MessageSource.redo();
			}
		});
		//格式刷
		$("#bar_brush").button({
			onClick: function () {
				if ($("#bar_brush").button().isSelected()) {
					//取消格式刷
					$("#bar_brush").button().unselect();
					$("#designer_op_help").hide();
					$(document).unbind("keydown.cancelbrush");
					Utils.selectCallback = null;
				} else {
					Designer.clipboard.brush();
				}
			}
		});
		//字体
		$("#bar_font_family").button({
			onMousedown: function () {
				$("#font_list").dropdown({
					target: $("#bar_font_family"),
					onSelect: function (item) {
						var font = item.text();
						Designer.setFontStyle({ fontFamily: font });
						$("#bar_font_family").button().setText( font);
					}
				});
				//选中
				var family = $("#bar_font_family").text().trim();
				$("#font_list").children().each(function () {
					if ($(this).text() == family) {
						$("#font_list").dropdown("select", $(this));
						return false;
					}
				});
			}
		});
		//字号
		$("#bar_font_size").spinner({
			min: 12,
			max: 100,
			step: 1,
			unit: "px",
			onChange: function (val) {
				Designer.setFontStyle({ size: val });
			}
		});
		$("#bar_font_size").spinner("setValue", "13px");
		//加粗
		$("#bar_font_bold").button({
			onClick: function () {
				var bold = !$("#bar_font_bold").button().isSelected();
				Designer.setFontStyle({ bold: bold });
				$("#bar_font_bold").toggleClass("selected");
			}
		});
		//斜体
		$("#bar_font_italic").button({
			onClick: function () {
				var italic = !$("#bar_font_italic").button().isSelected();
				Designer.setFontStyle({ italic: italic });
				$("#bar_font_italic").toggleClass("selected");
			}
		});
		//下划线
		$("#bar_font_underline").button({
			onClick: function () {
				var underline = !$("#bar_font_underline").button().isSelected();
				Designer.setFontStyle({ underline: underline });
				$("#bar_font_underline").toggleClass("selected");
			}
		});
		//字体颜色
		$("#bar_font_color").button({
			onMousedown: function () {
				var color = $("#bar_font_color").button().getColor();
				$.colorpicker({
					target: $("#bar_font_color"),
					onSelect: function (color) {
						Designer.setFontStyle({ color: color });
						$("#bar_font_color").button().setColor( color)
					},
					color: color
				});
			}
		});
		//文本对齐
		$("#bar_font_align").button({
			onMousedown: function () {
				$("#font_align_list").dropdown({
					target: $("#bar_font_align"),
					onSelect: function (item) {
						var align = {};
						align[item.attr("cate")] = item.attr("al");
						Designer.setFontStyle(align);
					}
				});
			}
		});
		//填充
		$("#bar_fill").button({
			onMousedown: function () {
				var color = $("#bar_fill").button().getColor();
				$.colorpicker({
					target: $("#bar_fill"),
					onSelect: function (color) {
						Designer.setFillStyle({ type: "solid", color: color });
						$("#bar_fill").button().setColor( color)
					},
					color: color,
					extend: "<div id='bar_fill_gradient' title='渐变' class='toolbar_button active'><div class='ico gradient'></div></div><div id='bar_fill_img' title='图片...' class='toolbar_button active'><div class='ico ico_img'></div></div><div id='bar_fill_more' class='toolbar_button active'>More...</div>"
				});
				$("#bar_fill_gradient").unbind().bind("click", function () {
					Designer.setFillStyle({ type: "gradient" });
					$("#color_picker").dropdown("close");
				});
				$("#bar_fill_img").unbind().bind("click", function () {
					UI.showImageSelect(function (fileId, w, h) {
						Designer.setFillStyle({
							type: "image",
							fileId: fileId,
							imageW: w,
							imageH: h
						});
					});
					$("#color_picker").dropdown("close");
				});
				$("#bar_fill_more").unbind().bind("click", function () {
					Dock.showView("graphic");
					$("#color_picker").dropdown("close");
				});
			}
		});
		//线条颜色
		$("#bar_line_color").button({
			onMousedown: function () {
				var color = $("#bar_line_color").button().getColor();
				$.colorpicker({
					target: $("#bar_line_color"),
					onSelect: function (color) {
						Designer.setLineStyle({ lineColor: color });
						$("#bar_line_color").button().setColor( color)
					},
					color: color
				});
			}
		});
		//线条宽度
		$("#bar_line_width").button({
			onMousedown: function () {
				$("#line_width_list").dropdown({
					target: $("#bar_line_width"),
					onSelect: function (item) {
						var width = parseInt(item.text());
						Designer.setLineStyle({ lineWidth: width });
					}
				});
				//选中
				var width = Utils.getSelected()[0].lineStyle.lineWidth;
				$("#line_width_list").children().each(function () {
					if (parseInt($(this).text()) == width) {
						$("#line_width_list").dropdown("select", $(this));
					}
				});
			}
		});
		//线条样式
		$("#bar_line_style").button({
			onMousedown: function () {
				$("#line_style_list").dropdown({
					target: $("#bar_line_style"),
					onSelect: function (item) {
						var lineStyle = item.attr("line");
						Designer.setLineStyle({ lineStyle: lineStyle });
					}
				});
				//选中
				var style = Utils.getSelected()[0].lineStyle.lineStyle;
				var item = $("#line_style_list").children("li[line=" + style + "]");
				$("#line_style_list").dropdown("select", item);
			}
		});
		//连接线类型
		$("#bar_linkertype").button({
			onMousedown: function () {
				$("#line_type_list").dropdown({
					target: $("#bar_linkertype"),
					onSelect: function (item) {
						var type = item.attr("tp");
						Designer.setLinkerType(type);
						var cls = item.children("div").attr("class");
						$("#bar_linkertype").children("div:eq(0)").attr("class", cls);
					}
				});
			}
		});
		//开始箭头
		$("#bar_beginarrow").button({
			onMousedown: function () {
				$("#beginarrow_list").dropdown({
					target: $("#bar_beginarrow"),
					onSelect: function (item) {
						var arrow = item.attr("arrow");
						Designer.setLineStyle({ beginArrowStyle: arrow });
						var cls = item.children("div").attr("class");
						$("#bar_beginarrow").children("div:eq(0)").attr("class", cls);
					}
				});
				//选中
				var style = Utils.getSelectedLinkers()[0].lineStyle.beginArrowStyle;
				var item = $("#beginarrow_list").children("li[arrow=" + style + "]");
				$("#beginarrow_list").dropdown("select", item);
			}
		});
		//结束箭头
		$("#bar_endarrow").button({
			onMousedown: function () {
				$("#endarrow_list").dropdown({
					target: $("#bar_endarrow"),
					onSelect: function (item) {
						var arrow = item.attr("arrow");
						Designer.setLineStyle({ endArrowStyle: arrow });
						var cls = item.children("div").attr("class");
						$("#bar_endarrow").children("div:eq(0)").attr("class", cls);
					}
				});
				//选中
				var style = Utils.getSelectedLinkers()[0].lineStyle.endArrowStyle;
				var item = $("#endarrow_list").children("li[arrow=" + style + "]");
				$("#endarrow_list").dropdown("select", item);
			}
		});
		//顶层底层
		$("#bar_front").button({
			onClick: function () {
				Designer.layerShapes("front");
			}
		});
		$("#bar_back").button({
			onClick: function () {
				Designer.layerShapes("back");
			}
		});
		//加解锁
		$("#bar_lock").button({
			onClick: function () {
				Designer.lockShapes();
			}
		});
		$("#bar_unlock").button({
			onClick: function () {
				Designer.unlockShapes();
			}
		});
		$("#bar_link").button({
			onClick: function () {
				UI.showInsertLink();
			}
		});
		$("#bar_collapse").button({
			onClick: function () {
				UI.toogleTitleBar();
			}
		});
		/** ##############菜单列表############## */
		$("#menu_bar").children().bind("mousedown", function (e) {
			var tar = $(this);
			showMenuBarList(tar);
			e.stopPropagation();
		});
		$("#menu_bar").children().bind("mouseenter", function () {
			var tar = $(this);
			if ($("#ui_container").find(".options_menu:visible").length > 0) {
				showMenuBarList(tar);
			}
		});

		function showMenuBarList(menuBar) {
			var menuId = menuBar.attr("menu");
			//只读
			if (menuBar.hasClass("readonly")) {
				return;
			}
			$("#" + menuId).dropdown({
				target: menuBar,
				onSelect: function (item) {
					menuSelected(item);
				}
			});
			if (menuId == "bar_list_page") {
				var item = $("#bar_list_pagesize").children("li[w=" + Model.define.page.width + "][h=" + Model.define.page.height + "]");
				if (item.length > 0) {
					$("#bar_list_pagesize").dropdown("select", item);
				} else {
					$("#bar_list_pagesize").dropdown("select", $("#page_size_custom"));
				}
				$("#page_size_w").spinner("setValue", Model.define.page.width + "px");
				$("#page_size_h").spinner("setValue", Model.define.page.height + "px");
				item = $("#bar_list_padding").children("li[p=" + Model.define.page.padding + "]");
				$("#bar_list_padding").dropdown("select", item);
				item = $("#bar_list_gridsize").children("li[s=" + Model.define.page.gridSize + "]");
				$("#bar_list_gridsize").dropdown("select", item);
				if (Model.define.page.showGrid) {
					$("#bar_list_page").dropdown("select", $("#bar_list_page").children("li[ac=set_page_showgrid]"));
				} else {
					$("#bar_list_page").dropdown("unselect", $("#bar_list_page").children("li[ac=set_page_showgrid]"));
				}
			} else if (menuId == "bar_list_view") {
				var item = $("#bar_list_view").children(".static[zoom='" + Designer.config.scale + "']");
				if (item.length) {
					$("#bar_list_page").dropdown("select", item);
				}
			}
		}

		function menuSelected(item) {
			var action = item.attr("ac");
			//编辑菜单
			if (action == "rename") {
				$(".diagram_title").trigger("click");
			} else if (action == "close") {
				window.location.href = "/diagraming/back?id=" + chartId;
			} else if (action == "saveAs") {
				UI.showSaveAs();
			} else if (action == "export") {
				$("#export_dialog").dlg();
			} else if (action == "undo") {
				MessageSource.undo();
			} else if (action == "redo") {
				MessageSource.redo();
			} else if (action == "cut") {
				Designer.clipboard.cut();
			} else if (action == "copy") {
				Designer.clipboard.copy();
			} else if (action == "paste") {
				Designer.clipboard.paste();
			} else if (action == "duplicate") {
				Designer.clipboard.duplicate();
			} else if (action == "brush") {
				Designer.clipboard.brush();
			} else if (action == "selectall") {
				Designer.selectAll();
			} else if (action == "delete") {
				Designer.op.removeShape();
				//视图缩放
			} else if (action == "zoom") {
				var zoom = item.attr("zoom");
				if (zoom == "in") {
					Designer.zoomIn();
				} else if (zoom == "out") {
					Designer.zoomOut();
				} else {
					var zoomScale = parseFloat(zoom);
					Designer.setZoomScale(zoomScale);
				}
				//插入
			} else if (action == "insert") {
				var insertType = item.attr("in");
				if (insertType == "text") {
					Designer.op.changeState("creating_free_text");
				} else if (insertType == "image") {
					UI.showImageSelect(function (fileId, w, h) {
						UI.insertImage(fileId, w, h);
					});
				} else if (insertType == "line") {
					Designer.op.changeState("creating_free_linker");
				}
				//页面
			} else if (action == "set_page_size") {
				var w = parseInt(item.attr("w"));
				var h = parseInt(item.attr("h"));
				Designer.setPageStyle({ width: w, height: h });
			} else if (action == "set_page_padding") {
				var p = parseInt(item.attr("p"));
				Designer.setPageStyle({ padding: p })
			} else if (action == "set_page_showgrid") {
				if (item.menuitem("isSelected")) {
					item.menuitem("unselect");
					Designer.setPageStyle({ showGrid: false });
				} else {
					item.menuitem("select");
					Designer.setPageStyle({ showGrid: true });
				}
			} else if (action == "set_page_gridsize") {
				var s = parseInt(item.attr("s"));
				Designer.setPageStyle({ gridSize: s })
			}
			//排列
			else if (action == "front") {
				Designer.layerShapes("front");
			} else if (action == "back") {
				Designer.layerShapes("back");
			} else if (action == "forward") {
				Designer.layerShapes("forward");
			} else if (action == "backward") {
				Designer.layerShapes("backward");
			} else if (action == "align_shape") {
				var align = item.attr("al");
				Designer.alignShapes(align);
			} else if (action == "distribute_shape") {
				var type = item.attr("dis");
				Designer.distributeShapes(type);
			} else if (action == "match_size") {
				if (item.attr("custom")) {
					Dock.showView("metric");
				} else {
					var type = {};
					var w = item.attr("w");
					var h = item.attr("h");
					if (w) {
						type.w = w;
					}
					if (h) {
						type.h = h;
					}
					Designer.matchSize(type);
				}
			} else if (action == "lock") {
				Designer.lockShapes();
			} else if (action == "unlock") {
				Designer.unlockShapes();
			} else if (action == "group") {
				Designer.group();
			} else if (action == "ungroup") {
				Designer.ungroup();
			} else if (action == "hotkey") {
				UI.showHotKey();
			} else if (action == "feedback") {
				UI.showFeedBack();
			} else if (action == "getting_started") {
				UI.gettingStart();
			}
		}
		$("#page_size_w").spinner({
			min: 200,
			unit: "px",
			step: 100,
			onChange: function (val) {
				Designer.setPageStyle({ width: val });
			}
		});
		$("#page_size_h").spinner({
			min: 200,
			unit: "px",
			step: 100,
			onChange: function (val) {
				Designer.setPageStyle({ height: val });
			}
		});
		//给设置页面背景色，放一个colorpicker
		var pickerHtml = $("#color_picker").html();
		var newPicker = $("<div class='menu color_picker extend_menu'>" + pickerHtml + "</div>").appendTo($("#bar_page_color"));
		newPicker.css("right", "-179px");
		newPicker.children(".color_items").children("div").unbind().bind("click", function () {
			var color = $(this).css("background-color");
			color = color.replace(/\s/g, "");
			color = color.substring(4, color.length - 1);
			Designer.setPageStyle({ backgroundColor: color });
			$("#bar_list_page").dropdown("close");
		});
		//抛出事件，控制状态
		Designer.events.push("selectChanged", 0);
		Designer.events.push("clipboardChanged", 0);
		Designer.events.push("undoStackChanged", 0);
		Designer.events.push("redoStackChanged", 0);
	},
	/**
	 * 更新UI
	 */
	update: function () {
		var selectedIds = Utils.getSelectedIds();
		var count = selectedIds.length;
		var linkerIds = Utils.getSelectedLinkerIds();
		var linkerCount = linkerIds.length;
		var shapeIds = Utils.getSelectedShapeIds();
		var shapeCount = shapeIds.length;
		var lockedCount = Utils.getSelectedLockedIds().length;
		var groupCount = Utils.getSelectedGroups().length;
		//排列菜单
		var arrangeMenu = $("#bar_list_arrange");
		if (count == 0) {
			$(".toolbar").find(".selected").removeClass("selected");
			//没有选中，让某些按钮失效
			if ($("#designer_op_help").is(":visible")) {
				$("#bar_brush").button().enable();
				$("#bar_brush").button().select();
			} else {
				$("#bar_brush").button().disable();
			}
			//字体
			$("#bar_font_family").button().disable();
			$("#bar_font_size").button().disable();
			$("#bar_font_bold").button().disable();
			$("#bar_font_italic").button().disable();
			$("#bar_font_underline").button().disable();
			$("#bar_font_color").button().disable();
			$("#bar_font_align").button().disable();
			//线条
			$("#bar_line_color").button().disable();
			$("#bar_line_width").button().disable();
			$("#bar_line_style").button().disable();
			//顶层底层
			$("#bar_front").button().disable();
			$("#bar_back").button().disable();
			//锁定
			$("#bar_lock").button().disable();
			//编辑菜单
			var editMenu = $("#bar_list_edit");
			editMenu.children("li[ac=cut]").menuitem("disable");
			editMenu.children("li[ac=copy]").menuitem("disable");
			editMenu.children("li[ac=duplicate]").menuitem("disable");
			editMenu.children("li[ac=brush]").menuitem("disable");
			editMenu.children("li[ac=delete]").menuitem("disable");
			//排列菜单
			arrangeMenu.children("li[ac=front]").menuitem("disable");
			arrangeMenu.children("li[ac=back]").menuitem("disable");
			arrangeMenu.children("li[ac=forward]").menuitem("disable");
			arrangeMenu.children("li[ac=backward]").menuitem("disable");
			arrangeMenu.children("li[ac=lock]").menuitem("disable");
		} else {
			//选中，让某些按钮激活
			$("#bar_brush").button().enable();
			if ($("#designer_op_help").is(":visible")) {
				$("#bar_brush").button().select();
			}
			$("#bar_font_family").button().enable();
			$("#bar_font_size").button().enable();
			$("#bar_font_bold").button().enable();
			$("#bar_font_italic").button().enable();
			$("#bar_font_underline").button().enable();
			$("#bar_font_color").button().enable();
			$("#bar_font_align").button().enable();
			//线条
			$("#bar_line_color").button().enable();
			$("#bar_line_width").button().enable();
			$("#bar_line_style").button().enable();
			//顶层底层
			$("#bar_front").button().enable();
			$("#bar_back").button().enable();
			//锁定
			$("#bar_lock").button().enable();
			//编辑菜单
			var editMenu = $("#bar_list_edit");
			editMenu.children("li[ac=cut]").menuitem("enable");
			editMenu.children("li[ac=copy]").menuitem("enable");
			editMenu.children("li[ac=duplicate]").menuitem("enable");
			editMenu.children("li[ac=brush]").menuitem("enable");
			editMenu.children("li[ac=delete]").menuitem("enable");
			//排列菜单
			arrangeMenu.children("li[ac=front]").menuitem("enable");
			arrangeMenu.children("li[ac=back]").menuitem("enable");
			arrangeMenu.children("li[ac=forward]").menuitem("enable");
			arrangeMenu.children("li[ac=backward]").menuitem("enable");
			arrangeMenu.children("li[ac=lock]").menuitem("enable");
			//设置Toolbar样式
			var shape = Model.getShapeById(selectedIds[0]);
			$("#bar_font_family").button().setText( shape.fontStyle.fontFamily);
			$("#bar_font_size").spinner("setValue", shape.fontStyle.size + "px");
			if (shape.fontStyle.bold) {
				$("#bar_font_bold").button().select();
			} else {
				$("#bar_font_bold").button().unselect();
			}
			if (shape.fontStyle.italic) {
				$("#bar_font_italic").button().select();
			} else {
				$("#bar_font_italic").button().unselect();
			}
			if (shape.fontStyle.underline) {
				$("#bar_font_underline").button().select();
			} else {
				$("#bar_font_underline").button().unselect();
			}
			$("#bar_font_color").button().setColor( shape.fontStyle.color);
			$("#bar_line_color").button().setColor( shape.lineStyle.lineColor);
		}
		//通过图形的数量，判读是否可以填充
		if (shapeCount == 0) {
			$("#bar_fill").button().disable();
		} else {
			$("#bar_fill").button().enable();
			var shape = Model.getShapeById(shapeIds[0]);
			//图形填充
			if (shape.fillStyle.type == "solid") {
				$("#bar_fill").button().setColor( shape.fillStyle.color);
			} else if (shape.fillStyle.type == "gradient") {
				$("#bar_fill").button().setColor( shape.fillStyle.endColor);
			}
		}
		if (shapeCount != 1) {
			$("#bar_link").button().disable();
		} else {
			$("#bar_link").button().enable();
		}
		//通过连接线的数量，判断是否可以修改箭头等
		if (linkerCount == 0) {
			$("#bar_linkertype").button().disable();
			$("#bar_beginarrow").button().disable();
			$("#bar_endarrow").button().disable();
		} else {
			$("#bar_linkertype").button().enable();
			$("#bar_beginarrow").button().enable();
			$("#bar_endarrow").button().enable();
			var shape = Model.getShapeById(linkerIds[0]);
			//设置Toolbar的线条样式
			$("#bar_linkertype").children("div:eq(0)").attr("class", "ico linkertype_" + shape.linkerType.toLowerCase());
			$("#bar_beginarrow").children("div:eq(0)").attr("class", "ico ico_arrow larrow_" + shape.lineStyle.beginArrowStyle.toLowerCase());
			$("#bar_endarrow").children("div:eq(0)").attr("class", "ico ico_arrow rarrow_" + shape.lineStyle.endArrowStyle.toLowerCase());
		}
		//通过锁定的数量，判断是否可以解除锁定
		if (lockedCount == 0) {
			$("#bar_unlock").button().disable();
			arrangeMenu.children("li[ac=unlock]").menuitem("disable");
		} else {
			$("#bar_unlock").button().enable();
			arrangeMenu.children("li[ac=unlock]").menuitem("enable");
		}
		//是否激活组合、对齐，条件是选中图形要不少于2个
		if (count < 2) {
			arrangeMenu.children("li[ac=group]").menuitem("disable");
			$("#bar_arrange_align").menuitem("disable");
		} else {
			arrangeMenu.children("li[ac=group]").menuitem("enable");
			$("#bar_arrange_align").menuitem("enable");
		}
		//是否激活匹配大小，条件是选中形状要不少于2个
		if (shapeCount < 2) {
			$("#bar_arrange_match").menuitem("disable");
		} else {
			$("#bar_arrange_match").menuitem("enable");
		}
		//是否激活排列图形菜单，条件是选中图形要不少于3个
		if (count < 3) {
			$("#bar_arrange_dist").menuitem("disable");
		} else {
			$("#bar_arrange_dist").menuitem("enable");
		}
		//通过组合的数量，判断是否可以取消组合
		if (groupCount == 0) {
			arrangeMenu.children("li[ac=ungroup]").menuitem("disable");
		} else {
			arrangeMenu.children("li[ac=ungroup]").menuitem("enable");
		}
	},
	/**
	 * 打开插入链接
	 */
	showInsertLink: function () {
		$("#link_dialog").dlg();
		var addr = Utils.getSelected()[0].link;
		if (!addr) {
			addr = "";
		}
		$("#linkto_addr").val(addr).select();
		$("#linkto_addr").unbind().bind("keydown", function (e) {
			if (e.keyCode == 13) {
				UI.setLink();
			}
		});
	},
	/**
	 * 设置连接
	 */
	setLink: function () {
		var newLink = $("#linkto_addr").val();
		var shape = Utils.getSelected()[0];
		shape.link = newLink;
		Model.update(shape);
		$('#link_dialog').dlg('close');
	},
	/**
	 * 选中图片后的回调
	 * @type {}
	 */
	imageSelectedCallback: null,
	/**
	 * 打开图片选择
	 */
	showImageSelect: function (callback) {
		if (callback) {
			this.imageSelectedCallback = callback;
		} else {
			this.imageSelectedCallback = null;
		}
		this.fetchingRequest = null;
		var height = $(window).height() - 200;
		if (height > 550) {
			height = 550;
		} else if (height < 200) {
			height = 200;
		}
		$(".image_list").height(height);
		//		this.showImageSelectContent("upload");
		$("#image_dialog").dlg({
			onClose: function () {
				if (UI.fetchingRequest) {
					UI.fetchingRequest.abort();
				}
			}
		});
		//加载用户图片
		if ($("#image_select_upload").is(":visible")) {
			UI.loadUserImages();
		};
		//左侧分类绑定事件
		$(".image_sources").children().unbind().bind("click", function () {
			UI.showImageSelectContent($(this).attr("ty"));
		});
		//上传
		$("#upload_img_res").empty();
		$("#input_upload_image").unbind().bind("change", function () {
			$("#upload_img_res").html("<span style='color: #666'>上传中...</span>");
			$("#frm_upload_image").submitForm({
				success: function (result) {
					if (result.result == "type_wrong") {
						$("#upload_img_res").html("此文件不是图片，请重新选择");
					} else if (result.result == "size_wrong") {
						$("#upload_img_res").html("文件大小超出要求，最大2M");
					} else if (result.result == "exception") {
						$("#upload_img_res").html("无法使用此图片，请选择其他图片");
					} else {
						var img = result.image;
						UI.setShapeImage(img.fileId, img.imageW, img.imageH);
					}
				}
			});
		});
		//输入URL
		$("#input_img_url").val("");
		$("#img_url_area").empty();
		var oldUrl = "";
		function urlChanged() {
			var url = $("#input_img_url").val().trim();
			if (url != oldUrl) {
				oldUrl = url
				if (url != "") {
					if (url.indexOf("http") < 0) {
						url = "http://" + url;
					}
					$("#img_url_area").html("<span class='img_url_loading_tip'>正在加载预览...</span>");
					var newImage = $("<img class='img_url_loading' src='" + url + "'/>").appendTo("#img_url_area");
					newImage.unbind().bind("load", function () {
						newImage.show().addClass("img_url_loaded");
						$(".img_url_loading_tip").remove();
					}).bind("error", function () {
						$("#img_url_area").html("<div class='img_url_error'>无法在此地址下加载图片。<ul><li>请检查图片地址是否输入正确。</li><li>确保图片地址是公开的。</li><ul></div>");
					});
				}
			}
		}
		$("#input_img_url").unbind().bind("paste", function () {
			urlChanged();
		}).bind("keyup", function () {
			urlChanged();
		});
		//搜索
		$("#input_img_search").unbind().bind("keydown", function (e) {
			if (e.keyCode == 13) {
				UI.searchImgByGoogle();
			}
		});
		$("#btn_img_search").unbind().bind("click", function () {
			UI.searchImgByGoogle();
		});
		//完成按钮
		$("#set_image_submit").button().enable();
		$("#set_image_submit").button({
			onClick: function () {
				var currentTab = $(".image_sources").children(".active").attr("ty");
				if (currentTab == "upload") {
					var selectedImg = $("#user_image_items").children(".image_item_selected");
					if (selectedImg.length > 0) {
						var fileId = selectedImg.attr("fileId");
						var imageW = selectedImg.attr("w");
						var imageH = selectedImg.attr("h");
						UI.setShapeImage(fileId, imageW, imageH);
					} else {
						$("#image_dialog").dlg("close");
					}
				} else if (currentTab == "url") {
					if ($(".img_url_loaded").length > 0) {
						var url = $(".img_url_loaded").attr("src");
						UI.setShapeImageByURL(url);
					} else {
						$("#image_dialog").dlg("close");
					}
				} else {
					//搜索
					var selectedImg = $("#google_image_items").children(".image_item_selected");
					if (selectedImg.length > 0) {
						var url = selectedImg.attr("u");
						UI.setShapeImageByURL(url);
					} else {
						$("#image_dialog").dlg("close");
					}
				}
			}
		});
		//取消按钮
		$("#set_image_cancel").button({
			onClick: function () {
				$("#image_dialog").dlg("close");
			}
		});
		$("#set_image_text").empty();
	},
	/**
	 * 显示图片设置类型
	 */
	showImageSelectContent: function (type) {
		$(".image_list").hide();
		$("#image_select_" + type).show().find("input[type=text]").select();
		$(".image_sources").children().removeClass("active");
		$(".image_sources").children("li[ty=" + type + "]").addClass("active");
	},
	/**
	 * 加载用户图片
	 */
	loadUserImages: function (refresh) {
		$("#user_image_items").empty();
		$.ajax({
			url: "/user_image/list",
			success: function (data) {
				if (data.images) {
					for (var i = 0; i < data.images.length; i++) {
						var img = data.images[i];
						UI.appendUserImage(img);
					}
					$("#user_image_items").append("<div style='clear: both'></div>");
				}
			}
		});
		$("#user_image_items").attr("loaded", "true");
	},
	searchIndex: 0,
	searchKeywords: "",
	/**
	 * 通过Google搜索图片
	 */
	searchImgByGoogle: function () {
		var keywords = $("#input_img_search").val();
		if (keywords.trim() != "") {
			$("#google_image_items").empty();
			this.searchKeywords = encodeURI(keywords);
			this.searchIndex = 0;
			this.loadGoogleImg();
		} else {
			$("#input_img_search").focus();
		}
	},
	/**
	 * 加载Google图片 
	 */
	loadGoogleImg: function () {
		$.getScript("https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=" + this.searchKeywords + "&rsz=8&start=" + (this.searchIndex * 16) + "&callback=UI.googleImgCallback");
		$.getScript("https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=" + this.searchKeywords + "&rsz=8&start=" + (this.searchIndex * 16 + 8) + "&callback=UI.googleImgCallback");
		$(".gg_img_more").remove();
		$("#google_image_items").append("<div class='img_gg_loading_tip'>正在加载图片...</div>");
		this.searchIndex++;
	},
	/**
	 * Google搜索回调
	 * @param {} data
	 */
	googleImgCallback: function (data) {
		var responseData = data.responseData;
		var results = responseData.results;
		for (var i = 0; i < results.length; i++) {
			var item = results[i];
			UI.appendGoogleImage(item);
		}
		$("#google_image_items").append("<div style='clear: both'></div>");
		$(".img_gg_loading_tip").remove();
		$(".gg_img_more").remove();
		if (this.searchIndex <= 3) {
			$("#google_image_items").append("<div onclick='UI.loadGoogleImg()' class='gg_img_more toolbar_button active'>显示更多结果...</div>");
		}
	},
	/**
	 * 添加一个用户图片
	 */
	appendUserImage: function (img) {
		var box = $("<div class='image_item' id='" + img.imageId + "' fileId='" + img.fileId + "' w='" + img.imageW + "' h='" + img.imageH + "'></div>").appendTo($("#user_image_items"));
		box.unbind().bind("click", function () {
			$(".image_item_selected").removeClass('image_item_selected');
			$(this).addClass('image_item_selected');
		}).bind("mouseenter", function () {
			var target = $(this);
			var remove = $("<div class='ico ico_remove_red'></div>").appendTo(target);
			var id = target.attr("id");
			remove.bind("click", function () {
				target.fadeOut();
				$.ajax({
					url: "/user_image/remove",
					data: { imageId: id }
				});
			});
		}).bind("mouseleave", function () {
			$(this).find(".ico_remove_red").remove();
		});
		var location = "/file/id/" + img.fileId + "/diagram_user_image";
		var newImage = $("<img src='" + location + "'/>").appendTo(box);
		newImage.bind("load", function () {
			$(this).css("margin-top", (140 - $(this).height()) / 2);
		});
	},
	/**
	 * 添加一个Google搜索的图片
	 */
	appendGoogleImage: function (img) {
		var title = img.title + " (" + img.width + " × " + img.height + ")";
		var box = $("<div class='image_item' u='" + img.url + "' title='" + title + "'></div>").appendTo($("#google_image_items"));
		box.unbind().bind("click", function () {
			$(".image_item_selected").removeClass('image_item_selected');
			$(this).addClass('image_item_selected');
		});
		var newImage = $("<img src='" + img.tbUrl + "'/>").appendTo(box);
		newImage.bind("load", function () {
			$(this).css("margin-top", (140 - $(this).height()) / 2);
		});
	},
	/**
	 * 设置形状的背景图片
	 * @param {} source
	 */
	setShapeImage: function (fileId, w, h) {
		if (this.imageSelectedCallback) {
			this.imageSelectedCallback(fileId, w, h);
		}
		$("#image_dialog").dlg("close");
	},
	/**
	 * 加载URL图片的ajax请求对象
	 * @type {}
	 */
	fetchingRequest: null,
	/**
	 * 通过URL设置图片
	 * @param {} url
	 */
	setShapeImageByURL: function (url) {
		$("#set_image_text").removeClass("errored").text("正在应用图片，请稍候...");
		$("#set_image_submit").button().disable();
		UI.fetchingRequest = $.ajax({
			url: "/user_image/reference",
			data: { url: url },
			success: function (result) {
				$("#set_image_submit").button().enable();
				if (result.result == "exception") {
					$("#set_image_text").addClass("errored").html("无法使用此图片，请选择其他图片");
				} else {
					$("#set_image_text").empty();
					var img = result.image;
					UI.setShapeImage(img.fileId, img.imageW, img.imageH);
				}
			}
		});
	},
	/**
	 * 插入图片
	 * @param {} source
	 * @param {} location
	 * @param {} w
	 * @param {} h
	 */
	insertImage: function (fileId, w, h) {
		w = parseInt(w);
		h = parseInt(h);
		var layout = $("#designer_layout");
		var centerX = layout.width() / 2 + layout.offset().left;
		var centerY = layout.height() / 2 + layout.offset().top;
		var pos = Utils.getRelativePos(centerX, centerY, $("#designer_canvas"));
		var shape = Model.create("standardImage", pos.x.restoreScale() - w / 2, pos.y.restoreScale() - h / 2);
		shape.props.w = w;
		shape.props.h = h;
		shape.fillStyle = { type: "image", fileId: fileId, display: "fill", imageW: w, imageH: h };
		Model.add(shape);
		Designer.painter.renderShape(shape);
		Utils.unselect();
		Utils.selectShape(shape.id);
	},
	/**
	 * 执行导出
	 */
	doExport: function () {
		var definition = JSON.stringify(Model.define);
		$("#export_definition").val(definition);
		$("#export_title").val($(".diagram_title").text());
		$("#export_form").submit();
		$('#export_dialog').dlg('close');
	},
	/**
	 * 展示hotkey列表
	 */
	showHotKey: function () {
		var height = $(window).height() - 175;
		if (height > 500) {
			height = 500 + "px";
		}
		$("#hotkey_list").dlg();
		$("#hotkey_list").css({ "top": "28px" });
		$("#hotkey_list .dialog_content").css({ "height": height });
	},
	/**
	 * 显示反馈dialog
	 */
	showFeedBack: function () {
		$("#send_feedback").css({
			width: "auto",
			height: "auto"
		});
		var sendFeedBack = $("#send_feedback");
		sendFeedBack.dlg();
		$("#feedback_email").focus();
		$("#feedback_message").val("");
		$(".feedback_error_email_format").hide();
		$(".feedback_error_msg").hide();
	},
	/**
	 * 发送反馈
	 */
	sendFeedBack: function (dom) {
		$(".feedback_error_email_format").hide();
		$(".feedback_error_msg").hide();
		var email = $.trim($("#feedback_email").val());
		var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
		if (!reg.test(email)) {
			$("#feedback_email").focus();
			$(".feedback_error_email_format").show();
			return;
		}
		var feedbackMessage = $.trim($("#feedback_message").val());
		if (feedbackMessage == "") {
			$("#feedback_message").val("").focus();
			$(".feedback_error_msg").show();
			return;
		}
		Util.ajax({
			url: "/support/save_ask",
			data: {
				content: feedbackMessage,
				username: $("#feedback_name").val(),
				email: email,
				url: location.href
			},
			success: function (data) {
				$(".dlg_mask").remove();
				$("#send_feedback").animate({
					left: $(window).width(),
					top: $(window).height(),
					width: 0,
					height: 0,
					opacty: 0.2
				});
			}
		});
	},
	/**
	 * 打开开始向导
	 */
	gettingStart: function (delay) {
		this.showStartStep(1);
	},
	showStartStep: function (step, dom) {
		$(".mark_content").hide();
		var content = $(".mark" + step + "_content");
		content.show();
		var top;
		var left;
		if (step == 1) {
			top = $("#shape_panel").offset().top + 70;
			left = $("#shape_panel").offset().left + $("#shape_panel").width() + 10;
		} else if (step == 2) {
			top = $(".row2").offset().top + 30;
			left = $("#menu_bar_insert").offset().left + $("#menu_bar_insert").width() - content.outerWidth() / 2;
		} else if (step == 3) {
			top = $(".toolbar").offset().top + 40;
			left = 270;
		} else if (step == 4) {
			top = $("#dock").offset().top + 10;
			left = $("#dock").offset().left - content.outerWidth() - 10
		} else if (step == "created") {
			top = dom.offset().top + dom.height() / 2 - content.outerHeight() / 2;
			if (top <= 0) {
				top = 0;
			}
			if (top + content.outerHeight() > $(window).height()) {
				top = $(window).height() - content.outerHeight();
			}
			left = dom.offset().left + dom.width() + 10;
		}
		content.css({ top: top, left: left });
	},
	/**
	 * 关闭开始向导
	 * @param {} dom
	 */
	closeGettingStart: function (dom) {
		$(".mark_content").hide();
	},
	/**
	 * Getting Start END--
	 */

	showAddColla: function () {
		Util.ajax({
			url: "/collaboration/get_colla_role_list",
			data: { chartId: chartId },
			success: function (data) {
				$("#colla_dialog").find(".role_list").html(data).scrollTop(999);
				$("#colla_dialog").removeClass("_update");
				$("#colla_dialog").css({ "top": ($(window).height() - $("#colla_dialog").outerHeight()) * 0.5 + "px" });
				$("#colla_dialog").dlg();
				$("#colla_suggest_box").empty();
				$("#add_prompt4").hide();
				$("#add_prompt3").hide();
				$("#add_prompt2").hide();
				$("#add_prompt1").show();
			}
		});

		var lastVal = "";
		$("#input_add_colla").val("").unbind().bind("keyup", function () {
			//加载信息
			var value = $(this).val();
			if (value == lastVal) {
				return;
			}
			lastVal = value;
			if (value == "") {
				$("#colla_suggest_box").empty();
				$("#add_prompt4").hide();
				$("#add_prompt3").hide();
				$("#add_prompt2").hide();
				$("#add_prompt1").show();
				return;
			}
			Util.ajax({
				url: "/collaboration/get_new_members",
				data: { value: value },
				success: function (data) {
					$("#colla_suggest_box").html(data);
					if ($("#colla_suggest_box").find("ul").length > 0) {
						$("#add_prompt4").hide();
						$("#add_prompt3").hide();
						$("#add_prompt2").show();
						$("#add_prompt1").hide();
					} else {
						$("#add_prompt4").hide();
						$("#add_prompt3").hide();
						$("#add_prompt2").hide();
						$("#add_prompt1").show();
					}
					$(".colla_suggest").find("li").unbind().bind("click", function () {
						$("#add_prompt4").hide();
						$("#add_prompt3").hide();
						$("#add_prompt2").show();
						$("#add_prompt1").hide();
						var value = $.trim($("#input_add_colla").val());
						$(".colla_suggest").find("li").removeClass("seled");
						$(this).addClass("seled");
						var type = $(this).attr("joinType");
						var target = $(this).attr("target");
						if (type == "user") {
							var userName = $(this).attr("username");
							$("#input_add_colla").val(userName);
							$("#add_userid").val(target);
						} else {
							$("#input_add_colla").val(target);
							$("#add_userid").val(target);
						}
						$("#add_type").val(type);
					});
				}
			});
		});
	},
	doAddCollaboration: function () {
		if ($(".colla_suggest").length > 0) {
			if ($(".colla_suggest").find(".seled").length == 0) {
				$("#add_prompt1").hide();
				$("#add_prompt2").show();
				$("#add_prompt3").hide();
				$("#add_prompt4").hide();
				var top = ($(window).outerHeight() - 104) * 0.5 + 100;
				var left = ($(window).outerWidth() - 272) * 0.5;
				$("#confirm_dlg").removeClass("newSize").css({ top: top + "px", left: left + "px" });
				$("#confirm_dlg").addClass("newSize").css({
					top: ($(window).outerHeight() - $("#confirm_dlg").height()) * 0.5 + "px",
					left: ($(window).outerWidth() - $("#confirm_dlg").width()) * 0.5 + "px",
					display: "block"
				});
			} else {
				var imgSrc = $(".colla_suggest").find(".seled").find("img").attr("src");
				var userFullName = $("#input_add_colla").val();
				if (userFullName.length > 30) {
					userFullName = userFullName.substr(0, 30) + "...";
				}
				var target = $("#add_userid").val();
				var role = $("#invit_role").val();
				var type = $("#add_type").val();
				$(".add_new_button").find(".designer_button").text("发送中...");
				var target_item = null;
				if (type == "email") {
					$(".role_list").find(".role_item").each(function () {
						if ($(this).attr("type") == type && $(this).attr("target") == target) {
							target_item = $(this);
							$(this).find(".inviting_").text("再次邀请");
						}
					});
				}

				var paramOuter = {
					type: type,
					target: target,
					role: role,
					chartId: chartId
				};
				Util.ajax({
					url: "/collaboration/add",
					data: paramOuter,
					success: function (data) {
						var result = data.result;
						if (result == "exists") {
							$("#add_prompt2").hide();
							$("#add_prompt1").hide();
							$("#add_prompt4").hide();
							$("#add_prompt3").show();
						} else {
							Util.ajax({
								url: "/collaboration/get_colla_role_list",
								data: { chartId: chartId },
								success: function (data) {
									$(".role_list").html(data).scrollTop(999);
								}
							});
						}
						$(".add_new_button").find(".designer_button").text("发送邀请");
						$("#colla_dialog").addClass("_update")
							.css({ top: ($(window).height() - $("#colla_dialog").outerHeight()) * 0.5 + "px" });
						if (result != "exists") {
							setTimeout(function () {
								$("#add_prompt3").hide();
								$("#add_prompt2").hide();
								$("#add_prompt1").hide();
								$("#add_prompt4").show();
							}, 400);
						}
						setTimeout(function () {
							$("#add_prompt3").hide();
							$("#add_prompt2").hide();
							$("#add_prompt4").hide();
							$("#add_prompt1").show();
							$("#input_add_colla").val("");
							$("#colla_suggest_box").html("");
						}, 1000);
					}
				});
			}
		}
	},
	deleteCollaRole: function (dom) {
		var parent = $(dom).parent(".role_item");
		var collaborationId = parent.attr("collaborationId");
		Util.ajax({
			url: "/collaboration/delete",
			data: { collaborationId: collaborationId },
			success: function (data) {
				if (data.result == "success") parent.remove();
			}
		});

		$("#colla_dialog").addClass("_update")
			.css({ top: ($(window).height() - $("#colla_dialog").outerHeight()) * 0.5 + "px" });
	},
	changeCollaRole: function (collaborationId, dom) {
		Util.ajax({
			url: "/collaboration/set_role",
			data: { collaborationId: collaborationId, role: $(dom).val() },
			success: function (data) {
				if (data.result == "success") {
					$(dom).parent(".given_role").find(".change_success").stop().animate({ "left": "-38px" }, 200).delay(400).animate({ "left": "0px" }, 200);
				}
			}
		});
	},
	/**
	 * 打开图形管理
	 */
	showShapesManage: function () {
		$("#shapes_dialog").dlg();
		$("#shape_manage_list").children("li").unbind().bind("click", function () {
			var chkbox = $(this).find("input");
			var checked = !chkbox.is(":checked");
			chkbox.attr("checked", checked);
			cateChanged(chkbox);
		});
		$("#shape_manage_list").find("input").unbind().bind("click", function (e) {
			e.stopPropagation();
			cateChanged($(this));
		}).each(function () {
			var categorys = $(this).val();
			var arr = categorys.split(",");
			var exists = true;
			for (var i = 0; i < arr.length; i++) {
				var cate = arr[i];
				if (!CategoryMapping[cate]) {
					//此分类下的图形，没有在当前使用中
					exists = false;
					break;
				}
			}
			$(this).attr("checked", exists);
		});

		function cateChanged(chk) {
			var value = chk.val();
			var arr = value.split(",");
			var chked = chk.is(":checked");
			if (arr.length > 1) {
				//是父级节点
				$("#shape_manage_list").find("input").each(function () {
					var cate = $(this).val();
					if (arr.indexOf(cate) >= 0) {
						//是选择父级的子节点
						$(this).attr("checked", chked);
					}
				});
			} else {
				//选择的是子节点
				$("#shape_manage_list").find(".cate_parent").each(function () {
					//获取所有的父节点，判断子节点是否都全部选中了
					var cates = $(this).val().split(",");
					var allChked = true;
					for (var i = 0; i < cates.length; i++) {
						var cate = cates[i];
						if (!$("#shape_manage_list").find("input[value=" + cate + "]").is(":checked")) {
							allChked = false;
							break;
						}
					}
					$(this).attr("checked", allChked);
				});
			}
		}
	},
	/**
	 * 保存图形管理
	 */
	saveShapesManage: function () {
		var checked = $("#shape_manage_list").find("input:checked:not(.cate_parent)").map(function () {
			return $(this).val();
		}).get();
		var a = "";
		//发送消息
		var msgObj = {
			action: "changeSchema",
			categories: checked.join(",")
		};
		CLB.send(msgObj);
		Designer.setSchema(checked, function () {
			$('#shapes_dialog').dlg('close');
		});
	},
	/**
	 * 打开用户菜单
	 */
	showUserMenu: function (e) {
		e.stopPropagation();
		$("#user_menu").dropdown({
			target: $(".user"),
			position: "right",
			onSelect: function (item) {
				var action = item.attr("ac");
				if (action == "dia") {
					location.href = "/diagrams";
				} else if (action == "net") {
					location.href = "/network";
				} else if (action == "out") {
					location.href = "/login/out";
				}
			}
		});
	},
	/**
	 * 打开另存为
	 */
	showSaveAs: function () {
		$("#saveas_dialog").dlg();
		$("#saveas_title").val($(".diagram_title").text()).select();
	},
	doSaveAs: function () {
		if ($("#saveas_title").val().trim() == "") {
			$("#saveas_title").focus();
			return;
		}
		$("#hid_saveas_id").val(chartId);
		$("#saveas_form").submit();
		$("#btn_dosaveas").removeAttr("onclick");
	},
	/**
	 * 打开形状的选项
	 * @param {} options
	 */
	showShapeOptions: function () {
		var shapeIds = Utils.getSelectedShapeIds();
		UI.hideShapeOptions();
		if (shapeIds.length == 1) {
			//只选中了一个图形，显示图形的选项
			var shape = Model.getShapeById(shapeIds[0]);
			if (shape.name == "uiTab") {
				//UI > Tab标签页
				//先查找当前第几个是激活的tab
				var activeTab = 0;
				for (var i = 0; i < shape.path.length - 1; i++) {
					var path = shape.path[i];
					if (typeof path.fillStyle == "undefined") {
						activeTab = i + 1;
						break;
					}
				}
				showOptions(shape, [
					{
						label: "Tabs:",
						type: "spinner",
						value: shape.path.length - 1,
						onChange: function (tabCount) {
							console.log("tabcount change");
							//先查找当前第几个是激活的tab
							var activeIndex = 0;
							for (var i = 0; i < shape.path.length - 1; i++) {
								var path = shape.path[i];
								if (typeof path.fillStyle == "undefined") {
									activeIndex = i;
									break;
								}
							}
							//先记录最后一节画法
							var last = shape.path[shape.path.length - 1];
							if (tabCount != shape.path.length - 1) {
								//减少了tab
								if (activeIndex > tabCount - 1) {
									activeIndex = tabCount - 1;
									$("#change_uitab_index").spinner("setValue", tabCount);
								}
								shape.path = [];
								var newBlock = [];
								for (var i = 0; i < tabCount; i++) {
									var pathCmd = {
										actions: [
											{ action: "move", x: "w/" + tabCount + "*" + i, y: "h" },
											{ action: "line", x: "w/" + tabCount + "*" + i, y: 7 },
											{ action: "quadraticCurve", x1: "w/" + tabCount + "*" + i, y1: 0, x: "w/" + tabCount + "*" + i + "+7", y: 0 },
											{ action: "line", x: "w/" + tabCount + "*" + (i + 1) + "-7", y: 0 },
											{ action: "quadraticCurve", x1: "w/" + tabCount + "*" + (i + 1), y1: 0, x: "w/" + tabCount + "*" + (i + 1), y: 7 },
											{ action: "line", x: "w/" + tabCount + "*" + (i + 1), y: "h" }
										]
									};
									if (i != activeIndex) {
										//如果不是激活的，需要添加深色的填充，画法需要关闭
										pathCmd.fillStyle = { color: "r-20,g-20,b-20" };
										pathCmd.actions.push({ action: "close" });
									}
									shape.path.push(pathCmd);
									//调整textBlock
									if (i < shape.textBlock.length) {
										var shapeBlock = shape.textBlock[i];
										shapeBlock.position.x = "w/" + tabCount + "*" + i + "+5";
										shapeBlock.position.w = "w/" + tabCount + "-10";
										newBlock.push(shapeBlock);
									} else {
										newBlock.push({
											position: { x: "w/" + tabCount + "*" + i + "+5", y: 5, w: "w/" + tabCount + "-10", h: "h-10" }, text: "Tab " + (i + 1)
										});
									}
								}
								shape.textBlock = newBlock;
								shape.path.push(last);
								Schema.initShapeFunctions(shape);
								Model.update(shape);
								Designer.painter.renderShape(shape);
								$("#change_uitab_index").spinner("setOptions", { max: tabCount });
							}
						}
					}, {
						id: "change_uitab_index",
						label: "Selected:",
						type: "spinner",
						value: activeTab,
						max: shape.path.length - 1,
						onChange: function (active) {
							console.log("select change");
							//先查找当前第几个是激活的tab
							var activeIndex = 0;
							for (var i = 0; i < shape.path.length - 1; i++) {
								var path = shape.path[i];
								if (typeof path.fillStyle == "undefined") {
									activeIndex = i;
									break;
								}
							}
							if (activeIndex != active - 1) {
								//先置灰以前激活的
								shape.path[activeIndex].fillStyle = { color: "r-20,g-20,b-20" };
								shape.path[activeIndex].actions.push({ action: "close" });
								//激活设置的
								delete shape.path[active - 1].fillStyle;
								shape.path[active - 1].actions.splice(6, 1)
								//重绘、修改
								Schema.initShapeFunctions(shape);
								Model.update(shape);
								Designer.painter.renderShape(shape);
							}
						}
					}
				]);
			}
		}
		function showOptions(shape, options) {
			var box = $("#shape_opt_box");
			if (box.length == 0) {
				box = $("<div id='shape_opt_box'><div class='shape_opts'></div><div class='ico dlg_close'></div></div>").appendTo("#designer_canvas");
				box.bind("mousedown", function (e) {
					e.stopPropagation();
				});
				box.children(".dlg_close").bind("click", function (e) {
					box.hide();
				});
			}
			box.show();
			var pos = Utils.getShapeBox(shape);
			box.css({
				left: pos.x + pos.w + 10,
				top: pos.y,
				"z-index": Model.orderList.length + 1
			});
			var items = box.children(".shape_opts");
			items.empty();
			for (var i = 0; i < options.length; i++) {
				var opt = options[i];
				var item = $("<div class='opt'></div>").appendTo(items);
				//标题
				item.append("<label>" + opt.label + "</label>");
				var field = $("<div class='field'></div>").appendTo(item);
				if (opt.type == "spinner") {
					var spinner = $("<div class='spinner active' style='width: 55px;'></div>").appendTo(field);
					if (opt.id) {
						spinner.attr("id", opt.id);
					}
					spinner.spinner({
						min: 1,
						max: typeof opt.max != "undefined" ? opt.max : 20,
						step: 1,
						onChange: opt.onChange
					});
					spinner.spinner("setValue", opt.value);
				}
			}
		}
	},
	hideShapeOptions: function () {
		$("#shape_opt_box").hide();
	},
	/**
	 * 收缩、展开标题栏
	 */
	toogleTitleBar: function () {
		var ico = $("#bar_collapse").children("div");
		if (ico.hasClass("collapse")) {
			ico.attr("class", "ico expand");
			$(".titlebar").slideUp(200);
			$(".layout").animate({
				height: $(window).height() - 73
			}, 200);
			$("#bar_return").show();
		} else {
			ico.attr("class", "ico collapse");
			$(".titlebar").slideDown(200);
			$(".layout").animate({
				height: $(window).height() - 143
			}, 200);
			$("#bar_return").hide();
		}
	}
};
