var dynamixContextHandler; 

var bindListener = function(status) {
	switch(status) {
		case Dynamix.Enums.BOUND :
      console.log("Successfully Bound!");
			openDynamixSession();
			break;
		case Dynamix.Enums.BIND_ERROR :
			Dynamix.bind(bindListener)
			break;
		case Dynamix.Enums.UNBOUND :
			break;
	}
};	

var bindDynamix = function() {
	Dynamix.bind(bindListener, {appName: 'VR Game', alwaysLocal: true});
};

var unbindDynamix = function() {
	Dynamix.unbind();
};

var openDynamixSession = function() {
	var openSessionCallback = function() {
		console.log("OpenSessionCallback >> Fired");
		createContextHandler();
	};

	/**
	The session listener gets updates when
	1. Session state changes.
	2. Plugins are enabled or disabled.
	3. Dynamix Framework is enabled or disabled.
	**/
	var sessionListener = function(status, result) {
		switch(status) {
			case Dynamix.Enums.SESSION_OPENED :
				console.log("session listener : " + status +" : " + result);
				break;
			case Dynamix.Enums.SESSION_CLOSED : 
				console.log("session listener : " + status +" : "+ result);
				break;
			case Dynamix.Enums.PLUGIN_UNINSTALLED :
				console.log("session listener : " + status +" : " + result);
				break;
			case Dynamix.Enums.PLUGIN_INSTALLED :
				console.log("session listener : " + status +" : " + result);
				break;
			case Dynamix.Enums.PLUGIN_ENABLED :
				console.log("session listener : " + status +" : " + result);
				break;
			case Dynamix.Enums.PLUGIN_DISABLED :
				console.log("session listener : " + status +" : " + result);
				break;
			case Dynamix.Enums.DYNAMIX_FRAMEWORK_ACTIVE :
				console.log("session listener : " + status);
				break;
			case Dynamix.Enums.DYNAMIX_FRAMEWORK_INACTIVE :
				console.log("session listener : " + status);
				break;
		}
	};
	Dynamix.openDynamixSession({listener:sessionListener, callback:openSessionCallback});
	console.log("Dynamix.openDynamixSession();");
};


var closeDynamixSession = function() {
	var closeSessionCallback = function() {
		console.log("CloseSessionCallback >> Fired");
	};
	Dynamix.closeDynamixSession({callback : closeSessionCallback});
	console.log("Dynamix.closeDynamixSession();");
};

var createContextHandler = function() {
	var createNewHandlerCallback = function(status, handler) {
		switch(status) {
			case Dynamix.Enums.SUCCESS:
				dynamixContextHandler = handler;
				console.log("createNewHandlerCallback >> Fired "+ dynamixContextHandler.id);
				discoverMyo();
				break;
			case Dynamix.Enums.FAILURE:
				console.log("Could not create a context handler");
				break;
		}
	};
	Dynamix.createContextHandler(createNewHandlerCallback);
	console.log("Dynamix.createContextHandler(createNewHandlerCallback)");
};

var removeContextHandler = function(handler) {
	var removeContextHandlerCallback = function() {
		console.log("removeContextHandlerCallback >> Fired");
	}
	Dynamix.removeContextHandler(handler, {callback : removeContextHandlerCallback});
	console.log("Dynamix.removeContextHandler()");
};


var myoPluginId = "org.ambientdynamix.contextplugins.myoplugin";

var discoverMyo = function(){
	// $('#myoDiscoverPopup').popup("open");
	var callback = function(status, result){
		if(status == Dynamix.Enums.SUCCESS){
			// $('#myoDiscoverPopup').popup("close");
			console.log("Myo Found");
			subscribeToIMUData();
			subscribeToPoseData();
			subscribeToCollisionData();
		} else {
			console.log("Myo Not Found");
		}
	}
	dynamixContextHandler.contextRequest(myoPluginId, "org.ambientdynamix.contextplugins.myoplugin.discover", callback);
};

var subscribeToIMUData = function(){
	var callback = function(status, result){
		switch(status, result){
			case Dynamix.Enums.SUCCESS:
				break;
		};
	};
	var listener = function(status, result){
		Myo.trigger('imu', result);
	};
	dynamixContextHandler.addContextSupport(myoPluginId, "org.ambientdynamix.contextplugins.myoplugin.threeAxis", {
		callback : callback, 
		listener : listener,
	});
};


var subscribeToPoseData = function(){
	var callback = function(status, result){
		switch(status, result){
			case Dynamix.Enums.SUCCESS:
			break;
		};
	};
	var listener = function(status, result){
	    console.log(result);
	    Myo.trigger('pose', result);
	};
	dynamixContextHandler.addContextSupport(myoPluginId, "org.ambientdynamix.contextplugins.myoplugin.gesture", {
		callback : callback, 
		listener : listener,
	});
};

var subscribeToCollisionData = function(){
  var callback = function(status, result){
  	if(status == Dynamix.Enums.SUCCESS){
	    $('#progressBar').remove();
  		init();
		animate();
  	} else {
  		console.log(result);
  	}
  };
  var listener = function(status, result){
    console.log(result);
    Myo.trigger('collision', true);
  };
  dynamixContextHandler.addContextSupport(myoPluginId, "org.ambientdynamix.contextplugins.myoplugin.collision", {
      callback: callback, 
      listener: listener
  });
};
