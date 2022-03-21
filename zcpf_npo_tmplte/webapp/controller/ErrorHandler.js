 
// * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 
sap.ui.define(["sap/ui/base/Object", "sap/m/MessageBox",
		
	], function (Object, MessageBox) {
	"use strict";

	return Object.extend("com.slb.cpf.online.nonpo.zcpfnpotmplte.controller.ErrorHandler", {

		constructor : function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;

			this._oModel.attachEvent("metadataFailed", function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showMetadataError(
					oParams.statusCode + " (" + oParams.statusText + ")\r\n" +
					oParams.message + "\r\n" +
					oParams.responseText + "\r\n"
				);
			}, this);

			this._oModel.attachEvent("requestFailed", function (oEvent) {
				var oParams = oEvent.getParameters(), index = oParams.url.indexOf("PrintPdfSet"), oBusyDialog = new sap.m.BusyDialog();
				oBusyDialog.open();
				if(index !== -1){
					//if printpdf set is called, response has to be handled in another browser window
					//This if block will be called from shipment content screen, onPrintPress function
					// Success part of submitChanges - group - printIEGroupId
					if (oParams.response.message == "no handler for data") {
						window.open("/sap/opu/odata/SAP/ZCPF_VIM_NPO_TEMPLATE_SRV/"+oParams.url);
						oBusyDialog.close();
					} 
					else {
						var error = JSON.parse(oEvent.mParameters.response.responseText).error.message.value;
						var docNo = oParams.url.split(",")[2].split("=")[1].replace(/'/g,'');
						
						if(oParams.url.indexOf("Application='V7'") !== -1){
							MessageBox.error(this._oResourceBundle.getText("ErrorHandler.ShipmentNo")+docNo + " - "+error,{
								title: "Error",
			    				onClose:  function(oAction){
			    					oBusyDialog.close();//Close the busy indicator so that user will not be able to click on any control
			    				},
								styleClass : "sapUiSizeCompact"
							});
						}
						else{
							MessageBox.error(this._oResourceBundle.getText("ErrorHandler.DeliveryNo")+docNo + " - "+error,{
								title: "Error",
			    				onClose:  function(oAction){
			    					oBusyDialog.close();//Close the busy indicator so that user will not be able to click on any control
			    				},
								styleClass : "sapUiSizeCompact"
							});
						}
					}
				}
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				// oParams.response.statusCode can be string or number
				if (oParams.response.statusCode != 404 || 
					(oParams.response.statusCode == 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
	            	var sMessage, oResponse;
	            	try {
	            		oResponse = jQuery.parseJSON(oEvent.getParameter("responseText"));
	            	} 
	            	catch (err) {
	            		oResponse = null;
	            		oBusyDialog.close();
	            	}
	            	// display error message of OData service if available
	            	if (oResponse && oResponse.error && oResponse.error.innererror && oResponse.error.innererror.errordetails && 
	            	    oResponse.error.innererror.errordetails[0] && oResponse.error.innererror.errordetails[0].message) {
	            		sMessage = oParams.response.statusCode + " (" + oParams.response.statusText + ")\r\n" +
	            					oResponse.error.innererror.errordetails[0].message; 
	            	} 
	            	else {
	            		sMessage = oParams.response.statusCode + " (" + oParams.response.statusText + ")\r\n" +
	            					oParams.response.message + "\r\n" + oParams.response.responseText + "\r\n";
	            	}
				}
			}, this);
		},
		_showMetadataError : function (sDetails) {
			MessageBox.show(this._oResourceBundle.getText("ERR_METADATA_TEXT"), {
					id : "metadataErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._oResourceBundle.getText("ERR_METADATA_TITLE"),
					details: sDetails,
					styleClass: this._oComponent.getCompactCozyClass(),
					actions: [MessageBox.Action.RETRY, sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this.bMessageOpen = false;
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},
	});
});