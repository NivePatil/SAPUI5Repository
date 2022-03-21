
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",

], function (Object, MessageBox) {
	"use strict";

	return Object.extend("com.slb.sup.vessel.tracker.zsupvesltrckr.controller.ErrorHandler", {

		/**
		 * @class Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @public
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;

			this._bMessageOpen = false;

			this._callModelFailed(oComponent.getModel(), this);


		},
		/**
		 * This function is being called when odata service returns an error
		 * @param {object} oModel - OData Model object which is being used incase of service failure 
		 * @param {object} that - reference of controller
		 */
		_callModelFailed: function (oModel, that) {
			oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showServiceError(oParams);
			}, this);

			oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._processError(oParams);
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 *
		 * @param {object} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;

			var sErrorText = this._getErrorMessage(sDetails);
			MessageBox.error(
				sErrorText,
				{
					id: "serviceErrorMessageBox",
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		//To Process all errors
		_processError: function (oError) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			var message = "";
			var messageDetails = "";
			var msgTyp = "";
			var body = {};
			var oMessage='';
			if (oError.response || oError.responseText) {
				if (oError.response.body && oError.response.body !== '') {
					try {
						oMessage = JSON.parse(oError.response.body);
						message = (oMessage.error.message.value ? oMessage.error.message.value : null);
						messageDetails = oMessage.error.code + " : " + message;
					} catch (e) {
						messageDetails = oError.response.body;
					}
				}
				else if (oError.response.responseText) {
					body = oError.response.responseText;
					try {
						body = JSON.parse(body);
						if (body.error.innererror && body.error.innererror.errordetails) {
							var errors = body.error.innererror.errordetails;
							for (var i = 0; i < errors.length; i++) {
								if (errors[i].code.match("/IWBEP")) {
									continue;
								}
								messageDetails += errors[i].code + " : " + errors[i].message + "\n";
							}
						}
						if (messageDetails === "") {
							messageDetails = body.error.code + " : " + body.error.message.value;
						}
						message = body.error.message.value;
						msgTyp = body.error.innererror.errordetails[0].severity;
					} catch (e) {
						messageDetails = oError.response.responseText;
						jQuery.sap.log.warning(
							"Could not parse the response",
							["parseError"],
							["com.slb.sup.vessel.tracker"]
						);
					}
				}
			}
			if (message === "") {
				message = this._oResourceBundle.getText("INTERNAL_ERROR");
			}
			if (messageDetails === "") {
				messageDetails = this._oResourceBundle.getText("INTERNAL_ERROR_BODY");
			}
			oMessage = {
				message: message,
				details: messageDetails,
				type: sap.m.MessageBox.Icon.ERROR,
			};
			var msgTitle = "Error";
			if (msgTyp && msgTyp === "info") {
				oMessage.type = sap.m.MessageBox.Icon.INFO;
				msgTitle = "Information";
			}
			sap.m.MessageBox.show(oMessage.message, {
				icon: oMessage.type,
				title: msgTitle,
				actions: [sap.m.MessageBox.Action.OK],
				details: oMessage.details,
				onClose: function (oAction) {
					this._bMessageOpen = false;
				}.bind(this)
			});
		},

		_getErrorMessage: function (oError) {
			var sErrorText = '',oMessage='';
			if (oError.response && oError.response.body && oError.response.body !== "") {
				try {
					oMessage = JSON.parse(oError.response.body);
					return (oMessage.error.message.value ? oMessage.error.message.value : null);
				} catch (e) {
					return oError.response.body;
				}
			} else if (oError.response.responseText && oError.response.responseText !== "") {
				try {
					oMessage = JSON.parse(oError.response.responseText);
					try {
						return oMessage.error.message.value;
					} catch (e) {
						/**Code to capture multiple error message of a service in single message box
						*/
						var errorDetails = errorObj.error.innererror.errordetails;
						for (var j = 0; j < errorDetails.length; j++) {
							sErrorText += '\u2022 ' + errorDetails[j].message + '\n';
						}
						return sErrorText;
					}
				} catch (e) {
					return oError.response.responseText;
				}
			} else if (oError.getParameter("responseText") || oError.getParameter("response").body) {
				return oError.getParameter("responseText") ? oError.getParameter("responseText") : oError.getParameter("response").body;
			} else {
				return null;
			}
		},

	});

});