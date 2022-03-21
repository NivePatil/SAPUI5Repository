
sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    
], function (Object, MessageBox) {
"use strict";

return Object.extend("com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.controller.ErrorHandler", {

    /**
     * @class Handles application errors by automatically attaching to the model events and displaying errors when needed.
     * @public
     */
    constructor : function (oComponent) {
        this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
        this._oComponent = oComponent;
        //this._oModel = oComponent.getModel();
        
        this._bMessageOpen = false;
        
        this._callModelFailed(oComponent.getModel(),this);
        
        
        },
        
        _callModelFailed : function(oModel,that){
            oModel.attachMetadataFailed(function (oEvent) {
                var oParams = oEvent.getParameters();
                that._showServiceError(oParams);
            }, that);

            oModel.attachRequestFailed(function (oEvent) {
                var oParams = oEvent.getParameters();
                var index = oParams.url.indexOf("PrintPdfSet");
                if(index !== -1){
                    //if printpdf set is called, response has to be handledin another browser window
                    if (oParams.response.message == "no handler for data") {
                        window.open("/sap/opu/odata/SAP/ZSUP_GOLD_LHS_DASHBOARD_SRV/"+oParams.url); 
                                //sRead+ "/$value");
                    }
                    else {
                        // Start of changes for CD# 2000025529 : Adding Download Cl functionality to the Shipment Content Delivery table
                        if(oParams.url.includes("IsInitial")){
//								MessageBox.error(oParams.response.statusText);
                            MessageBox.error(JSON.parse(oEvent.mParameters.response.responseText).error.message.value,{
                                styleClass : "sapUiSizeCompact"
                            });
                        }
                        // End of changes for CD# 2000025529 : Adding Download Cl functionality
                    
                    else{	var error = JSON.parse(oEvent.mParameters.response.responseText).error.message.value;
                    var docNo = oParams.url.split(",")[2].split("=")[1].replace(/'/g,'');
                    
                    if(oParams.url.indexOf("Application='V7'") !== -1){
                        MessageBox.error(this._oResourceBundle.getText("ErrorHandler.ShipmentNo")+docNo + " - "+error,{
                            
                            styleClass : "sapUiSizeCompact"
                        });
                    } 
                    else{
                        MessageBox.error(this._oResourceBundle.getText("ErrorHandler.DeliveryNo")+docNo + " - "+error,{
                            
                            styleClass : "sapUiSizeCompact"
                        });
                    }
                    
}
                    }
                    }else{
                        that._showServiceError(oParams);
                    }
                
            }, that);
        },
        
    /**
     * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
     * The user can try to refresh the metadata.
     *
     * @param {string} sDetails a technical error to be displayed on request
     * @private
     */
        _showServiceError : function (sDetails) {
            if (this._bMessageOpen) {
                return;
            }
            this._bMessageOpen = true;
            
            var sErrorText = this.getErrorMessage(sDetails);
            MessageBox.error(
                    sErrorText,
                    {
                        id : "serviceErrorMessageBox",
//							details : sDetails,
                        styleClass : this._oComponent.getCompactCozyClass(),
                        actions : [MessageBox.Action.CLOSE],
                        onClose : function () {
                            this._bMessageOpen = false;
                        }.bind(this)
                    }
                );
    },
    
    getErrorMessage: function(oError) {
        var sErrorText='';
        if(oError.response && oError.response.body && oError.response.body != ""){
            try{
                var oMessage = JSON.parse(oError.response.body);
                 return (oMessage.error.message.value ? oMessage.error.message.value : null);
            }catch(e){
                return oError.response.body;
            }
        }else if(oError.response.responseText && oError.response.responseText != ""){
            try{
                var oMessage = JSON.parse(oError.response.responseText);
                try{
                    return oMessage.error.message.value;
                }catch(e){
                    /**Code to capture multiple error message of a service in single message box
                    */
                    var errorDetails = errorObj.error.innererror.errordetails;
                    for(var j=0;j<errorDetails.length;j++){
                        sErrorText += '\u2022 '+ errorDetails[j].message+'\n';
                    }
                    return sErrorText;
                }
            }catch(e){
                return oError.response.responseText;
            }
        }else if(oError.getParameter("responseText") || oError.getParameter("response").body){
            return oError.getParameter("responseText") ? oError.getParameter("responseText"): oError.getParameter("response").body;
        }else {
            return null;
        }			
    },

});

});