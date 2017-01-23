// Myo.setLockingPolicy("none");

var Myo = {
	on : function(eventName, listener){
		if(typeof this.eventListeners === 'undefined'){
			this.eventListeners = {};
		}
		if(typeof this.eventListeners[eventName] === 'undefined'){
			this.eventListeners[eventName] = [];
		}
		this.eventListeners[eventName].push(listener);
	}, 

	trigger : function(eventName, data){
		var listeners = this.eventListeners[eventName];
		$.each(listeners, function(index, listener){
			if(typeof listener === 'function'){
	        	listener(data);
	      	}
		});
	}
};

Myo.on('pose', function(data){
	console.log(data);
	if(typeof data === 'undefined')
		return;
	
	switch(data.pose.toLowerCase()){
		case "fist":
			M.setCenter();
			break;
		case "double_tap":
			break;
	}
});

Myo.on('imu', function(data){
	M.orientation = {
		x : data.x, 
		y : data.y, 
		z : data.z, 
		w : data.w
	};
	M.setCenteredOrientation();
});

var M = {

	// http://developerblog.myo.com/quaternions/
	setCenter : function(){
		if(typeof this.center == 'object')
			return;

		var self = this;
		console.log("Setting Center");
		if(typeof this.orientation === 'undefined'){
			console.log("no orientation data from myo yet");
			setTimeout(function(){
				self.setCenter();
			}, 1000);
		} else {
			var orientation = this.orientation;
			var q = utils.getThreeJSQuat(orientation);
			this.center = q.conjugate(orientation);
			console.log("center is set");
		}
	}, 

	setCenteredOrientation : function(){
		if(typeof this.center === 'undefined'){
			return;
		}
		var q = utils.getThreeJSQuat(this.orientation);
		this.centered_orientation = q.multiply(this.center);
		this.centered_pyr = utils.getEulerAngles(this.centered_orientation);
	},

	getCenteredOrientation : function(){
		return this.centered_orientation;
	}, 

	// Get Centered THREE JS Euler Angles from a Myo Quaternion
	getCenteredPYR : function(){
		return utils.getEulerAngles(this.centered_orientation);
	}, 

	getBox : function(){
		var box_factor = 0.25;
		var neg_box_factor = box_factor * (-1);
		var centered_pyr = this.getCenteredPYR();
		var p = centered_pyr[0];
		var y = centered_pyr[1];
		var r = centered_pyr[2];

		if (p > box_factor){
			if(y > box_factor){
				return 2;
			} else if(y < neg_box_factor){
				return 8;
			} else {
				return 1;
			}
		} else if(p < neg_box_factor){
			if(y > box_factor ){
				return 4;
			} else if(y < neg_box_factor){
				return 6;
			} else {
				return 5;
			}
		} else {
			if(y > box_factor){
				return 3;
			} else if(y < neg_box_factor){
				return 7;
			}
			return 0;
		}
	}, 

	getBox2 : function(){
		var pyr = this.getCenteredPYRinDegrees();
		if(pyr[0] < 15 && pyr[0] > -15){
			if(pyr[1] < 15 && pyr[1] > -15){
				if(pyr[2] > 30){
					return 7;
				}
				if(pyr[2] < -30){
					return 3;
				}
				return 0;
			}

			/*
			if(pyr[1] > 15) {
				return 8;
			}

			if(pyr[1] < -15){
				return 6;
			}
			*/
		}

		if(pyr[0] < -15){
			return 5;
		}

		if(pyr[0] > 15){
			return 1;
		}
	}, 

	getCenteredPYRinDegrees: function(){
		var euler = this.getCenteredPYR();
		var p = utils.rad2Deg(euler[0]);
		var y = utils.rad2Deg(euler[1]);
		var r = utils.rad2Deg(euler[2]);
		// console.log("PYR : " + utils.rad2Deg(euler[0]) + ", " + utils.rad2Deg(euler[1]) + ", " + utils.rad2Deg(euler[2]));
		return [p, y, r];
	}
};

var utils = {
	getEulerAngles : function(quat){
		var e = new THREE.Euler();
		e.setFromQuaternion(quat);
		return e.toArray();
	}, 

	getThreeJSQuat : function(quat){
		return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
	}, 

	rad2Deg : function(rad){
		return 180 * rad / Math.PI;
	}
};




