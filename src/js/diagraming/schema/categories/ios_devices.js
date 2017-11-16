/**
 * 
 */
Schema.addCategory({
	name: "ios_devices",
	text: "iOS 设备",
	dataAttributes: []
});

/**
 * iPhone5
 */
Schema.addShape({
	name: "iPhone5Black",
	title: "iPhone（黑色）",
	category: "ios_devices",
	attribute: {
		container: true,
		linkable: false
	},
	props: {
		w: 340,
		h: 690
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/iphone_black.png", imageW: 340, imageH: 690, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/iphone5.png", imageW: 14, imageH: 30, display: "stretch"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: 0, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: 0, y: h},
					{action: "close"}
				]
			}
		];
	}
});

Schema.addShape({
	name: "iPhoneGold",
	title: "iPhone（金色）",
	category: "ios_devices",
	attribute: {
		container: true,
		linkable: false
	},
	props: {
		w: 340,
		h: 690
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/iphone_gold.png", imageW: 340, imageH: 690, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/iphone_white.png", imageW: 15, imageH: 30, display: "stretch"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: 0, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: 0, y: h},
					{action: "close"}
				]
			}
		];
	}
});

Schema.addShape({
	name: "iPhoneWhite",
	title: "iPhone（白色）",
	category: "ios_devices",
	attribute: {
		container: true,
		linkable: false
	},
	props: {
		w: 340,
		h: 690
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/iphone_white.png", imageW: 340, imageH: 690, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/iphone_white.png", imageW: 15, imageH: 30, display: "stretch"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: 0, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: 0, y: h},
					{action: "close"}
				]
			}
		];
	}
});

/**
 * 背景图
 */
Schema.addShape({
	name: "ios7GreyBg",
	title: "灰色背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	fillStyle: {type: "solid", color: "230,230,230"},
	path: [
		{
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		var x = -3;
		w += 4;
		return [
			{
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: x, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: x, y: h},
					{action: "close"},
				]
			}
		]
	}
});

Schema.addShape({
	name: "ios7BlackBg",
	title: "黑色背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	fillStyle: {type: "solid", color: "0,0,0"},
	path: [
		{
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		var x = -3;
		w += 4;
		return [
			{
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: x, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: x, y: h},
					{action: "close"},
				]
			}
		]
	}
});

Schema.addShape({
	name: "ios7WhiteBg",
	title: "白色背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	fillStyle: {type: "solid", color: "255,255,255"},
	path: [
		{
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		var x = -3;
		w += 4;
		return [
			{
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: x, y: 0},
					{action: "line", x: w, y: 0},
					{action: "line", x: w, y: h},
					{action: "line", x: x, y: h},
					{action: "close"},
				]
			}
		]
	}
});

Schema.addShape({
	name: "ios7DefaultBg",
	title: "iOS 背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/bg_default.png", imageW: 280, imageH: 495, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/bg_default.png", imageW: 26, imageH: 26, display: "original"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: -3, y: 0},
					{action: "line", x: w+4, y: 0},
					{action: "line", x: w+4, y: h},
					{action: "line", x: -3, y: h},
					{action: "close"}
				]
			}
		];
	}
});

Schema.addShape({
	name: "ios7SpaceBg",
	title: "星空背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/bg_space.png", imageW: 280, imageH: 495, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/bg_space.png", imageW: 26, imageH: 26, display: "original"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: -3, y: 0},
					{action: "line", x: w+4, y: 0},
					{action: "line", x: w+4, y: h},
					{action: "line", x: -3, y: h},
					{action: "close"}
				]
			}
		];
	}
});

Schema.addShape({
	name: "ios7GrassBg",
	title: "绿草背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/bg_grass.png", imageW: 280, imageH: 495, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/bg_grass.png", imageW: 26, imageH: 26, display: "original"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: -3, y: 0},
					{action: "line", x: w+4, y: 0},
					{action: "line", x: w+4, y: h},
					{action: "line", x: -3, y: h},
					{action: "close"}
				]
			}
		];
	}
});

Schema.addShape({
	name: "ios7MountainBg",
	title: "高山背景",
	category: "ios_devices",
	attribute: {
		linkable: false
	},
	props: {
		w: 280,
		h: 495
	},
	resizeDir: [],
	anchors: [],
	textBlock: [],
	path: [
		{
			fillStyle: {type: "image", fileId: "/images/designer/ios/bg_mountain.png", imageW: 280, imageH: 495, display: "stretch"},
			lineStyle: {lineWidth: 0},
			actions: {ref: "rectangle"}
		}
	],
	drawIcon: function(w, h){
		return [
			{
				fillStyle: {type: "image", fileId: "/images/designer/ios/thumb/bg_mountain.png", imageW: 26, imageH: 26, display: "original"},
				lineStyle: {lineWidth: 0},
				actions: [
					{action: "move", x: -3, y: 0},
					{action: "line", x: w+4, y: 0},
					{action: "line", x: w+4, y: h},
					{action: "line", x: -3, y: h},
					{action: "close"}
				]
			}
		];
	}
});





