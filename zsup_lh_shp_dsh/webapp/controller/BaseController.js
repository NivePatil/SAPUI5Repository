/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui
	.define(
		[ "sap/ui/core/mvc/Controller", 
            "sap/ui/core/routing/History",
			'sap/m/MessagePopover',
			'sap/m/MessagePopoverItem',
            "sap/ui/model/json/JSONModel",
			"sap/ui/core/util/Export",
			"sap/ui/core/util/ExportTypeCSV",],
		function(Controller, History, MessagePopover, MessagePopoverItem, JSONModel,Export,ExportTypeCSV) {
		    "use strict";

		    return Controller
			    .extend(
				    "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.controller.BaseController",
				    {

					/**
					 * Convenience method for accessing the
					 * event bus.
					 * 
					 * @public
					 * @returns {sap.ui.core.EventBus} the
					 *          event bus for this component
					 */
					getEventBus : function() {
					    return this.getOwnerComponent()
						    .getEventBus();
					},

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
					    return sap.ui.core.UIComponent
						    .getRouterFor(this);
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
					    return this.getView().getModel(
						    sName);
					},
					getMainModel : function(sName) {
					    return this.getOwnerComponent().getModel();
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
					    return this.getView().setModel(
						    oModel, sName);
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
					    return this.getOwnerComponent()
						    .getModel("i18n")
						    .getResourceBundle();
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
					    var oHistory = sap.ui.core.routing.History
						    .getInstance(), sPreviousHash = oHistory
						    .getPreviousHash(), oCrossAppNavigator = sap.ushell
						    && sap.ushell.Container
						    && sap.ushell.Container
							    .getService("CrossApplicationNavigation");
					    var oComponent = this
						    .getOwnerComponent();
					    if (sPreviousHash !== undefined
						    || !oCrossAppNavigator) {
						// The history contains a
						// previous entry
						history.go(-1);
					    } else if (oCrossAppNavigator) {
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
					},
					
					downloadToExcel : function(oModel,totalColumns){
						//Downloading sap ui table content to excel sheet- read the table columns, read the model property attached to it
						//add these two in columnsArray, pass columnsArray in export object
						var columnObj = {
								name : "",
								template : {
									content : ""
								}
						};
						var columnArray = [];
						
						for(var i = 0;i < totalColumns.length;i++){
							columnObj = {
									name : "",
									template : {
										content : ""
									}
							};
							columnObj.name = totalColumns[i].mAggregations.label.getProperty("text");
                            if(totalColumns[i].mAggregations.template.mBindingInfos.text){
                            if(totalColumns[i].mAggregations.template.mBindingInfos.text.parts.length > 1){
                            for(var j=0;j < totalColumns[i].mAggregations.template.mBindingInfos.text.parts.length ; j++){
                                   if(totalColumns[i].mAggregations.template.mBindingInfos.text){
                                          
                                          columnObj.template.content += "{" +totalColumns[i].mAggregations.template.mBindingInfos.text.parts[j].path + "}" + "   ";
                                   }
                            }
                            }else{
                                   columnObj.template.content = "{" +totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].path+"}";
                            }
                            }
                            else if(totalColumns[i].mAggregations.template.mBindingInfos.value){
                                   if(totalColumns[i].mAggregations.template.mBindingInfos.value.parts.length > 1){
                                          for(var j=0;j < totalColumns[i].mAggregations.template.mBindingInfos.value.parts.length ; j++){
                                                 if(totalColumns[i].mAggregations.template.mBindingInfos.value){
                                                       
                                                        columnObj.template.content += "{" +totalColumns[i].mAggregations.template.mBindingInfos.value.parts[j].path + "}" + "   ";
                                                 }
                                          }
                                   }else{
                                          columnObj.template.content = "{" +totalColumns[i].mAggregations.template.mBindingInfos.value.parts[0].path+"}";
                                   }
                            }
                            
                            columnArray.push(columnObj);
                     }
                            
             var oExport = new Export({
                       exportType : new ExportTypeCSV({
                          
                           fileExtension: "xls",
                           separatorChar: "\t",
                           charset: "utf-8",
                           mimeType: "application/vnd.ms-excel"
                       }),
                       models : oModel,
                       rows : {
                           path : "/",
                          
                       },
                       columns : columnArray
                   });
                   this.onExcelShipCon(oExport);
              },
              onExcelShipCon:function(oExport){
                     try{
                            oExport.saveFile()
                     }
                     catch(oError) {
                            MessageToast.show(this.getResourceBundle().getText("exportToExcelError"));
                      
                  }
              

              },     	   
					
					
					
					
					
					
					//club message--method is useful to open fragment as well
					openMessagePopover : function(oEvent){
						
                        var oMessageTemplate = new MessagePopoverItem({
                                      type: '{type}',
                                      title: '{title}',
                                      description: '{description}'
                               });
                        this.oMessagePopover1 = new MessagePopover({
                                      items: {
                                             path: '/',
                                             template: oMessageTemplate
                                      }
                               });
                        
                         var oModel = new JSONModel([]);
                                      this.oMessagePopover1.setModel(oModel);
                                      jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(),this.oMessagePopover1);
                                      this.oMessagePopover1.openBy(oEvent.getSource());
                        },
                        handleMessagePopoverPress :function(results){
                        var finalResult =[];
                        finalResult.push(results[1]);
                        finalResult.push(results[4]);
                         var templateObject = {},templateArray=[],that=this;
                         finalResult.forEach(function(obj){
                                templateObject = {};
                                templateObject.type = that.fetchtemplateObjectType(obj).type;
                                templateObject.title = that.fetchtemplateObjectType(obj).title;
                                templateObject.description = obj.Message;
                                templateArray.push(templateObject);
                                
                               
                                             })
                                            
                                              this.oMessagePopover1.getModel().setData(templateArray);
                        },
                        // to mention type of message i.e.object type of messages
                        fetchtemplateObjectType : function(obj){
                        	
                        var messageInfo = {type : sap.ui.core.MessageType.None,title : ""};
                        var messageType = sap.ui.core.MessageType.None;
                        if(obj.Type === "S"){
                                messageInfo.type = sap.ui.core.MessageType.Success;
                                messageInfo.title = "Success"; 
                         }else if(obj.Type === "E"){
                                messageInfo.type = sap.ui.core.MessageType.Error;
                                messageInfo.title = "Error";
                         }else if(obj.Type === "W"){
                                messageInfo.type = sap.ui.core.MessageType.Warning;
                                messageInfo.title = "Warning";
                         }else if(obj.Type === "I"){
                                messageInfo.type = sap.ui.core.MessageType.Information;
                                messageInfo.title = "Information";
                         }
                        return messageInfo;
                        },

                 
        				
        		//-------------------------------------------------------------------------------------------		            

					
					
//
				    });

		});
