Schema.init(true);
Schema.initMarkers();

$(function(){
	Designer.init();
	if(role == "trial"){
		Designer.status = "demo";
	}else if(role == "viewer"){
		Designer.status = "readonly";
	}
	if(Designer.status == "readonly"){
		Designer.setReadonly(true);
		return;
	}
	UI.init();
	Dock.init();
	Navigator.init();
	if(Designer.status == "demo"){
		UI.gettingStart();
	}
});
