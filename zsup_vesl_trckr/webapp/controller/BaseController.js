/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/util/Export",
		"sap/ui/core/util/ExportTypeCSV",
		"sap/ui/model/Filter",
		"sap/ui/table/TablePersoController"],
	function (Controller, History, JSONModel, Export, ExportTypeCSV, Filter, TablePersoController) {
		"use strict";

		return Controller.extend("com.slb.sup.vessel.tracker.zsupvesltrckr.controller.BaseController",
			{

				/**
				 * Convenience method for accessing the
				 * event bus.
				 * 
				 * @public
				 * @returns {sap.ui.core.EventBus} the
				 *          event bus for this component
				 */
				getEventBus: function () {
					return this.getOwnerComponent().getEventBus();
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
				getRouter: function () {
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
				getModel: function (sName) {
					return this.getView().getModel(sName);
				},

				/**
				 * Convenience method for getting the
				 * base model which has main service.
				 * @public
				 * @param {string}
				 *                [sName] the model name
				 * @returns {sap.ui.model.Model} the
				 *          model instance
				 */
				getBaseModel: function () {
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
				setModel: function (oModel, sName) {
					return this.getView().setModel(oModel, sName);
				},
				/**
				 * Getter for the resource bundle.
				 * 
				 * @public
				 * @returns {sap.ui.model.resource.ResourceModel}
				 *          the resourceModel of the
				 *          component
				 */
				getResourceBundle: function () {
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
				onBackNav: function (sRoute, mData) {
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
							target: {
								shellHash: "#"
							}
						}, oComponent);
					}
				},

				/*Function to Open General F4 Pop up*/
				_openValueHelp: function (searchFunction, confirmFunction, aCustomData) {
					this.getModel("valueHelpModel").setProperty("/f4Data", []);
					if (!this._valueHelpDialog) {
						this._valueHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.ValueHelpF4", this);
						this.getView().addDependent(this._valueHelpDialog);
					}
					var aConfirmFunc = this._valueHelpDialog.mEventRegistry.confirm;
					var aSearchFunc = this._valueHelpDialog.mEventRegistry.search;
					for (var i = 0; aConfirmFunc !== undefined && i < aConfirmFunc.length ? aConfirmFunc.length : 0; i++) {
						this._valueHelpDialog.detachConfirm(aConfirmFunc[i].fFunction);
					}
					for (var j = 0; aSearchFunc !== undefined && j < aSearchFunc.length ? aSearchFunc.length : 0; j++) {
						this._valueHelpDialog.detachSearch(aSearchFunc[j].fFunction);
					}
					this._valueHelpDialog.attachSearch(searchFunction);
					this._valueHelpDialog.attachConfirm(confirmFunction);
					this._valueHelpDialog.removeAllCustomData();
					for (var k = 0; k < aCustomData.length; k++) {
						this._valueHelpDialog.insertCustomData(aCustomData[k]);
					}
					this._valueHelpDialog.open();
				},

				/*General Function to search in F4 Pop up*/
				_genericF4Search: function (filters, oEvent, model, entity, columns) {
					var aFinalFilters = [];
					if (oEvent.getParameter("value")) {
						var sValue = oEvent.getParameter("value");
						var oFilters = [new Filter([
							new Filter("Title", sap.ui.model.FilterOperator.Contains, sValue),
							new Filter("Desc", sap.ui.model.FilterOperator.Contains, sValue)], false)];
						oEvent.getSource().getBinding("items").filter(oFilters);
						return;
					} else {
						oEvent.getSource().getBinding("items").filter([]);
					}
					if (filters.length) {
						aFinalFilters.push(new Filter({
							filters: filters,
							and: true
						}));
					}
					var that = this;
					var urlParams = {
					};
					var aCustomData = this._valueHelpDialog.getCustomData();
					this._valueHelpDialog.setBusy(true);
					this.getModel('valueHelpModel').setProperty('/count', 0);
					readOdataAndReturnPromise(model, entity, urlParams, aFinalFilters).done(
						function (response) {
							that._valueHelpDialog.setBusy(false);
							that.getModel("valueHelpModel").setProperty("/f4Data", []);
							var aData = response.results;
							aData.forEach(function (currentValue, index) {
								currentValue['Title'] = currentValue[columns[0]];
								currentValue['Desc'] = columns[1] ? currentValue[columns[1]] : '';
								for (var i = 0; i < aCustomData.length; i++) {
									if (aCustomData[i].getProperty("key") === currentValue.Title)
										currentValue['Selected'] = true;
								}

							});
							that.getModel("valueHelpModel").setProperty("/f4Data", aData);
							that.getModel('valueHelpModel').setProperty('/count', aData.length);
							that.getModel("valueHelpModel").refresh(true);
						})
						.fail(
							function (oResponse) {
								that._valueHelpDialog.setBusy(false);
							});
				},

				/*Function to Open General Shipment No F4 Pop up*/
				_openShipmentNoValueHelp: function (searchFunction, confirmFunction, aCustomData) {
					this.getModel("valueHelpModel").setProperty("/f4Data", []);
					if (!this._shipmentNoValueHelpDialog) {
						this._shipmentNoValueHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.ShipmentNoValueHelpF4", this);
						this.getView().addDependent(this._shipmentNoValueHelpDialog);
					}
					var aConfirmFunc = this._shipmentNoValueHelpDialog.mEventRegistry.confirm;
					var aSearchFunc = this._shipmentNoValueHelpDialog.mEventRegistry.search;
					for (var i = 0; aConfirmFunc !== undefined && i < aConfirmFunc.length ? aConfirmFunc.length : 0; i++) {
						this._shipmentNoValueHelpDialog.detachConfirm(aConfirmFunc[i].fFunction);
					}
					for (var j = 0; aSearchFunc !== undefined && j < aSearchFunc.length ? aSearchFunc.length : 0; j++) {
						this._shipmentNoValueHelpDialog.detachSearch(aSearchFunc[j].fFunction);
					}
					this._shipmentNoValueHelpDialog.attachSearch(searchFunction);
					this._shipmentNoValueHelpDialog.attachConfirm(confirmFunction);
					this._shipmentNoValueHelpDialog.removeAllCustomData();
					for (var k = 0; k < aCustomData.length; k++) {
						this._shipmentNoValueHelpDialog.insertCustomData(aCustomData[k]);
					}
					this._shipmentNoValueHelpDialog.open();
				},

				/**
				 * this function is used for Shipment No search in F4 Pop up
				 * @param {array} filters - array of all filters 
				 * @param {object} oEvent - reference to main object
				 * @param {object} model - basemodel for service call
				 * @param {string} entity - entityset name
				 * @param {array} columns - array of properties
				 * @returns 
				 */
				_shipmentNoF4Search: function (filters, oEvent, model, entity, columns) {
					var aFinalFilters = [];
					if (oEvent.getParameter("value")) {
						var sValue = oEvent.getParameter("value");
						var oFilters = [new Filter([
							new Filter("Title", sap.ui.model.FilterOperator.Contains, sValue),
							new Filter("Desc", sap.ui.model.FilterOperator.Contains, sValue)], false)];
						oEvent.getSource().getBinding("items").filter(oFilters);
						return;
					} else {
						oEvent.getSource().getBinding("items").filter([]);
					}
					if (filters.length) {
						aFinalFilters.push(new Filter({
							filters: filters,
							and: true
						}));
					}
					var that = this;
					var urlParams = {
					};
					var aCustomData = this._shipmentNoValueHelpDialog.getCustomData();
					this._shipmentNoValueHelpDialog.setBusy(true);
					this.getModel('valueHelpModel').setProperty('/count', 0);
					readOdataAndReturnPromise(model, entity, urlParams, aFinalFilters).done(
						function (response) {
							that._shipmentNoValueHelpDialog.setBusy(false);
							that.getModel("valueHelpModel").setProperty("/f4Data", []);
							var aData = response.results;
							aData.forEach(function (currentValue, index) {
								currentValue['Title'] = currentValue[columns[0]];
								currentValue['Desc'] = columns[1] ? currentValue[columns[1]] : '';
								for (var i = 0; i < aCustomData.length; i++) {
									if (aCustomData[i].getProperty("key") === currentValue.Title)
										currentValue['Selected'] = true;
								}
							});
							that.getModel("valueHelpModel").setProperty("/f4Data", aData);
							that.getModel('valueHelpModel').setProperty('/count', aData.length);
							that.getModel("valueHelpModel").refresh(true);
						})
						.fail(
							function (oResponse) {
								that._shipmentNoValueHelpDialog.setBusy(false);
							});
				},
				/**
				 * This function is used to get all shipments excluding existing shipment so that user can't add those shipments once
				 * again.
				 * @param {array} filters - array of all filters 
				 * @param {object} oEvent - reference to main object
				 * @param {object} model - basemodel for service call
				 * @param {string} entity - entityset name
				 * @param {array} columns - array of properties
				 * @param {array} aExcludedShipMents - array of excluded Shipment Numbers
				 * @returns 
				 */
				_shipmentNoF4SearchExcludeExisting: function (filters, oEvent, model, entity, columns, aExcludedShipMents) {
					var aFinalFilters = [];
					if (oEvent.getParameter("value")) {
						var sValue = oEvent.getParameter("value");
						var oFilters = [new Filter([
							new Filter("Title", sap.ui.model.FilterOperator.Contains, sValue),
							new Filter("Desc", sap.ui.model.FilterOperator.Contains, sValue)], false)];
						oEvent.getSource().getBinding("items").filter(oFilters);
						return;
					} else {
						oEvent.getSource().getBinding("items").filter([]);
					}
					if (filters.length) {
						aFinalFilters.push(new Filter({
							filters: filters,
							and: true
						}));
					}
					var that = this;
					var urlParams = {
					};
					var aCustomData = this._shipmentNoValueHelpDialog.getCustomData();
					this._shipmentNoValueHelpDialog.setBusy(true);
					that.getModel('valueHelpModel').setProperty('/count', 0);
					readOdataAndReturnPromise(model, entity, urlParams, aFinalFilters).done(
						function (response) {
							that._shipmentNoValueHelpDialog.setBusy(false);
							that.getModel("valueHelpModel").setProperty("/f4Data", []);
							var aData = response.results;
							//Remove Existing Shipments Entries
							aData = aData.filter(function (val) {
								return aExcludedShipMents.indexOf(val.ShipmentNo) == -1;
							});
							console.log(aData);
							aData.forEach(function (currentValue, index) {
								currentValue['Title'] = currentValue[columns[0]];
								currentValue['Desc'] = columns[1] ? currentValue[columns[1]] : '';
								for (var i = 0; i < aCustomData.length; i++) {
									if (aCustomData[i].getProperty("key") === currentValue.Title)
										currentValue['Selected'] = true;
								}

							});
							that.getModel("valueHelpModel").setProperty("/f4Data", aData);
							that.getModel('valueHelpModel').setProperty('/count', aData.length);
							that.getModel("valueHelpModel").refresh(true);
						})
						.fail(
							function (oResponse) {
								that._shipmentNoValueHelpDialog.setBusy(false);
							});
				},

				/**
				 * Variant Management function for UI table
				 * @param {string} containerId - Container ID to be used for 
				 * @param {string} tableId - Id of table where variant management is implemented
				 * @param {string} tableVarMangId  - table Variant management Id
				 * @param {string} tblVariantProperty - table variant property for model binding
				 * @param {string} tblVariantModelName - table variant model name
				 * @returns 
				 */

				fnVariantManagementSetUpForTable: function (containerId, tableId, tableVarMangId, tblVariantProperty, tblVariantModelName) {
					var promise = jQuery.Deferred();
					var callBackObj = {
						"oContainer": null,
						"oVariantSet": null,
						"oTablePersoService": null
					};
					// Personalization from ushell service to persist the settings
					if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
						var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
						var oPersonalizationService = sap.ushell.Container.getService("Personalization");
						var oPersId = {
							container: containerId,
							item: tableId // id of table        
						};
						// define scope 
						var oScope = {
							keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
							writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
							clientStorageAllowed: true
						};
						// Get a Personalizer
						var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
						oPersonalizationService.getContainer(containerId, oScope, oComponent).fail(function () { promise.reject(); }).done(function (oContainer) {
							var oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContainer);
							// get variant set which is stored in back end
							var oVariantSet = oVariantSetAdapter.getVariantSet(tableId);
							if (!oVariantSet) { //if not in back end, then create one
								oVariantSet = oVariantSetAdapter.addVariantSet(tableId);
							}
							// array to store the existing variants
							var aVariants = [];
							// now get the existing variants from the backend to show as list
							for (var key in oVariantSet.getVariantNamesAndKeys()) {
								var oVariantItemObject = {};
								oVariantItemObject.Key = oVariantSet.getVariantNamesAndKeys()[key];
								oVariantItemObject.Name = key;
								aVariants.push(oVariantItemObject);
							}
							// create JSON model and attach to the variant management UI control
							var oVesselTableVariantsModel = new JSONModel();
							var variantObj = {};
							variantObj[tblVariantProperty] = aVariants;
							oVesselTableVariantsModel.setData(variantObj);
							this.getOwnerComponent().setModel(oVesselTableVariantsModel, tblVariantModelName);
							// enable save button
							var oVariantMgmtControlTbl = this.getView().byId(tableVarMangId);
							// set custom variant selected by user as default
							if (oVariantSet._oVariantSetData.currentVariant !== null) {
								oVariantMgmtControlTbl.setDefaultVariantKey(oVariantSet._oVariantSetData.currentVariant);
							}
							callBackObj["oContainer"] = oContainer;
							callBackObj["oVariantSet"] = oVariantSet;
							promise.resolve(callBackObj);
						}.bind(this));
						// create table perso controller
						var oTablePersoService = new TablePersoController({
							table: this.getView().byId(tableId),
							persoService: oPersonalizer
						});
						callBackObj["oTablePersoService"] = oTablePersoService;

					} else {
						promise.reject();
					}

					return promise;
				},

				fnSaveTblVariant: function (oEvent, tableId) {
					// get variant parameters
					var oVariantParam = oEvent.getParameters();
					// get columns data
					var aColumnsData = [];
					this.getView().byId(tableId)._getVisibleColumns().forEach(function (oColumn, index) {
						var aColumn = {};
						aColumn.fieldName = oColumn.getProperty("name");
						aColumn.Id = oColumn.getId();
						aColumn.index = index;
						aColumn.Visible = oColumn.getVisible();
						aColumn.filterProperty = oColumn.getProperty("filterProperty");
						aColumn.sortProperty = oColumn.getProperty("sortProperty");
						aColumn.defaultFilterOperator = oColumn.getProperty("defaultFilterOperator");
						aColumnsData.push(aColumn);
					});

					//get if the variant exists or add new variant
					var sVariantKey = this.oVesselTableVariantSet.getVariantKeyByName(oVariantParam.name);
					var tableVariant = '';
					if (sVariantKey) {
						tableVariant = this.oVesselTableVariantSet.getVariant(sVariantKey);
					}
					else {
						tableVariant = this.oVesselTableVariantSet.addVariant(oVariantParam.name);
					}

					var i18n = this.getResourceBundle();

					if (tableVariant) {
						tableVariant.setItemValue("ColumnsVal", JSON.stringify(aColumnsData));
						if (oVariantParam.def === true) {
							this.oVesselTableVariantSet.setCurrentVariantKey(tableVariant.getVariantKey());
						}
						this.oContainerLhTable.save().done(function () {
							// Tell the user that the personalization data was saved
							sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
						});
					}
				},
				/**
				 * This function is called when we want to export data in excel sheet from UI table
				 * @param {object} oModel - Model which is used for preparing data for export to excel
				 * @param {array} totalColumns - List of columns which will become excel sheet columns
				 */
				downloadToExcel: function (oModel, totalColumns) {
					//Downloading sap ui table content to excel sheet- read the table columns, read the model property attached to it
					//add these two in columnsArray, pass columnsArray in export object
					var columnObj = {
						name: "",
						template: {
							content: ""
						}
					};
					var columnArray = [];
					//Loop at column array and check
					for (var i = 0; i < totalColumns.length; i++) {
						columnObj = {
							name: "",
							template: {
								content: ""
							}
						};
						columnObj.name = totalColumns[i].mAggregations.label.getProperty("text"); //gets the column name
						if (totalColumns[i].mAggregations.template.mBindingInfos.text) {
							//if cell has text ie displayOnly column
							if (totalColumns[i].mAggregations.template.mBindingInfos.text.parts.length > 1) {
								//check if cell has concatenated text ie key-value then perform below logic
								for (var j = 0; j < totalColumns[i].mAggregations.template.mBindingInfos.text.parts.length; j++) {
									if (totalColumns[i].mAggregations.template.mBindingInfos.text) {
										columnObj.template.content += "{" + totalColumns[i].mAggregations.template.mBindingInfos.text.parts[j].path + "}" + "   ";
									}
								}
							}
							else {
								//If cell has single value - display only then perform below logic 
								// If value is of type display only text form Date
								if (totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].type &&
									totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].type.sName === "Date") {
									columnObj.template.content = {
										// Changing the date format from long to dd/MM/yyyy
										path: totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].path,
										formatter: function (value) {
											if (value instanceof (Date)) {
												//Convert to user date format
												var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
													pattern: "dd-MMM-yyyy"
												});
												value = oFormat.format(value);
											}
											else {
												value = (value === null) ? "" : value;
											}
											return value;
										}
									};
								}
								else {
									columnObj.template.content = "{" + totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].path + "}";
								}
							}
						}
						else if (totalColumns[i].mAggregations.template.mBindingInfos.value) {
							//If cell has input field ie f4 help or datepicker then perform below logic
							if (totalColumns[i].mAggregations.template.mBindingInfos.value.parts.length > 1) {
								// if cell has input field but value is entered in key-value format then perform below logic
								for (var j = 0; j < totalColumns[i].mAggregations.template.mBindingInfos.value.parts.length; j++) {
									if (totalColumns[i].mAggregations.template.mBindingInfos.value) {
										columnObj.template.content += "{" + totalColumns[i].mAggregations.template.mBindingInfos.value.parts[j].path + "}" + "   ";
									}
								}
							}
							else {
								// if input cell has single value then perform below logic
								columnObj.template.content = {
									path: totalColumns[i].mAggregations.template.mBindingInfos.value.parts[0].path,
									formatter: function (value) {
										if (value instanceof (Date)) {
											//Convert to user date format
											var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
												pattern: "dd-MMM-yyyy"
											});
											value = oFormat.format(value);
										}
										else {
											value = (value === null) ? "" : value;
										}
										return value;
									}
								};
							}
						}
						// if cell has label and text concatenated
						else if (totalColumns[i].mAggregations.template.mAggregations.items) {
							for (var j = 0; j < totalColumns[i].mAggregations.template.mAggregations.items.length; j++) {
								if (totalColumns[i].mAggregations.template.mAggregations.items[j].mBindingInfos.text) {
									columnObj.template.content += "{" + totalColumns[i].mAggregations.template.mAggregations.items[j].mBindingInfos.text.parts[0].path + "}" + "   ";
								}
							}
						}
						// if cell has datepicker
						else if (totalColumns[i].mAggregations.template.mBindingInfos.dateValue) {
							if (totalColumns[i].mAggregations.template.mBindingInfos.dateValue.parts.length > 0) {
								for (var j = 0; j < totalColumns[i].mAggregations.template.mBindingInfos.dateValue.parts.length; j++) {
									columnObj.template.content = {
										path: totalColumns[i].mAggregations.template.mBindingInfos.dateValue.parts[j].path,
										formatter: function (value) {
											if (value instanceof (Date)) {
												//Convert to user date format
												var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
													pattern: "dd-MMM-yyyy"
												});
												value = oFormat.format(value);
											}
											else {
												value = (value === null) ? "" : value;
											}
											return value;
										}
									};
								}
							}
						}
						columnArray.push(columnObj);
					}
					//Export to excel logic
					var oExport = new Export({
						exportType: new ExportTypeCSV({

							fileExtension: "xls",
							separatorChar: "\t",
							charset: "utf-8",
							mimeType: "application/vnd.ms-excel"
						}),
						models: oModel,
						rows: {
							path: "/",

						},
						columns: columnArray
					});
					this._onExcelShipCon(oExport);
				},
				/**
				 * This is helper function to export data in excel sheet.
				 * @param {object} oExport - Export data object
				 */
				_onExcelShipCon: function (oExport) {
					try {
						oExport.saveFile();
					}
					catch (oError) {
						MessageToast.show(this.getResourceBundle().getText("exportToExcelError"));
					}
				}
			});

	});
