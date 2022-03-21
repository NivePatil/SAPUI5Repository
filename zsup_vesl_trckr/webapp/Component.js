sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/slb/sup/vessel/tracker/zsupvesltrckr/model/models",
        "com/slb/sup/vessel/tracker/zsupvesltrckr/controller/ErrorHandler"
    ],
    function (UIComponent, Device, models, ErrorHandler) {
        "use strict";

        return UIComponent.extend("com.slb.sup.vessel.tracker.zsupvesltrckr.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                this._oErrorHandler = new ErrorHandler(this);
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },
            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    // check whether FLP has already set the content density class; do nothing in this case
                    if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    }
                    else {
                        // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                        this._sContentDensityClass = "sapUiSizeCompact";//"sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            },
            destroy: function () {
                this._oErrorHandler.destroy();
                // call the base component's destroy function
                UIComponent.prototype.destroy.apply(this, arguments);
            }
        });
    }
);