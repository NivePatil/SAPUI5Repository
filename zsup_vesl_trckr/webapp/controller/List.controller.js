sap.ui.define(
	["com/slb/sup/vessel/tracker/zsupvesltrckr/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"com/slb/sup/vessel/tracker/zsupvesltrckr/util/formatter",
		"sap/ui/table/TablePersoController",
		"com/slb/sup/vessel/tracker/zsupvesltrckr/util/Helper",
		"sap/m/Token",
		"sap/m/MessageBox",
		"sap/ui/model/Filter",
		'sap/ui/model/FilterOperator'
	],
	function (BaseController, JSONModel, formatter, TablePersoController, Helper, Token, MessageBox, Filter, FilterOperator) {
		"use strict";
		return BaseController.extend("com.slb.sup.vessel.tracker.zsupvesltrckr.controller.List",
			{
				formatter: formatter,
				onInit: function () {

					var listViewModel = new JSONModel({
						hearderBusy: false,
						tableBusy: false,
						counter: {
							cnt_vessel_total: 0,
							cnt_vessel_depart: 0,
							cnt_vessel_transit: 0,
							cnt_vessel_arrived: 0,
							cnt_pickup: 0
						}
					});

					this.setModel(listViewModel, "listViewModel");

					//Success call of read request entityset - VesselDetailSet
					this.getOwnerComponent().getModel().attachEvent("requestCompleted", function (oEvent) {
						var oParams = oEvent.getParameters();

						var index = oParams.url.indexOf("VesselDetailSet");
						if (index !== -1) {
							if (oParams.response.headers.hdr_counters === "X") { //Counters are returned by the service
								if (oParams.response.headers.cnt_vessel_total !== undefined) {
									this.getModel("listViewModel").setProperty("/cnt_vessel_total", oParams.response.headers.cnt_vessel_total);
									this.getModel("listViewModel").setProperty("/cnt_vessel_depart", oParams.response.headers.cnt_vessel_depart);
									this.getModel("listViewModel").setProperty("/cnt_vessel_transit", oParams.response.headers.cnt_vessel_transit);
									this.getModel("listViewModel").setProperty("/cnt_vessel_arrived", oParams.response.headers.cnt_vessel_arrived);
									this.getModel("listViewModel").setProperty("/cnt_pickup", oParams.response.headers.cnt_pickup);
									this.getModel("listViewModel").setProperty("/HeaderTableBusy", false);
									this.getModel("listViewModel").setProperty("/totalCount", parseInt(oParams.response.headers.cnt_total_records));
									this.getModel("listViewModel").refresh();
								}
							}else if (oParams.response.headers.hdr_counters === undefined) { //Counters are returned by the service
								this.getModel("listViewModel").setProperty("/cnt_vessel_total", 0);
								this.getModel("listViewModel").setProperty("/cnt_vessel_depart", 0);
								this.getModel("listViewModel").setProperty("/cnt_vessel_transit", 0);
								this.getModel("listViewModel").setProperty("/cnt_vessel_arrived", 0);
								this.getModel("listViewModel").setProperty("/cnt_pickup", 0);
								this.getModel("listViewModel").setProperty("/HeaderTableBusy", false);
								this.getModel("listViewModel").setProperty("/totalCount", 0);
								this.getModel("listViewModel").refresh();
						}
						}
					}, this);
					//Export to excel Model
					var oVesselDetailsExlModel = new JSONModel([]);
					this.setModel(oVesselDetailsExlModel, "VesselDetailsExlModel");

					//Value Help F4 Model
					var valueHelpModel = new JSONModel({
						title: "",
						bMultiSelect: false,
						count: 0,
						f4Data: []
					});
					this.setModel(valueHelpModel, "valueHelpModel");

					//Shipment table model data. This table is being used in Create, Update and Add Shipment screen
					var oShipmentTblModel = new JSONModel({
						vesselUpdate: true,
						deleteFlag: false,
						shipmentData: []
					});
					this.setModel(oShipmentTblModel, "shipmentTblModel");

					//Varinat Management for vessel detail table
					this.fnVariantManagementSetUpForTable('VesselTablePersonalization', 'TblVesselDetail', 'VesselVariantManagement',
						'VesselTableVariants', 'VesselTableVariantsModel').done(
							function (response) {
								this.oContainerLhTable = response.oContainer;
								this.oVesselTableVariantSet = response.oVariantSet;
								this.oVesselDetailTablePersoService = response.oTablePersoService;
							}.bind(this)).fail(
								function () {

								}.bind(this));

					//Varaint Management for Selection Screen
					if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {

						var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
						this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
						var oPersId = {
							container: "SelScrnPersonalization",
							item: "SelScreenDialog"
						};
						// define scope 
						var oScope = {
							keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
							writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
							clientStorageAllowed: true
						};
						// Get a Personalizer
						var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
						this.oPersonalizationService.getContainer("SelScrnPersonalization", oScope, oComponent)
							.fail(function () { })
							.done(function (oContainer) {
								this.oContainer = oContainer;
								this.oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(this.oContainer);
								// get variant set which is stored in backend
								this.oVariantSet = this.oVariantSetAdapter.getVariantSet("SelScreenDialogVariantSet");
								if (!this.oVariantSet) { //if not in backend, then create one
									this.oVariantSet = this.oVariantSetAdapter.addVariantSet("SelScreenDialogVariantSet");
								}
								// array to store the existing variants
								var Variants = [];
								// now get the existing variants from the backend to show as list
								for (var key in this.oVariantSet.getVariantNamesAndKeys()) {
									if (this.oVariantSet.getVariantNamesAndKeys().hasOwnProperty(key)) {
										var oVariantItemObject = {};
										oVariantItemObject.Key = this.oVariantSet.getVariantNamesAndKeys()[key];
										oVariantItemObject.Name = key;
										Variants.push(oVariantItemObject);
									}
								}
								// create JSON model and attach to the variant management UI control
								var VariantsScreen = this.getView().byId("Variants");
								if (VariantsScreen !== undefined) {

									var VariantsModel = new JSONModel([]);
									this.getView().byId("Variants").setModel(VariantsModel, "VariantsModel");
									this.getView().byId("Variants").getModel("VariantsModel").setData(Variants);

									// enable save button
									// set custom variant selected by user as default
									if (this.oVariantSet._oVariantSetData.currentVariant !== null) {
										VariantsScreen.setDefaultVariantKey(this.oVariantSet._oVariantSetData.currentVariant);
									}
								}
							}.bind(this));
					}
					//End of variant for selection screen
				},
				/**
				 * This functions is called when we click on setting icon in Vessel Detail table. It will open a dialog where columns can be 
				 * selected/ deselected and organized based on user need.
				 */
				onPersonalizeVesselColumns: function () {
					this.oVesselDetailTablePersoService.openDialog({
					});
					var that = this;
					setTimeout(function () {
						that.oVesselDetailTablePersoService._oDialog.attachConfirm(that, that._onVesselTblColumnPersoDonePressed.bind(that));
					}, 3000, that);
				},
				/**
				 * Internal private function which further calls _setTblVesselDetailVariantEditMode to make variant in edit mode. 
				 */
				_onVesselTblColumnPersoDonePressed: function () {
					this._setTblVesselDetailVariantEditMode();
				},
				/**
				 * This function used to set current variant as editable mode. So that user can save existing or 
				 * create a new varaint.
				 */
				_setTblVesselDetailVariantEditMode: function () {
					this.getView().byId("VesselVariantManagement").currentVariantSetModified(true);
				},
				/**
				 * This function is triggered when user reposition the columns. This will trigger varaint in edit mode.
				 */
				onTblVesselDetailColumnMove: function () {
					this._setTblVesselDetailVariantEditMode();
				},
				/**
				 * This function internally calls another function from basecontroller which is used to To store the 
				 * variant with the columns settings including the order to the back end.
				 * @param {object} oEvent - Source reference for save button in varaint save method
				 */
				// To store the variant with the columns settings including the order to the back end
				onSaveVariantAsInTable: function (oEvent) {
					var tableId = "TblVesselDetail";
					this.fnSaveTblVariant(oEvent, tableId);
				},
				/**
				 * This function is used to read the service and change the table columns accordingly on selection of variant
				 * @param {object} oEvent - Source reference for selected variant in varaint pop up
				 */
				onSelectVariantInTable: function (oEvent) {
					var selectedKey = oEvent.getParameters().key;
					var selectedVariant = '';
					var oVariantMgmtControlVesselTbl = this.getView().byId("VesselVariantManagement");
					if (selectedKey === "*standard*") {
						// disable save button
						selectedVariant = "Standard";
					}
					else {
						for (var i = 0; i < oEvent.getSource().getVariantItems().length; i++) {
							if (oEvent.getSource().getVariantItems()[i].getProperty("key") === selectedKey) {
								selectedVariant = oEvent.getSource().getVariantItems()[i].getProperty("text");
								break;
							}
						}
					}
					this._setSelectedVariantToTable(selectedVariant);
				},

				/**
				 * This function is used to convert the stored values back into the array & modify the table and refresh 
				 * the table control to show that data on the screen
				 * @param {string} oSelectedVariant - Selected Varaint Name
				 */
				_setSelectedVariantToTable: function (oSelectedVariant) {
					if (oSelectedVariant && oSelectedVariant !== "Standard") {
						var sVariant = this.oVesselTableVariantSet.getVariant(this.oVesselTableVariantSet.getVariantKeyByName(oSelectedVariant));
						var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));
						// Hide all columns first
						this.getView().byId("TblVesselDetail").getColumns().forEach(function (oColumn) {
							oColumn.setVisible(false);
						});
						// re-arrange columns according to the saved variant
						aColumns.forEach(function (aColumn) {
							var aTableColumn = $.grep(this.getView().byId("TblVesselDetail").getColumns(), function (colObj, id) {
								return colObj.getProperty("name") === aColumn.fieldName;
							});
							if (aTableColumn.length > 0) {
								aTableColumn[0].setVisible(aColumn.Visible);
								aTableColumn[0].setFilterProperty(aColumn.filterProperty);
								aTableColumn[0].setSortProperty(aColumn.sortProperty);
								aTableColumn[0].setDefaultFilterOperator(aColumn.defaultFilterOperator);
								aTableColumn[0].setSorted(aColumn.sorted);
								aTableColumn[0].setSortOrder(aColumn.sortOrder);
								this.getView().byId("TblVesselDetail").removeColumn(aTableColumn[0]);
								this.getView().byId("TblVesselDetail").insertColumn(aTableColumn[0], aColumn.index);
							}
						}.bind(this));
					}
					// null means the standard variant is selected or the variant which is not available, then show all columns
					else {
						this.getView().byId("TblVesselDetail").getColumns().forEach(function (oColumn) {
							oColumn.setVisible(true);
						});
					}
				},
				/**
				 * This function is used to manage the variants. User can change the name or delete the variant or can make anyone of them as default.
				 * @param {object} oEvent - Source Object Reference
				 */
				onManageVariantsInTable: function (oEvent) {
					var aParameters = oEvent.getParameters();
					var i18n = this.getResourceBundle();
					// rename variants
					if (aParameters.renamed.length > 0) {
						aParameters.renamed.forEach(function (aRenamed) {
							var sVariant = this.oVesselTableVariantSet.getVariant(aRenamed.key),
								sItemValue = sVariant.getItemValue("ColumnsVal");
							// delete the variant 
							this.oVesselTableVariantSet.delVariant(aRenamed.key);
							// after delete, add a new variant
							var oNewVariant = this.oVesselTableVariantSet.addVariant(aRenamed.name);
							oNewVariant.setItemValue("ColumnsVal", sItemValue);
						}.bind(this));
					}
					// default variant change
					if (aParameters.def !== "*standard*") {
						this.oVesselTableVariantSet.setCurrentVariantKey(aParameters.def);
					}
					else {
						this.oVesselTableVariantSet.setCurrentVariantKey(null);
					}
					// Delete variants
					if (aParameters.deleted.length > 0) {
						aParameters.deleted.forEach(function (aDelete) {
							this.oVesselTableVariantSet.delVariant(aDelete);
						}.bind(this));
					}
					//  Save the Variant Container
					this.oContainerLhTable.save().done(function () {
						// Tell the user that the personalization data was saved
						sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
					});
				},
				// End of Apply Variant Management to the Vessel Detail Table

				//Variant management selection screen methods
				/**
				 * This function is used to To store the variant with the columns settings including the order to the back end.
				 * @param {object} oEvent - Source Object reference for save button in selection screen's variant popup
				 */
				onSaveVariantInSelScrn: function (oEvent) {
					// get variant parameters:
					var VariantParam = oEvent.getParameters();

					var oVesselSelObj = {};
					//Freight Forwarder
					var oFwdAgent = this.getView().byId("id_FreightForwarder").getTokens();
					var aFwdAgent = [];
					if (oFwdAgent.length) {
						for (var i = 0; i < oFwdAgent.length; i++) {
							aFwdAgent.push([oFwdAgent[i].getProperty("key"), oFwdAgent[i].getProperty("text")]);
						}
						oVesselSelObj.freightFwderObj = aFwdAgent;
					}

					//Vessel No
					var oVesselNo = this.getView().byId("id_VesselNo").getTokens();
					var aVesselNo = [];
					if (oVesselNo.length) {
						for (var i = 0; i < oVesselNo.length; i++) {
							aVesselNo.push([oVesselNo[i].getProperty("key"), oVesselNo[i].getProperty("text")]);
						}
						oVesselSelObj.vesselNoObj = aVesselNo;
					}

					//Shipment No
					var oShipmentNo = this.getView().byId("id_ShipmentNo").getTokens();
					var aShipmentNo = [];
					if (oShipmentNo.length) {
						for (var i = 0; i < oShipmentNo.length; i++) {
							aShipmentNo.push([oShipmentNo[i].getProperty("key"), oShipmentNo[i].getProperty("text")]);
						}
						oVesselSelObj.shipmentNoObj = aShipmentNo;
					}

					//BOL and AWB
					var sBolId = this.getView().byId("id_BolID").getValue();
					oVesselSelObj.BolIDObj = sBolId;

					//Ereq ID
					var sEreqId = this.getView().byId("id_EreqID").getValue();
					oVesselSelObj.EreqIdObj = sEreqId;

					//Flight or Voyage No
					var sFlightVoyageNo = this.getView().byId("id_FlightVoyageNo").getValue();
					oVesselSelObj.FlightVoyageNoObj = sFlightVoyageNo;

					//Ship From Country
					var oShipFromCountry = this.getView().byId("id_ShipFromCountry").getTokens();
					var aShipFromCountry = [];
					if (oShipFromCountry.length) {
						for (var i = 0; i < oShipFromCountry.length; i++) {
							aShipFromCountry.push([oShipFromCountry[i].getProperty("key"), oShipFromCountry[i].getProperty("text")]);
						}
						oVesselSelObj.ShipFromCountryObj = aShipFromCountry;
					}

					//Ship To Country
					var oShipToCountry = this.getView().byId("id_ShipToCountry").getTokens();
					var aShipToCountry = [];
					if (oShipToCountry.length) {
						for (var i = 0; i < oShipToCountry.length; i++) {
							aShipToCountry.push([oShipToCountry[i].getProperty("key"), oShipToCountry[i].getProperty("text")]);
						}
						oVesselSelObj.ShipToCountryObj = aShipToCountry;
					}

					//Vessel Status
					var oVesselStatus = this.getView().byId("id_VesselStatus").getTokens();
					var aVesselStatus = [];
					if (oVesselStatus.length) {
						for (var i = 0; i < oVesselStatus.length; i++) {
							aVesselStatus.push([oVesselStatus[i].getProperty("key"), oVesselStatus[i].getProperty("text")]);
						}
						oVesselSelObj.VesselStatusObj = aVesselStatus;
					}

					//Shipment Status
					var oShipmentStatus = this.getView().byId("id_SHStatus").getTokens();
					var aShipmentStatus = [];
					if (oShipmentStatus.length) {
						for (var i = 0; i < oShipmentStatus.length; i++) {
							aShipmentStatus.push([oShipmentStatus[i].getProperty("key"), oShipmentStatus[i].getProperty("text")]);
						}
						oVesselSelObj.ShipmentStatusObj = aShipmentStatus;
					}

					//Vessel Creation Date
					oVesselSelObj.VesselCrtDtFromObj = this.getView().byId("id_VesselCreationDate").getDateValue();
					oVesselSelObj.VesselCrtDtToObj = this.getView().byId("id_VesselCreationDate").getSecondDateValue();

					//End of logics
					var i18n = this.getResourceBundle();

					//get if the variant exists or add new variant
					var sVariantKey = this.oVariantSet.getVariantKeyByName(VariantParam.name);
					if (sVariantKey) {
						this.oVariant = this.oVariantSet.getVariant(sVariantKey);
					}
					else {
						this.oVariant = this.oVariantSet.addVariant(VariantParam.name);
					}

					//end

					if (this.oVariant) {
						this.oVariant.setItemValue("ColumnsVal", JSON.stringify(oVesselSelObj));
						if (VariantParam.def === true) {
							this.oVariantSet.setCurrentVariantKey(this.oVariant.getVariantKey());
						}


						this.oContainer.save().done(function () {
							// Tell the user that the personalization data was saved
							sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
						}.bind(this));
					}
				},

				/**
				 * This function is used to get the selected variant and pass internally to another function _setSelectedVariantToSelectionScreen
				 * @param {object} oEvent - Source reference for selected variant in Varaint Selection Pop Up Screen
				 */
				onSelectVariantInSelScrn: function (oEvent) {

					var selectedKey = oEvent.getParameters().key;
					var selectedVariant = '';
					if (selectedKey === "*standard*") {
						// disable save button
						selectedVariant = "Standard";
						var VariantsScreen = this.getView().byId("Variants");
					} else {
						for (var i = 0; i < oEvent.getSource().getVariantItems().length; i++) {
							if (oEvent.getSource().getVariantItems()[i].getProperty("key") === selectedKey) {
								selectedVariant = oEvent.getSource().getVariantItems()[i].getProperty("text");
								break;
							}
						}
					}
					this._setSelectedVariantToSelectionScreen(selectedVariant);
				},
				/**
				 * This function is used to make changes in Selection screen as per the details saved in selected variant
				 * @param {object} oSelectedVariant - Selected Variant Name
				 */
				_setSelectedVariantToSelectionScreen: function (oSelectedVariant) {
					var oToken;
					if (oSelectedVariant) {
						if (oSelectedVariant === "Standard") {
							this.getView().byId("id_FreightForwarder").removeAllTokens();
							this.getView().byId("id_VesselNo").removeAllTokens();
							this.getView().byId("id_ShipmentNo").removeAllTokens();
							this.getView().byId("id_ShipFromCountry").removeAllTokens();
							this.getView().byId("id_ShipToCountry").removeAllTokens();
							this.getView().byId("id_SHStatus").removeAllTokens();
							this.getView().byId("id_BolID").setValue('');
							this.getView().byId("id_EreqID").setValue('');
							this.getView().byId("id_FlightVoyageNo").setValue('');
							this.getView().byId("id_VesselCreationDate").setValue('');
							this.byId("id_VesselStatus").setTokens([new Token({text: "Pending Pick Up", key: "01"}),new Token({text: "Pending Shipping Departure", key: "02"}),
								new Token({text: "In Transit", key: "03"})]);
						}
						else {
							var sVariant = this.oVariantSet.getVariant(this.oVariantSet.getVariantKeyByName(oSelectedVariant));
							var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));

							// fill fields according to the saved variant
							var aTokens = [];
							oToken = {};
							if ((aColumns.freightFwderObj !== undefined) && aColumns.freightFwderObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.freightFwderObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.freightFwderObj[i][0],
										text: aColumns.freightFwderObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_FreightForwarder").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_FreightForwarder").setTokens([]);
							}

							if ((aColumns.vesselNoObj !== undefined) && aColumns.vesselNoObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.vesselNoObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.vesselNoObj[i][0],
										text: aColumns.vesselNoObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_VesselNo").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_VesselNo").setTokens([]);
							}

							if ((aColumns.shipmentNoObj !== undefined) && aColumns.shipmentNoObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.shipmentNoObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.shipmentNoObj[i][0],
										text: aColumns.shipmentNoObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_ShipmentNo").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_ShipmentNo").setTokens([]);
							}

							if ((aColumns.BolIDObj !== undefined) && aColumns.BolIDObj !== 0) {
								this.getView().byId("id_BolID").setValue(aColumns.BolIDObj);
							} else {
								this.getView().byId("id_BolID").setValue("");
							}

							if ((aColumns.EreqIdObj !== undefined) && aColumns.EreqIdObj !== 0) {
								this.getView().byId("id_EreqID").setValue(aColumns.EreqIdObj);
							} else {
								this.getView().byId("id_EreqID").setValue("");
							}

							if ((aColumns.FlightVoyageNoObj !== undefined) && aColumns.FlightVoyageNoObj !== 0) {
								this.getView().byId("id_FlightVoyageNo").setValue(aColumns.FlightVoyageNoObj);
							} else {
								this.getView().byId("id_FlightVoyageNo").setValue("");
							}

							if ((aColumns.ShipFromCountryObj !== undefined) && aColumns.ShipFromCountryObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.ShipFromCountryObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.ShipFromCountryObj[i][0],
										text: aColumns.ShipFromCountryObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_ShipFromCountry").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_ShipFromCountry").setTokens([]);
							}

							if ((aColumns.ShipToCountryObj !== undefined) && aColumns.ShipToCountryObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.ShipToCountryObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.ShipToCountryObj[i][0],
										text: aColumns.ShipToCountryObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_ShipToCountry").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_ShipToCountry").setTokens([]);
							}

							if ((aColumns.VesselStatusObj !== undefined) && aColumns.VesselStatusObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.VesselStatusObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.VesselStatusObj[i][0],
										text: aColumns.VesselStatusObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_VesselStatus").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_VesselStatus").setTokens([]);
							}

							if ((aColumns.ShipmentStatusObj !== undefined) && aColumns.ShipmentStatusObj !== 0) {
								aTokens = [];
								oToken = {};
								for (var i = 0; i < aColumns.ShipmentStatusObj.length; i++) {
									oToken = new sap.m.Token({
										key: aColumns.ShipmentStatusObj[i][0],
										text: aColumns.ShipmentStatusObj[i][1]
									});
									aTokens.push(oToken);
								}
								this.getView().byId("id_SHStatus").setTokens(aTokens);
							}
							else {
								this.getView().byId("id_SHStatus").setTokens([]);
							}
						}
					}
				},
				/**
				 * This function is used to Rename, Delete exisitng variant.
				 * @param {object} oEvent - Source reference for manage variant
				 */
				onManageVariantInSelScrn: function (oEvent) {
					var i18n = this.getResourceBundle();
					var aParameters = oEvent.getParameters();
					// rename variants
					if (aParameters.renamed.length > 0) {
						aParameters.renamed.forEach(function (aRenamed) {
							var sVariant = this.oVariantSet.getVariant(aRenamed.key),
								sItemValue = sVariant.getItemValue("ColumnsVal");
							// delete the variant 
							this.oVariantSet.delVariant(aRenamed.key);
							// after delete, add a new variant
							var oNewVariant = this.oVariantSet.addVariant(aRenamed.name);
							oNewVariant.setItemValue("ColumnsVal", sItemValue);
						}.bind(this));
					}
					// default variant change
					if (aParameters.def !== "*standard*") {
						this.oVariantSet.setCurrentVariantKey(aParameters.def);
					} else {
						this.oVariantSet.setCurrentVariantKey(null);
					}
					// Delete variants
					if (aParameters.deleted.length > 0) {
						aParameters.deleted.forEach(function (aDelete) {
							this.oVariantSet.delVariant(aDelete);
						}.bind(this));
					}
					//  Save the Variant Container
					this.oContainer.save().done(function () {
						// Tell the user that the personalization data was saved
						sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
					});
				},
				/**
				 * This is one of the life cycle method. This function gets executed after page rendering.
				 * It will load all fragments in background job. Along with this, this will execute variant management code initialization.
				 */
				onAfterRendering: function () {
					this.onSelectionScreenPress();
					if (!this._oDialogCreateVessel) {
						this._oDialogCreateVessel = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.CreateVesselDialog", this);
						this.getView().addDependent(this._oDialogCreateVessel);
					}
					jQuery.sap.syncStyleClass(this.getView(), this._oDialogCreateVessel);

					if (!this._oDialogUpdateVessel) {
						this._oDialogUpdateVessel = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.UpdateVesselDialog", this);
						this.getView().addDependent(this._oDialogUpdateVessel);
					}
					jQuery.sap.syncStyleClass(this.getView(), this._oDialogUpdateVessel);

					if (!this._oDialogAddShipment) {
						this._oDialogAddShipment = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.AddShipmentDialog", this);
						this.getView().addDependent(this._oDialogAddShipment);
					}
					jQuery.sap.syncStyleClass(this.getView(), this._oDialogAddShipment);

					//Opens the selection screen dialog oninitial launch of the application
					//start of variant-header table
					if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
						var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
						var oPersonalizationService = sap.ushell.Container.getService("Personalization");
						var oPersId = {
							container: "VesselTablePersonalization",
							item: "TblVesselDetail" // id of table        
						};
						// define scope 
						var oScope = {
							keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
							writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
							clientStorageAllowed: true
						};
						// Get a Personalizer
						var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
						oPersonalizationService.getContainer("VesselTablePersonalization", oScope, oComponent).fail(function () { }).done(function (oContainer) {
							var oContainer = oContainer;
							var oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContainer);
							// get variant set which is stored in back end
							var oVesselTableVariantSet = oVariantSetAdapter.getVariantSet("TblVesselDetail");

							if (oVesselTableVariantSet && (oVesselTableVariantSet._oVariantSetData.currentVariant !== null)) {
								if (oVesselTableVariantSet._oVariantSetData.variants[oVesselTableVariantSet._oVariantSetData.currentVariant]) {
									this._setSelectedVariantToTable(oVesselTableVariantSet._oVariantSetData.variants[oVesselTableVariantSet._oVariantSetData.currentVariant].name);
									var VesselVariantManagement = this.getView().byId("VesselVariantManagement");
									if (VesselVariantManagement) {
										VesselVariantManagement.oVariantText.setText(oVesselTableVariantSet._oVariantSetData.variants[oVesselTableVariantSet._oVariantSetData.currentVariant].name);
										VesselVariantManagement.setInitialSelectionKey(oVesselTableVariantSet._oVariantSetData.currentVariant);
									}
								}
							}
							// enable save button
							var oVariantMgmtControlVesselTbl = this.getView().byId("VesselVariantManagement");
							// set custom variant selected by user as default
							if (this.oVesselTableVariantSet._oVariantSetData.currentVariant !== null) {
								oVariantMgmtControlVesselTbl.setDefaultVariantKey(this.oVesselTableVariantSet._oVariantSetData.currentVariant);
							}
						}.bind(this));
					}
					//end of variant-header table


					//variant management - selection screen
					if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {

						var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
						this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
						var oPersId = {
							container: "SelScrnPersonalization",
							item: "SelScreenDialog"
						};
						// define scope 
						var oScope = {
							keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
							writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
							clientStorageAllowed: true
						};
						// Get a Personalizer

						var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
						this.oPersonalizationService.getContainer("SelScrnPersonalization", oScope, oComponent)
							.fail(function () { })
							.done(function (oContainer) {
								var oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContainer);
								// get variant set which is stored in backend
								var variantSet = oVariantSetAdapter.getVariantSet("SelScreenDialogVariantSet");

								//default variant
								if (variantSet && (variantSet._oVariantSetData.currentVariant !== null)) {
									if (variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant]) {
										this._setSelectedVariantToSelectionScreen(variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant].name);
										var VariantsScreen = this.getView().byId("Variants");
										if (VariantsScreen) {
											VariantsScreen.oVariantText.setText(variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant].name);
											VariantsScreen.setInitialSelectionKey(variantSet._oVariantSetData.currentVariant);
										}
									}
								}
								//end default
								var VariantsScreen = this.getView().byId("Variants");
								// set custom variant selected by user as default
								if (this.oVariantSet._oVariantSetData.currentVariant !== null) {
									VariantsScreen.setDefaultVariantKey(this.oVariantSet._oVariantSetData.currentVariant);
								}
							}.bind(this));
					}
					
					this.byId("id_VesselStatus").setTokens([new Token({text: "Pending Pick Up", key: "01"}),new Token({text: "Pending Shipping Departure", key: "02"}),
						new Token({text: "In Transit", key: "03"})]);
				},
				/**
				 * This function opens selection screen.
				 */
				onSelectionScreenPress: function () {
					if (!this._oDialogSelectionScreen) {
						this._oDialogSelectionScreen = sap.ui.xmlfragment(this.getView().getId(), "com.slb.sup.vessel.tracker.zsupvesltrckr.fragments.SelectionScreenFrag", this);
						this.getView().addDependent(this._oDialogSelectionScreen);
					}
					jQuery.sap.syncStyleClass(this.getView(), this._oDialogSelectionScreen);
					this._oDialogSelectionScreen.open();
					
				},
				/**
				 * This function set selection screen variant in edit mode whenever there is any changes in the corresponding fields.
				 */
				_setSelectionScreenVariantEditMode: function () {
					this.getView().byId("Variants").currentVariantSetModified(true);
				},
				/**
				 * This Function closes selection screen.
				 */
				handleSelectionScreenClose: function () {
					this._oDialogSelectionScreen.close();
				},
				/**
				 * This function is used to referesh data in vessel details table. It internally call another function and reset
				 * table filter and sorter too.
				 */
				onVesselRefresh: function () {
					var oVesselDetailTable = this.getView().byId("TblVesselDetail");
					resetTableFilterSort(oVesselDetailTable);
					this.handleSelectionScreenSave();
				},
				/**
				 * This function build all filter paramters from selection screen and returns the filter values.
				 * @returns array - Selection Screen's filter values
				 */
				handleSelectionParameters: function () {
					var that = this;
					var i18n = this.getResourceBundle();
					var oFwdAgentArr = this.getView().byId("id_FreightForwarder").getTokens();
					var oVessleNo = this.getView().byId("id_VesselNo").getTokens();
					var oShipmentNo = this.getView().byId("id_ShipmentNo").getTokens();
					var oEreqId = this.getView().byId("id_EreqID").getValue();
					var oBOLId = this.getView().byId("id_BolID").getValue();
					var oFlightVoyageNo = this.getView().byId("id_FlightVoyageNo").getValue();
					var oShipFromCountry = this.getView().byId("id_ShipFromCountry").getTokens();
					var oShipToCountry = this.getView().byId("id_ShipToCountry").getTokens();
					var oSHStatus = this.getView().byId("id_SHStatus").getTokens();
					var oVesselStatus = this.getView().byId("id_VesselStatus").getTokens();

					var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddTHH:mm:ss"/*,
						UTC : true*/
					});
					var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddTHH:mm:ss"/*,
						UTC : true*/
					});

					var dVesselCreationDateFrom = this.getView().byId("id_VesselCreationDate").getDateValue();
					var dVesselCreationDateFromVal = formatter.fnAdjustTimeZoneDiff(dVesselCreationDateFrom);
					var dVesselCreationDateFromFormatted = oFormatFrom.format(dVesselCreationDateFromVal);

					var dVesselCreationDateTo = this.getView().byId("id_VesselCreationDate").getSecondDateValue();
					var dVesselCreationDateToVal = formatter.fnAdjustTimeZoneDiff(dVesselCreationDateTo);
					var dVesselCreationDateToFormatted = oFormatTo.format(dVesselCreationDateToVal);
					//mandatory field
					if (!oFwdAgentArr.length) {
						MessageBox.alert(i18n.getText("SelectionScreen.MandateForwardAgent"));
						this.getView().byId("id_FreightForwarder").setValueState("Error");
						this.getView().byId("id_FreightForwarder").setValueStateText(i18n.getText("SelectionScreen.MandateForwardAgent"));
						return;
					} else {
						this.getView().byId("id_FreightForwarder").setValueState("None");
					}
					
					if (!oVesselStatus.length) {
						MessageBox.alert(i18n.getText("SelectionScreen.MandateVesselStatus"));
						this.getView().byId("id_VesselStatus").setValueState("Error");
						this.getView().byId("id_VesselStatus").setValueStateText(i18n.getText("SelectionScreen.MandateVesselStatus"));
						return;
					} else {
						this.getView().byId("id_VesselStatus").setValueState("None");
					}

					var filters = [];
					var oFilter = '';
					if (oFwdAgentArr.length) {
						for (var i = 0; i < oFwdAgentArr.length; i++) {
							oFilter = new Filter("ForwardingAgent", sap.ui.model.FilterOperator.EQ, oFwdAgentArr[i].getProperty("key"));
							filters.push(oFilter);
						}
					}

					if (oVessleNo.length) {
						for (var i = 0; i < oVessleNo.length; i++) {
							oFilter = new Filter("VesselCode", sap.ui.model.FilterOperator.EQ, oVessleNo[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (oShipmentNo.length) {
						for (var i = 0; i < oShipmentNo.length; i++) {
							oFilter = new Filter("ShipmentNo", sap.ui.model.FilterOperator.EQ, oShipmentNo[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (oBOLId.length) {
						oFilter = new Filter("BolNo", sap.ui.model.FilterOperator.EQ, oBOLId);
						filters.push(oFilter);
					}
					if (oEreqId.length) {
						oFilter = new Filter("EreqNo", sap.ui.model.FilterOperator.EQ, oEreqId);
						filters.push(oFilter);
					}
					if (oFlightVoyageNo.length) {
						oFilter = new Filter("FlightVoyageNo", sap.ui.model.FilterOperator.EQ, oFlightVoyageNo);
						filters.push(oFilter);
					}
					if (oShipFromCountry.length) {
						for (var i = 0; i < oShipFromCountry.length; i++) {
							oFilter = new Filter("ShipFromCountry", sap.ui.model.FilterOperator.EQ, oShipFromCountry[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (oShipToCountry.length) {
						for (var i = 0; i < oShipToCountry.length; i++) {
							oFilter = new Filter("ShipToCountry", sap.ui.model.FilterOperator.EQ, oShipToCountry[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (oSHStatus.length) {
						for (var i = 0; i < oSHStatus.length; i++) {
							oFilter = new Filter("ShipStatusSAP", sap.ui.model.FilterOperator.EQ, oSHStatus[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (oVesselStatus.length) {
						for (var i = 0; i < oVesselStatus.length; i++) {
							oFilter = new Filter("VesselStatus", sap.ui.model.FilterOperator.EQ, oVesselStatus[i].getProperty("key"));
							filters.push(oFilter);
						}
					}
					if (dVesselCreationDateFrom !== null) {
						filters.push(new Filter("CreatedOn", sap.ui.model.FilterOperator.BT, dVesselCreationDateFromFormatted, dVesselCreationDateToFormatted));
					}
					return filters;
				},
				/**
				 * This function is called on click of save button. It will fetch the records based on provieded filter values.
				 */
				handleSelectionScreenSave: function () {
					var filters = this.handleSelectionParameters();
					var oListViewModel = this.getModel("listViewModel");
					var oVesselDetailTable = this.getView().byId("TblVesselDetail");

					resetTableFilterSort(oVesselDetailTable);
					if (filters && filters.length > 0) {
						oVesselDetailTable.bindRows({
							path: "/VesselDetailSet",
							filters: filters,
							events: {
								dataRequested: function (oResponse) {
									oListViewModel.setProperty("/tableBusy", true);
								}.bind(this),
								dataReceived: function () {
									oListViewModel.setProperty("/tableBusy", false);
								}.bind(this)
							}
						});
						this._oDialogSelectionScreen.close();
					}
				},
				/**
				 * This function clear selection screens all input values to default.
				 */
				handleSelectionScreenClear: function () {
					this.getView().byId("id_FreightForwarder").destroyTokens();
					this.getView().byId("id_VesselNo").destroyTokens();
					this.getView().byId("id_ShipmentNo").destroyTokens();
					this.getView().byId("id_BolID").setValue("");
					this.getView().byId("id_EreqID").setValue("");
					this.getView().byId("id_FlightVoyageNo").setValue("");
					this.getView().byId("id_ShipFromCountry").destroyTokens();
					this.getView().byId("id_ShipToCountry").destroyTokens();
					this.getView().byId("id_SHStatus").destroyTokens();
					this.byId("id_VesselStatus").setTokens([new Token({text: "Pending Pick Up", key: "01"}),new Token({text: "Pending Shipping Departure", key: "02"}),
						new Token({text: "In Transit", key: "03"})]);
					this.getView().byId("id_VesselCreationDate").setValue("");
				},
				/**
				 * This function is called when there is a change in Freight Forwarder. It reset values in shipment no F4.
				 */
				onSelScrnFrghtFrwdTokenChange: function () {
					this.getView().byId('id_ShipmentNo').removeAllTokens();
					this._setSelectionScreenVariantEditMode();
				},
				/**
				 * This function is called when there is a change in any F4 in selection screen. This changes triggers varaint to move 
				 * in edit mode so that user can save it.
				 */
				onSelectionScreenTokenChange: function () {
					this._setSelectionScreenVariantEditMode();
				},
				/**
				 * This function is called when there is a change in any INPUT in selection screen. This changes triggers varaint to move 
				 * in edit mode so that user can save it.
				 */
				onSelectionScreenInputChange: function () {
					this._setSelectionScreenVariantEditMode();
				},
				/**
				 * This function is called when there is a change in Date Range in selection screen. This changes triggers varaint to move 
				 * in edit mode so that user can save it.
				 */
				handleSelScnCrtVslDateRangeChange: function () {
					this._setSelectionScreenVariantEditMode();
				},

				//Selection Screens F4
				/**
				 * This function is for value help of Ship From Country
				 * @param {object} oEvent - Source reference
				 */
				handleFreightForwarderF4Open: function (oEvent) {
					var oFreightForwarderAgent = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpFrgtFrwdAgentTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnFreightForwarderAgentF4Search.bind(this), function (oEvent) {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath, title, description;
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								newToken = new Token({ text: "", key: "" });
								sPath = oSelectedContexts[i].sPath;
								title = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Title;
								description = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Desc;
								newToken.setKey(title);
								newToken.setText(description);
								tokenArray.push(newToken);
							}
							oFreightForwarderAgent.setTokens(tokenArray);
							oFreightForwarderAgent.fireTokenUpdate();
						}
					}, aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},
				/**
				 * Search Handler for Frieght Forwarding Agent
				 * @param {object} oEvent - Source reference
				 */
				_fnFreightForwarderAgentF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_FwdAgentSet", ['FwdAgent', 'FwdAgntName']);
				},
				/**
				 * This function is used to open Value help for Ship From Country
				 * @param {object} oEvent - Source reference
				 */
				handleShipFromCountryF4Open: function (oEvent) {
					var oShipFromCountry = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpShipFromCountryTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnShipFromCountryF4Search.bind(this), function (oEvent) {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath, title, description;
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								newToken = new Token({ text: "", key: "" });
								sPath = oSelectedContexts[i].sPath;
								title = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Title;
								description = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Desc;
								newToken.setKey(title);
								newToken.setText(description);
								tokenArray.push(newToken);
							}
							oShipFromCountry.setTokens(tokenArray);
						}
					}, aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},
				/**
				 * Search Handler for Ship From Country
				 * @param {object} oEvent - Source reference
				 */
				_fnShipFromCountryF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_CountrySet", ['Country_Code', 'Country']);
				},
				/**
				 * This function is used for Ship To Country F4 Open
				 * @param {object} oEvent - Source reference
				 */
				handleShipToCountryF4Open: function (oEvent) {
					var oShipFromCountry = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpShipToCountryTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnShipToCountryF4Search.bind(this), function (oEvent) {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath, title, description;
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								newToken = new Token({ text: "", key: "" });
								sPath = oSelectedContexts[i].sPath;
								title = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Title;
								description = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Desc;
								newToken.setKey(title);
								newToken.setText(description);
								tokenArray.push(newToken);
							}
							oShipFromCountry.setTokens(tokenArray);
						}
					}, aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},

				//	Search Handler for Ship To Country
				_fnShipToCountryF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_CountrySet", ['Country_Code', 'Country']);
				},
				/**
				 * Open Vessel F4 in selection screen
				 * @param {object} oEvent - Source reference
				 */
				handleVesselF4Open: function (oEvent) {
					var oVesselNo = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpVesselTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnVesselF4Search.bind(this), function (oEvent) {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath, title, description;
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								newToken = new Token({ text: "", key: "" });
								sPath = oSelectedContexts[i].sPath;
								title = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Title;
								description = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath).Desc;
								newToken.setKey(title);
								newToken.setText(description);
								tokenArray.push(newToken);
							}
							oVesselNo.setTokens(tokenArray);
						}
					}, aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},

				/**
				 * Vessel F4 Search in selection screen
				 * @param {object} oEvent - Source reference
				 */
				_fnVesselF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFilter = new Filter("Inactive", sap.ui.model.FilterOperator.EQ, '');
					filters.push(oFilter);
					aFinalFilters.push(new Filter({
						filters: filters,
						and: false
					}));
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_VesselSet", ['VesselCode', 'VesselName']);
				},
				
				/**
				 * Shipment No F4 in selection Screen
				 * @param {object} oEvent - Source reference
				 */
				handleShipNoF4Open: function (oEvent) {
					var i18n = this.getResourceBundle();
					var oShipNo = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpShipNoTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					var oFwdAgentArr = this.getView().byId("id_FreightForwarder").getTokens();
					if (!oFwdAgentArr.length) {
						MessageBox.alert(i18n.getText("SelectionScreen.MandateForwardAgent"));
						return;
					}
					this._openValueHelp(this._fnShipNoF4Search.bind(this), function (oEvent) {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath = '', title = '', description = '', selectedObject = {};
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								newToken = new Token({ text: "", key: "" });
								sPath = oSelectedContexts[i].sPath;
								selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
								title = selectedObject.Title;
								description = selectedObject.Desc !== '' ? selectedObject.Desc : selectedObject.Title;
								newToken.setKey(title);
								newToken.setText(description);
								tokenArray.push(newToken);
							}
							oShipNo.setTokens(tokenArray);
						}

					}, aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},

				/**
				 * Search Handler for Shipment No search in selection Screen
				 * @param {object} oEvent - Source reference
				 */
				_fnShipNoF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFwdAgentArr = this.getView().byId("id_FreightForwarder").getTokens();
					if (oFwdAgentArr.length) {
						for (var i = 0; i < oFwdAgentArr.length; i++) {
							var oFilter = new Filter("ForwardingAgent", sap.ui.model.FilterOperator.EQ, oFwdAgentArr[i].getProperty("key"));
							filters.push(oFilter);
						}
						aFinalFilters.push(new Filter({
							filters: filters,
							and: false
						}));
					}
					this._genericF4Search(aFinalFilters, oEvent, this.getOwnerComponent().getModel(), "/F4_ShipmentSet", ['ShipmentNo', '']);
				},

				/**
				 * Shipment Staus F4 open in selection screen
				 * @param {object} oEvent - Source reference
				 */
				handleSHStatusF4Open: function (oEvent) {
					var oShipStatusNo = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpShipmentStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnShipStatusF4Search.bind(this), this._fnShipStatusF4Confirm.bind(this, oShipStatusNo), aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},

				/**
				 * Search handler for Shipment Status in selection screen
				 * @param {object} oEvent - Source reference
				 */
				_fnShipStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Shipment_StatusSet", ['Ship_Status_Value', 'Ship_Status_Desc']);
				},
				/**
				 * Confirm Handler for Shipment Status in selection screen
				 * @param {string} oShipStatusNo - Shipment no
				 * @param {object} oEvent - Source Reference
				 */
				_fnShipStatusF4Confirm: function (oShipStatusNo, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oShipStatusNo.setTokens(tokenArray);
				},
				/**
				 * Vessel Status F4 open in selection screen
				 * @param {object} oEvent - Source reference
				 */
				handleVesselStatusF4Open: function (oEvent) {
					var oVesselStatus = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpVesselStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnVesselStatusF4Search.bind(this), this._fnVesselStatusF4Confirm.bind(this, oVesselStatus), aCustomData);
					this._valueHelpDialog.fireSearch();
					this._setSelectionScreenVariantEditMode();
				},

				/**
				 * Search handler for Vessel Status F4 in selection screen
				 * @param {object} oEvent - Source reference
				 */
				_fnVesselStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Vessel_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm handler for vessel status f4 in selection screen
				 * @param {object} oEvent - Source reference
				 */
				_fnVesselStatusF4Confirm: function (oVesselStatus, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oVesselStatus.setTokens(tokenArray);
				},
				// End of Selection Screen F4
				/**
				 * This function build parameters for create screen based on user row selection in vessel detail screen.
				 * @returns promise - returns promise for create screen to be visible or not
				 */
				_fnBuildCreateVesselParameters: function () {
					var promise = jQuery.Deferred();
					var that = this, i18n = this.getResourceBundle();
					var oVesselDetailTbl = this.getView().byId("TblVesselDetail");
					var aSelectedIndices = oVesselDetailTbl.getSelectedIndices();
					var oSelScrnFrghtForwrder = this.getView().byId('id_FreightForwarder');
					function setTokenToCreateScreen(sControlId, sTokenKey, sTokenText) {
						var oCrtScrnControl = that.getView().byId(sControlId);
						var oCrtScrnToken = {}, oCrtScrnTokenArray = [];
						if (sTokenText !== '' && sTokenKey !== '') {
							oCrtScrnToken = new Token({ text: sTokenText, key: sTokenKey });
							oCrtScrnTokenArray.push(oCrtScrnToken);
							oCrtScrnControl.setTokens(oCrtScrnTokenArray);
						}
					}
					var oCrtScrnFrghtForwrder = this.getView().byId('id_CrtScrnFreightForwarder');
					if (!aSelectedIndices.length) {
						//No Selected Indices means, it is Without Reference
						if (oSelScrnFrghtForwrder.getTokens().length === 1) {
							var oCrtScrnToken = new Token({ text: oSelScrnFrghtForwrder.getTokens()[0].getText(), key: oSelScrnFrghtForwrder.getTokens()[0].getKey() }), oCrtScrnTokenArray = [];
							oCrtScrnTokenArray.push(oCrtScrnToken);
							oCrtScrnFrghtForwrder.setTokens(oCrtScrnTokenArray);
						}
						oCrtScrnFrghtForwrder.setEditable(true);
						this.getView().byId("id_CrtScrnShipmentNo").setEditable(true);
						this.getView().byId('id_CrtScrnLoadPort').setEnabled(true);
						this.getView().byId('id_CrtScrnLoadPort').setEditable(true);
						this.getView().byId('id_CrtScrnTransLoadInd').setEnabled(true);
						this.getView().byId('id_CrtScrnTransLoadInd').setSelected(false);
						this.getView().byId('id_CrtScrnTransLoadInd').fireSelect();
						promise.resolve();
					} else if (aSelectedIndices.length > 1) {
						MessageBox.error(i18n.getText("VesselScreen.SelectASingleRow"));
						promise.reject();
						return promise;
					} else {
						//When user selected some rows that means, it is With Reference
						oCrtScrnFrghtForwrder.setEditable(false);
						this.getView().byId('id_CrtScrnLoadPort').setEnabled(false);
						this.getView().byId('id_CrtScrnLoadPort').setEditable(false);
						this.getView().byId('id_CrtScrnTransLoadInd').setEnabled(false);
						this.getView().byId('id_CrtScrnTransLoadInd').setSelected(true);
						this.getView().byId('id_CrtScrnTransLoadPort').setEditable(false);
						this.getView().byId('id_CrtScrnTransLoadPort').setEnabled(false);
						this.getView().byId('id_CrtScrnDischargePort').setEditable(true);
						this.getView().byId('id_CrtScrnDischargePort').setEnabled(true);
						//To Check if transload indicator ticked or not
						var oFirstRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);
						if (oFirstRowObj.TransloadInd !== 'X') {
							MessageBox.error(i18n.getText("VesselScreen.TransLoadIsNotActive"));
							promise.reject();
							return promise;
						}

						function _buildCreateVesselScreen(that, _bSingleShipment) {

							var sVesselCode = '', sShipmentNo = '', sVesselInfo = '', oRowObj = {};

							oRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);
							sVesselCode = oRowObj.VesselCode;
							sShipmentNo = oRowObj.ShipmentNo;
							sVesselInfo = oRowObj.VesselInfoRec;

							//Write Get Data call
							var aFilters = [];
							aFilters.push(new Filter("VesselCode", sap.ui.model.FilterOperator.EQ, sVesselCode));
							aFilters.push(new Filter("VesselInfoRec", sap.ui.model.FilterOperator.EQ, sVesselInfo));
							if (_bSingleShipment)
								aFilters.push(new Filter("ShipmentNo", sap.ui.model.FilterOperator.EQ, sShipmentNo));
							aFilters.push(new Filter("NoHdrCount", sap.ui.model.FilterOperator.EQ, 'X'));

							var url = "/VesselDetailSet";
							var urlParams = {};
							that.getView().setBusy(true);
							readOdataAndReturnPromise(that.getOwnerComponent().getModel(), url, urlParams, aFilters).done(function (response) {
								that.getView().setBusy(false);
								promise.resolve();
								var aData = response.results;
								var oCrtScrnShipmentToken = {}, oCrtScrnShipmentTokenArray = [], aShipmentTblData = [];
								aData.forEach(function (currentValue, index) {
									if (index === 0) {
										setTokenToCreateScreen("id_CrtScrnFreightForwarder", currentValue.ForwardingAgent, currentValue.AgentName);
										setTokenToCreateScreen("id_CrtScrnVesselStatus", currentValue.VesselStatus, currentValue.VesStatDes);
										setTokenToCreateScreen("id_CrtScrnCurrentPort", currentValue.CurrentPort, currentValue.CurrentPortName);
										setTokenToCreateScreen("id_CrtScrnTransLoadPort", currentValue.TransLoadPortCode, currentValue.TransLoadPortName);
										setTokenToCreateScreen("id_CrtScrnVesselWeightUnit", currentValue.VesselWeightUnit, currentValue.WeightUnitDes);

										that.getView().byId("id_CrtScrnVesselNo").removeAllTokens();
										that.getView().byId("id_CrtScrnLoadPort").removeAllTokens();
										that.getView().byId("id_CrtScrnDischargePort").removeAllTokens();
										that.getView().byId("id_CrtScrnForwarderRefNo").setValue(currentValue.ForwarderRefNo);
										that.getView().byId("id_CrtScrnBookingNo").setValue(currentValue.BookingNo);
										that.getView().byId("id_CrtScrnFlightVoyageNo").setValue('');
										that.getView().byId("id_CrtScrnVesselWeight").setValue(currentValue.VesselWeight);
										that.getView().byId("id_CrtScrnCountOfContnr").setValue(parseInt(currentValue.ShipContainerCnt));
									}
									var oShipmentObj = { ShipmentNo: '', EreqNo: '', BolNo: '', ShipStatusSPS: [] };
									var oShipStatusSPS = { title: '', description: '' };
									//Set Multiple Shipment
									oCrtScrnShipmentToken = {};
									if (currentValue.ShipStatusSAP !== '' && currentValue.ShipmentNo !== '') {
										oCrtScrnShipmentToken = new Token({ text: currentValue.ShipmentNo + ' - ' + currentValue.ShipStatusSAP, key: currentValue.ShipmentNo });
										oCrtScrnShipmentTokenArray.push(oCrtScrnShipmentToken);
									}
									oShipStatusSPS = { title: currentValue.ShipStatusSPS, description: currentValue.ShipStatusSPSDes };
									oShipmentObj = { ShipmentNo: currentValue.ShipmentNo, EreqNo: currentValue.EreqNo, BolNo: currentValue.BolNo, ShipStatusSPS: [oShipStatusSPS] };
									aShipmentTblData.push(oShipmentObj);
								}.bind(that));
								var oCrtScrnShipmentNoControl = that.getView().byId("id_CrtScrnShipmentNo");
								oCrtScrnShipmentNoControl.setTokens(oCrtScrnShipmentTokenArray);
								that.getView().getModel('shipmentTblModel').setProperty("/shipmentData", aShipmentTblData);
								that.getView().byId('id_CrtScrnShipmentTbl').setVisibleRowCount(aShipmentTblData.length !== 0 ? aShipmentTblData.length : 1);
							}.bind(that)).fail(function (oError) {
								that.getView().setBusy(false);
								promise.reject();
							});
						}

						var bSingleShipment = true;
						this.getView().byId("id_CrtScrnShipmentNo").setEditable(false);
						var oConfirmDialog = new sap.m.Dialog(
							{
								title: i18n.getText("Alert"),
								showHeader: true,
								verticalScrolling: false,
								horizontalScrolling: false,
								content: new sap.m.Text({ text: i18n.getText("VesselScreen.massCreate") }).addStyleClass("sapUiResponsiveMargin"),
								buttons: [
									new sap.m.Button({
										text: i18n.getText("VesselScreen.SelectedShipment"),
										press: function () {
											oConfirmDialog.close();
											bSingleShipment = true;
											_buildCreateVesselScreen(this, bSingleShipment);
										}.bind(this)
									}),
									new sap.m.Button({
										text: i18n.getText("VesselScreen.AllShipments"),
										press: function () {
											bSingleShipment = false;
											_buildCreateVesselScreen(this, bSingleShipment);
											oConfirmDialog.close();
										}.bind(this)
									}),
									new sap.m.Button({
										text: i18n.getText("VesselScreen.Cancel"),
										press: function () {
											oConfirmDialog.close();
										}
									})
								],
								afterClose: function () {
									oConfirmDialog.destroy();
								}
							});
						oConfirmDialog.addStyleClass("sapUiResponsiveMargin");
						oConfirmDialog.open();
					}
					return promise;
				},
				/**
				 * This function open Create Vessel Screen Pop Up after building relevant filters and chnages
				 */
				onCreateVessel: function () {
					this._fnBuildCreateVesselParameters().done(function (response) {
						this._oDialogCreateVessel.open();
					}.bind(this));
				},
				/**
				 * This function is used to clear values in F4, Input and Date Picker in Create Vessel Screen.
				 */
				handleCrtVslScreenClear: function () {
					this.getView().byId("id_CrtScrnVesselNo").destroyTokens();
					this.getView().byId("id_CrtScrnVesselStatus").destroyTokens();
					this.getView().byId("id_CrtScrnBOL_AWB").setValue("");
					this.getView().byId("id_CrtScrnEreqId").setValue("");
					this.getView().byId("id_CrtScrnFlightVoyageNo").setValue("");
					this.getView().byId("id_CrtScrnLoadPort").destroyTokens();
					this.getView().byId("id_CrtScrnDischargePort").destroyTokens();
					this.getView().byId("id_CrtScrnTransLoadPort").destroyTokens();
					this.getView().byId("id_CrtScrnCurrentPort").destroyTokens();
					this.getView().byId("id_CrtScrnVesselWeight").setValue("");
					this.getView().byId("id_CrtScrnVesselWeightUnit").destroyTokens();
					this.getView().byId("id_CrtScrenPLDLoadDate").setValue("");
					this.getView().byId("id_CrtScrenPLDDelivDate").setValue("");
					this.getView().byId("id_CrtScrnCountOfContnr").setValue("");
					this.getView().byId("id_CrtScrnBookingNo").setValue("");
					this.getView().byId("id_CrtScrnForwarderRefNo").setValue("");
					var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
					aShipmentTblData.forEach(function (currentValue, index) {
						currentValue.EreqNo = '';
						currentValue.BolNo = '';
					});
					this.getView().getModel('shipmentTblModel').refresh(true);

					this.getView().getControlsByFieldGroupId("createMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput")
							oInput.setValueState("None");
					});
				},
				/**
				 * To close Create Vessel Screen
				 */
				handleCrtVslScreenClose: function () {
					this._oDialogCreateVessel.close();
					this.handleCrtVslScreenClear();
				},
				/**
				 * Event reset error value state to none after Create Vessel Dialog closed
				 */
				onAfterCreateScreenClose: function () {
					this.handleCrtVslScreenClear();
					this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
					this.getView().byId("id_CrtScrnShipmentNo").destroyTokens();
					this.getView().byId("id_CrtScrnGLobalSPSSHStatus").destroyTokens();
				},
				/**
				 * Validate Input field
				 * @param {object} oInput - Input control which should be validated before processing further
				 * @returns 
				 */
				_validateInput: function (oInput) {
					var sValueState = "None";
					var bValidationError = false;

					if (((oInput.getMetadata().getElementName() === "sap.m.Input" && oInput.getValue() === "") ||
						(oInput.getMetadata().getElementName() === "sap.m.MultiInput" && oInput.getTokens().length === 0)) &&
						oInput.getEnabled() && oInput.getRequired()) {
						sValueState = "Error";
						bValidationError = true;
						oInput.setValueState(sValueState);
						return bValidationError;
					}
				},
				/**
				 * Event reset Value State to None when Input is updated with valid values
				 * @param {object} oEvent - Source Reference
				 */
				onValidateCreateScreenMandatory: function (oEvent) {
					this.getView().getControlsByFieldGroupId("createMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput") {
							if ((oInput.getValue() !== "" && oInput.getValueState() === "Error") || oInput.getEnabled() === false) {
								oInput.setValueState("None");
							}
						}
					});
				},
				/**
				 * Vessel No F4 Open in create vessel screen
				 * @param {Object} oEvent - Source Reference
				 */
				handleCrtVslVesselF4Open: function (oEvent) {
					var oVesselNo = oEvent.getSource();
					//Reset Error State
					oVesselNo.setValueState("None");
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpVesselTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslVesselF4Search.bind(this), this._fnCrtVslVesselF4Confirm.bind(this, oVesselNo), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Hanlder for vessel no in create vessel screen
				 * @param {Object} oEvent - Source Reference
				 */
				_fnCrtVslVesselF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFilter = new Filter("Inactive", sap.ui.model.FilterOperator.EQ, '');
					filters.push(oFilter);
					aFinalFilters.push(new Filter({
						filters: filters,
						and: false
					}));
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_VesselSet", ['VesselCode', 'VesselName']);
				},
				/**
				 * Confirm Handler for Vessel No 
				 * @param {string} oVesselNo - Vessel No
				 * @param {*} oEvent - Source reference
				 */
				_fnCrtVslVesselF4Confirm: function (oVesselNo, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oVesselNo.setTokens(tokenArray);
				},
				/**
				 * Vessel Status F4 Open in Create Vessel Screen
				 * @param {Object} oEvent - Source Reference
				 */
				handleCrtVslVesselStatusF4Open: function (oEvent) {
					var oVesselStatus = oEvent.getSource();
					oVesselStatus.setValueState('None');
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpVesselStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslVesselStatusF4Search.bind(this), this._fnCrtVslVesselStatusF4Confirm.bind(this, oVesselStatus), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Vessel Status in create vessel screen
				 * @param {Object} oEvent - Source Reference
				 */
				_fnCrtVslVesselStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Vessel_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm Handler for Vessel Status in Create Vessel screen
				 * @param {string} oVesselStatus - Vessel Status
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslVesselStatusF4Confirm: function (oVesselStatus, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oVesselStatus.setTokens(tokenArray);
				},
				/**
				 * Change Event for Flight Voyage No in create vessel screen
				 * @param {Object} oEvent - Source Reference
				 */
				handleCrtVslFlightVoyageChange: function (oEvent) {
					var oFlightVoyageNo = oEvent.getSource();
					oFlightVoyageNo.setValueState('None');
				},
				/**
				 * Change Event for Transload Indicator in create vessel screen
				 * @param {Object} oEvent - Source Reference
				 */
				onCrtScrnTransLoadIndChange: function (oEvent) {
					var bTransLoadIndSelected = oEvent.getSource().getSelected();
					this.getView().byId('id_CrtScrnTransLoadPort').setEnabled(bTransLoadIndSelected);
					this.getView().byId('id_CrtScrnTransLoadPort').setEditable(bTransLoadIndSelected);
					this.getView().byId('id_CrtScrnDischargePort').setEnabled(!bTransLoadIndSelected);
					this.getView().byId('id_CrtScrnDischargePort').setEditable(!bTransLoadIndSelected);
					this.getView().byId('id_CrtScrnTransLoadPort').removeAllTokens();
					this.getView().byId('id_CrtScrnDischargePort').removeAllTokens();
				},
				/**
				 * Open Current Port F4 in Create Vessel Screen
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslCurrentPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleCrtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpCurrentPortTitle"), bMultiSelect);
				},
				/**
				 * Open Load Port F4 in Create Vessel Screen
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslLoadPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleCrtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpLoadPortTitle"), bMultiSelect);
				},
				/**
				 * Open Trans Load Port F4 in Create Vessel Screen
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslTransLoadPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleCrtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpTransLoadPortTitle"), bMultiSelect);
				},
				/**
				 * Open Discharge Port F4 in Create Vessel Screen
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslDischargePortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleCrtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpDischargePortTitle"), bMultiSelect);
				},
				/**
				 * This function is internal function for all port F4 in create vessel screen
				 * @param {object} oEvent - Source reference
				 * @param {string} sF4Title - Title of F4
				 * @param {boolean} bMultiSelect - to make f4 multi select or single select
				 */
				handleCrtVslPortF4Open: function (oEvent, sF4Title, bMultiSelect) {
					var oPort = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", sF4Title);
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", bMultiSelect);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslPortF4Search.bind(this), this._fnCrtVslPortF4Confirm.bind(this, oPort), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Port in create vessel screen
				 * @param {object} oEvent - Source event
				 */
				_fnCrtVslPortF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFilter = new Filter("InActive", sap.ui.model.FilterOperator.EQ, '');
					filters.push(oFilter);
					aFinalFilters.push(new Filter({
						filters: filters,
						and: false
					}));
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_PortSet", ['PortCode', 'PortName']);
				},
				/**
				 * Confirm Handler for Port in create vessel screen
				 * @param {object} oPort - Port Object
				 * @param {object} oEvent - Source event
				 */
				_fnCrtVslPortF4Confirm: function (oPort, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oPort.setTokens(tokenArray);
				},
				/**
				 * Handle for Weight UOM in create vessel screen
				 * @param {object} oEvent - Source event
				 */
				handleCrtVsl_VesselWeightUOMF4Open: function (oEvent) {
					var oVesselWeihgtUOM = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpWeightUOMTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslWeightUOMF4Search.bind(this), this._fnCrtVslWeightUOMF4Confirm.bind(this, oVesselWeihgtUOM), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Vessel Weight Unit in create vessel screen
				 * @param {object} oEvent - Source event
				 */
				_fnCrtVslWeightUOMF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Weight_UnitSet", ['WeightUnit', 'UnitText']);
				},
				/**
				 * Confirm Handler for Vessel Weight Unit in create vessel screen
				 * @param {object} oVesselWeihgtUOM - Vessel Weight Object
				 * @param {object} oEvent - Source event
				 */
				_fnCrtVslWeightUOMF4Confirm: function (oVesselWeihgtUOM, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oVesselWeihgtUOM.setTokens(tokenArray);
				},
				/**
				 * Shipment No F4 open in create vessel screen
				 * @param {object} oEvent - Source event
				 */
				handleCrtVslShipmentNoF4Open: function (oEvent) {
					var oShipmentNo = oEvent.getSource();
					oShipmentNo.setValueState('None');
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valpHelShipmentNoTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);
					var i18n = this.getResourceBundle();
					var oFwdAgentArr = this.getView().byId("id_CrtScrnFreightForwarder").getTokens();
					if (!oFwdAgentArr.length) {
						MessageBox.alert(i18n.getText("CreateVessel.MandateForwardAgent"));
						return;
					}
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openShipmentNoValueHelp(this._fnCrtVslShipmentNoF4Search.bind(this), this._fnCrtVslShipmentNoF4Confirm.bind(this, oShipmentNo), aCustomData);
					this._shipmentNoValueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Shipment No in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslShipmentNoF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFwdAgentArr = this.getView().byId("id_CrtScrnFreightForwarder").getTokens();
					if (oFwdAgentArr.length) {
						for (var i = 0; i < oFwdAgentArr.length; i++) {
							var oFilter = new Filter("ForwardingAgent", sap.ui.model.FilterOperator.EQ, oFwdAgentArr[i].getProperty("key"));
							filters.push(oFilter);
						}
						aFinalFilters.push(new Filter({
							filters: filters,
							and: false
						}));
					}
					this._shipmentNoF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_ShipmentSet", ['ShipmentNo', 'ShipStatusSAP']);
				},
				/**
				 * Confirm Handler for Shipment No in create vessel screen
				 * @param {object} oShipmentNo - Shipment No Object
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslShipmentNoF4Confirm: function (oShipmentNo, oEvent) {
					var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath = '', title = '', description = '', selectedObject = {};
					if (oSelectedContexts) {
						for (var i = 0; i < oSelectedContexts.length; i++) {
							newToken = new Token({ text: "", key: "" });
							sPath = oSelectedContexts[i].sPath;
							selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
							title = selectedObject.Title;
							description = selectedObject.Desc !== '' ? selectedObject.Title + ' - ' + selectedObject.Desc : selectedObject.Title;
							newToken.setKey(title);
							newToken.setText(description);
							tokenArray.push(newToken);
						}
					}
					oShipmentNo.setTokens(tokenArray);
					oShipmentNo.fireTokenUpdate();
				},
				/**
				 * When Shipment is changed, reset values in Shipment No Table in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				onCrtVslScrnShipmentTokenChange: function (oEvent) {
					var aShipmentTblData = [];
					if (oEvent.getParameters() && oEvent.getParameters().type === "removed") {
						aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
						var oRemovedShipment = oEvent.getParameters().removedTokens[0];
						var sRemovedShipmentKey = oRemovedShipment.getKey();
						var elementIndex = aShipmentTblData.findIndex(shipObj => shipObj.ShipmentNo === sRemovedShipmentKey);
						aShipmentTblData.splice(elementIndex, 1);
						this.getView().getModel('shipmentTblModel').refresh(true);
						return;
					} else {
						this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
					}
					aShipmentTblData = [];
					var oShipmentObj = { ShipmentNo: '', EreqNo: '', BolNo: '', ShipStatusSPS: [] };
					var aShipmentTokens = oEvent.getSource().getTokens();
					for (var i = 0; i < aShipmentTokens.length; i++) {
						oShipmentObj = { ShipmentNo: aShipmentTokens[i].getProperty("key"), EreqNo: '', BolNo: '', ShipStatusSPS: [] };
						aShipmentTblData.push(oShipmentObj);
					}
					this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", aShipmentTblData);
					this.getView().getModel('shipmentTblModel').refresh(true);
					this.getView().byId('id_CrtScrnShipmentTbl').setVisibleRowCount(aShipmentTblData.length !== 0 ? aShipmentTblData.length : 1);
				},
				/**
				 * Handler for Frieght Forwarding Agent in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslFreightForwarderF4Open: function (oEvent) {
					var oFreightForwNo = oEvent.getSource();
					//Reset Error State
					oFreightForwNo.setValueState("None");
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpFrgtFrwdAgentTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslFreightForwarderF4Search.bind(this), this._fnCrtVslFreightForwarderF4Confirm.bind(this, oFreightForwNo), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Frieght Forwarding Agent in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslFreightForwarderF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_FwdAgentSet", ['FwdAgent', 'FwdAgntName']);
				},
				/**
				 * Confirm Handler for Frieght Forwarding Agent in create vessel screen
				 * @param {object} oFreightForwNo - Freight Forwarder No
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslFreightForwarderF4Confirm: function (oFreightForwNo, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oFreightForwNo.setTokens(tokenArray);
					//To Reset Shipment No Fields Token
					oFreightForwNo.fireTokenUpdate();
					this.getView().byId('id_CrtScrnShipmentNo').fireTokenUpdate();
				},
				/**
				 * When Frieght Forwarder is changed, reset values in Shipment No field as it is dependent on Freight 
				 * Forwarder in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				onCrtVslScrnFrghtFrwdTokenChange: function (oEvent) {
					this.getView().byId('id_CrtScrnShipmentNo').removeAllTokens();
				},
				/**
				 * Handler for SPS Shipment F4 in Create Vessel Screen 
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslSPSSHStatusF4Open: function (oEvent) {
					var oSPSShipStatusControl_RowPath = '';
					if (this.getView().byId('id_CrtScrnGLobalSPSSHStatusForm').getVisible())
						oSPSShipStatusControl_RowPath = oEvent.getSource();
					else
						oSPSShipStatusControl_RowPath = oEvent.getSource().getBindingContext('shipmentTblModel').sPath;
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpSPSShipmentStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnCrtVslSPSShipStatusF4Search.bind(this), this._fnCrtVslSPSShipStatusF4Confirm.bind(this, oSPSShipStatusControl_RowPath), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for SPS Shipment Status in create vessel screen
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslSPSShipStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_SPS_Shipment_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm Handler for SPS Shipment Status in create vessel screen
				 * @param {string} oSPSShipStatusControl_RowPath - SPS Ship Status Control's RowPath
				 * @param {object} oEvent - Source Reference
				 */
				_fnCrtVslSPSShipStatusF4Confirm: function (oSPSShipStatusControl_RowPath, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					if (this.getView().byId('id_CrtScrnGLobalSPSSHStatusForm').getVisible()) {
						oSPSShipStatusControl_RowPath.setTokens(tokenArray);
						oSPSShipStatusControl_RowPath.fireTokenUpdate();
					} else {
						var oSelectedContexts = oEvent.getParameter("selectedContexts"), aShipStatusSPS = [], oShipStatusSPS = { title: '', description: '' }, sPath = '', selectedObject = {};
						if (oSelectedContexts) {
							for (var i = 0; i < oSelectedContexts.length; i++) {
								oShipStatusSPS = { title: '', description: '' };
								sPath = oSelectedContexts[i].sPath;
								selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
								oShipStatusSPS.title = selectedObject.Title;
								oShipStatusSPS.description = selectedObject.Desc !== '' ? selectedObject.Desc : selectedObject.Title;
								aShipStatusSPS.push(oShipStatusSPS);
							}
						}
						this.getView().getModel('shipmentTblModel').setProperty(oSPSShipStatusControl_RowPath + '/ShipStatusSPS', aShipStatusSPS);
						this.getView().getModel('shipmentTblModel').refresh(true);
					}
				},
				/**
				 * When SPS Shipment Status is changed, update SPS Shipment Column in Shipment No Table in Create Vessel Screen
				 * @param {object} oEvent - Source Reference
				 */
				onCrtVslSPSShipStatusTokenChange: function (oEvent) {
					var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
					if (oEvent.getParameters() && oEvent.getParameters().type === "removed") {
						aShipmentTblData.forEach(function (currentValue, index) {
							currentValue.ShipStatusSPS = [];
						});
					} else {
						var aTokenArray = this.getView().byId('id_CrtScrnGLobalSPSSHStatus').getTokens();
						if (aTokenArray.length) {
							var oShipStatusSPS = { title: aTokenArray[0].getKey(), description: aTokenArray[0].getText() };
							aShipmentTblData.forEach(function (currentValue, index) {
								currentValue.ShipStatusSPS = [];
								currentValue.ShipStatusSPS.push(oShipStatusSPS);
							});
						} else {
							aShipmentTblData.forEach(function (currentValue, index) {
								currentValue.ShipStatusSPS = [];
							});
						}
					}
					this.getView().getModel('shipmentTblModel').refresh(true);
				},
				/**
				 * This function is used to convert selected items of Pop Up into tokens, so these tokens can be set to input boxes.
				 * @param {object} oEvent - Source Reference
				 * @returns returns token array
				 */
				_fnGetTokensFromSelectedItems: function (oEvent) {
					var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath = '', title = '', description = '', selectedObject = {};
					if (oSelectedContexts) {
						for (var i = 0; i < oSelectedContexts.length; i++) {
							newToken = new Token({ text: "", key: "" });
							sPath = oSelectedContexts[i].sPath;
							selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
							title = selectedObject.Title;
							description = selectedObject.Desc !== '' ? selectedObject.Desc : selectedObject.Title;
							newToken.setKey(title);
							newToken.setText(description);
							tokenArray.push(newToken);
						}
					}
					return tokenArray;
				},
				/**
				 * This function is helper function for Create button in create vessel pop up. This function builds create payload.
				 */
				handleCreateParameters: function () {
					var sErrorText = '', bErrorFlag = false;
					var i18n = this.getResourceBundle();
					var oCrtVeslObj = {}, aCrtVeslPayload = [];
					//mandatory fields
					var oFwdAgentArr = this.getView().byId("id_CrtScrnFreightForwarder").getTokens();
					if (!oFwdAgentArr.length) {
						sErrorText += '\u2022 ' + i18n.getText("CreateVessel.MandateForwardAgent") + '\n';
						bErrorFlag = true;
					}
					var sFwdAgentArr = oFwdAgentArr[0].getProperty("key");
					var sVessleNo = '', oVessleNo = this.getView().byId("id_CrtScrnVesselNo").getTokens();
					if (oVessleNo.length)
						sVessleNo = oVessleNo[0].getProperty("key");

					var sVessleStatus = '', oVessleStatus = this.getView().byId("id_CrtScrnVesselStatus").getTokens();
					if (oVessleStatus.length)
						sVessleStatus = oVessleStatus[0].getProperty("key");

					var sFlightVoyageNo = this.getView().byId("id_CrtScrnFlightVoyageNo").getValue();
					var sBookingNo = this.getView().byId("id_CrtScrnBookingNo").getValue();
					var sForwarderRefNo = this.getView().byId("id_CrtScrnForwarderRefNo").getValue();
					var iCountOfContainer = this.getView().byId("id_CrtScrnCountOfContnr").getValue();
					
					var sCurrentPort = '', oCurrentPort = this.getView().byId("id_CrtScrnCurrentPort").getTokens();
					if (oCurrentPort.length)
						sCurrentPort = oCurrentPort[0].getProperty("key");
					
					var sLoadPort = '', oLoadPort = this.getView().byId("id_CrtScrnLoadPort").getTokens();
					if (oLoadPort.length)
						sLoadPort = oLoadPort[0].getProperty("key");

					var bTransLoadInd = this.getView().byId('id_CrtScrnTransLoadInd').getSelected();

					var sTransLoadPort = '', oTransLoadPort = this.getView().byId("id_CrtScrnTransLoadPort").getTokens();
					if (oTransLoadPort.length)
						sTransLoadPort = oTransLoadPort[0].getProperty("key");

					var sDischargePort = '', oDischargePort = this.getView().byId("id_CrtScrnDischargePort").getTokens();
					if (oDischargePort.length)
						sDischargePort = oDischargePort[0].getProperty("key");

					if ((sDischargePort !== '') && (sLoadPort === sDischargePort)) {
						sErrorText += '\u2022 ' + i18n.getText("CreateVessel.LoadAndDischargePortCantBeSame") + '\n';
						bErrorFlag = true;
					}

					if ((sTransLoadPort !== '') && (sLoadPort === sTransLoadPort)) {
						sErrorText += '\u2022 ' + i18n.getText("CreateVessel.LoadAndTransLoadPortCantBeSame") + '\n';
						bErrorFlag = true;
					}

					if ((sTransLoadPort !== '') && (sDischargePort === sTransLoadPort)) {
						sErrorText += '\u2022 ' + i18n.getText("CreateVessel.TransLoadAndDischargePortCantBeSame") + '\n';
						bErrorFlag = true;
					}

					var sVesselWeightVal = this.getView().byId("id_CrtScrnVesselWeight").getValue();
					var sVesselWeight = sVesselWeightVal === '' ? '0' : sVesselWeightVal;

					var sVesselWeightUOM = '', oVesselWeightUOM = this.getView().byId("id_CrtScrnVesselWeightUnit").getTokens();
					if (oVesselWeightUOM.length)
						sVesselWeightUOM = oVesselWeightUOM[0].getProperty("key");

					var aShipNoTblData = this.getView().getModel('shipmentTblModel').getProperty('/shipmentData');
					var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT00:00:00"/*,
						UTC : true*/
					});
					var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT23:59:59"/*,
						UTC : true*/
					});

					//Format the Shipment Creation Date into Odata Understandable format
					var dPlannedLoadDate = this.getView().byId("id_CrtScrenPLDLoadDate").getDateValue();
					var dPlannedDeliveryDate = this.getView().byId("id_CrtScrenPLDDelivDate").getDateValue();

					if (sVesselWeight !== '0' && sVesselWeightUOM === "") {
						sErrorText += '\u2022 ' + i18n.getText("VesselScreen.VesselUnitWithWeightMandatory") + '\n';
						bErrorFlag = true;
					}
					else if (sVesselWeight === '0' && sVesselWeightUOM !== "") {
						sErrorText += '\u2022 ' + i18n.getText("VesselScreen.VesselWeightIfUOMMandatory") + '\n';
						bErrorFlag = true;
					}
					
					if(this.getView().byId("id_CrtScrnLoadPort").getEnabled() && !oLoadPort.length){
						sErrorText += '\u2022 ' + i18n.getText("VesselScreen.LoadPortIsMandatory") + '\n';
						bErrorFlag = true;
					}
					if(!this.getView().byId('id_CrtScrnTransLoadInd').getEnabled() && !sDischargePort.length){
						sErrorText += '\u2022 ' + i18n.getText("VesselScreen.DischargePortIsMandatory") + '\n';
						bErrorFlag = true;
					}else if(this.getView().byId('id_CrtScrnTransLoadInd').getEnabled()){
						if(bTransLoadInd && !sTransLoadPort.length){
							sErrorText += '\u2022 ' + i18n.getText("VesselScreen.TransLoadPortIsMandatory") + '\n';
							bErrorFlag = true;
						}else if(!bTransLoadInd && !sDischargePort.length){
							sErrorText += '\u2022 ' + i18n.getText("VesselScreen.DischargePortIsMandatory") + '\n';
							bErrorFlag = true;
						}
					}
					

					if (bErrorFlag) {
						MessageBox.error(sErrorText);
						return aCrtVeslPayload;
					}
					oCrtVeslObj = {
						"FlightVoyageNo": sFlightVoyageNo,
						"VesselCode": sVessleNo,
						"ForwardingAgent": sFwdAgentArr,
						"ForwarderRefNo": sForwarderRefNo,
						"VesselStatus": sVessleStatus,
						"LoadPortCode": sLoadPort,
						"TransLoadPortCode": sTransLoadPort,
						"DischargePortCode": sDischargePort,
						"TransloadInd": bTransLoadInd ? "X" : "",
						"BookingNo": sBookingNo,
						"CurrentPort": sCurrentPort,
						"ShipContainerCnt": iCountOfContainer,
						"VesselWeight": sVesselWeight,
						"VesselWeightUnit": sVesselWeightUOM,
						"LoadPortDateP": dPlannedLoadDate === ("" || null) ? null : oFormatFrom.format(dPlannedLoadDate),
						"TransLoadPortDateP": dPlannedDeliveryDate === ("" || null) ? null : oFormatFrom.format(dPlannedDeliveryDate),
						"DiscPortDateP": dPlannedDeliveryDate === ("" || null) ? null : oFormatFrom.format(dPlannedDeliveryDate)
					};
					for (var i = 0; i < aShipNoTblData.length; i++) {
						var oCrtVeslObjClone = jQuery.extend(true, {}, oCrtVeslObj);
						oCrtVeslObjClone.ShipmentNo = aShipNoTblData[i].ShipmentNo;
						oCrtVeslObjClone.EreqNo = aShipNoTblData[i].EreqNo;
						oCrtVeslObjClone.BolNo = aShipNoTblData[i].BolNo;
						if (aShipNoTblData[i].BolNo === '') {
							aCrtVeslPayload = [];
							MessageBox.error(i18n.getText('VesselScreen.BolIsMandatory'),
								{
									styleClass: "sapUiSizeCompact"
								});
							break;
						}
						oCrtVeslObjClone.ShipStatusSPS = aShipNoTblData[i].ShipStatusSPS.length > 0 ? aShipNoTblData[i].ShipStatusSPS[0].title : "";
						aCrtVeslPayload.push(oCrtVeslObjClone);
					}
					return aCrtVeslPayload;
				},
				/**
				 * This function is called when we click Create button in create vessel pop up.
				 * @param {object} oEvent - Source Reference
				 */
				handleCrtVslScreenCreate: function (oEvent) {
					var that = this;
					var validationError = false;
					this.getView().getControlsByFieldGroupId("createMandate").forEach(function (oInput) {
						validationError = this._validateInput(oInput) || validationError;
					}, this);
					if (validationError) {
						return;
					}
					var aVesselHdToVesselUpdate = this.handleCreateParameters();
					if (!aVesselHdToVesselUpdate.length) {
						return;
					}
					var oCreateVesselObj = {
						"d": {
							"Indicator": "I",
							"VesselHdToVesselUpdate": aVesselHdToVesselUpdate,
							"VesselHdToReturnMsg": [
								{
									"MsgID": "ZSUP"
								}
							]
						}
					};
					var oModel = this.getOwnerComponent().getModel();
					this._oDialogCreateVessel.setBusy(true);
					oModel.create("/VesselHdSet", oCreateVesselObj, {
						success: function (oData, response) {
							that._oDialogCreateVessel.setBusy(false);
							if (oData.VesselHdToReturnMsg && oData.VesselHdToReturnMsg.results && oData.VesselHdToReturnMsg.results.length) {
								var results = oData.VesselHdToReturnMsg.results;
								//To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
								var sMessage = '', sMessageError = '';
								results.some(function (obj) {
									if (obj.MsgType === 'I') {
										sMessage += obj.Message +' - '+obj.Msgv1+ "\n";
									} else if (obj.MsgType === 'E') {
										sMessageError += obj.Message +' - '+obj.Msgv1+ "\n";
									}
								});
								if (sMessageError) {
									MessageBox.error(sMessageError);
									return;
								} else {
									MessageBox.success(sMessage);
								}
							}
							that._oDialogCreateVessel.close();
							that.getView().byId("BtnRefresh").firePress();
						},
						error: function (oError) {
							that._oDialogCreateVessel.setBusy(false);
						}
					});
				},
				/**
				 * This function is called when we click Delete button in List page.
				 * @param {object} oEvent - Source Reference
				 */
				onDeleteVessel: function (oEvent) {
					var that = this;
					var i18n = this.getResourceBundle();
					var oDeleteVeslObj = {}, aVesselHdToVesselUpdate = [];
					var oVesselDetailTbl = that.getView().byId("TblVesselDetail");
					var aSelectedIndices = oVesselDetailTbl.getSelectedIndices();
					if (!aSelectedIndices.length) {
						MessageBox.error(i18n.getText("VesselScreen.SelectAtleastARow"));
						return;
					}
					MessageBox.confirm(
						(i18n.getText("VesselScreen.ConfirmDeleteMsg")), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.YES) {
								for (var i = 0; i < aSelectedIndices.length; i++) {
									var selectRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[i]).sPath);
									oDeleteVeslObj = {};
									oDeleteVeslObj.VesselCode = selectRowObj.VesselCode;
									oDeleteVeslObj.ShipmentNo = selectRowObj.ShipmentNo;
									oDeleteVeslObj.BolNo = selectRowObj.BolNo;
									oDeleteVeslObj.VesselInfoRec = selectRowObj.VesselInfoRec;
									if(selectRowObj.VesselStatus !== '' &&
											(parseInt(selectRowObj.VesselStatus) === 3 || parseInt(selectRowObj.VesselStatus) === 4)){
										
										MessageBox.error(i18n.getText("VesselScreen.VesselStatusNotAllowedToDelete"));
										return;
									}
									aVesselHdToVesselUpdate.push(oDeleteVeslObj);
								}
								if (!aVesselHdToVesselUpdate.length) {
									return;
								}
								var oDeleteVesselObj = {
									"d": {
										"Indicator": "D",
										"VesselHdToVesselUpdate": aVesselHdToVesselUpdate,
										"VesselHdToReturnMsg": [
											{
												"MsgID": "ZSUP"
											}
										]
									}
								};
								var oModel = that.getOwnerComponent().getModel();
								that.getModel("listViewModel").setProperty("/tableBusy", true);
								oModel.create("/VesselHdSet", oDeleteVesselObj, {
									success: function (oData, response) {
										that.getModel("listViewModel").setProperty("/tableBusy", false);
										if (oData.VesselHdToReturnMsg && oData.VesselHdToReturnMsg.results && oData.VesselHdToReturnMsg.results.length) {
											var results = oData.VesselHdToReturnMsg.results;
											//To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
											var sMessage = '';
											results.some(function (obj) {
												if (obj.MsgType === 'I') {
													sMessage += obj.Message +' - '+obj.Msgv1+ "\n";
												}else if (obj.MsgType === 'E') {
													sMessageError += obj.Message +' - '+obj.Msgv1+ "\n";
												}
											});
											MessageBox.success(sMessage);
										}
										that.getView().byId("BtnRefresh").firePress();
									},
									error: function (oError) {
										that.getModel("listViewModel").setProperty("/tableBusy", false);
									}
								});
							} else if (oAction === sap.m.MessageBox.Action.CANCEL) {
								return;
							}
						}
					}
					);

				},
				// End of Selection Screen F4
				/**
				 * This function enable/ disable controls in Update Vessel Screen based on Vessel/Shipment Selection
				 * @param {boolean} bEntireVesselUpdate - If entire vessel is selected or specific shipment
				 */
				_fnEnableControlsInUpdateVessel: function (bEntireVesselUpdate) {
					this.getView().byId("id_UpdtScrnVesselStatus").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnForwarderRefNo").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnBookingNo").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnFlightVoyageNo").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnCurrentPort").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnLoadPort").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnTransLoadPort").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnDischargePort").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnVesselWeight").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnVesselWeightUnit").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnCountOfContnr").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnPLDLoadDate").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnPLDDelivDate").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnActLoadDate").setEditable(bEntireVesselUpdate);
					this.getView().byId("id_UpdtScrnActDelivDate").setEditable(bEntireVesselUpdate);
					this.getView().byId('id_UpdtScrnTransLoadPort').setEnabled(true);
					this.getView().byId('id_UpdtScrnDischargePort').setEnabled(true);
				},
				/**
				 * This function is helper function to build Update Vessel screen data which are later binded to F4 and Input fields.
				 */
				_fnBuildUpdateVesselParameters: function () {
					var promise = jQuery.Deferred();
					var that = this, i18n = this.getResourceBundle();
					var oVesselDetailTbl = this.getView().byId("TblVesselDetail");
					var aSelectedIndices = oVesselDetailTbl.getSelectedIndices();
					function setTokenToUpdateScreen(sControlId, sTokenKey, sTokenText) {
						var oCrtScrnControl = that.getView().byId(sControlId);
						var oCrtScrnToken = {}, oCrtScrnTokenArray = [];
						if (sTokenText !== '' && sTokenText !== undefined && sTokenKey !== '' && sTokenKey !== undefined) {
							oCrtScrnToken = new Token({ text: sTokenText, key: sTokenKey });
							oCrtScrnTokenArray.push(oCrtScrnToken);
							oCrtScrnControl.setTokens(oCrtScrnTokenArray);
						}
					}
					if (aSelectedIndices.length !== 1) {
						MessageBox.error(i18n.getText("VesselScreen.SelectASingleRow"));
						promise.reject();
					} else {
						this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
						var oConfirmDialog = new sap.m.Dialog(
							{
								title: i18n.getText("Alert"),
								showHeader: true,
								verticalScrolling: false,
								horizontalScrolling: false,
								content: new sap.m.Text({ text: i18n.getText("VesselScreen.massUpdateVessel") }).addStyleClass("sapUiResponsiveMargin"),
								buttons: [
									new sap.m.Button({
										text: i18n.getText("VesselScreen.SelectedShipment"),
										press: function () {
											oConfirmDialog.close();
											var oRowObj = {};
											this.getView().getModel('shipmentTblModel').setProperty("/vesselUpdate", false);
											this.getView().getModel('shipmentTblModel').refresh(true);
											this._fnEnableControlsInUpdateVessel(false);
											var oFirstRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);

											setTokenToUpdateScreen("id_UpdtScrnFreightForwarder", oFirstRowObj.ForwardingAgent, oFirstRowObj.AgentName);
											setTokenToUpdateScreen("id_UpdtScrnVesselNo", oFirstRowObj.VesselCode, oFirstRowObj.VesselName);
											setTokenToUpdateScreen("id_UpdtScrnVesselStatus", oFirstRowObj.VesselStatus, oFirstRowObj.VesStatDes);
											setTokenToUpdateScreen("id_UpdtScrnCurrentPort", oFirstRowObj.CurrentPort, oFirstRowObj.CurrentPortName);
											setTokenToUpdateScreen("id_UpdtScrnLoadPort", oFirstRowObj.LoadPortCode, oFirstRowObj.LoadPortName);
											setTokenToUpdateScreen("id_UpdtScrnTransLoadPort", oFirstRowObj.TransLoadPortCode, oFirstRowObj.TransLoadPortName);
											setTokenToUpdateScreen("id_UpdtScrnDischargePort", oFirstRowObj.DischargePortCode, oFirstRowObj.DischargePortName);
											setTokenToUpdateScreen("id_UpdtScrnVesselWeightUnit", oFirstRowObj.VesselWeightUnit, oFirstRowObj.WeightUnitDes);

											this.getView().byId('id_UpdtScrnTransLoadInd').setSelected(oFirstRowObj.TransloadInd === 'X' ? true : false);
											this.getView().byId('id_UpdtScrnTransLoadInd').setEditable(false);
											this.getView().byId("id_UpdtScrnForwarderRefNo").setValue(oFirstRowObj.ForwarderRefNo);
											this.getView().byId("id_UpdtScrnBookingNo").setValue(oFirstRowObj.BookingNo);
											this.getView().byId("id_UpdtScrnFlightVoyageNo").setValue(oFirstRowObj.FlightVoyageNo);
											this.getView().byId("id_UpdtScrnVesselWeight").setValue(oFirstRowObj.VesselWeight);
											this.getView().byId("id_UpdtScrnCountOfContnr").setValue(parseInt(oFirstRowObj.ShipContainerCnt));
											this.getView().byId("id_UpdtScrnVesselInfo").setValue(oFirstRowObj.VesselInfoRec);
											if (oFirstRowObj.LoadPortDateP !== null && oFirstRowObj.LoadPortDateP !== undefined && oFirstRowObj.LoadPortDateP !== '')
												this.getView().byId("id_UpdtScrnPLDLoadDate").setDateValue(oFirstRowObj.LoadPortDateP);
											if (oFirstRowObj.DiscPortDateP !== null && oFirstRowObj.DiscPortDateP !== undefined && oFirstRowObj.DiscPortDateP !== '')
												this.getView().byId("id_UpdtScrnPLDDelivDate").setDateValue(oFirstRowObj.DiscPortDateP);
											if (oFirstRowObj.LoadPortDateA !== null && oFirstRowObj.LoadPortDateA !== undefined && oFirstRowObj.LoadPortDateA !== '')
												this.getView().byId("id_UpdtScrnActLoadDate").setDateValue(oFirstRowObj.LoadPortDateA);
											if (oFirstRowObj.DiscPortDateA !== null && oFirstRowObj.DiscPortDateA !== undefined && oFirstRowObj.DiscPortDateA !== '')
												this.getView().byId("id_UpdtScrnActDelivDate").setDateValue(oFirstRowObj.DiscPortDateA);

											this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);

											//Set Multiple Shipment
											var oUpdtScrnShipmentToken = {}, oUpdtScrnShipmentTokenArray = [];
											var aShipmentTblData = [];
											var oShipmentObj = { ShipmentNo: '', EreqNo: '', BolNo: '', ShipStatusSPS: [] };
											var oShipStatusSPS = { title: '', description: '' };
											oRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);
											if (oRowObj.ShipStatusSAP !== '' && oRowObj.ShipmentNo !== '') {
												oUpdtScrnShipmentToken = new Token({
													text: oRowObj.ShipmentNo + ' - ' + oRowObj.ShipStatusSAP, key: oRowObj.ShipmentNo
												});
												oUpdtScrnShipmentTokenArray.push(oUpdtScrnShipmentToken);
											}
											oShipStatusSPS = { title: oRowObj.ShipStatusSPS, description: oRowObj.ShipStatusSPSDes };
											oShipmentObj = { ShipmentNo: oRowObj.ShipmentNo, EreqNo: oRowObj.EreqNo, BolNo: oRowObj.BolNo, ShipStatusSPS: [oShipStatusSPS] };
											aShipmentTblData.push(oShipmentObj);
											this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", aShipmentTblData);
											this.getView().byId('id_UpdtScrnShipmentTbl').setVisibleRowCount(aShipmentTblData.length !== 0 ? aShipmentTblData.length : 1);
											var oUpdtcrnShipmentNoControl = that.getView().byId("id_UpdtScrnShipmentNo");
											oUpdtcrnShipmentNoControl.setTokens(oUpdtScrnShipmentTokenArray);
											promise.resolve();
										}.bind(this)
									}),
									new sap.m.Button({
										text: i18n.getText("VesselScreen.EntireVessel"),
										press: function () {
											oConfirmDialog.close();
											this.getView().getModel('shipmentTblModel').setProperty("/vesselUpdate", true);
											this.getView().getModel('shipmentTblModel').refresh(true);
											this._fnEnableControlsInUpdateVessel(true);
											var sVesselCode = '', sBolNo = '', sVesselInfo = '', oRowObj = {};

											oRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);
											sVesselCode = oRowObj.VesselCode;
											sBolNo = oRowObj.BolNo;
											sVesselInfo = oRowObj.VesselInfoRec;

											//Write Get Data call
											var aFilters = [];
											aFilters.push(new Filter("VesselCode", sap.ui.model.FilterOperator.EQ, sVesselCode));
											aFilters.push(new Filter("VesselInfoRec", sap.ui.model.FilterOperator.EQ, sVesselInfo));
											aFilters.push(new Filter("NoHdrCount", sap.ui.model.FilterOperator.EQ, 'X'));

											var url = "/VesselDetailSet";
											var urlParams = {};
											this.getView().setBusy(true);
											readOdataAndReturnPromise(this.getOwnerComponent().getModel(), url, urlParams, aFilters).done(function (response) {
												that.getView().setBusy(false);
												promise.resolve();
												var aData = response.results;
												var oUpdtScrnShipmentToken = {}, oUpdtScrnShipmentTokenArray = [], aShipmentTblData = [];
												aData.forEach(function (currentValue, index) {
													if (index === 0) {
														setTokenToUpdateScreen("id_UpdtScrnFreightForwarder", currentValue.ForwardingAgent, currentValue.AgentName);
														setTokenToUpdateScreen("id_UpdtScrnVesselNo", currentValue.VesselCode, currentValue.VesselName);
														setTokenToUpdateScreen("id_UpdtScrnVesselStatus", currentValue.VesselStatus, currentValue.VesStatDes);
														setTokenToUpdateScreen("id_UpdtScrnCurrentPort", currentValue.CurrentPort, currentValue.CurrentPortName);
														setTokenToUpdateScreen("id_UpdtScrnLoadPort", currentValue.LoadPortCode, currentValue.LoadPortName);
														setTokenToUpdateScreen("id_UpdtScrnTransLoadPort", currentValue.TransLoadPortCode, currentValue.TransLoadPortName);
														setTokenToUpdateScreen("id_UpdtScrnDischargePort", currentValue.DischargePortCode, currentValue.DischargePortName);
														setTokenToUpdateScreen("id_UpdtScrnVesselWeightUnit", currentValue.VesselWeightUnit, currentValue.WeightUnitDes);

														this.getView().byId("id_UpdtScrnForwarderRefNo").setValue(currentValue.ForwarderRefNo);
														this.getView().byId("id_UpdtScrnBookingNo").setValue(currentValue.BookingNo);
														this.getView().byId("id_UpdtScrnFlightVoyageNo").setValue(currentValue.FlightVoyageNo);
														this.getView().byId("id_UpdtScrnVesselWeight").setValue(currentValue.VesselWeight);
														this.getView().byId("id_UpdtScrnCountOfContnr").setValue(parseInt(currentValue.ShipContainerCnt));
														this.getView().byId("id_UpdtScrnVesselInfo").setValue(currentValue.VesselInfoRec);
														this.getView().byId('id_UpdtScrnTransLoadInd').setSelected(currentValue.TransloadInd === 'X' ? true : false);
														this.getView().byId('id_UpdtScrnTransLoadInd').setEditable(true);

														if (currentValue.LoadPortDateP !== null && currentValue.LoadPortDateP !== undefined && currentValue.LoadPortDateP !== '')
															this.getView().byId("id_UpdtScrnPLDLoadDate").setDateValue(currentValue.LoadPortDateP);
														if (currentValue.DiscPortDateP !== null && currentValue.DiscPortDateP !== undefined && currentValue.DiscPortDateP !== '')
															this.getView().byId("id_UpdtScrnPLDDelivDate").setDateValue(currentValue.DiscPortDateP);
														if (currentValue.LoadPortDateA !== null && currentValue.LoadPortDateA !== undefined && currentValue.LoadPortDateA !== '')
															this.getView().byId("id_UpdtScrnActLoadDate").setDateValue(currentValue.LoadPortDateA);
														if (currentValue.DiscPortDateA !== null && currentValue.DiscPortDateA !== undefined && currentValue.DiscPortDateA !== '')
															this.getView().byId("id_UpdtScrnActDelivDate").setDateValue(currentValue.DiscPortDateA);
													}
													var oShipmentObj = { ShipmentNo: '', EreqNo: '', BolNo: '', ShipStatusSPS: [] };
													var oShipStatusSPS = { title: '', description: '' };
													//Set Multiple Shipment
													oUpdtScrnShipmentToken = {};
													if (currentValue.ShipStatusSAP !== '' && currentValue.ShipmentNo !== '') {
														oUpdtScrnShipmentToken = new Token({ text: currentValue.ShipmentNo + ' - ' + currentValue.ShipStatusSAP, key: currentValue.ShipmentNo });
														oUpdtScrnShipmentTokenArray.push(oUpdtScrnShipmentToken);
													}
													oShipStatusSPS = { title: currentValue.ShipStatusSPS, description: currentValue.ShipStatusSPSDes };
													oShipmentObj = { ShipmentNo: currentValue.ShipmentNo, EreqNo: currentValue.EreqNo, BolNo: currentValue.BolNo, ShipStatusSPS: [oShipStatusSPS] };
													aShipmentTblData.push(oShipmentObj);
												}.bind(this));
												var oUpdtScrnShipmentNoControl = that.getView().byId("id_UpdtScrnShipmentNo");
												oUpdtScrnShipmentNoControl.setTokens(oUpdtScrnShipmentTokenArray);
												this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", aShipmentTblData);
												this.getView().byId('id_UpdtScrnShipmentTbl').setVisibleRowCount(aShipmentTblData.length !== 0 ? aShipmentTblData.length : 1);
											}.bind(this)).fail(function (oError) {
												that.getView().setBusy(false);
												promise.reject();
											});
										}.bind(this)
									}),
									new sap.m.Button({
										text: i18n.getText("VesselScreen.Cancel"),
										press: function () {
											oConfirmDialog.close();
										}
									})
								],
								afterClose: function () {
									oConfirmDialog.destroy();
								}
							});
						oConfirmDialog.addStyleClass("sapUiResponsiveMargin");
						oConfirmDialog.open();
					}
					return promise;
				},
				/**
				 * This function is called when we clicked on Update button in Vessel Detail Table
				 */
				onUpdateVessel: function () {
					this._fnBuildUpdateVesselParameters().done(function (response) {
						this._oDialogUpdateVessel.open();
					}.bind(this));

				},
				/**
				 * This function is used to clear all input and F4 data in Update Vessel Screen
				 */
				handleUpdtVslScreenClear: function () {
					var bEntireVesselUpdate = this.getView().getModel('shipmentTblModel').getProperty("/vesselUpdate");
					if (bEntireVesselUpdate) {
						this.getView().byId("id_UpdtScrnVesselStatus").destroyTokens();
						this.getView().byId("id_UpdtScrnForwarderRefNo").setValue("");
						this.getView().byId("id_UpdtScrnBookingNo").setValue("");
						this.getView().byId("id_UpdtScrnCurrentPort").destroyTokens();
						this.getView().byId("id_UpdtScrnLoadPort").destroyTokens();
						this.getView().byId("id_UpdtScrnTransLoadPort").destroyTokens();
						this.getView().byId("id_UpdtScrnDischargePort").destroyTokens();
						this.getView().byId("id_UpdtScrnVesselWeight").setValue("");
						this.getView().byId("id_UpdtScrnVesselWeightUnit").destroyTokens();
						this.getView().byId("id_UpdtScrnCountOfContnr").setValue("");
						this.getView().byId("id_UpdtScrnPLDLoadDate").setValue("");
						this.getView().byId("id_UpdtScrnPLDDelivDate").setValue("");
						this.getView().byId("id_UpdtScrnActLoadDate").setValue("");
						this.getView().byId("id_UpdtScrnActDelivDate").setValue("");
					}
					this.getView().byId("id_UpdtScrnSPSSHStatus").destroyTokens();
					this.getView().byId("id_UpdtScrnSPSSHStatus").fireTokenUpdate();
					var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
					aShipmentTblData.forEach(function (currentValue, index) {
						currentValue.EreqNo = '';
						currentValue.BolNo = '';
					});
					this.getView().getModel('shipmentTblModel').refresh(true);

					//Event reset error value state to none after Add Shipment Dialog closed
					this.getView().getControlsByFieldGroupId("updateMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput")
							oInput.setValueState("None");
					});
				},
				/**
				 * This function is for closing Update Vessel Screen
				 */
				handleUpdtVslScreenClose: function () {
					this._oDialogUpdateVessel.close();
					this.handleUpdtVslScreenClear();
				},
				/**
				 * Event reset error value state to none after Update Vessel Dialog closed
				 */
				onAfterUpdateScreenClose: function () {
					this.getView().getModel('shipmentTblModel').setProperty("/vesselUpdate",true);
					this.handleUpdtVslScreenClear();
					this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
					this.getView().getModel('shipmentTblModel').refresh(true);
				},
				/**
				 * Event reset Value State to None when Input is updated with valid values
				 * @param {object} oEvent - Source Referenece
				 */
				onValidateUpdateScreenMandatory: function (oEvent) {
					this.getView().getControlsByFieldGroupId("updateMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput") {
							if ((oInput.getValue() !== "" && oInput.getValueState() === "Error") || oInput.getEnabled() === false) {
								oInput.setValueState("None");
							}
						}
					});
				},
				/**
				 * Vessel Status F4 open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslVesselStatusF4Open: function (oEvent) {
					var oVesselStatus = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpVesselStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnUpdtVslVesselStatusF4Search.bind(this), this._fnUpdtVslVesselStatusF4Confirm.bind(this, oVesselStatus), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Vessel Status No in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslVesselStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Vessel_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm Handler for Vessel Status No in Update Vessel Screen
				 * @param {object} oVesselStatus - Vessel Status Control
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslVesselStatusF4Confirm: function (oVesselStatus, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oVesselStatus.setTokens(tokenArray);
				},
				/**
				 * Trans load indicator change in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				onUpdtVslTransLoadIndChange: function (oEvent) {
					var bTransLoadIndSelected = oEvent.getSource().getSelected();
					this.getView().byId('id_UpdtScrnTransLoadPort').setEnabled(bTransLoadIndSelected);
					this.getView().byId('id_UpdtScrnTransLoadPort').setEditable(bTransLoadIndSelected);
					this.getView().byId('id_UpdtScrnDischargePort').setEnabled(!bTransLoadIndSelected);
					this.getView().byId('id_UpdtScrnDischargePort').setEditable(!bTransLoadIndSelected);
					this.getView().byId('id_UpdtScrnTransLoadPort').removeAllTokens();
					this.getView().byId('id_UpdtScrnDischargePort').removeAllTokens();
				},
				/**
				 * Current Port F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslCurrentPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleUpdtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpCurrentPortTitle"), bMultiSelect);
				},
				/**
				 * Load Port F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslLoadPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleUpdtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpLoadPortTitle"), bMultiSelect);
				},
				/**
				 * Trans Load Port F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslTransLoadPortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleUpdtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpTransLoadPortTitle"), bMultiSelect);
				},
				/**
				 * Discharge Port F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslDischargePortF4Open: function (oEvent) {
					var bMultiSelect = false;
					this.handleUpdtVslPortF4Open(oEvent, this.getResourceBundle().getText("valHelpDischargePortTitle"), bMultiSelect);
				},
				/**
				 * Common function for all Port F4 open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 * @param {string} sF4Title - Title of F4
				 * @param {boolean} bMultiSelect - If F4 should have multi select or single select
				 */
				handleUpdtVslPortF4Open: function (oEvent, sF4Title, bMultiSelect) {
					var oPort = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", sF4Title);
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", bMultiSelect);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnUpdtVslPortF4Search.bind(this), this._fnUpdtVslPortF4Confirm.bind(this, oPort), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Port in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslPortF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFilter = new Filter("InActive", sap.ui.model.FilterOperator.EQ, '');
					filters.push(oFilter);
					aFinalFilters.push(new Filter({
						filters: filters,
						and: false
					}));
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_PortSet", ['PortCode', 'PortName']);
				},
				/**
				 * Confirm Handler for Port in Update Vessel Screen
				 * @param {object} oPort - Port Control
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslPortF4Confirm: function (oPort, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oPort.setTokens(tokenArray);
				},
				/**
				 * Handler for Weight UOM in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslWeightUOMF4Open: function (oEvent) {
					var oWiehgtUOM = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpWeightUOMTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}

					this._openValueHelp(this._fnUpdtVslWeightUOMF4Search.bind(this), this._fnUpdtVslWeightUOMF4Confirm.bind(this, oWiehgtUOM), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Frieght Forwarding Agent in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslWeightUOMF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_Weight_UnitSet", ['WeightUnit', 'UnitText']);
				},
				// 
				/**
				 * Confirm Handler for Frieght Forwarding Agent
				 * @param {object} oWiehgtUOM - Weight UOM Control
				 * @param {*} oEvent - Source Reference
				 */
				_fnUpdtVslWeightUOMF4Confirm: function (oWiehgtUOM, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oWiehgtUOM.setTokens(tokenArray);
				},
				/**
				 * Shipment No F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslShipmentNoF4Open: function (oEvent) {
					var oShipmentNo = oEvent.getSource();
					oShipmentNo.setValueState('None');
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valpHelShipmentNoTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);

					var i18n = this.getResourceBundle();
					var oFwdAgentArr = this.getView().byId("id_UpdtScrnFreightForwarder").getTokens();
					if (!oFwdAgentArr.length) {
						MessageBox.alert(i18n.getText("UpdateVessel.MandateForwardAgent"));
						return;
					}
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openShipmentNoValueHelp(this._fnUpdtVslShipmentNoF4Search.bind(this), this._fnUpdtVslShipmentNoF4Confirm.bind(this, oShipmentNo), aCustomData);
					this._shipmentNoValueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Shipment No in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslShipmentNoF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [];
					var oFwdAgentArr = this.getView().byId("id_UpdtScrnFreightForwarder").getTokens();
					if (oFwdAgentArr.length) {
						for (var i = 0; i < oFwdAgentArr.length; i++) {
							var oFilter = new Filter("ForwardingAgent", sap.ui.model.FilterOperator.EQ, oFwdAgentArr[i].getProperty("key"));
							filters.push(oFilter);
						}
						aFinalFilters.push(new Filter({
							filters: filters,
							and: false
						}));
					}
					this._shipmentNoF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_ShipmentSet", ['ShipmentNo', 'ShipStatusSAP']);
				},
				/**
				 * Confirm Handler for Shipment No in Update Vessel Screen
				 * @param {object} oShipmentNo - Shipment No Control
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslShipmentNoF4Confirm: function (oShipmentNo, oEvent) {
					var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath = '', title = '', description = '', selectedObject = {};
					if (oSelectedContexts) {
						for (var i = 0; i < oSelectedContexts.length; i++) {
							newToken = new Token({ text: "", key: "" });
							sPath = oSelectedContexts[i].sPath;
							selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
							title = selectedObject.Title;
							description = selectedObject.Desc !== '' ? selectedObject.Title + ' - ' + selectedObject.Desc : selectedObject.Title;
							newToken.setKey(title);
							newToken.setText(description);
							tokenArray.push(newToken);
						}
					}
					oShipmentNo.setTokens(tokenArray);
				},
				/**
				 * Handle for SPS Shipment Status F4 Open in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				handleUpdtVslSPSSHStatusF4Open: function (oEvent) {
					var oSPSShipStatusNo = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpSPSShipmentStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);

					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnUpdtVslSPSShipStatusF4Search.bind(this), this._fnUpdtVslSPSShipStatusF4Confirm.bind(this, oSPSShipStatusNo), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for SPS Shipment Status in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslSPSShipStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_SPS_Shipment_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm Handler for SPS Shipment Status in Update Vessel Screen
				 * @param {object} oSPSShipStatusNo - Shipment Status Control
				 * @param {object} oEvent - Source Referenece
				 */
				_fnUpdtVslSPSShipStatusF4Confirm: function (oSPSShipStatusNo, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oSPSShipStatusNo.setTokens(tokenArray);
					oSPSShipStatusNo.fireTokenUpdate();
				},
				/**
				 * When SPS Shipment Status is changed, update SPS Shipment Column in Shipment No Table in Update Vessel Screen
				 * @param {object} oEvent - Source Referenece
				 */
				onUpdtVslSPSShipStatusTokenChange: function (oEvent) {
					var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
					if (oEvent.getParameters() && oEvent.getParameters().type === "removed") {
						aShipmentTblData.forEach(function (currentValue, index) {
							currentValue.ShipStatusSPS = [];
						});
					} else {
						var aTokenArray = this.getView().byId('id_UpdtScrnSPSSHStatus').getTokens();
						if (aTokenArray.length) {
							var oShipStatusSPS = { title: aTokenArray[0].getKey(), description: aTokenArray[0].getText() };
							aShipmentTblData.forEach(function (currentValue, index) {
								currentValue.ShipStatusSPS = [];
								currentValue.ShipStatusSPS.push(oShipStatusSPS);
							});
						} else {
							aShipmentTblData.forEach(function (currentValue, index) {
								currentValue.ShipStatusSPS = [];
							});
						}
					}
					this.getView().getModel('shipmentTblModel').refresh(true);
				},
				/**
				 * This function builds Upload Payload for Update event
				 */
				handleUpdateParameters: function () {
					var i18n = this.getResourceBundle();
					var oUpdtVeslObj = {}, aUpdtVeslPayload = [];

					var oFwdAgentArr = this.getView().byId("id_UpdtScrnFreightForwarder").getTokens();
					var sFwdAgentArr = '';
					if (oFwdAgentArr.length)
						sFwdAgentArr = oFwdAgentArr[0].getProperty("key");

					var sVessleNo = '', oVessleNo = this.getView().byId("id_UpdtScrnVesselNo").getTokens();
					if (oVessleNo.length)
						sVessleNo = oVessleNo[0].getProperty("key");

					var sVessleStatus = '', oVessleStatus = this.getView().byId("id_UpdtScrnVesselStatus").getTokens();
					if (oVessleStatus.length)
						sVessleStatus = oVessleStatus[0].getProperty("key");
					var sFlightVoyageNo = this.getView().byId("id_UpdtScrnFlightVoyageNo").getValue();
					var sForwarderRefNo = this.getView().byId("id_UpdtScrnForwarderRefNo").getValue();
					var sBookingNo = this.getView().byId("id_UpdtScrnBookingNo").getValue();
					var sVesselInfo = this.getView().byId("id_UpdtScrnVesselInfo").getValue();
					var iCountOfContainer = this.getView().byId("id_UpdtScrnCountOfContnr").getValue();

					var sCurrentPort = '', oCurrentPort = this.getView().byId("id_UpdtScrnCurrentPort").getTokens();
					if (oCurrentPort.length)
						sCurrentPort = oCurrentPort[0].getProperty("key");

					var sLoadPort = '', oLoadPort = this.getView().byId("id_UpdtScrnLoadPort").getTokens();
					if (oLoadPort.length)
						sLoadPort = oLoadPort[0].getProperty("key");

					var bTransLoadInd = this.getView().byId('id_UpdtScrnTransLoadInd').getSelected();

					var sTransLoadPort = '', oTransLoadPort = this.getView().byId("id_UpdtScrnTransLoadPort").getTokens();
					if (oTransLoadPort.length)
						sTransLoadPort = oTransLoadPort[0].getProperty("key");

					var sDischargePort = '', oDischargePort = this.getView().byId("id_UpdtScrnDischargePort").getTokens();
					if (oDischargePort.length)
						sDischargePort = oDischargePort[0].getProperty("key");

					var sWeightVal = this.getView().byId("id_UpdtScrnVesselWeight").getValue();
					var sWeight = sWeightVal === '' ? '0' : sWeightVal;

					var sWeightUOM = '', oWeightUOM = this.getView().byId("id_UpdtScrnVesselWeightUnit").getTokens();
					if (oWeightUOM.length)
						sWeightUOM = oWeightUOM[0].getProperty("key");

					if (sWeight !== '0' && sWeightUOM === "") {
						MessageBox.error(i18n.getText("VesselScreen.VesselUnitWithWeightMandatory"));
						return aUpdtVeslPayload;
					}
					else if (sWeight === '0' && sWeightUOM !== "") {
						MessageBox.error(i18n.getText("VesselScreen.VesselWeightIfUOMMandatory"));
						return aUpdtVeslPayload;
					}
					if(this.getView().byId('id_UpdtScrnTransLoadInd').getEnabled() && this.getView().byId('id_UpdtScrnTransLoadInd').getEditable()){
						if((!oLoadPort.length && !oTransLoadPort.length) || (!oTransLoadPort.length && !oDischargePort.length)
								|| (!oDischargePort.length && !oLoadPort.length)){
							MessageBox.error(i18n.getText("VesselScreen.AnyTwoOfPortsMandatory"));
							return aUpdtVeslPayload;
						}
					}

					var aShipNoTblData = this.getView().getModel('shipmentTblModel').getProperty('/shipmentData');
					var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT00:00:00"
					});
					var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT23:59:59"
					});

					//Format the Shipment Creation Date into Odata Understandable format
					var dPlannedLoadDate = this.getView().byId("id_UpdtScrnPLDLoadDate").getDateValue();
					var dPlannedDeliveryDate = this.getView().byId("id_UpdtScrnPLDDelivDate").getDateValue();
					var dActualLoadDate = this.getView().byId("id_UpdtScrnActLoadDate").getDateValue();
					var dActualDischargeDate = this.getView().byId("id_UpdtScrnActDelivDate").getDateValue();

					oUpdtVeslObj = {
						"FlightVoyageNo": sFlightVoyageNo,
						"VesselCode": sVessleNo,
						"ForwardingAgent": sFwdAgentArr,
						"ForwarderRefNo": sForwarderRefNo,
						"VesselStatus": sVessleStatus,
						"VesselInfoRec": sVesselInfo,
						"CurrentPort": sCurrentPort,
						"LoadPortCode": sLoadPort,
						"TransLoadPortCode": sTransLoadPort,
						"DischargePortCode": sDischargePort,
						"TransloadInd": bTransLoadInd ? "X" : "",
						"BookingNo": sBookingNo,
						"VesselWeight": sWeight,
						"VesselWeightUnit": sWeightUOM,
						"ShipContainerCnt": iCountOfContainer,
						"LoadPortDateP": dPlannedLoadDate === ("" || null) ? null : oFormatFrom.format(dPlannedLoadDate),
						"LoadPortDateA": dActualLoadDate === ("" || null) ? null : oFormatFrom.format(dActualLoadDate),
						"DiscPortDateP": dPlannedDeliveryDate === ("" || null) ? null : oFormatTo.format(dPlannedDeliveryDate),
						"DiscPortDateA": dActualDischargeDate === ("" || null) ? null : oFormatTo.format(dActualDischargeDate)
					};
					for (var i = 0; i < aShipNoTblData.length; i++) {
						var oUpdtVeslObjClone = jQuery.extend(true, {}, oUpdtVeslObj);
						oUpdtVeslObjClone.ShipmentNo = aShipNoTblData[i].ShipmentNo;
						oUpdtVeslObjClone.EreqNo = aShipNoTblData[i].EreqNo;
						oUpdtVeslObjClone.BolNo = aShipNoTblData[i].BolNo;
//						if (aShipNoTblData[i].BolNo === '') {
//							aUpdtVeslPayload = [];
//							MessageBox.error(i18n.getText('VesselScreen.BolIsMandatory'),
//								{
//									styleClass: "sapUiSizeCompact"
//								});
//							break;
//
//						}
						oUpdtVeslObjClone.ShipStatusSPS = aShipNoTblData[i].ShipStatusSPS.length > 0 ? aShipNoTblData[i].ShipStatusSPS[0].title : "";
						aUpdtVeslPayload.push(oUpdtVeslObjClone);
					}
					return aUpdtVeslPayload;
				},

				/**
				 * This event is triggered when we want to update data from Update Vessel Pop Up Screen.
				 */
				handleUpdtVslScreenUpdate: function () {
					var that = this;
					var validationError = false;
					this.getView().getControlsByFieldGroupId("updateMandate").forEach(function (oInput) {
						validationError = this._validateInput(oInput) || validationError;
					}, this);

					if (validationError) {
						return;
					}
					var aVesselHdToVesselUpdate = this.handleUpdateParameters();
					if (!aVesselHdToVesselUpdate.length) {
						return;
					}
					var oUpdateVesselObj = {
						"d": {
							"Indicator": "U",
							"VesselHdToVesselUpdate": aVesselHdToVesselUpdate,
							"VesselHdToReturnMsg": [
								{
									"MsgID": "ZSUP"
								}
							]
						}
					};
					var oModel = this.getOwnerComponent().getModel();
					this._oDialogUpdateVessel.setBusy(true);
					oModel.create("/VesselHdSet", oUpdateVesselObj, {
						success: function (oData, response) {
							that._oDialogUpdateVessel.setBusy(false);
							if (oData.VesselHdToReturnMsg && oData.VesselHdToReturnMsg.results && oData.VesselHdToReturnMsg.results.length) {
								var results = oData.VesselHdToReturnMsg.results;
								//To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
								var sMessage = '', sMessageError = '';
								results.some(function (obj) {
									if (obj.MsgType === 'I') {
										sMessage += obj.Message +' - '+obj.Msgv1+ "\n";
									} else if (obj.MsgType === 'E') {
										sMessageError += obj.Message +' - '+obj.Msgv1+ "\n";
									}
								});
								if (sMessageError) {
									MessageBox.error(sMessageError);
									return;
								} else {
									MessageBox.success(sMessage);
								}
							}
							that._oDialogUpdateVessel.close();
							that.getView().byId("BtnRefresh").firePress();
						},
						error: function (oError) {
							that._oDialogUpdateVessel.setBusy(false);
						}
					});
				},
				//Start of Add Shipment Screen
				/**
				 * This function builts screen data for Add Shipment Pop Up.
				 * @returns 
				 */
				_fnBuildAddShipmentParameters: function () {
					var promise = jQuery.Deferred();
					var that = this, i18n = this.getResourceBundle();
					var oVesselDetailTbl = this.getView().byId("TblVesselDetail");
					var aSelectedIndices = oVesselDetailTbl.getSelectedIndices();

					function setTokenToAddShipmentScreen(sControlId, sTokenKey, sTokenText) {
						var oAddShipScrnControl = that.getView().byId(sControlId);
						var oAddShipScrnToken = {}, oAddShipScrnTokenArray = [];
						if (sTokenText !== '' && sTokenText !== undefined && sTokenKey !== '' && sTokenKey !== undefined) {
							oAddShipScrnToken = new Token({ text: sTokenText, key: sTokenKey });
							oAddShipScrnTokenArray.push(oAddShipScrnToken);
							oAddShipScrnControl.setTokens(oAddShipScrnTokenArray);
						}
					}
					if (aSelectedIndices.length !== 1) {
						MessageBox.error(i18n.getText("VesselScreen.SelectASingleRow"));
						promise.reject();
					} else {
						this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
						this.getView().getModel('shipmentTblModel').setProperty("/vesselUpdate", true);
						this.getView().getModel('shipmentTblModel').refresh(true);

						var sVesselCode = '', sVesselInfoRec = '', oRowObj = {};

						oRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[0]).sPath);
						sVesselCode = oRowObj.VesselCode;
						sVesselInfoRec = oRowObj.VesselInfoRec;

						var aFilters = [];
						aFilters.push(new Filter("VesselCode", sap.ui.model.FilterOperator.EQ, sVesselCode));
						aFilters.push(new Filter("VesselInfoRec", sap.ui.model.FilterOperator.EQ, sVesselInfoRec));
						aFilters.push(new Filter("NoHdrCount", sap.ui.model.FilterOperator.EQ, 'X'));
						var url = "/VesselDetailSet";
						var urlParams = {};
						this.getView().setBusy(true);
						readOdataAndReturnPromise(this.getOwnerComponent().getModel(), url, urlParams, aFilters).done(function (response) {
							that.getView().setBusy(false);
							promise.resolve();
							var aData = response.results;
							var oAddShipScrnShipToken = {}, oAddShipScrnShipTokenArray = [];
							aData.forEach(function (currentValue, index) {
								if (index === 0) {
									setTokenToAddShipmentScreen("id_AddShipScrnFreightForwarder", currentValue.ForwardingAgent, currentValue.AgentName);
									setTokenToAddShipmentScreen("id_AddShipScrnVesselNo", currentValue.VesselCode, currentValue.VesselName);
									setTokenToAddShipmentScreen("id_AddShipScrnVesselStatus", currentValue.VesselStatus, currentValue.VesStatDes);
									setTokenToAddShipmentScreen("id_AddShipScrnCurrentPort", currentValue.CurrentPort, currentValue.CurrentPortName);
									setTokenToAddShipmentScreen("id_AddShipScrnLoadPort", currentValue.LoadPortCode, currentValue.LoadPortName);
									setTokenToAddShipmentScreen("id_AddShipScrnTransLoadPort", currentValue.TransLoadPortCode, currentValue.TransLoadPortName);
									setTokenToAddShipmentScreen("id_AddShipScrnDischargePort", currentValue.DischargePortCode, currentValue.DischargePortName);
									setTokenToAddShipmentScreen("id_AddShipScrnVesselWeightUnit", currentValue.VesselWeightUnit, currentValue.WeightUnitDes);

									this.getView().byId("id_AddShipScrnForwarderRefNo").setValue(currentValue.ForwarderRefNo);
									this.getView().byId("id_AddShipScrnBookingNo").setValue(currentValue.BookingNo);
									this.getView().byId("id_AddShipScrnFlightVoyageNo").setValue(currentValue.FlightVoyageNo);
									this.getView().byId("id_AddShipScrnVesselWeight").setValue(currentValue.VesselWeight);
									this.getView().byId("id_AddShipScrnCountOfContnr").setValue(parseInt(currentValue.ShipContainerCnt));
									this.getView().byId("id_AddShipScrnVesselInfo").setValue(currentValue.VesselInfoRec);
									this.getView().byId('id_AddShipScrnTransLoadInd').setSelected(currentValue.TransloadInd === 'X' ? true : false);
									if (currentValue.LoadPortDateP !== null && currentValue.LoadPortDateP !== undefined && currentValue.LoadPortDateP !== '')
										this.getView().byId("id_AddShipScrnPLDLoadDate").setDateValue(currentValue.LoadPortDateP);
									if (currentValue.DiscPortDateP !== null && currentValue.DiscPortDateP !== undefined && currentValue.DiscPortDateP !== '')
										this.getView().byId("id_AddShipScrnPLDDelivDate").setDateValue(currentValue.DiscPortDateP);
									if (currentValue.LoadPortDateA !== null && currentValue.LoadPortDateA !== undefined && currentValue.LoadPortDateA !== '')
										this.getView().byId("id_AddShipScrnActLoadDate").setDateValue(currentValue.LoadPortDateA);
									if (currentValue.DiscPortDateA !== null && currentValue.DiscPortDateA !== undefined && currentValue.DiscPortDateA !== '')
										this.getView().byId("id_AddShipScrnActDelivDate").setDateValue(currentValue.DiscPortDateA);
								}
								//Set Multiple Shipment
								oAddShipScrnShipToken = {};
								if (currentValue.ShipStatusSAP !== '' && currentValue.ShipmentNo !== '') {
									oAddShipScrnShipToken = new Token({ text: currentValue.ShipmentNo + ' - ' + currentValue.ShipStatusSAP, key: currentValue.ShipmentNo });
									oAddShipScrnShipTokenArray.push(oAddShipScrnShipToken);
								}
							}.bind(this));
							var oAddShipScrnShipNoControl = that.getView().byId("id_AddShipScrnExistingShipmentNo");
							oAddShipScrnShipNoControl.setTokens(oAddShipScrnShipTokenArray);
						}.bind(this)).fail(function (oError) {
							that.getView().setBusy(true);
							promise.reject();
						});

					}
					return promise;
				},
				/**
				 * This function is triggered when user clicks on Add Shipment Button in Vessel Detail Table.
				 */
				onAddShipment: function () {
					this._fnBuildAddShipmentParameters().done(function (response) {
						this._oDialogAddShipment.open();
					}.bind(this));

				},
				/**
				 * This function is used to reset Add Shipment Screen's editable data
				 */
				handleAddShipScreenClear: function () {
					this.getView().byId("id_AddShipScrnNewShipments").destroyTokens();
					this.getView().byId("id_AddShipScrnSPSSHStatus").destroyTokens();
					this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
					//Event reset error value state to none after Add Shipment Dialog closed
					this.getView().getControlsByFieldGroupId("addShipMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput")
							oInput.setValueState("None");
					});
				},
				/**
				 * This function is for closing Add Shipment Pop Up
				 */
				handleAddShipScreenClose: function () {
					this._oDialogAddShipment.close();
					this.handleAddShipScreenClear();
				},
				/**
				 * Event reset error value state to none after Add Shipment Dialog closed
				 */
				onAfterAddShipScreenClose: function () {
					this.handleAddShipScreenClear();
				},
				/**
				 * Event reset Value State to None when Input is updated with valid values in Add Shipment Screen
				 * @param {object} oEvent - Source Reference
				 */
				onValidateAddShipScreenMandatory: function (oEvent) {
					this.getView().getControlsByFieldGroupId("addShipMandate").forEach(function (oInput) {
						if (oInput.getMetadata().getElementName() === "sap.m.Input" || oInput.getMetadata().getElementName() === "sap.m.MultiInput") {
							if ((oInput.getValue() !== "" && oInput.getValueState() === "Error") || oInput.getEnabled() === false) {
								oInput.setValueState("None");
							}
						}
					});
				},
				/**
				 * Shipment No F4 open in Add Shipment Screen. It excludes already assigned shipments.
				 * @param {object} oEvent - Source Reference
				 */
				handleAddShipScrnShipmentNoF4Open: function (oEvent) {
					var oShipmentNo = oEvent.getSource();
					oShipmentNo.setValueState('None');
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valpHelShipmentNoTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", true);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openShipmentNoValueHelp(this._fnAddShipScrnShipmentNoF4Search.bind(this), this._fnAddShipScrnShipmentNoF4Confirm.bind(this, oShipmentNo), aCustomData);
					this._shipmentNoValueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for Shipment No in Add Shipment Screen
				 * @param {object} oEvent - Source Reference
				 */
				_fnAddShipScrnShipmentNoF4Search: function (oEvent) {
					var filters = [], aFinalFilters = [], aExcludedShipMents = [];
					var oFwdAgentArr = this.getView().byId("id_AddShipScrnFreightForwarder").getTokens();
					var aExistingShipNos = this.getView().byId("id_AddShipScrnExistingShipmentNo").getTokens();
					if (oFwdAgentArr.length) {
						for (var i = 0; i < oFwdAgentArr.length; i++) {
							var oFilter = new Filter("ForwardingAgent", sap.ui.model.FilterOperator.EQ, oFwdAgentArr[i].getProperty("key"));
							filters.push(oFilter);
						}
						aFinalFilters.push(new Filter({
							filters: filters,
							and: false
						}));
					}
					if (aExistingShipNos.length) {
						for (var i = 0; i < aExistingShipNos.length; i++) {
							aExcludedShipMents.push(aExistingShipNos[i].getProperty("key"));
						}
					}
					this._shipmentNoF4SearchExcludeExisting(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_ShipmentSet", ['ShipmentNo', 'ShipStatusSAP'], aExcludedShipMents);
				},
				// Confirm Handler for Shipment No
				_fnAddShipScrnShipmentNoF4Confirm: function (oShipmentNo, oEvent) {
					var oSelectedContexts = oEvent.getParameter("selectedContexts"), newToken = new Token({ text: "", key: "" }), tokenArray = [], sPath = '', title = '', description = '', selectedObject = {};
					if (oSelectedContexts) {
						for (var i = 0; i < oSelectedContexts.length; i++) {
							newToken = new Token({ text: "", key: "" });
							sPath = oSelectedContexts[i].sPath;
							selectedObject = oSelectedContexts[i].getModel('valueHelpModel').getProperty(sPath);
							title = selectedObject.Title;
							description = selectedObject.Desc !== '' ? selectedObject.Title + ' - ' + selectedObject.Desc : selectedObject.Title;
							newToken.setKey(title);
							newToken.setText(description);
							tokenArray.push(newToken);
						}
					}
					oShipmentNo.setTokens(tokenArray);
					oShipmentNo.fireTokenUpdate();
				},
				/**
				 * When Shipment is changed while adding new shipments in ADD SHIPMENT Screen, reset values in Shipment No Table
				 * @param {object} oEvent - Source Reference
				 */
				onAddShipScrnShipmentTokenChange: function (oEvent) {
					if (oEvent.getParameters() && oEvent.getParameters().type === "removed") {
						var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
						var oRemovedShipment = oEvent.getParameters().removedTokens[0];
						var sRemovedShipmentKey = oRemovedShipment.getKey();
						var elementIndex = aShipmentTblData.findIndex(shipObj => shipObj.ShipmentNo === sRemovedShipmentKey);
						aShipmentTblData.splice(elementIndex, 1);
						this.getView().getModel('shipmentTblModel').refresh(true);
						return;
					} else {
						this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", []);
					}
					var aShipmentTblData = [];
					var oShipmentObj = { ShipmentNo: '', EreqNo: '', BolNo: '', ShipStatusSPS: [] };
					var aShipmentTokens = oEvent.getSource().getTokens();
					for (var i = 0; i < aShipmentTokens.length; i++) {
						oShipmentObj = { ShipmentNo: aShipmentTokens[i].getProperty("key"), EreqNo: '', BolNo: '', ShipStatusSPS: [] };
						aShipmentTblData.push(oShipmentObj);
					}
					this.getView().getModel('shipmentTblModel').setProperty("/shipmentData", aShipmentTblData);
					this.getView().getModel('shipmentTblModel').refresh(true);
					this.getView().byId('id_AddShipScrnShipmentTbl').setVisibleRowCount(aShipmentTblData.length !== 0 ? aShipmentTblData.length : 1);
					this.getView().byId('id_AddShipScrnSPSSHStatus').fireTokenUpdate();
				},
				/**
				 * Handle for SPS Shipment Status in Add Shipment Screen
				 * @param {object} oEvent - Source Reference
				 */
				handleAddShipScrnSPSSHStatusF4Open: function (oEvent) {
					var oSPSShipStatusNo = oEvent.getSource();
					this.getView().getModel("valueHelpModel").setProperty("/title", this.getResourceBundle().getText("valHelpSPSShipmentStatusTitle"));
					this.getView().getModel("valueHelpModel").setProperty("/bMultiSelect", false);
					var selectedTokens = oEvent.getSource().getTokens();
					var aCustomData = [];
					for (var i = 0; i < selectedTokens.length; i++) {
						aCustomData.push(new sap.ui.core.CustomData({ key: selectedTokens[i].getProperty("key"), value: selectedTokens[i].getProperty("text") }));
					}
					this._openValueHelp(this._fnAddShipSPSShipStatusF4Search.bind(this), this._fnAddShipSPSShipStatusF4Confirm.bind(this, oSPSShipStatusNo), aCustomData);
					this._valueHelpDialog.fireSearch();
				},
				/**
				 * Search Handler for SPS Shipment Status in Add Shipment Screen
				 * @param {object} oEvent - Source Reference
				 */
				_fnAddShipSPSShipStatusF4Search: function (oEvent) {
					var filters = [];
					this._genericF4Search(filters, oEvent,
						this.getOwnerComponent().getModel(), "/F4_SPS_Shipment_StatusSet", ['Value', 'Description']);
				},
				/**
				 * Confirm Handler for SPS Shipment Status in Add Shipment Screen
				 * @param {object} oSPSShipStatusNo - SPS Ship Status No Control
				 * @param {object} oEvent - Source Reference
				 */
				_fnAddShipSPSShipStatusF4Confirm: function (oSPSShipStatusNo, oEvent) {
					var tokenArray = this._fnGetTokensFromSelectedItems(oEvent);
					oSPSShipStatusNo.setTokens(tokenArray);
					oSPSShipStatusNo.fireTokenUpdate();
				},
				/**
				 * When SPS Shipment Status is changed, update SPS Shipment Column in Shipment No Table in ADD SHIPMENT Screen
				 * @param {object} oEvent - Source Reference
				 */
				onAddShipScrnSPSShipStatusTokenChange: function (oEvent) {
					var aShipmentTblData = this.getView().getModel('shipmentTblModel').getProperty("/shipmentData");
					if (oEvent.getParameters() && oEvent.getParameters().type === "removed") {
						aShipmentTblData.forEach(function (currentValue, index) {
							currentValue.ShipStatusSPS = [];
						});
					} else {
						var aTokenArray = this.getView().byId('id_AddShipScrnSPSSHStatus').getTokens();
						if (aTokenArray.length) {
							var oShipStatusSPS = { title: aTokenArray[0].getKey(), description: aTokenArray[0].getText() };
							aShipmentTblData.forEach(function (currentValue, index) {
								currentValue.ShipStatusSPS = [];
								currentValue.ShipStatusSPS.push(oShipStatusSPS);
							});
						}
					}
					this.getView().getModel('shipmentTblModel').refresh(true);
				},
				/**
				 * This function build payload for Add Shipment event.
				 */
				handleAddShipmentParameters: function () {
					var i18n = this.getResourceBundle();
					var oAddShipObj = {}, aAddShipPayload = [];

					var oFwdAgentArr = this.getView().byId("id_AddShipScrnFreightForwarder").getTokens();
					var sFwdAgentArr = '';
					if (oFwdAgentArr.length)
						sFwdAgentArr = oFwdAgentArr[0].getProperty("key");

					var sVessleNo = '', oVessleNo = this.getView().byId("id_AddShipScrnVesselNo").getTokens();
					if (oVessleNo.length)
						sVessleNo = oVessleNo[0].getProperty("key");

					var sVessleStatus = '', oVessleStatus = this.getView().byId("id_AddShipScrnVesselStatus").getTokens();
					if (oVessleStatus.length)
						sVessleStatus = oVessleStatus[0].getProperty("key");

					var sFlightVoyageNo = this.getView().byId("id_AddShipScrnFlightVoyageNo").getValue();
					var sForwarderRefNo = this.getView().byId("id_AddShipScrnForwarderRefNo").getValue();
					var sBookingNo = this.getView().byId("id_AddShipScrnBookingNo").getValue();
					var sVesselInfo = this.getView().byId("id_AddShipScrnVesselInfo").getValue();
					var iCountOfContainer = this.getView().byId("id_AddShipScrnCountOfContnr").getValue();

					var sCurrentPort = '', oCurrentPort = this.getView().byId("id_AddShipScrnLoadPort").getTokens();
					if (oCurrentPort.length)
						sCurrentPort = oCurrentPort[0].getProperty("key");

					var sLoadPort = '', oLoadPort = this.getView().byId("id_AddShipScrnLoadPort").getTokens();
					if (oLoadPort.length)
						sLoadPort = oLoadPort[0].getProperty("key");

					var bTransLoadInd = this.getView().byId('id_AddShipScrnTransLoadInd').getSelected();

					var sTransLoadPort = '', oTransLoadPort = this.getView().byId("id_AddShipScrnTransLoadPort").getTokens();
					if (oTransLoadPort.length)
						sTransLoadPort = oTransLoadPort[0].getProperty("key");

					var sDischargePort = '', oDischargePort = this.getView().byId("id_AddShipScrnDischargePort").getTokens();
					if (oDischargePort.length)
						sDischargePort = oDischargePort[0].getProperty("key");

					var sWeight = this.getView().byId("id_AddShipScrnVesselWeight").getValue();

					var sWeightUOM = '', oWeightUOM = this.getView().byId("id_AddShipScrnVesselWeightUnit").getTokens();
					if (oWeightUOM.length)
						sWeightUOM = oWeightUOM[0].getProperty("key");

					var aShipNoTblData = this.getView().getModel('shipmentTblModel').getProperty('/shipmentData');
					var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT00:00:00"
					});
					var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddT23:59:59"
					});

					//Format the Shipment Creation Date into Odata Understandable format
					var dPlannedLoadDate = this.getView().byId("id_AddShipScrnPLDLoadDate").getDateValue();
					var dPlannedDeliveryDate = this.getView().byId("id_AddShipScrnPLDDelivDate").getDateValue();
					var dActualLoadDate = this.getView().byId("id_AddShipScrnActLoadDate").getDateValue();
					var dActualDischargeDate = this.getView().byId("id_AddShipScrnActDelivDate").getDateValue();

					oAddShipObj = {
						"FlightVoyageNo": sFlightVoyageNo,
						"VesselCode": sVessleNo,
						"ForwardingAgent": sFwdAgentArr,
						"ForwarderRefNo": sForwarderRefNo,
						"VesselStatus": sVessleStatus,
						"VesselInfoRec": sVesselInfo,
						"CurrentPort": sCurrentPort,
						"LoadPortCode": sLoadPort,
						"TransLoadPortCode": sTransLoadPort,
						"DischargePortCode": sDischargePort,
						"TransloadInd": bTransLoadInd ? "X" : "",
						"BookingNo": sBookingNo,
						"VesselWeight": sWeight,
						"VesselWeightUnit": sWeightUOM,
						"ShipContainerCnt": iCountOfContainer,
						"LoadPortDateP": dPlannedLoadDate === ("" || null) ? null : oFormatFrom.format(dPlannedLoadDate),
						"LoadPortDateA": dActualLoadDate === ("" || null) ? null : oFormatFrom.format(dActualLoadDate),
						"DiscPortDateP": dPlannedDeliveryDate === ("" || null) ? null : oFormatFrom.format(dPlannedDeliveryDate),
						"DiscPortDateA": dActualDischargeDate === ("" || null) ? null : oFormatFrom.format(dActualDischargeDate)
					};
					for (var i = 0; i < aShipNoTblData.length; i++) {
						var oAddShipObjClone = jQuery.extend(true, {}, oAddShipObj);
						oAddShipObjClone.ShipmentNo = aShipNoTblData[i].ShipmentNo;
						oAddShipObjClone.EreqNo = aShipNoTblData[i].EreqNo;
						if (aShipNoTblData[i].BolNo === '') {
							aAddShipPayload = [];
							MessageBox.error(i18n.getText('VesselScreen.BolIsMandatory'),
								{
									styleClass: "sapUiSizeCompact"
								});
							break;
						}
						oAddShipObjClone.BolNo = aShipNoTblData[i].BolNo;
						oAddShipObjClone.ShipStatusSPS = aShipNoTblData[i].ShipStatusSPS.length > 0 ? aShipNoTblData[i].ShipStatusSPS[0].title : "";
						aAddShipPayload.push(oAddShipObjClone);
					}
					return aAddShipPayload;
				},
				/**
				 * This function is used to Add New Shipment.
				 */
				handleAddShipScreenCreate: function () {
					var that = this;
					var validationError = false;
					this.getView().getControlsByFieldGroupId("addShipMandate").forEach(function (oInput) {
						validationError = this._validateInput(oInput) || validationError;
					}, this);

					if (validationError) {
						return;
					}
					var aVesselHdToVesselUpdate = this.handleAddShipmentParameters();
					if (!aVesselHdToVesselUpdate.length) {
						return;
					}
					var oAddShipObj = {
						"d": {
							"Indicator": "A",
							"VesselHdToVesselUpdate": aVesselHdToVesselUpdate,
							"VesselHdToReturnMsg": [
								{
									"MsgID": "ZSUP"
								}
							]
						}
					};
					var oModel = this.getOwnerComponent().getModel();
					this._oDialogAddShipment.setBusy(true);
					oModel.create("/VesselHdSet", oAddShipObj, {
						success: function (oData, response) {
							that._oDialogAddShipment.setBusy(false);
							if (oData.VesselHdToReturnMsg && oData.VesselHdToReturnMsg.results && oData.VesselHdToReturnMsg.results.length) {
								var results = oData.VesselHdToReturnMsg.results;
								//To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
								var sMessage = '', sMessageError = '';
								results.some(function (obj) {
									if (obj.MsgType === 'I') {
										sMessage += obj.Message +' - '+obj.Msgv1+ "\n";
									} else if (obj.MsgType === 'E') {
										sMessageError += obj.Message +' - '+obj.Msgv1+ "\n";
									}
								});
								if (sMessageError) {
									MessageBox.error(sMessageError);
									return;
								} else {
									MessageBox.success(sMessage);
								}
							}
							that._oDialogAddShipment.close();
							that.getView().byId("BtnRefresh").firePress();
						},
						error: function (oError) {
							that._oDialogAddShipment.setBusy(false);
						}
					});
				},
				/**
				 * This function is used to Mark a vessel in compelte status.
				 */
				onCompleteVessel: function () {
					var that = this, i18n = this.getResourceBundle(), oCompleteVeslObj = {}, aVesselHdToVesselUpdate = [],
						oVesselDetailTbl = that.getView().byId("TblVesselDetail"), aSelectedIndices = oVesselDetailTbl.getSelectedIndices();
					if (!aSelectedIndices.length) {
						MessageBox.error(i18n.getText("VesselScreen.SelectAtleastARow"));
						return;
					}
					MessageBox.confirm((i18n.getText("VesselScreen.ConfirmCompleteMsg")), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.YES) {
								for (var i = 0; i < aSelectedIndices.length; i++) {
									var selectRowObj = oVesselDetailTbl.getModel().getProperty(oVesselDetailTbl.getContextByIndex(aSelectedIndices[i]).sPath);
									oCompleteVeslObj = {};
									oCompleteVeslObj.VesselCode = selectRowObj.VesselCode;
									oCompleteVeslObj.VesselInfoRec = selectRowObj.VesselInfoRec;
									oCompleteVeslObj.VesselStatus = '04',//04 stands for complete vessel
										oCompleteVeslObj.ShipmentNo = selectRowObj.ShipmentNo;
									oCompleteVeslObj.BolNo = selectRowObj.BolNo;
									aVesselHdToVesselUpdate.push(oCompleteVeslObj);
								}
								if (!aVesselHdToVesselUpdate.length) {
									return;
								}
								var oCompleteVesselObj = {
									"d": {
										"Indicator": "C",
										"VesselHdToVesselUpdate": aVesselHdToVesselUpdate,
										"VesselHdToReturnMsg": [
											{
												"MsgID": "ZSUP"
											}
										]
									}
								};
								var oDataModel = that.getOwnerComponent().getModel();
								that.getModel("listViewModel").setProperty("/tableBusy", true);
								oDataModel.create("/VesselHdSet", oCompleteVesselObj, {
									success: function (oData, response) {
										that.getModel("listViewModel").setProperty("/tableBusy", false);
										if (oData.VesselHdToReturnMsg && oData.VesselHdToReturnMsg.results && oData.VesselHdToReturnMsg.results.length) {
											var results = oData.VesselHdToReturnMsg.results;
											//To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
											var sMessage = '', sMessageError = '';
											results.some(function (obj) {
												if (obj.MsgType === 'I') {
													sMessage += obj.Message +' - '+obj.Msgv1+ "\n";
												} else if (obj.MsgType === 'E') {
													sMessageError += obj.Message +' - '+obj.Msgv1+ "\n";
												}
											});
											if (sMessageError) {
												MessageBox.error(sMessageError);
												return;
											} else {
												MessageBox.success(sMessage);
											}
										}
										that.getView().byId("BtnRefresh").firePress();
									},
									error: function (oError) {
										that.getModel("listViewModel").setProperty("/tableBusy", false);
									}
								});
							}
							else if (oAction === sap.m.MessageBox.Action.CANCEL) {
								return;
							}
						}
					});
				},
				/**
				 * This function is used for Download to Excel functionality.
				 */
				onVesselDownload: function () {
					var downloadThreshold = 10000;
					if (this.getModel("listViewModel").getProperty("/totalCount") > downloadThreshold) {
						this.openConfirmationBox(downloadThreshold);
					} else {
						this.callVesselDetailsData();
					}
				},
				/**
				 * This function opens confirmation when data is huge.
				 * @param {*} downloadThreshold - Download to Excel Thresold Limit
				 */
				openConfirmationBox: function (downloadThreshold) {
					var that = this;
					MessageBox.confirm(
						(this.getResourceBundle().getText("downloadConfirmMsg", [downloadThreshold])), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.YES) {
								that.callShipmentHeaderData();
							} else if (oAction === sap.m.MessageBox.Action.NO) {
								sap.m.MessageToast.show(that.getResourceBundle().getText("IncreaseSelectionCriteria"));
							}
						}
					}
					);
				},
				/**
				 * Internal helper function for Download To Excel functionality.
				 */
				callVesselDetailsData: function () {
					var filters = this.handleSelectionParameters(), that = this,
						promise = jQuery.Deferred(), url = "/VesselDetailSet", urlParams = {};
					this.getModel("listViewModel").setProperty("/tableBusy", true);
					readOdataAndReturnPromise(this.getOwnerComponent().getModel(), url, urlParams, filters).done(function (response) {
						promise.resolve();
						that.getModel("listViewModel").setProperty("/tableBusy", false);
						that.getModel("VesselDetailsExlModel").setData(response.results);
						that.getModel("VesselDetailsExlModel").refresh();
						var iModelLength = that.getModel("VesselDetailsExlModel").getData().length;
						if (iModelLength > 0) {
							var dataModel = that.getModel("VesselDetailsExlModel");
							that.downloadToExcel(dataModel, that.getView().byId("TblVesselDetail").getColumns());
						}
						else {
							MessageBox.error(that.getResourceBundle().getText("NoDataToDownload"));
						}
					}.bind(this)).fail(function (oError) {
						that.getModel("listViewModel").setProperty("/tableBusy", false);
						promise.reject();
					});
					return promise;
				},

			});
	});