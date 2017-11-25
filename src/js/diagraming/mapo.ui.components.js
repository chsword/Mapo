/**
 * jQuery的扩展
 */
(function ($) {
	/**
	 * 按钮
	 */
	$.fn.button = function (options) {
		var target = $(this);
		if (options) {
			target.unbind("click").unbind("mousedown");
			if (options.onClick) {
				target.bind("click", function () {
					if (target.button().isDisabled()) {
						return;
					}
					options.onClick();
				});
			}
			if (options.onMousedown) {
				target.bind("mousedown", function (e) {
					if (target.button().isDisabled()) {
						return;
					}
					options.onMousedown();
					e.stopPropagation();
				});
			}
		}
		return {
			"disable": function () {
				target.addClass("disabled");
				target.find("input").prop("disabled", true);
			},
			"enable": function () {
				target.removeClass("disabled");
				target.find("input").prop("disabled", false);
			},
			"isDisabled": function () {
				return target.hasClass("disabled");
			},
			"isSelected": function () {
				return target.hasClass("selected");
			},
			"unselect": function () {
				target.removeClass("selected");
			},
			"select": function () {
				target.addClass("selected");
			},
			"setText": function (text) {
				target.children(".text_content").html(text);//arguments[1]
			},
			"setColor": function (color) {
				target.children(".btn_color").css("background-color", "rgb(" + color + ")");//arguments[1]
			},
			"getColor": function () {
				var color = target.children(".btn_color").css("background-color").replace(/\s/g, "");
				return color.substring(4, color.length - 1);
			}
		};
	};
	var currentMenu = null;
	//下拉控件
	$.fn.dropdown = function (options) {
		var menu = $(this);
		menu.find(".ico_selected").remove();
		if (typeof options == "string") {
			if (options == "close") {
				menu.hide();
				currentMenu.target.removeClass("selected");
				$(document).unbind("mousedown.ui_dropdown");
				currentMenu = null;
			} else if (options == "select") {
				arguments[1].prepend("<div class='ico ico_selected'></div>");
			}
			return;
		}
		if (currentMenu != null) {
			/**
			 * 如果当前有其他菜单是打开的，则要先关闭
			 */
			currentMenu.menu.dropdown("close");
		}
		var menu = $(this);
		var tar = options.target;
		currentMenu = {
			target: tar,
			menu: menu
		};
		var offset = tar.offset();
		tar.addClass("selected");
		menu.show();
		var left;
		if (options.position == "center") {
			left = offset.left + tar.outerWidth() / 2 - menu.outerWidth() / 2;
		} else if (options.position == "right") {
			left = offset.left + tar.outerWidth() - menu.outerWidth();
		} else {
			left = offset.left;
		}
		var top = offset.top + tar.outerHeight();
		if (top + menu.outerHeight() > $(window).height()) {
			top = $(window).height() - menu.outerHeight();
		}
		menu.css({
			top: top,
			left: left
		});
		if (typeof options.zindex != "undefined") {
			menu.css("z-index", options.zindex);
		}
		menu.unbind("mousedown").bind("mousedown", function (e) {
			e.stopPropagation();
		});
		if (typeof options.bind == "undefined" || options.bind == true) {
			menu.find("li:not(.devider,.menu_text)").unbind().bind("click", function () {
				var item = $(this);
				if (!item.menuitem().isDisabled() && item.children(".extend_menu").length == 0) {
					if (options.onSelect) {
						options.onSelect(item);
					}
					menu.dropdown("close");
				}
			});
		}
		$(document).bind("mousedown.ui_dropdown", function () {
			menu.dropdown("close");
		});
	};
	//调色板
	$.colorpicker = function (options) {
		var picker = $("#color_picker");
		picker.find(".selected").removeClass("selected");
		if (!picker.attr("init")) {
			//没有经过初始化
			picker.find("div").each(function () {
				var color = $(this).css("background-color");
				color = color.replace(/\s/g, "");
				color = color.substring(4, color.length - 1);
				$(this).attr("col", color);
			});
			picker.attr("init", true);
		}
		var opt = $.extend({}, options, { bind: false });
		picker.dropdown(opt);
		picker.children(".color_items").children("div").unbind().bind("click", function () {
			if (options.onSelect) {
				var color = $(this).css("background-color");
				color = color.replace(/\s/g, "");
				color = color.substring(4, color.length - 1);
				options.onSelect(color);
			}
			$("#color_picker").dropdown("close");
		});
		if (options.color) {
			picker.find("div[col='" + options.color + "']").addClass("selected");
		}
		$("#color_picker").children(".color_extend").remove();
		if (options.extend) {
			$("#color_picker").append("<div class='color_extend'>" + options.extend + "</div>")
		}
		//return $(this);
	};
	//颜色按钮
	$.fn.colorButton = function (opt) {
		var target = $(this);
		if (opt) {
			target.html("<div class='picker_btn_holder'></div><div class='ico ico_colordrop'></div>");
			target.bind("mousedown", function (e) {
				if (target.button().isDisabled()) {
					return;
				}
				e.stopPropagation();
				var options = $.extend({}, opt);
				options.target = target;
				options.onSelect = function (color) {
					target.colorButton().setColor(color);
					if (opt.onSelect) {
						opt.onSelect(color);
					}
				};
				var color = $(this).children(".picker_btn_holder").css("background-color");
				color = color.replace(/\s/g, "");
				color = color.substring(4, color.length - 1);
				options.color = color;
				$.colorpicker(options);
			});
		}
		return {
			"setColor": function (color) {
				target.children(".picker_btn_holder").css("background-color", "rgb(" + color + ")");// arguments[1] 
			}
		};
	};
	/**
	 * 数字框
	 * min: 0, max: 360, unit: "°", step: 15,
	 */
	$.fn.spinner = function (opt) {
		var target = $(this);
		if (opt) {
			target.html("<div class='spinner_input'><input/></div><div class='buttons'><div class='spinner_up'></div><div class='spinner_down'></div></div>");
			var defaults = {
				step: 1,
				unit: ""
			};
			opt = $.extend(defaults, opt);
			//将max和min配置放到行内属性中，可以支持动态修改
			if (typeof opt.min != "undefined") {
				target.attr("min", opt.min);
			}
			if (typeof opt.max != "undefined") {
				target.attr("max", opt.max);
			}
			var inputBox = target.children(".spinner_input");
			var input = inputBox.find("input");
			target.spinner().setValue(opt.min + opt.unit);
			target.find(".spinner_up").bind("click", function () {
				if (target.button().isDisabled()) {
					return;
				}
				var now = target.spinner().getValue();
				var newVal = now + opt.step;
				setSpinnerValue(target, newVal, opt);
			});
			target.find(".spinner_down").bind("click", function () {
				if (target.button().isDisabled()) {
					return;
				}
				var now = target.spinner().getValue();
				var newVal = now - opt.step;
				setSpinnerValue(target, newVal, opt);
			});
			input.bind("keydown", function (e) {
				if (e.keyCode == 13) {
					var newVal = parseInt($(this).val());
					setSpinnerValue(target, newVal || opt.min, opt);
				}
			}).bind("focus", function (e) {
				$(this).select();
				$(this).bind("mouseup", function (e) {
					e.preventDefault();
					$(this).unbind("mouseup");
				});
				var box = $(this).parent().parent();
				if (!box.hasClass("active")) {
					box.addClass("active inset");
				}
			}).bind("blur", function (e) {
				var box = $(this).parent().parent();
				if (box.hasClass("inset")) {
					box.removeClass("active inset");
				}
			});
		}
		return {
			"getValue": function () {
				var result = target.find("input").val();
				result = parseInt(result);
				return result;
			},
			 "setValue": function (val) {
				target.find("input").val(val);
				target.data("old", val);
			}, 
			"setOptions": function (newOpt) {
				if (typeof newOpt.min != "undefined") {
					target.attr("min", newOpt.min);
				}
				if (typeof newOpt.max != "undefined") {
					target.attr("max", newOpt.max);
				}
			}
		};
	};
	function setSpinnerValue(spinner, value, opt) {
		if (spinner.attr("max")) {
			value = Math.min(value, parseInt(spinner.attr("max")));
		}
		if (spinner.attr("min")) {
			value = Math.max(value, parseInt(spinner.attr("min")));
		}
		var newValue = value + opt.unit;
		if (spinner.data("old") != newValue && opt.onChange) {
			opt.onChange(value);
		}
		spinner.spinner().setValue(value + opt.unit);
	}
	/**
	 * 菜单项
	 */
	$.fn.menuitem = function (options) {
		var target = $(this);
		return {
			"disable": function () {
				target.addClass("disabled");
			},
			"enable": function () {
				target.removeClass("disabled");
			},
			"isDisabled": function () {
				return target.hasClass("disabled");
			},
			"isSelected": function () {
				return target.children(".ico_selected").length > 0;
			},
			"unselect": function () {
				return target.children(".ico_selected").remove();
			},
			"select": function () {
				return target.prepend("<div class='ico ico_selected'></div>");
			}
		};
	};
	/**
	 * 窗口
	 */
	$.fn.dlg = function (options) {
		var target = $(this);
		var defaults = { closable: true };
		options = $.extend(defaults, options);
		var close = target.children(".dlg_close");
		if (close.length == 0) {
			close = $("<div class='ico dlg_close'></div>").appendTo(target);
		}
		if (options.closable == false) {
			close.hide();
		} else {
			close.show();
		}
		$(".dlg_mask").remove();
		$("body").append("<div class='dlg_mask'></div>")
		close.unbind().bind("click", function () {
			target.hide();
			$(".dlg_mask").remove();
			if (options && options.onClose) {
				options.onClose();
			}
			$(document).unbind("keydown.closedlg");
			target.find("input,textarea,select").unbind("keydown.closedlg");
		});
		target.css({
			left: ($(window).width() - target.outerWidth()) / 2,
			top: ($(window).height() - target.outerHeight()) / 2
		});
		target.show();
		if (options.closable) {
			function closeEvent(e) {
				if (e.keyCode == 27) {
					target.children(".dlg_close").trigger("click");
				}
			}
			target.find("input,textarea,select").unbind("keydown.closedlg").bind("keydown.closedlg", closeEvent);
			$(document).unbind("keydown.closedlg").bind("keydown.closedlg", closeEvent);
		}
		target.children(".dialog_header").unbind("mousedown.drag_dlg").bind("mousedown.drag_dlg", function (e) {
			var target = $(this).parent();
			var downX = e.pageX;
			var downY = e.pageY;
			var downLeft = target.offset().left;
			var downTop = target.offset().top;
			$(document).bind("mousemove.drag_dlg", function (e) {
				var left = e.pageX - downX + downLeft;
				var top = e.pageY - downY + downTop;
				target.offset({
					left: left,
					top: top
				});
			});
			$(document).bind("mouseup.drag_dlg", function (e) {
				$(document).unbind("mousemove.drag_dlg");
				$(document).unbind("mouseup.drag_dlg");
			});
		});

		target.data("dlg", {
			"close": function () {
				target.children(".dlg_close").trigger("click");
			}
		});
	};
})(jQuery);