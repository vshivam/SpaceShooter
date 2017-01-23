/**
 * Copyright (C) The Ambient Dynamix Project
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview
 * The Dynamix object allows web applications to control a local Dynamix
 * Framework instance that is running on the device.
 ===============================================================<br/>
 Supported Browsers<br/>
 ===============================================================<br/>
 <ul>
 <li> Standard Android Browser </li>
 <li> Chrome for Android </li>
 <li> Firefox for Android </li>
 <li> Dolphin Browser HD for Android </li>
 <li> Dolphin Browser Mini for Android </li>
 <li> Boat Browser </li>
 <li> Boat Browser Mini </li>
 <li> Maxthon Android Web Browser </li>
 <li> SkyFire Browser </li>
 </ul>
 ===============================================================
**/
var DEBUG = false;
var Dynamix = {
    // ===============================================================
    // Dynamix Configuration Data (!!USED INTERNALLY - DO NOT MODIFY!!)
    // ===============================================================
    /*
     * Base URL for the Dynamix Web Connector. Note that we need to use
     * '127.0.0.1' and not 'localhost', since on some devices, 'localhost' is
     * problematic.
     */
    dashboard_base_url : "http://shivamverma.info/presentations/dynamix/dashboard/dashboard/?pairingCode=",
    pairing_server_address: "http://pairing.ambientdynamix.org/securePairing/",
    // List of possible Dynamix ports
    port_list: [18087, 5633, 5634, 5635, 5636],

    // ===============================================================
    // Dynamix Private Data (!!USED INTERNALLY - DO NOT MODIFY!!)
    // ===============================================================
    Callbacks: {},
    Listeners: {},
    Handlers: {},

    /**
     @readonly
     @enum
     @property {String} Dynamix.Enums.SESSION_OPENED SESSION_OPENED
     @property {String} Dynamix.Enums.SESSION_CLOSED SESSION_CLOSED
     @property {String} Dynamix.Enums.SUCCESS SUCCESS
     @property {String} Dynamix.Enums.WARNING WARNING
     @property {String} Dynamix.Enums.FAILURE FAILURE
     @property {String} Dynamix.Enums.PLUGIN_ENABLED PLUGIN_ENABLED
     @property {String} Dynamix.Enums.PLUGIN_DISABLED PLUGIN_DISABLED
     @property {String} Dynamix.Enums.PLUGIN_INSTALLED PLUGIN_INSTALLED
     @property {String} Dynamix.Enums.PLUGIN_UNINSTALLED PLUGIN_UNINSTALLED
     @property {String} Dynamix.Enums.PLUGIN_ERROR PLUGIN_ERROR
     @property {String} Dynamix.Enums.INSTALL_PROGRESS INSTALL_PROGRESS
     @property {String} Dynamix.Enums.BOUND BOUND
     @property {String} Dynamix.Enums.UNBOUND UNBOUND
     @property {String} Dynamix.Enums.BIND_ERROR BIND_ERROR
     @property {String} Dynamix.Enums.PLUGIN_DISCOVERY_STARTED PLUGIN_DISCOVERY_STARTED
     @property {String} Dynamix.Enums.PLUGIN_DISCOVERY_FINISHED PLUGIN_DISCOVERY_FINISHED
     **/

    Enums: Object.freeze({
        SESSION_OPENED: "SESSION_OPENED",
        SESSION_CLOSED: "SESSION_CLOSED",
        SUCCESS: "SUCCESS",
        WARNING: "WARNING",
        FAILURE: "FAILURE",
        CONTEXT_RESULT: "CONTEXT_RESULT",
        PLUGIN_ENABLED: "PLUGIN_DISABLED",
        PLUGIN_DISABLED: "PLUGIN_DISABLED",
        PLUGIN_INSTALLED: "PLUGIN_INSTALLED",
        PLUGIN_UNINSTALLED: "PLUGIN_UNINSTALLED",
        PLUGIN_INSTALL_FAILED: "PLUGIN_INSTALL_FAILED",
        PLUGIN_ERROR: "PLUGIN_ERROR",
        INSTALL_PROGRESS: "INSTALL_PROGRESS",
        BOUND: "BOUND",
        UNBOUND: "UNBOUND",
        BIND_ERROR: "BIND_ERROR",
        PLUGIN_DISCOVERY_STARTED: "PLUGIN_DISCOVERY_STARTED",
        PLUGIN_DISCOVERY_FINISHED: "PLUGIN_DISCOVERY_FINISHED",
        DYNAMIX_FRAMEWORK_ACTIVE: "DYNAMIX_FRAMEWORK_ACTIVE",
        DYNAMIX_FRAMEWORK_INACTIVE: "DYNAMIX_FRAMEWORK_INACTIVE",
        CONTEXT_LISTENER_REMOVED: "CONTEXT_LISTENER_REMOVED",
        CONTEXT_SUPPORT_REMOVED: "CONTEXT_SUPPORT_REMOVED"
    }),

    /**
     Binds to the Dynamix Framework.
     @param {function} bindListener The web client should provide a listener which would listen to changes in the bind state.
     @example
     var bindListener = function(status) {
        switch(status) {
            case Dynamix.Enums.BOUND :
                openDynamixSession();
                break;
            case Dynamix.Enums.BIND_ERROR :
                Dynamix.bind(bindListener)
                break;
            case Dynamix.Enums.UNBOUND :
                break;
        }
    }
     Dynamix.bind(bindListener);
     */
    bind: function (listener, bindOptions) {
        var self = this;
        if (!self.binding) {
            if (!self.bound) {
                self.binding = true;
                if(typeof listener !== 'undefined'){
                   self.Listeners['bind-state-listener'] = listener;
                }
                if(typeof bindOptions !== 'undefined'){
                    if(typeof bindOptions.appName !== 'undefined'){
                        WebClient.name = bindOptions.appName;
                    } 
                    var amILocalCallback = function (isLocal) {
                        if(DEBUG){
                            console.log("amILocal :" + isLocal);
                        }
                        if (isLocal) {
                            if(bindOptions.alwaysLocal){
                                if(DEBUG) {
                                    console.log("App requests to bind only with local Dynamix Instances");
                                }
                                DynamixInstance.bindLocal();
                            } else {
                                var callback = function(shouldBindLocal){
                                    if(shouldBindLocal){
                                        DynamixInstance.bindLocal();
                                    } else {
                                        self.binding = false;
                                        self.bound = false;
                                        self.findRemoteClient();
                                    }
                                };
                                PairingUtils.confirmPairWithLocal(callback);
                            }
                        } else {
                            if(bindOptions.alwaysLocal){
                                if(DEBUG){
                                    console.log("App requested to bind only with local instance but could not find one");
                                }
                                self.binding = false;
                                self.bound = false;
                                DynamixListener.onDynamixFrameworkBindError("Could not find a local dynamix instance.");
                            } else {
                                if(DEBUG){
                                    console.log("Could not find a local dynamix instance");
                                }
                                self.binding = false;
                                self.findRemoteClient();
                            }
                        }
                    };
                    DynamixUtils.amILocal(amILocalCallback);
                }
            } else {
                if(DEBUG){
                    console.log("Dynamix Already Bound!");
                }
            }
        } else {
            DynamixListener.onDynamixFrameworkBindError("Dynamix is already binding");
            if(DEBUG){
                console.log("Dynamix Already Binding!");
            }        
        }
    },

    findRemoteClient : function(){
        console.log('finding remote client');
        if(Database.isPairingDataAvailable()){
            DynamixInstance.rebind();
        } else {
            var callback = function(status, responseObject){
                if(status === Dynamix.Enums.SUCCESS){
                    DynamixInstance.ip_address = responseObject.instanceIp;
                    DynamixInstance.port = responseObject.instancePort;
                    DynamixInstance.instance_id = responseObject.instanceId;
                    Database.save('instanceId', responseObject.instanceId);
                    DynamixInstance.pair();
                } else {
                    DynamixListener.onDynamixFrameworkBindError("could not retrieve data using lookup key");
                }
            };
            PairingUtils.showPairingQRCodeAndWaitForInstance(WebClient.name, callback);
        }
    },

    /**
     Open a new Dynamix Session. A session can be opened only after the bind call was successful.
     @param {Object} optParams Optional callback and listener
     @example
     var openSessionCallback = function(status) {
        switch(status) {
            case Dynamix.Enums.SUCCESS :
                createContextHandler();
                break;
            case Dynamix.Enums.FAILURE : 
                break;
        }
    };
     //The session listener gets updates when
     //1. Session state changes.
     //2. Plugin state changes.
     var sessionListener = function(status, result) {
        switch(status) {
            case Dynamix.Enums.SESSION_OPENED :
                break;
            case Dynamix.Enums.SESSION_CLOSED : 
                break;
            case Dynamix.Enums.PLUGIN_UNINSTALLED :
                break;
            case Dynamix.Enums.PLUGIN_INSTALLED :
                break;
            case Dynamix.Enums.PLUGIN_ENABLED :
                break;
            case Dynamix.Enums.PLUGIN_DISABLED :
                break;
            case Dynamix.Enums.PLUGIN_ERROR :
                break;
            case Dynamix.Enums.DYNAMIX_FRAMEWORK_ACTIVE:
                break;
            case DYNAMIX_FRAMEWORK_INACTIVE:
                break;
        }
    };
     Dynamix.openDynamixSession({listener:sessionListener, callback:openSessionCallback});
     **/
    openDynamixSession: function (optParams) {
        var endpointParamsString = "opendynamixsession?timestamp=" + Date.now();
        try {
            if (typeof optParams !== 'undefined' && typeof optParams.listener !== 'undefined') {
                var listenerId = Utils.generateGuid();
                Dynamix.Listeners[listenerId] = optParams.listener;
                endpointParamsString = endpointParamsString + "&sessionListenerId=" + listenerId;
            }
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
            }
            if(DEBUG){
                console.log(endpointParamsString);
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error opening new session:" + e);
        }
    },

    /**
     Creates a new {@link Dynamix.handler context handler}.
     @params {function} callback The callback will receive a newly created context handler on success. The web client will then be able to make requests using this handler object.

     @example
     var createNewHandlerCallback = function(status, handler) {
        switch(status) {
            case Dynamix.Enums.SUCCESS :
            dynamixContextHandler = handler;
            break;
        }
    };
     Dynamix.createContextHandler(createNewHandlerCallback);
     **/
    createContextHandler: function (callback) {
        var callbackId = Utils.generateGuid();
        Dynamix.Callbacks[callbackId] = callback;
        var endpointParamsString = "createcontexthandler?callbackId=" + callbackId;
        WebClient.sendToDynamixInstance(endpointParamsString);
    },

    /**
     Unbind dynamix. This'll completely clear all communication with the Dynamix Framework.
     The web client will need to call bind() and start fresh.
     **/
    unbind: function () {
        try {
            var endpointParamsString = "dynamixunbind"
            var url = WebClient.getFinalUrl(endpointParamsString);
            $.ajax({
                url : url, 
                type : "GET", 
                headers : {
                    httpToken : WebClient.httpToken
                },
                error : function(jqXHR, textStatus, errorThrown){
                    if(DEBUG){
                        console.log(jqXHR);
                    }
                    if(jqXHR.status == 401){
                        if(DEBUG){
                            console.log("unbind call succeeded in Dynamix");
                        }
                        Dynamix.onDynamixUnbind();
                    } else {
                        if(DEBUG){
                            console.log("error in unbind call");
                        }
                    }
                   
                }
            });
        } catch (e) {
            console.log("Error unbinding Dynamix: " + e);
        }
    },

    /**
     Retrieve the version of the Ambient Dynamix Framework.
     */
    getDynamixVersion: function () {
        try {
            var endpointParamsString = "dynamixVersion"
            var url = WebClient.getFinalUrl(endpointParamsString);
            var version = null;
            $.ajax({
                url : url, 
                type : "GET", 
                headers : {
                    httpToken : WebClient.httpToken
                },
                async : false, 
                success : function(data){
                    version = WebClient.decryptSessionData(data);
                    if(DEBUG){
                        console.log(version);
                    }
                }
            });
            return version;
        } catch (e) {
            console.log("Error getting dynamix version : " + e.message);
        }
    },

    /**
     Set a listener for session changes.
     @param {function} listener
     @param {object} optParams
     @example
     Dynamix.setDynamixSessionListener(listener, {callback:callback});
     */
    setDynamixSessionListener: function (listener, optParams) {
        try {
            var listenerId = Utils.generateGuid();
            Dynamix.Listeners[listenerId] = listener;
            var endpointParamsString = "setdynamixsessionlistener?sessionListenerId=" + listenerId;
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error setting session listener" + e.message);
        }
    },

    /**
     Remove a context handler.
     NOTE : This'll also remove any context support that was added to the context handler and
     the web client will have to request a new handler to make any further context support requests.
     @param {Object} handler The handler object which should be removed.
     @param {Object} optParams The web client can provide an optional callback
     which'll be provided the success or failure state of the request.
     **/
    removeContextHandler: function (handler, optParams) {
        try {
            var endpointParamsString = "removecontexthandler?contextHandlerId=" + handler.id;
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error removing context handler : " + e);
        }
    },

    /**
     Close the current dynamix session.
     NOTE : This'll also remove any context support that was added by the web client. The client
     will have to open a new session before making any further requests to Dynamix.
     The client will still be bound to Dynamix.

     @param {Object} optParams The web client can provide an optional callback
     which'll be provided the success or failure state of the request.
     **/
    closeDynamixSession: function (optParams) {
        try {
            var endpointParamsString = "closedynamixsession?timestamp=" + Date.now();
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;

            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error closing dynamix session : " + e);
        }
    },

    /**
     Get information about all the context plugins.
     @params {function} callback method
     @example
     Dynamix.getAllContextPluginInformation();
     **/
    getAllContextPluginInformation: function (callback) {
        try {
            var callbackId = Utils.generateGuid();
            Dynamix.Callbacks[callbackId] = callback;
            var endpointParamsString = "getallcontextplugininformation" + "?callbackId=" + callbackId;
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error getting all context plugin information : " + e);
        }
    },

    /**
     Get information about all the context plugins of the given type.
     @param {String} contextType The context type for which the context
     plugins information should be fetched.
     @example
     Dynamix.getAllContextPluginsForType('org.ambientdynamix.contextplugins.batterylevel', callback);
     **/
    getAllContextPluginsForType: function (contextType, callback) {
        try {
            var callbackId = Utils.generateGuid();
            Dynamix.Callbacks[callbackId] = callback;
            var endpointParamsString = "getallcontextplugininformationfortype?contextType=" + contextType + "&callbackId=" + callbackId;
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error getting context plugins for the type " + contextType + " : " + e);
        }
    },

    /**
     Get information about all the currently installed context plugins.
     @example
     Dynamix.getInstalledContextPlugins(callback);
     **/
    getInstalledContextPlugins: function (callback) {
        try {
            var callbackId = Utils.generateGuid();
            Dynamix.Callbacks[callbackId] = callback;
            var endpointParamsString = "getinstalledcontextplugininformation?callbackId=" + callbackId;
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error getting context plugins for the type " + contextType + " : " + e);
        }
    },

    /**
     Get information about a particular plugin.
     @param {String} pluginId The plugin id for which the information should be fetched.
     @example
     Dynamix.getContextPluginInformation('org.ambientdynamix.contextplugins.batterylevel', callback);
     **/
    getContextPluginInformation: function (pluginId, callback) {
        try {
            var callbackId = Utils.generateGuid();
            Dynamix.Callbacks[callbackId] = callback;
            var endpointParamsString = "getcontextplugininformation?pluginId=" + pluginId + "&callbackId=" + callbackId;
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error getting plugin information for the pluginId " + pluginId + " : " + e);
        }
    },

    /**
     * Returns true if Dynamix is active; false otherwise.
     NOTE : The Dynamix Framework becomes inactive when the device screen turns off
     and active again when the screen is turned on.
     */
    isDynamixActive: function () {
        try {
            var endpointParamsString = "isdynamixactive";
            var url = WebClient.getFinalUrl(endpointParamsString);
            var isActive = null;
            $.ajax({
                url : url, 
                headers : {
                    httpToken : WebClient.httpToken
                },
                async : false, 
                success : function(data){
                    data = WebClient.decryptSessionData(data);
                    isActive = Utils.getBooleanFromString(data);
                    if(DEBUG){
                        console.log(isActive);
                    }
                }
            });
            return isActive;
        } catch (e) {
            console.log("Error connecting to Dynamix: " + e);
            return false;
        }
    },


    /**
     * Returns true if the specified token is valid (i.e. registered by
     * Dynamix); false otherwise.
     @private
     */
    isTokenValid: function (token) {
        try {
            var endpointParamsString = "isDynamixTokenValid";
            var url = WebClient.getFinalUrl(endpointParamsString);
            var isValid = null;
            $.ajax({
                url : url, 
                headers : {
                    httpToken : WebClient.httpToken
                },
                async : false, 
                success : function(data){
                    data = WebClient.decryptSessionData(data);
                    data = JSON.parse(data);
                    isValid = data.tokenValid;
                    if(DEBUG){
                        console.log(isValid);
                    }
                }
            });
            return isValid;
        } catch (e) {
            console.log("Error connecting to Dynamix: " + e);
            return false;
        }
    },

    /**
     Returns true if the web client's session is open; false otherwise.
     @example
     Dynamix.isSessionOpen();
     */
    isSessionOpen: function () {
        try {
            var endpointParamsString = "isdynamixsessionopen";
            var url = WebClient.getFinalUrl(endpointParamsString);
            var isOpen = null;
            $.ajax({
                url : url, 
                headers : {
                    httpToken : WebClient.httpToken
                },
                async : false, 
                success : function(data){
                    data = WebClient.decryptSessionData(data);
                    data = JSON.parse(data);
                    isOpen = data.sessionOpen;
                    if(DEBUG){
                        console.log(isOpen);
                    }
                }
            });
            return isOpen;
        } catch (e) {
            console.log("Error connecting to Dynamix: " + e);
            return false;
        }
    },

    // ===============================================================
    // Dynamix Event Handlers (used internally only)
    // ===============================================================

    // onDynamixUnbind
    onDynamixUnbind: function () {
        Dynamix.bound = false;
        Dynamix.binding = false;
        DynamixListener.onDynamixFrameworkUnbound();
    }
}

/**
 * Represents a Context Handler.
 * @constructor
 **/
var handler = function(id) {
    this.id = id;
    /**
     Add a new context support to the context handler.
     @param {String} pluginId Plugin Id
     @param {String} contextType Context Type
     @param {object} optParams Optional callback and listener
     @example
     var batteryLevelCallback = function(status, result) {
        switch(status) {
            case Dynamix.Enums.SUCCESS :
                break;
            case Dynamix.Enums.FAILURE :
                break;
            case Dynamix.Enums.INSTALL_PROGRESS :
                break;
            case Dynamix.Enums.WARNING :
                break;
        }
    };
     var batteryLevelListener = function(status, result) {
        switch(status) {
            case Dynamix.Enums.CONTEXT_RESULT :
                batteryLevel = parseInt(result.batteryLevel);
                console.log(result.batteryLevel);
                break;
        }
    };

     dynamixContextHandler.addContextSupport( "org.ambientdynamix.contextplugins.batterylevel",
     "org.ambientdynamix.contextplugins.batterylevel", {callback : batteryLevelCallback , listener : batteryLevelListener, pluginVersion : '2.0.0.1'});
     **/
    this.addContextSupport = function (pluginId, contextType, optParams) {
        try {
            var endpointParamsString = "addContextSupport?contextHandlerId=" + id +
                "&contextType=" + contextType + "&pluginId=" + pluginId;
            if (typeof optParams !== 'undefined') {
                if (typeof optParams.callback !== 'undefined') {
                    var callbackId = Utils.generateGuid();
                    Dynamix.Callbacks[callbackId] = optParams.callback;
                    endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
                }
                if (typeof optParams.listener !== 'undefined') {
                    var listenerId = Utils.generateGuid();
                    Dynamix.Listeners[listenerId] = optParams.listener;
                    endpointParamsString = endpointParamsString + "&contextListenerId=" + listenerId;
                }
                if (typeof optParams.pluginVersion !== 'undefined') {
                    endpointParamsString = endpointParamsString + "&pluginVersion=" + optParams.pluginVersion
                }
            }
           WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Add context support failed : " + e);
        }
    };

    /**
     Make a new context request. A context request can only be made if the
     context support request has been made successfully.
     @param {String} pluginId Id of the plugin.
     @param {String} contextType Context type for the context request.
     @param {function} callback a function to which Dynamix would return the context request result object.
     @param {Object} optParams Optional parameters for the request.
     @example
     var voiceControlContextRequestCallback = function(status, result) {
        switch(status) {
            case Dynamix.Enums.SUCCESS:
                doSomethingWithResult(result);
                break;
        }
    };
     dynamixContextHandler.contextRequest("org.ambientdynamix.contextplugins.speechtotext",
     "org.ambientdynamix.contextplugins.speechtotext.voiceresults", voiceControlContextRequestCallback, {pluginVersion : "2.0.1.2"} );
     **/
    this.contextRequest = function (pluginId, contextType, callback, optParams) {
        try {
            var callbackId = Utils.generateGuid();
            Dynamix.Callbacks[callbackId] = callback;
            var endpointParamsString = "contextrequest?contextHandlerId=" + id +
                "&contextType=" + contextType + "&pluginId=" + pluginId +
                "&callbackId=" + callbackId;
            if (typeof optParams !== 'undefined' && typeof optParams.pluginVersion !== 'undefined') {
                endpointParamsString = endpointParamsString + "&pluginVersion=" + optParams.pluginVersion;
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Context request failed : " + e);
        }
    };

    /**
     Make a configured request to the Dynamix Framework.
     Since, the request to be made is similar for addConfiguredContextSupport() and configuredContextRequest()
     we pass on the parameters from these methods to makeConfiguredRequest() which makes the relevant REST Request.

     NOTE : This method is used internally and the web client does not need to use this method.
     The client should make use of addConfiguredContextSupport() and configuredContextRequest() as required.
     @private
     */
    makeConfiguredRequest = function (endpoint, method, pluginId, contextType, optParams) {

        /**
         Converts an object to a string of paramaters which can be appended to a GET URL.
         */
        var getParamStringFromObject = function (obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return str.join("&");
        };

        var method = method.toUpperCase();
        var endpointParamsString = endpoint + "?contextHandlerId=" + id +
            "&contextType=" + contextType + "&pluginId=" + pluginId;

        if (typeof optParams !== 'undefined') {
            if (typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
            }
            if (typeof optParams.listener !== 'undefined') {
                var listenerId = Utils.generateGuid();
                Dynamix.Listeners[listenerId] = optParams.listener;
                endpointParamsString = endpointParamsString + "&contextListenerId=" + listenerId;
            }
            if (typeof optParams.pluginVersion !== 'undefined') {
                endpointParamsString = endpointParamsString + "&pluginVersion=" + optParams.pluginVersion;
            }
        }

        if (method == "GET" || method == "POST" || method == "PUT" || method == "DELETE") {
            endpointParamsString = endpointParamsString + "&" + getParamStringFromObject(optParams.params);
        } else {
            console.log("Unsupported REST Method");
        }

        var url = WebClient.getFinalUrl(endpointParamsString);
        if(typeof optParams.headers === "undefined")
            optParams.headers = {};
        optParams.headers["httpToken"] = WebClient.httpToken;
        $.ajax({
            url : url,
            type : method,
            headers : optParams.headers,
            error : function(jqXHR, textStatus, errorThrown){
                console.log("Send to dynamix request failed : " + jqXHR.status);
                if(DEBUG){
                    console.log("Request Failed : " + endpointParamsString);
                }
            }
        });
    };

    /**
     Allows the web clients to make configured context requests. These requests
     can only be made if a context support has been successfully requested.
     @param {String} method The Dynamix Framework supports GET, PUT, POST and DELETE Methods.
     @param {String} pluginId The id of the plugin
     @param {String} contextType The context type.
     @param {Object} optParams The optional parameters.
     @example
     var paramsObject = {color : "red", lux : 22};
     var headerObject = {"Content-type" : "application/x-www-form-urlencoded"};
     dynamixContextHandler.addConfiguredContextSupport("PUT", "org.ambientdynamix.contextplugins.samplepluginid, "org.ambientdynamix.contextplugins.samplecontexttype",
     {pluginVersion : '2.0.0.1', callback : configuredRequestCallback, params : params, headers : headerObject});
     **/
    this.configuredContextRequest = function (method, pluginId, contextType, optParams) {
        makeConfiguredRequest("configuredcontextrequest", method, pluginId, contextType, optParams);
    };

    /**
     Allows the web clients to add configured context support.

     @param {String} method The Dynamix Framework supports GET, PUT, POST and DELETE Methods.
     @param {String} pluginId The id of the plugin
     @param {String} contextType The context type.
     @param {Object} optParams The optional parameters.
     @example
     var paramsObject = {color : "red", lux : 22};
     var headerObject = {"Content-type" : "application/x-www-form-urlencoded"};
     dynamixContextHandler.addConfiguredContextSupport("PUT", "org.ambientdynamix.contextplugins.samplepluginid", "org.ambientdynamix.contextplugins.samplecontexttype",
     {pluginVersion : '2.0.0.1', callback : configuredRequestCallback, listener : configuredRequestListener, params : paramsObject, headers : headerObject});
     **/
    this.addConfiguredContextSupport = function (method, pluginId, contextType, optParams) {
        makeConfiguredRequest("addconfiguredcontextsupport", method, pluginId, contextType, optParams);
    };


    /**
     Get the context support information currently associated with this handler.
     @example
     dynamixContextHandler.getContextSupportInfo();
     */
    this.getContextSupportInfo = function (callback) {
        var callbackId = Utils.generateGuid();
        Dynamix.Callbacks[callbackId] = callback;
        var endpointParamsString = "getcontextsupport?contextHandlerId=" + this.id + "&callbackId=" + callbackId;
        WebClient.sendToDynamixInstance(endpointParamsString);
    };


    /**
     Remove context support for the given context type.
     @param {String} contextType The contextType for which the support should be removed.
     @param {Object} optParams The optional parameters. The web client can provide an optional callback.
     @example
     var disableVoiceControlPluginCallback = function(status, result) {
        switch(status) {
            case Dynamix.Enums.FAILURE :
                break;
            case Dynamix.Enums.SUCCESS :
                break;
        }
    };
     dynamixContextHandler.removeContextSupportForContextType("org.ambientdynamix.contextplugins.speechtotext.voiceresults",
     {callback : disableVoiceControlPluginCallback });
     **/
    this.removeContextSupportForContextType = function (contextType, optParams) {
        try {
            var endpointParamsString = "removecontextsupportforcontexttype?contextHandlerId=" + this.id + "&contextType=" + contextType;
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error removing context support for type : " + contextType + " : " + e);
        }
    };

    /**
     Remove context support for the given context type.
     @param {String} supportId The supportId for which the support should be removed.
     @param {Object} optParams The optional parameters. The web client can provide an optional callback.
     @example
     var removeVoiceControlSupportCallback = function(status, result) {
        switch(status) {
            case Dynamix.Enums.FAILURE :
                break;
            case Dynamix.Enums.SUCCESS :
                break;
        }
    };
     dynamixContextHandler.removeContextSupportForSupportId("org.ambientdynamix.contextplugins.speechtotext",
     {callback : removeVoiceControlSupportCallback });
     **/
    this.removeContextSupportForSupportId = function (supportId, optParams) {
        try {
            var endpointParamsString = "removecontextsupportforsupportid?contextHandlerId=" + this.id + "&supportId=" + supportId;
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error removing context support for type : " + contextType + " : " + e);
        }
    };

    /**
     Remove all context support from the given context handler.
     @param {Object} callback
     */
    this.removeAllContextSupport = function (optParams) {
        try {
            var endpointParamsString = "removeallcontextsupport?contextHandlerId=" + this.id;
            if (typeof optParams !== 'undefined' && typeof optParams.callback !== 'undefined') {
                var callbackId = Utils.generateGuid();
                Dynamix.Callbacks[callbackId] = optParams.callback;
                endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
            }
            WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error removing all context support : " + e.message);
        }
    };

    /**
     Open the configuration view defined by the plugin.
     @params {String} pluginId
     @params {Object} optParams optional Paramaters for the request.
     @example
     dynamixContextHandler.openContextPluginConfigurationView('org.ambientdynamix.contextplugins.batterylevel',
     {callback:callback, pluginVersion:'2.0.0.1'});
     */
    this.openContextPluginConfigurationView = function (pluginId, optParams) {
        try {
            var endpointParamsString = "opencontextpluginconfigurationview?pluginId=" + pluginId;
            if (typeof optParams !== 'undefined') {
                if (typeof optParams.callback !== 'undefined') {
                    var callbackId = Utils.generateGuid();
                    Dynamix.Callbacks["callbackId"] = optParams.callback;
                    endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
                }
                if (typeof optParams.pluginVersion !== 'undefined') {
                    endpointParamsString = endpointParamsString + "&pluginVersion=" + optParams.pluginVersion;
                }
            }
           WebClient.sendToDynamixInstance(endpointParamsString);
        }
        catch (e) {
            console.log("Error opening context plugin configuration view for plugin Id : " + pluginId);
        }
    };

    /**
     Open the default configuration view defined by the plugin.
     @params {String} pluginId
     @params {Object} optParams optional parameters for the request.
     @example
     dynamixContextHandler.openDefaultContextPluginConfigurationView('org.ambientdynamix.contextplugins.batterylevel',
     {callback:callback, pluginVersion:'2.0.0.1'});
     */
    this.openDefaultContextPluginConfigurationView = function (pluginId, optParams) {
        try {
            var endpointParamsString = "opendefaultcontextpluginconfigurationview?pluginId=" + pluginId;
            if (typeof optParams !== 'undefined') {
                if (typeof optParams.callback !== 'undefined') {
                    var callbackId = Utils.generateGuid();
                    Dynamix.Callbacks["callbackId"] = optParams.callback;
                    endpointParamsString = endpointParamsString + "&callbackId=" + callbackId;
                }
                if (typeof optParams.pluginVersion !== 'undefined') {
                    endpointParamsString = endpointParamsString + "&pluginVersion=" + optParams.pluginVersion;
                }
            }
           WebClient.sendToDynamixInstance(endpointParamsString);
        } catch (e) {
            console.log("Error opening default context plugin configuration view for plugin Id : " + pluginId);
        }
    };
}

/**
 @namespace DynamixListener
 @private
 **/
var DynamixListener = {

    /**
     * Called after the web client successfully binds itself with the Dynamix Framework.
     * This is turn raises the listener provided by the web client while making a bind request.
     * The web client after this can successfully open a session with Dynamix.
     */
    onDynamixFrameworkBound: function () {
        Dynamix.binding = false;
        Dynamix.bound = true;
        Dynamix.Listeners['bind-state-listener'](Dynamix.Enums.BOUND);
    },

    /**
     * Called after the web client loses connection to Dynamix. Raised in
     * response to 'Dynamix.unbind()' or Dynamix Framework initiated unbinds.
     * This is turn raises the listener provided by the web client while making a bind request.
     * The web client can no more open sessions with Dynamix before binding again.
     **/
    onDynamixFrameworkUnbound: function () {
        console.log("onDynamixFrameworkUnbound");
        Dynamix.binding = false;
        Dynamix.bound = false;
        Dynamix.Listeners['bind-state-listener'](Dynamix.Enums.UNBOUND);
    },

    /**
     * Called if no connection can be established to Dynamix. Note that it is
     * NOT possible to interact with Dynamix if this event is raised.
     */
    onDynamixFrameworkBindError: function (result) {
        console.log("onDynamixFrameworkBindError :" + result);
        Dynamix.binding = false;
        Dynamix.bound = false;
        Dynamix.Listeners['bind-state-listener'](Dynamix.Enums.BIND_ERROR);
    },

    /**
     * Called when the web client's session has opened.
     * This in turn calls the listener provided by the web client when opening a session.
     * The web client needs to open a session after it is successfully
     * bound with Dynamix. The client can then create a handler using
     * which it can make context requests to the Dynamix Framework.
     **/
    onSessionOpened: function (listenerId, result) {
        console.log("onSessionOpened");
        if (Dynamix.EncryptionParams.encrypt) {
        }
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.SESSION_OPENED);
    },

    /**
     * Called when the web client's Dynamix session has closed. This in turn will
     * raise the session listener provided by the web client when opening a new Session.
     *
     * After this event the web client cannot make requests to the Dynamix Framework except
     * apart from unbinding or opening new sessions.
     **/
    onSessionClosed: function (listenerId) {
        console.log("onSessionClosed");
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.SESSION_CLOSED);
    },

    /**
     * Called when the session is successfully opened and raises
     * the callback provided by the web client when opening a Session.
     **/
    onSessionCallbackSuccess: function (callbackId) {
        console.log("onSessionCallbackSuccess");
        console.log(Dynamix.Callbacks[callbackId]);
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.SUCCESS);
    },

    /**
     * Called when the Dynamix Framework becomes active.
     **/
    onDynamixFrameworkActive: function (listenerId) {
        console.log("onDynamixFrameworkActive");
        Dynamix.Listeners[listenerId](Dynamix.Enums.DYNAMIX_FRAMEWORK_ACTIVE);
    },

    /**
     * Called when the Dynamix Framework becomes inactive.
     */
    onDynamixFrameworkInactive: function (listenerId) {
        console.log("onDynamixFrameworkInactive");
        Dynamix.Listeners[listenerId](Dynamix.Enums.DYNAMIX_FRAMEWORK_INACTIVE);
    },

    /**
     * Raised when a handler is successfully created and in turn
     * provides a new handler object to the callback provided by the web client
     * when creating a new context handler.
     **/
    onContextHandlerCallbackSuccess: function (callbackId, result) {
        try {
            if(DEBUG){
                console.log("Handler created successfully");
            }
            var contextHandlerId = result.handlerId;
            var h = new handler(contextHandlerId);
            Dynamix.Handlers[contextHandlerId] = h;
            Dynamix.Callbacks[callbackId](Dynamix.Enums.SUCCESS, h);
        } catch (e) {
            console.log("Couldn't pass newly created handler to callback : " + e);
        }
    },

    /**
     * The following onContextSupportCallback* methods in turn raise the callback that
     * was provided while adding the context support.
     **/

    /**
     * Called when the context support requested by the web client was added successfully.
     **/
    onContextSupportCallbackSuccess: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.SUCCESS, result.supportInfo);
    },

    /**
     * Called when the context support requested by the web client was added successfully.
     **/
    onContextSupportCallbackWarning: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.WARNING, result);
    },

    /**
     * Called when the context support requested by the web client failed.
     **/
    onContextSupportCallbackFailure: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.FAILURE, result);
    },

    /**
     * Called when a plugin installation is in progress with the %age progress.
     **/
    onContextSupportCallbackProgress: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.INSTALL_PROGRESS, progress);
    },

    onCallbackFailure: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.FAILURE, result);
    },

    onCallbackSuccess: function (callbackId) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.SUCCESS);
    },

    /**
     * Called when a new context result is received from the Dynamix Framework.
     * The result is passed to the listener that was provided by the web client
     * while adding the context support.
     **/
    onContextResult: function (listenerId, result) {
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.CONTEXT_RESULT, result);
    },

    onContextListenerRemoved: function (listenerId, result) {
        Dynamix.Listeners[listenerId](Dynamix.Enums.CONTEXT_LISTENER_REMOVED);
    },

    onContextSupportRemoved: function (listenerId, result) {
        Dynamix.Listeners[listenerId](Dynamix.Enums.CONTEXT_SUPPORT_REMOVED, result);
    },

    /**
     * Called when a plugin is enabled. The result
     * is passed on to the listener that was provided by the web client while
     * opening a new session with Dynamix.
     **/
    onContextPluginEnabled: function (listenerId, result) {
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.PLUGIN_ENABLED, result.plugin);
    },

    /**
     * Called when a plugin is disabled. The result
     * is passed on to the listener that was provided by the web client while
     * opening a new session with Dynamix.
     **/
    onContextPluginDisabled: function (listenerId, result) {
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.PLUGIN_DISABLED, result.plugin);
    },

    /**
     * Called when a plugin installation requested by the web client fails.
     **/
    onContextPluginInstallFailed: function (listenerId, result) {
        Dynamix.Listeners[listenerId](Dynamix.Enums.PLUGIN_INSTALL_FAILED, result.plugin);
    },

    /**
     * Called when a plugin is successfully installed. This in turn sends the details of the
     * installed plugin to the listener provided by the web client
     * while opening a new session with Dynamix
     **/
    onContextPluginInstalled: function (listenerId, result) {
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.PLUGIN_INSTALLED, result.plugin);
    },

    /**
     * Called when a plugin is successfully uninstalled. This in turn sends the details of the
     * uninstalled plugin to the listener provided by the web client
     * while opening a new Dynamix Session.
     **/
    onContextPluginUninstalled: function (listenerId, result) {
        Dynamix.Listeners[listenerId](
            Dynamix.Enums.PLUGIN_UNINSTALLED, result.plugin);
    },

    /**
     * Called when an error occurs with the plugin. This in turn sends the details of the
     * error to the listener provided by the web client
     * while opening a new Dynamix Session.
     **/
    onContextPluginError: function (callbackId, result) {
        Dynamix.Listeners[callbackId](
            Dynamix.Enums.PLUGIN_ERROR, result);
    },

    /**
     * Called when a context request made by the web client is successful. Raises the callback
     * that was provided while making the context request with the relevant result.
     **/
    onContextRequestCallbackSuccess: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.SUCCESS, result);
    },

    /**
     * Called when a context request made by the web client is unsuccessful. Raises the callback
     * that was provided while making the context request with the relevant error message.
     **/
    onContextRequestCallbackFailure: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](
            Dynamix.Enums.FAILURE, result);
    },

    /**
     * Called when the Dynamix Framework starts discovering plugins.
     **/
    onContextPluginDiscoveryStarted: function (listenerId) {
        Dynamix.Listeners[listenerId](Dynamix.Enums.PLUGIN_DISCOVERY_STARTED);
    },

    /**
     * Called when the Dynamix Framework finishes discovering plugins.
     **/
    onContextPluginDiscoveryFinished: function (listenerId, result) {
        Dynamix.Listeners[listenerId](Dynamix.Enums.PLUGIN_DISCOVERY_FINISHED,
            result);
    },

    /**
     * Called when the handler.getContextSupport() method is successful.
     * @param callbackId
     * @param result
     */
    onContextSupportQuerySuccess: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.SUCCESS, result.supportList);
    },

    /**
     * Called when the handler.getContextSupport() method is unsuccessful.
     * @param callbackId
     * @param result
     */
    onContextSupportQueryFailure: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.FAILURE, result);
    },

    /**
     * called when GET_CONTEXT_PLUG_IN, GET_ALL_CONTEXT_PLUG_INS, GET_INSTALLED_CONTEXT_PLUG_INS,
     * GET_ALL_CONTEXT_PLUG_INS_FOR_TYPE calls are successful
     * @param callbackId
     * @param result
     */
    onContextPluginQuerySuccess: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.SUCCESS, result.supportList);
    },

    /**
     * called when GET_CONTEXT_PLUG_IN, GET_ALL_CONTEXT_PLUG_INS, GET_INSTALLED_CONTEXT_PLUG_INS,
     * GET_ALL_CONTEXT_PLUG_INS_FOR_TYPE calls are unsuccessful
     * @param callbackId
     * @param result
     */
    onContextPluginQueryFailure: function (callbackId, result) {
        Dynamix.Callbacks[callbackId](Dynamix.Enums.FAILURE, result);
    }
}

$(document).ready(function(){
    $(window).on('beforeunload', function(){
        if(Dynamix.bound){
            Dynamix.unbind();
        }
    });
});
