var DynamixUtils = {
    amILocal: function (callback) {
        DynamixInstance.ip_address = "127.0.0.1";
        var index = 0;
        var cycleThroughPorts = function(port){
            DynamixInstance.port = port;
            var helloCallback = function(status, data){
                if(status === Dynamix.Enums.SUCCESS){
                    data = JSON.parse(data);
                    if(!data.pairingRequired){
                        callback(true);
                        return;
                    } else {
                        console.log("There is a local instance but isn't allowing a non paired connection, so returning false");
                        callback(false);
                        return;
                    }
                } else {
                    if(index == Dynamix.port_list.length - 1){
                        callback(false);
                        return;
                    } else {
                        index++;
                        cycleThroughPorts(Dynamix.port_list[index]);
                    }
                }
            };
            DynamixInstance.sayHello(helloCallback, 1000);
        };
        cycleThroughPorts(Dynamix.port_list[index]);
    }, 

    getInstanceDetailsFromInstanceId : function(instanceId, callback){
        var numOfTries = 60;
        var url = Dynamix.pairing_server_address + "getInstanceFromId.php?instanceId=" + instanceId;
        var getInstanceFromId = function (){
            $.ajax({
                url : url, 
                type : "GET",
                success : function(response){
                    var responseObject = JSON.parse(response);
                    if("error" in responseObject) {
                        callback(Dynamix.Enums.FAILURE);
                        return;
                    } else {          
                        callback(Dynamix.Enums.SUCCESS, responseObject);
                        return;
                    }
                }, 
                error : function(jqXHR, textStatus, errorThrown){
                    if(numOfTries > 0) {
                        numOfTries = numOfTries - 1;
                        getInstanceFromId();
                    } else {
                        callback(Dynamix.Enums.FAILURE);
                        return;
                    }
                }
            });
        };
        getInstanceFromId();
    }, 

    lookupInstanceDetails : function(lookupKey, callback) {
        if(DEBUG){
            console.log("Looking up instance details using lookup key");            
        }
        var md = forge.md.sha256.create();
        md.update(lookupKey);
        var hashCodeinHex = md.digest().toHex();
        var url = Dynamix.pairing_server_address + "getDynamixInstance.php?hash=" + hashCodeinHex;
        console.log(url);
        var numOfTries = 60;
        var lookup = function() {
            $.ajax({
                url : url, 
                type : "GET", 
                success : function(responseObject){
                    responseObject = JSON.parse(responseObject);
                    if( "error" in responseObject) {
                        if(DEBUG){
                            console.log(responseObject.error);
                        }
                        if(numOfTries > 0) {
                            numOfTries = numOfTries - 1;
                            setTimeout(lookup, 1000);
                        } else {
                            callback(Dynamix.Enums.FAILURE);
                            return;
                        }
                    } else {
                        if(DEBUG){
                            console.log(responseObject);
                        }
                        callback(Dynamix.Enums.SUCCESS, responseObject);
                        return;
                    }
                }, 
                error : function(jqXHR, textStatus, errorThrown){
                    numOfTries = numOfTries - 1;
                    setTimeout(lookup, 1000);
                    console.log('Error occured while retrieving instance details');
                }
            });
        }
        lookup();
    }
}

var PairingUtils = {
    showPairingQRCodeAndWaitForInstance: function (appName, callback) {
        var popup = '<div data-role="popup" id="qrcodePopup" data-transition="pop" style="padding:10px;" data-theme="a" data-dismissible="false">' +
                        '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right"> Close </a>' +
                        '<h3> Scan the QR Code </h3> '+
                        '<div id="dynamixPairingQrCode" >'+
                           
                        '</div>'+
                    '</div>';

        $("body").append(popup);
        $('#qrcodePopup').enhanceWithin();
        $('#qrcodePopup').popup({
            afterclose: function(event, ui) {
                console.log('Removing QR Code popup from Dom');
                $('#qrcodePopup').remove();
            }, 
            history: false
        });

        var pairingCode = WebClient.generatePairingCode();
        var lookupKey = WebClient.generateRandomInt().toString();

        var qrCodeDataObject = {
            "TYPE": "PAIRING",
            "APP_TYPE": "WEB", 
            "PAIRING_CODE": pairingCode,
            "LOOKUP_KEY" : lookupKey,
            "APP_NAME": appName
        };

        console.log(qrCodeDataObject);
        $('#dynamixPairingQrCode').qrcode(JSON.stringify(qrCodeDataObject));
        /*** If this popup is being shown after confirmPairWithLocal popup, 
        we need to use the timeout. Otherwise, the popup won't show up ***/
        var retrieveInstanceCallback = function(status, data){
            $('#qrcodePopup').popup("close");
            if(status === Dynamix.Enums.SUCCESS){
                callback(status, data);
            } else {
                callback(status);
            }
        };

        setTimeout(function(){
            console.log("showing pairing qr code popup");
            $('#qrcodePopup').popup("open");
            DynamixUtils.lookupInstanceDetails(lookupKey, retrieveInstanceCallback);
        }, 1500)
    },

    showRoleSharingBarcode : function(roleTokenString) {
        var popup = '<div data-role="popup" id="roleQrcodePopup" data-transition="pop" style="padding:10px;" data-theme="a" data-dismissible="false">' +
                        '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right"> Close </a>' +
                        '<h3> Scan the QR code to <br/> access your Dashboard!! </h3> <br/>'+
                        '<center><a href="' + Dynamix.dashboard_base_url + roleTokenString + '"> Or click here to debug</a></center><br/>' +
                        '<div id="roleQrCode" >'+
                           
                        '</div>'+
                    '</div>';

        $("body").append(popup);
        $('#roleQrcodePopup').enhanceWithin();
        $('#roleQrcodePopup').popup({
            afterclose: function(event, ui) {
                console.log('Removing QR Code popup from Dom');
                $('#roleQrcodePopup').remove();
            }, 
            history: false
        });
        $('#roleQrCode').qrcode(Dynamix.dashboard_base_url + roleTokenString);
        $('#roleQrcodePopup').popup("open"); 
    },

    initPreapprovedToken : function(pairingCode) {
        PairingUtils.pairingCode = pairingCode;
        var instanceListener = function(status) {
            switch(status){
                case "SUCCESS":
                    PairingUtils.addNewUser();
                    break;
                case "FAILURE":
                    console.log("Could not retrieve the dynamix instance details from the server");                
                    DynamixListener.onDynamixFrameworkBindError("Could not retrieve the dynamix instance details from the server");  
                    break;
            }
        };
        var md = forge.md.sha256.create();
        md.update(pairingCode);
        var hashCodeinHex = md.digest().toHex();
        PairingUtils.getInstanceDetails(hashCodeinHex, instanceListener);
    },

    confirmPairWithLocal: function (callback) {
        Dynamix.binding = false;
        var popup = 
            '<div data-role="popup" id="confirmPairWithLocalPopup" data-transition="pop" data-theme="a" style="padding:10px;" data-dismissible="false">' +
                '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right"> Close </a>' +
		'<h3> Dynamix is running on your Android device. Connect? <br> <br> Press No to connect to a remote Dynamix Client. </h3>' +
                '<div>'+
                    '<a href="#" id="btn-pairWithLocal" class="ui-btn ui-corner-all ui-icon-check">Yes</a>'+
                    '<a href="#" id="btn-dontPairWithLocal" class="ui-btn ui-corner-all ui-icon-delete">No</a>'+
                '</div>'+
            '</div>';

        $("body").append(popup);
        $('#confirmPairWithLocalPopup').enhanceWithin();
        $('#confirmPairWithLocalPopup').popup({
            afterclose: function(event, ui) {
                $('#confirmPairWithLocalPopup').remove();
            }, 
            history: false
        });
        $('#confirmPairWithLocalPopup').popup("open"); 

        $('#btn-pairWithLocal').on('click', function(e){
            PairingUtils.pairingWithLocal = true;
            $('#confirmPairWithLocalPopup').popup("close");
            callback(true);
        });

        $('#btn-dontPairWithLocal').on('click', function(e){
            PairingUtils.pairingWithLocal = false;
            $('#confirmPairWithLocalPopup').popup("close");
            callback(false);
        });
    }
}

var EncryptionUtils = {
    doAES: function (stringToBeEncrypted, keyBytes, ivBytes) {
        var input = forge.util.createBuffer(stringToBeEncrypted, 'utf8');
        var cipher = forge.cipher.createCipher('AES-CBC', keyBytes);
        cipher.start({iv: ivBytes});
        cipher.update(input);
        cipher.finish();
        return cipher.output.toHex();
    },

    decryptAES: function (encryptedString, key, iv) {
        var decodedString = forge.util.decode64(encryptedString);
        var decipher = forge.cipher.createDecipher('AES-CBC', key);
        decipher.start({iv: iv});
        decipher.update(forge.util.createBuffer(decodedString, 'raw'));
        decipher.finish();
        return decipher.output;
    },

    decryptAESFromHex: function (encryptedHexString, keyBytes, ivBytes) {
        var decodedString = forge.util.hexToBytes(encryptedHexString);
        var decipher = forge.cipher.createDecipher('AES-CBC', keyBytes);
        decipher.start({iv: ivBytes});
        decipher.update(forge.util.createBuffer(decodedString, 'raw'));
        decipher.finish();
        return decipher.output.data;
    }
}

var Database = {
    isPairingDataAvailable : function(){
        if(localStorage.getItem('instanceId') != null && 
            localStorage.getItem('masterPassword') != null &&
            localStorage.getItem('iterationRounds') != null && 
            localStorage.getItem('httpToken') != null){
            return true;
        }
        return false;
    },

    get: function(keyname){
        return localStorage.getItem(keyname);
    },

    savePairingKeys : function(data){
        localStorage.setItem('masterPassword', data.masterPassword);
        localStorage.setItem('iterationRounds', data.iterationRounds);
        localStorage.setItem('httpToken', data.httpToken);
    }, 

    save : function(key, value){
        localStorage.setItem(key, value);
    }, 

    clearAll : function(){
        localStorage.clear();
    }
}

var Utils = {
    getUrlParameter: function(paramName) {
        var sPageURL = window.location.search.substring(1);
        if(sPageURL.slice(-1) == '/'){
            sPageURL = sPageURL.slice(0, -1);
        }
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == paramName) {
                return sParameterName[1];
            }
        }
    }, 

    /**
     * Generates random guids for the callbacks, listeners and handlers to map to.
     @private
     **/
    generateGuid: function () {
        function _p8(s) {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        }

        return _p8() + _p8(true) + _p8(true) + _p8();
    }, 

    getBooleanFromString: function (string) {
        switch (string.toLowerCase()) {
            case "true":
                return true;
            case "yes":
                return true;
            case "1":
                return true;
            case "false":
                return false;
            case "no":
                return false;
            case "0":
                return false;
            case null:
                return false;
            default:
                return Boolean(string);
        }
    }
}

var WebClient = {
    name : "Web App(Default Name)",
    httpToken : null,
    pairingCode : null,
    sessionKeyBytes : null,
    eventLoopTimeout : 12000,

    helloResponse : {
        nonce : null,
        ivBytes: null,
    }, 

    pairResponse : {
        masterPassword : null,
        iterationRounds : null,
    },

    setHelloResponse : function(helloResponse){
        if(DEBUG){
            console.log(helloResponse);
        }
        this.helloResponse.ivBytes = forge.util.decode64(helloResponse.iv);
        this.helloResponse.nonce = helloResponse.nonce;
    },

    saveMasterData : function(pairResponse){
        if(DEBUG){
            console.log(pairResponse);
        }
        this.pairResponse.masterPassword = pairResponse.masterKey;
        this.pairResponse.iterationRounds = pairResponse.iterationRounds;
        this.httpToken = pairResponse.httpToken;
        Database.savePairingKeys({
            masterPassword : this.pairResponse.masterPassword, 
            iterationRounds : this.pairResponse.iterationRounds,
            httpToken : this.httpToken 
        });
    }, 

    getPairingKeys : function(){
        var md = forge.md.sha256.create();
        md.update(this.pairingCode);
        var hex = md.digest().toHex();
        var keyBytes = forge.util.hexToBytes(hex);
        var ivBytes = this.helloResponse.ivBytes;
        return {
            keyBytes: keyBytes, 
            ivBytes: ivBytes
        };
    },

	generatePairingCode : function(){
		this.pairingCode = this.generateRandomInt().toString();
		return this.pairingCode;
	},

    getPairingSignature : function(){
        var pairingKeys = this.getPairingKeys();
        var signature = EncryptionUtils.doAES(this.helloResponse.nonce, pairingKeys.keyBytes, pairingKeys.ivBytes );
        return signature;
    },

	generateRandomInt: function () {
        var min = 100000;
        var max = 999999;
        return min + Math.floor(Math.random() * (max - min + 1)) ;
    },

    generateSessionKey : function(){
        var masterPassword = this.pairResponse.masterPassword;
        this.sessionKeyBytes = forge.pkcs5.pbkdf2(masterPassword, this.helloResponse.ivBytes, parseInt(this.pairResponse.iterationRounds), 32);
    }, 

    getBindSignature : function(){
        var signature = EncryptionUtils.doAES(this.helloResponse.nonce, this.sessionKeyBytes, this.helloResponse.ivBytes);
        return signature;
    }, 

    startEventLoop : function(){
        var self = this;
        if(Dynamix.bound){
            if(DEBUG){
                console.log("Starting Event Loop");
            }
            var endpoint = "eventcallback";
            var url = this.getFinalUrl(endpoint);
            var checkForResponse = function(){
                try{
                    $.ajax({
                        url : url, 
                        headers : {
                           httpToken : self.httpToken
                        },
                        timeout : self.eventLoopTimeout,
                        type: "GET",
                        success: function(data){
            			    if(DEBUG){
            			    	console.log(JSON.parse(data).results); 
            			    }	    
            			    var results = JSON.parse(data).results;
            			    if(DEBUG){
            				    console.log(results);
            			    }
                            console.log(results.length);
            			    for(var i = 0; i < results.length; i++){
            				    var response = decodeURIComponent(results[i]);
                				if(DEBUG){
                				    console.log(response);
                				}
            				    self.dispatchResponse(response)
            			    }
            			    checkForResponse();
                        }, 
                        error : function(jqXHR, textStatus, errorThrown){
                            if(jqXHR.status == 401 || jqXHR.status == 403 || textStatus === "timeout"){
                                if(DEBUG){
                                    console.log("Terminating event loop. Received: " + jqXHR.status);                                
                                }
                                Dynamix.onDynamixUnbind();
                            } else if(jqXHR.status == 404){
                                checkForResponse();
                            } else{
                                if(DEBUG){
                                    console.log("error thrown in eventcallback ajax request. triggering unbind");
                                }
                                Dynamix.onDynamixUnbind();
                            }
                        }
                    });
                }catch(e){
                    if(DEBUG){
                       console.log("Exception occured in the eventloop callback : " + e.message); 
                    }
                    Dynamix.onDynamixUnbind();
                }
            }
            checkForResponse();
        } else {
            if(DEBUG){
                console.log("Dynamix.bound flag is false. Not Starting event loop.");
            }
        }
    }, 

    dispatchResponse : function(response){
        response = this.decryptSessionData(response);
        response = response.replace(/\+/g,' ');
        if(DEBUG){
            console.log(typeof response);
            console.log(JSON.stringify(response));
        }
        var responseObj = JSON.parse(response);
        try {
            if(DEBUG){
    		  console.log(response);
        	}
    		if (typeof responseObj.callbackId !== 'undefined' && typeof responseObj.method !== 'undefined' 
    		       /*	&& typeof responseObj.params !== 'undefined'*/) {
    			setTimeout(
    			    function () {
    				if(typeof responseObj.params == 'undefined'){
    				    responseObj.params = {};
    				}
    				window["DynamixListener"][responseObj.method](responseObj.callbackId, responseObj.params);
    			    }, 1);
    		}
	    } catch (e) {
            	console.log(e.message);
        }
    },

    encryptSessionData : function(clearText){
        if(DynamixInstance.isRemote){
            return EncryptionUtils.doAES(clearText, this.sessionKeyBytes, this.helloResponse.ivBytes);
        } 
        return clearText;
    },

    decryptSessionData : function(cipherText){
        if(DynamixInstance.isRemote){
            return EncryptionUtils.decryptAESFromHex(cipherText, this.sessionKeyBytes, this.helloResponse.ivBytes);
        }
        return cipherText;
    },

    getFinalUrl : function(endpointString){
        if(DEBUG){
            console.log("Encrypting: " + endpointString);
        }
        endpointString = this.encryptSessionData(endpointString);
        return DynamixInstance.address() + "/" + endpointString;
    }, 

    sendToDynamixInstance : function(endpointString){
        var self = this;
        if(DEBUG){
            console.log("Sending to Dynamix : " + endpointString);
        }
        var clearText = endpointString;
        var url = this.getFinalUrl(endpointString);
        $.ajax({
            url : url,
            headers : {
                httpToken : self.httpToken
            },
            error : function(jqXHR, textStatus, errorThrown){
                if(DEBUG){
                    console.log("Send to dynamix request failed : " + jqXHR.status);
                    console.log(clearText);
                }
            }
        });
    }, 

    reloadMasterDataFromStorage : function(){
        this.httpToken = Database.get('httpToken');
        this.pairResponse.masterPassword = Database.get('masterPassword');
        this.pairResponse.iterationRounds = Database.get('iterationRounds');
    }
}

var DynamixInstance = {
    ip_address : null, 
    port : null,
    isRemote : false, //Set to true if bindRemote call is successful
    defaultHelloTimeout : 1000,

	address : function(){
		return "http://" + this.ip_address + ":" + this.port;
	},

	pair : function(callback){
        var self = this;
		var pair = function(signature){
			var url = self.address() + "/pair";
			$.get(url, {signature : signature}, function(data){
                var pairingKeys = WebClient.getPairingKeys();
                data = EncryptionUtils.decryptAESFromHex(data, pairingKeys.keyBytes, pairingKeys.ivBytes);
                if(DEBUG){
                    console.log(data);
                }
                var pairResponse = JSON.parse(data);
                WebClient.saveMasterData(pairResponse);
                var secondHelloCallback = function(status, data){
                    if(status === Dynamix.Enums.SUCCESS){
                        data = JSON.parse(data);
                        WebClient.setHelloResponse(data);
                        WebClient.generateSessionKey();
                        self.bindRemote();
                    }
                }
                self.sayHelloWithToken(secondHelloCallback);
			});
		};

		var helloCallback = function(status, data){
			if(status === Dynamix.Enums.SUCCESS){
                data = JSON.parse(data);
                WebClient.setHelloResponse(data);
				var signature = WebClient.getPairingSignature();
               	pair(signature);
			}
		};
		this.sayHello(helloCallback);
	},

	sayHello : function(callback, timeout){
		var self = this;
		var url = this.address() + "/hello";
        if(typeof timeout === 'undefined'){
            timeout = self.defaultHelloTimeout;
        }
		$.ajax({
           url : url,
           timeout : timeout,             
           type: "GET",
           success: function(data){
               callback(Dynamix.Enums.SUCCESS, data);               
           }, 
           error : function(jqXHR, textStatus, errorThrown){
               callback(Dynamix.Enums.FAILURE);
           }
       });
	}, 

    sayHelloWithToken : function(callback){
        var url = this.address() + "/hello"
        $.ajax({
            url : url, 
            headers : {
                httpToken : WebClient.httpToken
            },
            type: "GET",
            success: function(data){
                callback(Dynamix.Enums.SUCCESS, data);                
            }, 
            error : function(jqXHR, textStatus, errorThrown){
                callback(Dynamix.Enums.FAILURE);
            }
        });
    },

    bindLocal : function(){
        var url = this.address() + "/dynamixbind";
        $.get(url, function(data){
            WebClient.httpToken = data;
            DynamixListener.onDynamixFrameworkBound();
            WebClient.startEventLoop();
        });
    }, 

    bindRemote : function(){
        var self = this;
        var url = this.address() + "/dynamixbind";
        var signature = WebClient.getBindSignature();
        $.ajax({
            url : url, 
            headers : {
                httpToken : WebClient.httpToken
            },
            type: "GET",
            data: {
                signature: signature
            }, 
            success: function(data){
                if(DEBUG){
                    console.log(data);
                }
                self.isRemote = true;
                DynamixListener.onDynamixFrameworkBound();
                WebClient.startEventLoop();
            }, 
            error : function(jqXHR, textStatus, errorThrown){
                if(DEBUG){
                    console.log("could not bind to remote: " + textStatus);
                }
                if(jqXHR.status == 401){
                    if(DEBUG){
                        console.log("Unauthorized credentials. Clearing Database");
                    }
                    Database.clearAll();
                }
                DynamixListener.onDynamixFrameworkBindError("Failed to bind after pairing");
            }
        });
    }, 

    rebind : function(){
        var self = this;
        //We've paired with this instance before
        var instanceId = Database.get('instanceId');
        //Let's find out what the current ip address of the device is
        var callback = function(status, responseObject){
            if(status === Dynamix.Enums.SUCCESS){
                self.ip_address = responseObject.instanceIp;
                self.port = responseObject.instancePort;
                if(DEBUG){
                    console.log("Retrieved instance details :");
                    console.log(responseObject);
                }
                WebClient.reloadMasterDataFromStorage();
                var callback = function(status, helloResponse){
                    if(status === Dynamix.Enums.SUCCESS){
                        helloResponse = JSON.parse(helloResponse);
                        WebClient.setHelloResponse(helloResponse);
                        WebClient.generateSessionKey();
                        self.bindRemote();
                    } else {
                        var error_message = "Unable to reach the Dynamix client after retrieving current ip address. " + 
                        "Please ensure that both devices are on the same network";
                        DynamixListener.onDynamixFrameworkBindError(error_message);
                    }
                };
                self.sayHelloWithToken(callback);
            } else {
                if(DEBUG){
                    console.log("Could not retrieve current instance data from the server");
                }                    
                DynamixListener.onDynamixFrameworkBindError("could not find details using instance id.");
            }
        };
        if(DEBUG){
            console.log("Pairing data is available in the local storage. Let's find out the current ip address and port for the instance");
            console.log("instanceId: " + instanceId);
        }  
        DynamixUtils.getInstanceDetailsFromInstanceId(instanceId, callback);
    }
}

  
