/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */

sap.ui.define([ "sap/ui/core/UIComponent", "com/slb/cpf/online/nonpo/zcpfnpotmplte/controller/ErrorHandler",
		], function(UIComponent, ErrorHandler ) {
	    "use strict";
	    return UIComponent.extend("com.slb.cpf.online.nonpo.zcpfnpotmplte.Component", {
		metadata : {
		    manifest : "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the
		 * startup of the app and calls the init method once. In this
		 * function, the resource and application models are set and the
		 * router is initialized.
		 * 
		 * @public
		 * @override
		 */
		init : function() {
		    // initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);
		    // call the base component's init function
		    UIComponent.prototype.init.apply(this, arguments);
		    // get Root control
		    var oRootControl = this.getAggregation("rootControl").addStyleClass(this.getCompactCozyClass());
		    // create the views based on the url/hash
		    this.getRouter().initialize();
		},

		/**
		 * This method can be called to determine whether the
		 * sapUiSizeCompact or sapUiSizeCozy design mode class should be
		 * set, which influences the size appearance of some controls.
		 * 
		 * @public
		 */
		getCompactCozyClass : function() {
		    if (!this._sCompactCozyClass) {
				if (!sap.ui.Device.support.touch) { // apply compact
								    // mode if
				    // touch is not supported;
				    // this could me made
				    // configurable for the user
				    // on "combi" devices with
				    // touch AND mouse
				    this._sCompactCozyClass = "sapUiSizeCompact";
				} 
				else {
				    this._sCompactCozyClass = "sapUiSizeCozy"; // needed
										// for
				    // desktop-first
				    // controls like
				    // sap.ui.table.Table
				}
		    }
		    return this._sCompactCozyClass;
		},

		destroy : function() {
		    this._oErrorHandler.destroy();
		    // call the base component's destroy function
		    UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * Creates a promise which is resolved when the metadata is
		 * loaded.
		 * 
		 * @param {sap.ui.core.Model}
		 *                oModel the app model
		 * @private
		 */
		
	    });
	});
