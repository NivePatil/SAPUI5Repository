/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
    [ "sap/ui/core/mvc/Controller", "sap/ui/core/routing/History", "sap/ui/core/util/Export", "sap/ui/core/util/ExportTypeCSV" ],
    function(Controller, History, Export, ExportTypeCSV) {
        "use strict";
        return Controller.extend(
                "com.slb.cpf.online.nonpo.zcpfnpotmplte.controller.BaseController",
                {

                /**
                 * Convenience method for accessing the
                 * event bus.
                 * 
                 * @public
                 * @returns {sap.ui.core.EventBus} the
                 *          event bus for this component
                 */
                /*getEventBus : function() {
                    return this.getOwnerComponent()
                        .getEventBus();
                },*/

                /**
                 * Convenience method for accessing the
                 * router.
                 * 
                 * @public
                 * @returns {sap.ui.core.routing.Router}
                 *          the router for this
                 *          component
                 */
                getRouter : function() {
                    return sap.ui.core.UIComponent.getRouterFor(this);
                },

                /**
                 * Convenience method for getting the
                 * view model by name.
                 * 
                 * @public
                 * @param {string}
                 *                [sName] the model name
                 * @returns {sap.ui.model.Model} the
                 *          model instance
                 */
                getModel : function(sName) {
                    return this.getView().getModel(sName);
                },

                /**
                 * Convenience method for setting the
                 * view model.
                 * 
                 * @public
                 * @param {sap.ui.model.Model}
                 *                oModel the model
                 *                instance
                 * @param {string}
                 *                sName the model name
                 * @returns {sap.ui.mvc.View} the view
                 *          instance
                 */
                setModel : function(oModel, sName) {
                    return this.getView().setModel( oModel, sName);
                },
                /**
                 * Getter for the resource bundle.
                 * 
                 * @public
                 * @returns {sap.ui.model.resource.ResourceModel}
                 *          the resourceModel of the
                 *          component
                 */
                getResourceBundle : function() {
                    return this.getOwnerComponent().getModel("i18n").getResourceBundle();
                },

                /**
                 * Navigates back in the browser
                 * history, if the entry was created by
                 * this app. If not, it navigates to a
                 * route passed to this function.
                 * 
                 * @public
                 * @param {string}
                 *                sRoute the name of the
                 *                route if there is no
                 *                history entry
                 * @param {object}
                 *                mData the parameters
                 *                of the route, if the
                 *                route does not need
                 *                parameters, it may be
                 *                omitted.
                 */
                onBackNav : function(sRoute, mData) {
                    var oHistory = sap.ui.core.routing.History.getInstance(), sPreviousHash = oHistory.getPreviousHash(), 
                        oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
                    var oComponent = this.getOwnerComponent();
                    if (sPreviousHash !== undefined || !oCrossAppNavigator) {
                    // The history contains a
                    // previous entry
                    history.go(-1);
                    } 
                    else if (oCrossAppNavigator) {
                    // Navigate back to FLP home
                    // TODO: Test this in a working
                    // sandbox, with the current
                    // version it is not possible
                    oCrossAppNavigator.toExternal({
                        target : {
                            /*semanticObject: "Zshipment",
                              action: "Monitor",*/
                        shellHash : "#"
                        }
                    }, oComponent);
                    }
                }    
          });
});