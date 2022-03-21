/*jshint sub:true*/

sap.ui.define(["com/slb/cpf/online/nonpo/zcpfnpotmplte/controller/BaseController", 
				"sap/ui/model/json/JSONModel", 
				"com/slb/cpf/online/nonpo/zcpfnpotmplte/util/formatter",
				"com/slb/cpf/online/nonpo/zcpfnpotmplte/util/Helper", 
				"sap/ui/model/Filter", 
				"sap/ui/model/FilterOperator", 
				"sap/m/MessageBox"],
				
function(BaseController, JSONModel, formatter, Helper, Filter, FilterOperator, MessageBox, FormatDateOutput) {
	"use strict";
	return BaseController.extend("com.slb.cpf.online.nonpo.zcpfnpotmplte.controller.NonPOForm", {
		formatter : formatter,
		FormatDateOutput: FormatDateOutput, 
		// ---------------------------------------------
		// INITIALIZATION
		// ---------------------------------------------
		onInit: function() {
			var oDate = new Date(), dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd-MMM-yyyy" }),   
				dateFormatted = dateFormat.format(oDate), i18n = this.getResourceBundle();					
			this.getView().byId("dtDateTemplateCompleted").setText(dateFormatted);
			this.odataModel = this.getOwnerComponent().getModel(); 
			this.odataModel.setSizeLimit(1000);
			this.odataModel.setDefaultCountMode("None");
			this.getView().setModel(this.odataModel);
			
			// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies
			var oAppBaseDataModel = new JSONModel({"zeroDecimalFlag":""});
			this.getView().setModel(oAppBaseDataModel, "AppBaseDataModel");
			// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
			
			// Start of changes for RFC# 7000018441 CD# 2000039133 - Changing Payment Contact from display only to dropdown selection
			var aFinanceHelpdeskData = [
				{"key": i18n.getText("HelpDesk1Key"), "text": i18n.getText("HelpDesk1Text")}, 
				{"key": i18n.getText("HelpDesk2Key"), "text": i18n.getText("HelpDesk2Text")}];
			var oFinanceHelpDeskModel = new JSONModel({
				"SelectedHelpdesk": i18n.getText("HelpDesk1Key"), 
				"FinanceHelpdeskCollection": aFinanceHelpdeskData
			});
			this.getView().setModel(oFinanceHelpDeskModel, "FinanceHelpDeskModel");
			// End of changes for RFC# 7000018441 CD# 2000039133 - Changing Payment Contact from display only to dropdown selection
			
			// Start of changes for RFC# 7000015093 CD# 2000033080 - Adding tab to display history : setting min and max dates for creation date range
			// Template Creation From Date setting
			this.getView().byId("historyFromDateFilter").setDateValue(new Date(oDate.getFullYear(), oDate.getMonth()-1, oDate.getDate()));
			this.getView().byId("historyFromDateFilter").setMinDate(new Date(oDate.getFullYear()-1, oDate.getMonth(), oDate.getDate()));
			this.getView().byId("historyFromDateFilter").setMaxDate(new Date());
			// Template Creation To Date setting
			this.getView().byId("historyToDateFilter").setDateValue(new Date());
			this.getView().byId("historyToDateFilter").setMinDate(new Date(oDate.getFullYear()-1, oDate.getMonth(), oDate.getDate()));
			this.getView().byId("historyToDateFilter").setMaxDate(new Date());
			
			// to disable manual entry or editing of date. User can only select or change date using calendar icon
			sap.m.DatePicker.prototype.onAfterRendering = function(e){
				$("#"+e.srcControl.getId()+"-inner").prop("readonly", true);
				};
			// End of changes for RFC# 7000015093 CD# 2000033080 - Adding tab to display history : setting min and max dates for creation date range
			
			// Accounting Model
			var AccountingModel = new JSONModel([]);
			this.getView().setModel(AccountingModel, "AccountingModel");
			// Value Help Model
			var valueHelpModel = new JSONModel([]);
			this.setModel(valueHelpModel, "valueHelpModel");
			//CompanyCode F4 Model
			var companyCodeF4Model = new JSONModel([]);
			this.setModel(companyCodeF4Model, "companyCodeF4Model");
			//VendorCode F4 Model
			var vendorCodeF4Model = new JSONModel([]);
			this.setModel(vendorCodeF4Model, "vendorCodeF4Model");
			//VendorCode F4 Model
			var permittedPayeeCodeF4Model = new JSONModel([]);
			this.setModel(permittedPayeeCodeF4Model, "permittedPayeeCodeF4Model");
			//Commodity Description F4 Model
			var commodityDescF4Model = new JSONModel([]);
			this.setModel(commodityDescF4Model, "commodityDescF4Model");
			//Type Of Transaction F4 Model
			var transactionF4Model = new JSONModel([]);
			this.setModel(transactionF4Model, "transactionF4Model");
			//GL Account F4 Model
			var glAccountF4Model = new JSONModel([]);
			this.setModel(glAccountF4Model, "glAccountF4Model");
			// Start of changes for RFC# 7000008934 CD# 2000031315 - Adding new UOM F4 column
			// UOM F4 Model
			var uomF4Model = new JSONModel([]);
			this.setModel(uomF4Model, "UOMF4Model");
			// End of changes for RFC# 7000008934 CD# 2000031315 - Adding new UOM F4 column
			//Cost Center F4 Model
			var costCenterF4Model = new JSONModel([]);
			this.setModel(costCenterF4Model, "costCenterF4Model");
			//Profit Center F4 Model
			var profitCenterF4Model = new JSONModel([]);
			this.setModel(profitCenterF4Model, "profitCenterF4Model");
			//WBS F4 Model
			var wbsF4Model = new JSONModel([]);
			this.setModel(wbsF4Model, "wbsF4Model");
			//TIC Code F4 Model
			var ticCodeF4Model = new JSONModel([]);
			this.setModel(ticCodeF4Model, "ticCodeF4Model");
			//Requester Detail model
			var RequesterDetailModel = new JSONModel([]); 
			this.setModel(RequesterDetailModel, "RequesterDetailModel");
			// Invoice Currency Model
			var invoiceCurrencyF4Model = new JSONModel([]); 
			this.setModel(invoiceCurrencyF4Model, "InvoiceCurrencyF4Model");
			// Start of changes for RFC# 7000015093 CD# 2000033080 - Requester Multi Input F4 help
			// Requester Model
			var requesterF4Model = new JSONModel([]); 
			this.setModel(requesterF4Model, "RequesterF4Model");
			// End of changes for RFC# 7000015093 CD# 2000033080 - Requester Multi Input F4 help
			//Initial empty object line item in the Accounting Table
			var initialAccountingData = this.getView().getModel("AccountingModel").getData();
			var initialBlankLineItem = {
					ItemDesc : '', CommodityDesc : '', TICDesc : '', Quantity : '', UOM : '', UnitPrice : '', ItemNetAmount : '', sGLAccount : '', 
					CostCenter : '', ProfitCenter : '', WBS : '', TIC : '', WBSEnable : true, CostCenterEnable : true, editable : true, 
					newItem : true, removeItem : false
			};
			initialAccountingData.splice(0, 0, initialBlankLineItem);
			this.getView().getModel("AccountingModel").setData(initialAccountingData);
			// Setting logged in User details
			if(window["sap-ushell-config"]){				
				var shellConfig = window["sap-ushell-config"].services.Container.adapter.config, sRequestorEmail = shellConfig.email;
				this.getView().byId("inpRequesterAlias").setValue(sRequestorEmail.split("@")[0]);
				this.getView().byId("inpRequesterFullName").setValue(shellConfig.fullName);
				this.getView().byId("inpRequesterGIN").setValue(shellConfig.id);								
				this.getView().byId("inpRequesterEmail").setValue(sRequestorEmail);
				this.getView().byId("inpRecpOfTmpltEmail1").setValue(sRequestorEmail);
				this.getView().byId("inpDefaultUserFullName").setValue(shellConfig.fullName);																
				this.getView().byId("inpDefaultUserEmailId").setValue(shellConfig.email);
				this.getView().byId("inpRecpOfTmpltEmail2").setValue(shellConfig.email);								
			}								
		}, 
		//--------------------------Generic method for F4s----------------------------	
		handleValueHelpOpen: function(oEvent, model, url, columns, urlParams, title){
			var that = this, model = this.getOwnerComponent().getModel();
			this._InputId = oEvent.oSource.sId;
			if(oEvent.oSource.oParent.sParentAggregationName === "rows"){
				this._TblColName = title;
				this._aTblCols = oEvent.oSource.oParent.oParent.getColumns();
			}
			this._InputSource = oEvent.oSource;
			this.getModel('valueHelpModel').setData([]);
			// create value help dialog
			if (!this._ValueHelpDialog) {
				this._ValueHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "com.slb.cpf.online.nonpo.zcpfnpotmplte.fragments.ValueHelpDialog", this);
				this.getView().addDependent(this._ValueHelpDialog);
			}
			// Start of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter 
			var selectionType = oEvent.getSource().data("selectionType");
			if(selectionType === "multiSelect"){
				this._ValueHelpDialog.setMultiSelect(true);
			}
			else{
				this._ValueHelpDialog.setMultiSelect(false);
			}
			// End of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
			readOdataAndReturnPromise(model, url, urlParams)
				.done(function(response) {
					if(response.results.length>100)
						that.getModel('valueHelpModel').setSizeLimit(response.results.length);
					var aData = response.results;
					aData.forEach(function(currentValue,index){
						currentValue['Title'] = currentValue[columns[0]];
						currentValue['Desc'] = currentValue[columns[1]];
						// Start of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
						if(selectionType === "multiSelect"){
							var selectedTokens = that.byId(that._InputId).getTokens();
							if(selectedTokens.length>0){
								for(var i = 0 ; i < selectedTokens.length; i++){
									if(selectedTokens[i].getProperty("text") === currentValue.Title)
										currentValue['Selected'] = true;
								}
							}
						}
						// End of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
					});
					that.getModel('valueHelpModel').setData(aData);
					that.getModel('valueHelpModel').refresh(true);
					that._ValueHelpDialog.setBusy(false);
				})
				.fail(function(oError) {
					that._ValueHelpDialog.setBusy(false);
			});
			// open value help dialog
			this._ValueHelpDialog.open();
			this._ValueHelpDialog.setTitle(title);
			this._ValueHelpDialog.setBusy(true);
		},
		// To filter values in F4 helps - generic method
		handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value"), 
				oFilters = [new Filter([
										new Filter("Title", FilterOperator.Contains, sValue),
										new Filter("Desc", FilterOperator.Contains, sValue)], false)];
			oEvent.getSource().getBinding("items").filter(oFilters);
		},
		// On selection of a value from F4 helps - generic method
		handleValueHelpClose: function (oEvent) {
			var i18n = this.getResourceBundle();
			// Start of changes for RFC# 7000015093 CD# 2000033080 - Using Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
			if(oEvent.getSource().getMultiSelect() === true){
				this.handleMultiValueHelpClose(oEvent);
			}
			// End of changes for RFC# 7000015093 CD# 2000033080 - Using Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
			else{
				var that = this, oSelectedItem = oEvent.getParameter("selectedItem"), oDialogTitle = oEvent.getSource().getTitle();
				if (oSelectedItem){
					var _InputId = sap.ui.getCore().byId(this._InputId);
					//If condition will work when we press F4 in Table row, it will pick up row context and set value
					if(_InputId.mBindingInfos && _InputId.mBindingInfos.value && _InputId.mBindingInfos.value.parts[0]){
						var inputBinding = _InputId.mBindingInfos.value.parts[0], bindingModel = inputBinding.model, bindingPath = inputBinding.path;
						this._InputSource.getBindingContext(bindingModel).getObject()[bindingPath] = oSelectedItem.getTitle();
						if(bindingPath === "CommodityDesc"){
							var glAccountNo = oSelectedItem.getDescription()/*, colFieldGlAccountNo*/;
							that._InputSource.getBindingContext(bindingModel).getObject()["GLAccount"] = glAccountNo;
						}	
						if(bindingPath === "TICDesc"){
							this._InputSource.getBindingContext(bindingModel).getObject()["TIC"] = oSelectedItem.getDescription();
						}	
						// If User selects Cost Center, then disable WBS
						if(bindingPath === "CostCenter"){
							that._InputSource.getBindingContext(bindingModel).getObject()["WBSEnable"] = false;
							that.getProfitCenter(oSelectedItem.getTitle()).then(function(relativeProfitCenterVal) {
								that._InputSource.getBindingContext(bindingModel).getObject()["ProfitCenter"] = relativeProfitCenterVal;
								that.getModel(bindingModel).refresh(true);	
						    });
						}
						// If User selects WBS, then disable Cost Center
						if(bindingPath === "WBS"){
							that._InputSource.getBindingContext(bindingModel).getObject()["CostCenterEnable"] = false;
							that.getProfitCenter(oSelectedItem.getTitle()).then(function(relativeProfitCenterVal) {
								that._InputSource.getBindingContext(bindingModel).getObject()["ProfitCenter"] = relativeProfitCenterVal;
								that.getModel(bindingModel).refresh(true);	
						    });
						}
						this.getModel(bindingModel).refresh(true);
					}
					else{
						//Else condition will work when we press F4 as free control, where we don't need table context
						_InputId.setValue(oSelectedItem.getTitle());
						_InputId.setValueState("None");
						_InputId.setValueStateText("");
						//check if Company code has been entered by the user
						//Vendor code and Permitted payee code is dependent on the Company code
						if(_InputId.sId.includes("inpCompanyCode")){
							if(this.getView().byId("inpCompanyCode").getValue() !== ""){
								// Enable & clear Vendor Code
								this.getView().byId("inpVendorCode").setEnabled(true);
								this.getView().byId("inpVendorCode").setValue("");
								// Enable & clear Permitted Payee Code
								this.getView().byId("inpPermittedPayeeCode").setEnabled(true);
								this.getView().byId("inpPermittedPayeeCode").setValue("");
								// Clear Vendor Name
								this.getView().byId("inpVendorName").setValue("");
								// Clear Permitted Payee Name
								this.getView().byId("inpPermittedPayeeName").setValue("");
								// Clear table rows if any on change of Company Code
								var oTable = this.byId("tblAccountCode"), oModel = oTable.getModel("AccountingModel"); 
								if(oModel.getData().length > 0){
									var tableRowData = oModel.getData()[0];
									if(tableRowData.ItemDesc !== '' || tableRowData.CommodityDesc !== '' || tableRowData.TICDesc !== '' || 
										tableRowData.Quantity !== '' || tableRowData.UOM !== '' || tableRowData.UnitPrice !== '' || 
										tableRowData.ItemNetAmount !== '' || tableRowData.sGLAccount !== '' || tableRowData.CostCenter !== '' || 
										tableRowData.ProfitCenter !== '' || tableRowData.WBS !== '' || tableRowData.TIC !== ''){
										var initialAccountingData = oModel.getData();
										var initialBlankLineItem = {
												ItemDesc : '', CommodityDesc : '', TICDesc : '', Quantity : '',  UOM : '',UnitPrice : '', ItemNetAmount : '', sGLAccount : '', 
												CostCenter : '', ProfitCenter : '', WBS : '', TIC : '', WBSEnable : true, CostCenterEnable : true, editable : true, 
												newItem : true, removeItem : false
										};
										initialAccountingData.splice(0, oModel.getData().length, initialBlankLineItem);
										oModel.setData(initialAccountingData);
										oModel.refresh(true);
										oTable.clearSelection(true);
									}
									this.byId("inpInvNetAmt").setValue("");
									this.byId("inpInvoiceNetAmt").setValue("");
									this.byId("inpInvoiceGrossAmt").setValue("");
								}
							}
							else{
								this.getView().byId("inpVendorCode").setEnabled(false);
								this.getView().byId("inpPermittedPayeeCode").setEnabled(false);
							}	
						}
						var _InputName = oSelectedItem.getDescription(), sPath = oSelectedItem.getBindingContextPath(), 
							billingAddress = this.getModel("valueHelpModel").getProperty(sPath).BillAddress;
						if(oDialogTitle === i18n.getText("CompanyCode")){
							this.getView().byId("inpCompanyName").setValue(_InputName);
							/* Start of changes for RFC# 7000008934 CD# 2000031315 - Setting description value of selected Company Code in 
							 	Specific Billing Instructions input field on Company Code selection */
							// Changes for RFC# 7000018441 CD# 2000039133 - Removed Billing Instructions
							/* End of changes for RFC# 7000008934 CD# 2000031315 - Setting description value of selected Company Code in 
							 	Specific Billing Instructions input field on Company Code selection */
							this.getView().byId("txtAreaBillInvoiceTo").setValue(billingAddress);	
						}
						if(oDialogTitle === i18n.getText("VendorCode")){
							this.getView().byId("inpVendorName").setValue(_InputName);
						}
						if(oDialogTitle === i18n.getText("PermittedPayeeCode")){
							this.getView().byId("inpPermittedPayeeName").setValue(_InputName);
						}
						// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
						if(oDialogTitle === i18n.getText("InvCurr")){
							var sPath = oSelectedItem.getBindingContextPath(), zeroDecimalFlag = this.getModel("valueHelpModel").getProperty(sPath).ZeroDecimal;
							this.getView().getModel("AppBaseDataModel").setProperty("/zeroDecimalFlag", zeroDecimalFlag);
							if(zeroDecimalFlag === "X"){
								var lineItemsTable = this.byId("tblAccountCode"), i18n = this.getResourceBundle(), 
									aLineItemsModelData = lineItemsTable.getModel("AccountingModel").getData();
								sap.m.MessageToast.show(i18n.getText("zeroDecimalCurrencyMsg"));
								for(var i=0;i<aLineItemsModelData.length;i++){
									aLineItemsModelData[i].UnitPrice = Math.round(parseFloat(aLineItemsModelData[i].UnitPrice));
									var quantity = parseFloat(aLineItemsModelData[i].Quantity), 
										unitPrice = aLineItemsModelData[i].UnitPrice, 
										total = quantity*unitPrice;
									aLineItemsModelData[i].ItemNetAmount = Math.round(total);
								}
								lineItemsTable.getModel("AccountingModel").refresh(true);
								this.calculateNetAmount();
								var invNetAmtExTaxVal = this.getView().byId("inpInvNetAmt").getValue(), 
									invNetAmtVal = this.getView().byId("inpInvoiceNetAmt").getValue(), 
									invTaxAmtVal = this.getView().byId("inpTaxAmt").getValue(), 
									invGrossAmtVal = this.getView().byId("inpInvoiceGrossAmt").getValue();
								this.getView().byId("inpInvNetAmt").setValue(Math.round(invNetAmtExTaxVal));
								this.getView().byId("inpInvoiceNetAmt").setValue(Math.round(invNetAmtVal));
								this.getView().byId("inpTaxAmt").setValue(Math.round(invTaxAmtVal));
								this.getView().byId("inpInvoiceGrossAmt").setValue(Math.round(invGrossAmtVal));
							}
						}
						// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
					}
					this._InputSource.setValueState('None');
				}
				oEvent.getSource().getBinding("items").filter([]);
			}
			this._ValueHelpDialog.setBusy(false);
		},
		// Start of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
		handleMultiValueHelpClose: function(oEvent){
			var oSelectedItems = oEvent.getParameter("selectedContexts"), tokenArray = [];
			if(oSelectedItems){
				var _InputId = sap.ui.getCore().byId(this._InputId);
				for(var i = 0;i < oSelectedItems.length;i++){
					var newToken = new sap.m.Token({text: "", key: ""});
					newToken.setText(oSelectedItems[i].getProperty("Title"));
					newToken.setKey(oSelectedItems[i].getProperty("Desc"));
					tokenArray.push(newToken);
				}
				_InputId.setTokens(tokenArray);
				_InputId.setValueState("None");
				_InputId.setValueStateText("");
				// Enable & clear Vendor Code
				this.getView().byId("multiInput_VendorCode").setEnabled(true);
				this.getView().byId("multiInput_VendorCode").setValue("");
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		// End of changes for RFC# 7000015093 CD# 2000033080 - Using existing Inputs (Company Code, Vendor Code & Requestor) as Multi-Inputs for history tab filter
		// Fetch Profit Center based on the value selected for Cost Center or WBS
		getProfitCenter: function(filterValue){
			var that = this, sPath = "/ProfitCenterGets", companyCode = this.byId('inpCompanyCode'), filters;
			if(this._TblColName === "Cost Center"){
				filters = [
        			new Filter("CompanyCode", FilterOperator.EQ, companyCode.getValue()),
        			new Filter("CostCenter", FilterOperator.EQ, filterValue)];
			}
			if(this._TblColName === "WBS"){
				filters = [
        			new Filter("CompanyCode", FilterOperator.EQ, companyCode.getValue()),
        			new Filter("WBSElement", FilterOperator.EQ, filterValue)];
			}
			return new Promise (function(resolve, reject) {
				that.getOwnerComponent().getModel().read(sPath, {
					async: false,
					filters: filters,
					success: function(oData, oResponse) {
						if(oData.results.length){
							var profitCenterVal = oData.results[0].ProfitCenter;
							resolve(profitCenterVal);
						}
						else{
							return "";
						}
					},
					error: function(oError){
						var message = JSON.parse(oError.responseText), msgText = message.error.message.value;
						MessageBox.show(msgText, MessageBox.Icon.ERROR);
					}
				});
			});
		},
		// To clear and enable Vendor, Permitted Payee on change of company code
		onliveChangeCompCode: function(oEvent){
			var compCode = this.getView().byId("inpCompanyCode").getValue();
			if(compCode.length >= 2){
				this.getView().byId("inpCompanyName").setValue("");
				this.getView().byId("inpBillIns1").setValue("");
				this.getView().byId("inpVendorCode").setEnabled(true);
				this.getView().byId("inpPermittedPayeeCode").setEnabled(true);
				this.getView().byId("inpVendorCode").setValue("");
				this.getView().byId("inpPermittedPayeeCode").setValue("");
				this.getView().byId("inpVendorName").setValue("");
				this.getView().byId("inpPermittedPayeeName").setValue("");
			}
			else{
				this.getView().byId("inpVendorCode").setEnabled(false);
				this.getView().byId("inpPermittedPayeeCode").setEnabled(false);
			}
		},
		// Fetch Company code
		onChangeCompCode: function(oEvent){
			var compCode=this.getView().byId("inpCompanyCode").getValue();
			if(compCode.length >= 2){
				var url = "/CompanyCodeGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectCompanyCode"), companyCode = this.byId('inpCompanyCode'), 
					urlParams = {
								$filter: "substringof('" + companyCode.getValue().toUpperCase() + "', CompanyCode) eq true"
					}; 
				this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('companyCodeF4Model'), url, ['CompanyCode', 'CompanyCodeDesc', 'BillAddress'], urlParams, title);
			}
		},
		//------------------------Company Code F4 Open ------------------------------------------		
		handleCompanyCodeF4Open: function(oEvent){
			var url = "/CompanyCodeGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectCompanyCode");
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('companyCodeF4Model'), url, ['CompanyCode', 'CompanyCodeDesc'], 'BillAddress', title);
		},	
		// Start of changes for RFC# 7000015093 CD# 2000033080 - Requester Multi Input F4 help
		handleRequestorMultiF4Open: function(oEvent){
			var url = "/RequestorGets", i18n = this.getResourceBundle(), title = i18n.getText("history.requestorMultiInput");
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('RequesterF4Model'), url, ['ReqName', 'ReqGin'], '', title);
		},
		// End of changes for RFC# 7000015093 CD# 2000033080 - Requester Multi Input F4 help
		//------------------------Vendor Code F4 Open ------------------------------------------		
		handleVendorCodeF4Open: function(oEvent){
			// Start of changes for RFC# 7000015093 CD# 2000033080 - Using single select Vendor Code for multiple select too
			var selectionType = oEvent.getSource().data("selectionType"), url = "/VendorGets", i18n = this.getResourceBundle(), 
				title = i18n.getText("FragSelectVendorCode"), companyCode = this.byId('inpCompanyCode');
			if(selectionType === "multiSelect"){
				var oCompCodeTokens = this.byId("multiInput_CompanyCode").getTokens();
				if(oCompCodeTokens.length === 1){
					var urlParams = {
							$filter: "CompanyCode eq '" + oCompCodeTokens[0].getText() + "'"
						};
				}
				else{
					var filterString = "CompanyCode eq '" + oCompCodeTokens[0].getText() + "'";
					for(var i=1; i<oCompCodeTokens.length; i++){
						filterString += " and CompanyCode eq '" + oCompCodeTokens[i].getText() + "'";
					}
					var urlParams = {
							$filter: filterString
						};
				}
				
			}
			else{
				var urlParams = {
						$filter: "CompanyCode eq '" + companyCode.getValue() + "'"
					};
			}
			// End of changes for RFC# 7000015093 CD# 2000033080 - Using single select Vendor Code for multiple select too
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('vendorCodeF4Model'), url, ['Vendor', 'VendorDesc'], urlParams, title);
		},	
		//------------------------Permitted Payee Code F4 Open ------------------------------------------		
		handlePermittedPayeeCodeF4Open: function(oEvent){
			var url = "/PermittedPayeeGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectPermittedPayeeCode");
			var companyCode = this.byId('inpCompanyCode');
			var vendorCode = this.byId('inpVendorCode');
			var urlParams = {
					$filter: "CompanyCode eq '" + companyCode.getValue() + "' and Vendor eq '" + vendorCode.getValue() + "'"
				};
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('permittedPayeeCodeF4Model'), url, ['PermittedPayee', 'PermittedPayeeDesc'], urlParams, title);
		},	
		//-----------------------Commodity Description F4-----------------------------------
		openCommDescPopup: function(oEvent){
			var url = "/CommodityGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectCommodityDesc");
			/* Start of changes for RFC# 7000008934 CD# 2000031315 - Removed ValueClass property and added GLAccount instead as earlier 
			   ValueClass was used to fetch respective GL Account no. for selected Commodity Desc from GL Account get service, 
			   but now related GL Account no. is directly available in the Commodity Desc get service */
			// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Removed MaterialGrp attribute
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('commodityDescF4Model'), url, ['CommodityDesc', 'GLAccount'], '', title);
			// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Removed MaterialGrp attribute
			/* End of changes for RFC# 7000008934 CD# 2000031315 - Removed ValueClass property and added GLAccount instead as earlier 
			   ValueClass was used to fetch respective GL Account no. for selected Commodity Desc from GL Account get service, 
			   but now related GL Account no. is directly available in the Commodity Desc get service */
		},
		// To clear the value of GL Account if Commodity Description F4 value is cleared from the table
		handleCommodityDescChange: function(oEvent){
			var oCommodityDesc = oEvent.getSource(), sId = oEvent.getSource().sId;
			if(oCommodityDesc.getValue().length === 0){
				var colFieldGlAccountNo;
				for(var i=0; i<this._aTblCols.length; i++){
					if(this._aTblCols[i].getLabel().getText() === "GL Account"){
						colFieldGlAccountNo = this._aTblCols[i].sId.substr(8);
					}
				}
				var inputGlAccoutCode = "__input" + colFieldGlAccountNo + "-col" + colFieldGlAccountNo + "-" + sId.split("-")[2];
				sap.ui.getCore().byId(inputGlAccoutCode).setValue("");
			}
		},
		//-----------------------Type of Transaction F4-----------------------------------
		openTypeOfTraxnPopup: function(oEvent){
			var url = "/TICGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectTransType"), companyCode = this.byId('inpCompanyCode'), InputSource = oEvent.oSource, 
				inputId = sap.ui.getCore().byId(InputSource.sId), inputBinding = inputId.mBindingInfos.value.parts[0], 
				bindingModel = inputBinding.model, oBindingContextObj=InputSource.getBindingContext(bindingModel).getObject(), 
				sTypeOfTransaction=oBindingContextObj["TICDesc"], strTOC= sTypeOfTransaction.toUpperCase(), 
				urlParams = {
					$filter: "CompanyCode eq '" + companyCode.getValue() + /*"' and TICDesc eq '" + strTOC +*/ "'"
				};
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('transactionF4Model'), url, ['TICDesc', 'TIC'], urlParams, title);
		},
		// To clear the value of TIC Code if Type of Transport F4 value is cleared from the table
		handleTypeOfTransChange: function(oEvent){
			var oTypeOfTrans = oEvent.getSource(), sId = oEvent.getSource().sId;
			if(oTypeOfTrans.getValue().length === 0){
				var colFieldTicCodeNo;
				for(var i=0; i<this._aTblCols.length; i++){
					if(this._aTblCols[i].getLabel().getText() === "TIC Code"){
						colFieldTicCodeNo = this._aTblCols[i].sId.substr(8);
					}
				}
				var inputTICCode = "__input" + colFieldTicCodeNo + "-col" + colFieldTicCodeNo + "-" + sId.split("-")[2];
				sap.ui.getCore().byId(inputTICCode).setValue("");
			}
		},
		// Start of changes for RFC# 7000008934 CD# 2000031315 - Adding new UOM F4 column
		//----------------------- UOM F4-----------------------------------
		openUOMPopup: function(oEvent){
			var url = "/UOMGets", i18n = this.getResourceBundle(), title = i18n.getText("NonPOTblColUOM"), InputSource = oEvent.oSource, 
				inputId = sap.ui.getCore().byId(InputSource.sId), inputBinding = inputId.mBindingInfos.value.parts[0], 
				bindingModel = inputBinding.model, oBindingContextObj=InputSource.getBindingContext(bindingModel).getObject();
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('UOMF4Model'), url, ['UOM', 'UOMText'], '', title);
		},
		// End of changes for RFC# 7000008934 CD# 2000031315 - Adding new UOM F4 column
		//-----------------------Cost Center F4-----------------------------------
		openCostCenterPopup: function(oEvent){
			var url = "/CostCenterGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectCostCenter"), companyCode = this.byId('inpCompanyCode'), 
				urlParams = {
					$filter: "CompanyCode eq '" + companyCode.getValue() + "'"
				};	
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('costCenterF4Model'), url, ['CostCenter', 'CompanyCode', 'CostCenterDesc'], urlParams, title);
		},
		// Enable WBS if Cost Center value is cleared
		handleCostCenterChange: function(oEvent){
			if(oEvent.getSource().getValue() === ""){
				var colFieldProfitCenterNo, colFieldWbsNo, sId = oEvent.getSource().sId;
				for(var i=0; i<this._aTblCols.length; i++){
					if(this._aTblCols[i].getLabel().getText() === "Profit Center"){
						colFieldProfitCenterNo = this._aTblCols[i].sId.substr(8);
					}
					if(this._aTblCols[i].getLabel().getText() === "WBS"){
						colFieldWbsNo = this._aTblCols[i].sId.substr(8);
					}
				}
				var inputIdWBS = "__input" + colFieldWbsNo + "-col" + colFieldWbsNo + "-" + sId.split("-")[2], 
					inputProfitCenter = "__input" + colFieldProfitCenterNo + "-col" + colFieldProfitCenterNo + "-" + sId.split("-")[2];
				sap.ui.getCore().byId(inputIdWBS).setEnabled(true);
				sap.ui.getCore().byId(inputProfitCenter).setValue("");
			}
		},
		//-----------------------Profit Center F4-----------------------------------
		openProfitCenterPopup: function(oEvent){
			var url = "/ProfitCenterGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectProfitCenter"), companyCode = this.byId('inpCompanyCode'), 
				filterValue = sap.ui.getCore().byId(this._InputId).getValue(), colFieldCostCenterNo, colFieldWbsNo;
			for(var i=0; i<this._aTblCols.length; i++){
				if(this._aTblCols[i].getLabel().getText() === "Cost Center"){
					colFieldCostCenterNo = this._aTblCols[i].sId.substr(8);
				}
				if(this._aTblCols[i].getLabel().getText() === "WBS"){
					colFieldWbsNo = this._aTblCols[i].sId.substr(8);
				}
			}
			var inputIdWBS = "__input" + colFieldWbsNo + "-col" + colFieldWbsNo + "-" + this._InputId.split("-")[2], 
				inputCostCenter = "__input" + colFieldCostCenterNo + "-col" + colFieldCostCenterNo + "-" + this._InputId.split("-")[2];
			if(this._InputId === inputCostCenter){
				var urlParams = {
						$filter: "CompanyCode eq '" + companyCode.getValue() + "' and CostCenter eq '" + filterValue + "'"
					};
			}
			if(this._InputId === inputIdWBS){
				var urlParams = {
						$filter: "CompanyCode eq '" + companyCode.getValue() + "' and WBSElement eq '" + filterValue + "'"
					};
			}
			this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel('profitCenterF4Model'),url,['ProfitCenter', 'ProfitCenterDesc'],urlParams,title);
		},
		//-----------------------WBS F4-----------------------------------
		openWbsPopup:function(oEvent){
			var url = "/WBSGets", i18n = this.getResourceBundle(), title = i18n.getText("FragSelectWbs"), companyCode = this.byId('inpCompanyCode'), 
				urlParams = {
					$filter: "CompanyCode eq '" + companyCode.getValue() + "'"
				};
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('wbsF4Model'), url, ['WBS', 'WBSDesc'], urlParams, title);
		},
		// Enable Cost Center if WBS value is cleared
		handleWBSChange: function(oEvent){
			if(oEvent.getSource().getValue() === ""){
				var colFieldCostCenterNo, colFieldProfitCenterNo, sId = oEvent.getSource().sId;
				for(var i=0; i<this._aTblCols.length; i++){
					if(this._aTblCols[i].getLabel().getText() === "Profit Center"){
						colFieldProfitCenterNo = this._aTblCols[i].sId.substr(8);
					}
					if(this._aTblCols[i].getLabel().getText() === "Cost Center"){
						colFieldCostCenterNo = this._aTblCols[i].sId.substr(8);
					}
				}
				var inputIdCostCenter = "__input" + colFieldCostCenterNo + "-col" + colFieldCostCenterNo + "-" + sId.split("-")[2], 
					inputProfitCenter = "__input" + colFieldProfitCenterNo + "-col" + colFieldProfitCenterNo + "-" + sId.split("-")[2];
				sap.ui.getCore().byId(inputIdCostCenter).setEnabled(true);
				sap.ui.getCore().byId(inputProfitCenter).setValue("");
			}
		},
		// Fetch Invoice Currency
		handleInvoiceCurrF4Open: function(oEvent){
			var url = "/CurrencyGets", i18n = this.getResourceBundle(), title = i18n.getText("InvCurr");					
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('InvoiceCurrencyF4Model'), url, ['Currency', 'CurrText'], '', title);
		},
		//-------------------------Tic Code F4---------------------------------
		openTicCodePopup: function(oEvent){
			var url = "/F4_TicCodeSet", i18n = this.getResourceBundle(), title = i18n.getText("NonPOTblColTicCode");
			this.handleValueHelpOpen(oEvent, this.getOwnerComponent().getModel('ticCodeF4Model'), url, ['tickCode', 'ticName'], '', title);
		},
		//On click of Edit button
		onPressEditBtn: function(){
			if (!this._oDialogSearchPopUp) {
				this._oDialogSearchPopUp = sap.ui.xmlfragment(this.getView().getId(), "com.slb.cpf.online.nonpo.zcpfnpotmplte.fragments.SearchPopUp", this);
			    this.getView().addDependent(this._oDialogSearchPopUp);
			}
			jQuery.sap.syncStyleClass(this.getView(), this._oDialogSearchPopUp);
			this._oDialogSearchPopUp.open();
			var srchInput = this.getView().byId("IdSearchField").setValue("");
		},
		//On Close of Search Requester fragment								
		onPressSrchPopUpCancel: function(){
			this._oDialogSearchPopUp.close();  
		},	
		//On click of Submit button inside Search Requester fragment opens Requester Details fragment			
		onPressSrchPopUpSubmit: function(){
			var that = this, i18n = this.getResourceBundle(), srchInput = this.getView().byId("IdSearchField").getValue();
			if(srchInput.length >= 3){
				this._oDialogSearchPopUp.close();
				var filters = [], sPath = "/UserGets";
				filters.push(new Filter("GIN", FilterOperator.EQ, srchInput));
				this.getOwnerComponent().getModel().read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						if(oData.results.length>0){
							that.getModel("RequesterDetailModel").setData(oData.results);
						if (!that._oDialogRequesterDetailsPopUp) {
							that._oDialogRequesterDetailsPopUp = new sap.ui.xmlfragment(that.getView().getId(), "com.slb.cpf.online.nonpo.zcpfnpotmplte.fragments.RequestorDetailsPopUp", that);
							that.getView().addDependent(that._oDialogRequesterDetailsPopUp);
						}
						jQuery.sap.syncStyleClass(that.getView(), that._oDialogRequesterDetailsPopUp);
						that._oDialogRequesterDetailsPopUp.open();
						}
						else{
							MessageBox.error(i18n.getText("Validation.NoDataRequesterDetails"));
						}
					},
					error: function(oError){
						var message = JSON.parse(oError.responseText), msgText = message.error.message.value;
						MessageBox.show(msgText, MessageBox.Icon.ERROR);
					}
				});
			}
			else{
				MessageBox.alert(i18n.getText("Validation.SearchField"),{});
			}
		},							
		//On Click of close of Requester Details fragment
		onPressRequesterDetailsPopUpClose: function(){
			this._oDialogRequesterDetailsPopUp.close();
		},
		//On Click of submit  Requester Details fragment
		onPressRequesterDetailsPopUpSubmit(){	
			var oRequesterDetailModel=this.getModel("RequesterDetailModel").getData();
			this.getView().byId("inpRequesterAlias").setValue(oRequesterDetailModel[0].UsrAlias);
			this.getView().byId("inpRequesterFullName").setValue(oRequesterDetailModel[0].UsrName);
			this.getView().byId("inpRequesterGIN").setValue(oRequesterDetailModel[0].GIN);								
			this.getView().byId("inpRequesterEmail").setValue(oRequesterDetailModel[0].UsrEmail);
			this.getView().byId("inpRecpOfTmpltEmail1").setValue(oRequesterDetailModel[0].UsrEmail);
			this._oDialogRequesterDetailsPopUp.close();
		},
		
		// Changes for RFC# 7000018441 CD# 2000039133 - Removed Approver Details
		
		// Add new blank  item to the line items table
		onPressAddItem: function(oEvent){
			var accountingData = this.getView().getModel("AccountingModel").getData();
			var initialBlankLineItem = {
					ItemDesc : '', CommodityDesc : '', TICDesc : '', Quantity : '', UOM : '', UnitPrice : '', ItemNetAmount : '', GLAccount : '',
					CostCenter : '', ProfitCenter : '', WBS : '', TIC : '', WBSEnable : true, CostCenterEnable : true, editable : true, 
					newItem : true, removeItem : false
			};
			accountingData.splice(0, 0, initialBlankLineItem);
			this.getView().getModel("AccountingModel").setData(accountingData);
		},	
		// Delete the selected line items from the table
		onPressDeleteItem: function() {
			var i18n = this.getResourceBundle(), oTable = this.byId("tblAccountCode"), oModel = oTable.getModel("AccountingModel"), 
				data = oModel.getData(), oItems = oTable.getSelectedIndices();
			if(oItems.length === 0){
				MessageBox.alert(i18n.getText("Validation.DeleteSelectedItem"), {});
			}
			for (var i = oItems.length - 1; i >= 0; --i) {
				var id = oItems[i], path = oTable.getContextByIndex(id).sPath, idx = parseInt(path.substring(path.lastIndexOf('/') + 1));
				data.splice(idx, 1);
			}
			oModel.setData(data);
			oTable.clearSelection();
			this.calculateNetAmount();
		},	
		// Start of changes for RFC# 7000018441 CD# 2000039133 - Adding Copy Item button
		// Copy the selected line item from table
		onPressCopyItem: function(){
			var oAccountingTable = this.byId("tblAccountCode"), oAccountingModel = oAccountingTable.getModel("AccountingModel"), 
				i18n = this.getResourceBundle(), aAccountingData = oAccountingModel.getData(), 
				oAccountingItems = oAccountingTable.getSelectedIndices();
			if(oAccountingItems.length === 0){
				MessageBox.alert(i18n.getText("Validation.CopySelectedItem"), {});
			}
			for(var i=0; i<oAccountingItems.length; i++){
				var lineItemIndex = oAccountingItems[i], path = oAccountingTable.getContextByIndex(lineItemIndex).sPath, obj = oAccountingModel.getProperty(path);
				var copiedLineItem = {
						ItemDesc : obj.ItemDesc, 
						CommodityDesc : obj.CommodityDesc, 
						TICDesc : obj.TICDesc, 
						Quantity : obj.Quantity, 
						UOM : obj.UOM, 
						UnitPrice : obj.UnitPrice, 
						ItemNetAmount : obj.ItemNetAmount, 
						GLAccount : obj.GLAccount,
						CostCenter : obj.CostCenter, 
						ProfitCenter : obj.ProfitCenter, 
						WBS : obj.WBS, 
						TIC : obj.TIC, 
						WBSEnable : obj.WBSEnable, 
						CostCenterEnable : obj.CostCenterEnable, 
						editable : obj.editable, 
						newItem : obj.newItem, 
						removeItem : obj.removeItem
				};
				aAccountingData.splice(oAccountingItems.length, 0, copiedLineItem);
			}
			oAccountingModel.setData(aAccountingData);
			oAccountingTable.clearSelection();
			this.calculateNetAmount();
		},
		// End of changes for RFC# 7000018441 CD# 2000039133 - Adding Copy Item button
		//save and complete functionality
		onPressSaveAndComplete: function(){
			var i18n = this.getResourceBundle(), oCreateData = {}, that = this;
			//General Services Work order Non PO Purchase
			var inpCompanyCode = this.getView().byId("inpCompanyCode"), inpRequesterAlias = this.getView().byId("inpRequesterAlias"), 
				inpCompanyName = this.getView().byId("inpCompanyName"), inpRequesterFullName = this.getView().byId("inpRequesterFullName"), 
				inpVendorCode = this.getView().byId("inpVendorCode"), inpRequesterGIN = this.getView().byId("inpRequesterGIN"), 
				inpVendorName = this.getView().byId("inpVendorName"), inpRequesterEmail = this.getView().byId("inpRequesterEmail"), 
				inpPermittedPayeeCode = this.getView().byId("inpPermittedPayeeCode"), dtDateTemplateCompleted = this.getView().byId("dtDateTemplateCompleted"), 
				inpPermittedPayeeName = this.getView().byId("inpPermittedPayeeName"), inpDefaultUserFullName = this.getView().byId("inpDefaultUserFullName"), 
				inpDefaultUserEmailId = this.getView().byId("inpDefaultUserEmailId"), inpCompanyCodeVal = inpCompanyCode.getValue(), 
				inpRequesterAliasVal = inpRequesterAlias.getValue(), inpCompanyNameVal = inpCompanyName.getValue(), 
				inpRequesterFullNameVal = inpRequesterFullName.getValue(), inpVendorCodeVal = inpVendorCode.getValue(), 
				inpRequesterGINVal = inpRequesterGIN.getValue(), inpVendorNameVal = inpVendorName.getValue(), 
				inpRequesterEmailVal = inpRequesterEmail.getValue(), inpPermittedPayeeCodeVal = inpPermittedPayeeCode.getValue(), 
				inpPermittedPayeeNameVal = inpPermittedPayeeName.getValue(), 
				inpDefaultUserFullNameVal = inpDefaultUserFullName.getValue(), inpDefaultUserEmailIdVal = inpDefaultUserEmailId.getValue();
			
			// Changes for RFC# 7000018441 CD# 2000039133 - Removed Approver Details
			
			var templateDateVal = new Date(dtDateTemplateCompleted.getText()), tmpltDate = templateDateVal.getDate(), 
				tmpltMonth = templateDateVal.getMonth()+1, tmpltDateFormatted = "", tmpltMonthFormatted = "";
			if(tmpltDate < 10){
				tmpltDateFormatted = String("0" + tmpltDate);
			}
			else{
				tmpltDateFormatted = String(tmpltDate);
			}
			if(tmpltMonth < 10){
				tmpltMonthFormatted = String("0" + tmpltMonth);
			}
			else{
				tmpltMonthFormatted = String(tmpltMonth);
			}
			var	dtDateTemplateCompletedVal = String(templateDateVal.getFullYear()) + tmpltMonthFormatted + tmpltDateFormatted;
			//Important Instructions to Supplier/Vendor
			var txtAreaBillInvoiceTo = this.getView().byId("txtAreaBillInvoiceTo"), inpInvoiceNum = this.getView().byId("inpInvoiceNum"), 
				dtInvoiceDate = this.getView().byId("dtInvoiceDate"), inpInvoiceNetAmt = this.getView().byId("inpInvoiceNetAmt"), 
				inpTaxAmt = this.getView().byId("inpTaxAmt"), inpInvoiceGrossAmt = this.getView().byId("inpInvoiceGrossAmt"), 
				inpInvoiceCurr = this.getView().byId("inpInvoiceCurr"), inpRecpOfTmpltEmail1 = this.getView().byId("inpRecpOfTmpltEmail1"), 
				inpRecpOfTmpltEmail2 = this.getView().byId("inpRecpOfTmpltEmail2"), inpOthrGenIns1 = this.getView().byId("inpOthrGenIns1"), 
				inpOthrGenIns2 = this.getView().byId("inpOthrGenIns2"), inpOthrGenIns3 = this.getView().byId("inpOthrGenIns3"), 
				inpOthrGenIns4 = this.getView().byId("inpOthrGenIns4"), txtAreaBillInvoiceToVal = txtAreaBillInvoiceTo.getValue(), 
				inpInvoiceNumVal = inpInvoiceNum.getValue(), inpInvoiceNetAmtVal = inpInvoiceNetAmt.getValue(), 
				inpTaxAmtVal = inpTaxAmt.getValue(), inpInvoiceGrossAmtVal = inpInvoiceGrossAmt.getValue(), 
				inpInvoiceCurrVal = inpInvoiceCurr.getValue(), inpRecpOfTmpltEmail1Val = inpRecpOfTmpltEmail1.getValue(), 
				inpRecpOfTmpltEmail2Val = inpRecpOfTmpltEmail2.getValue(), invoiceDateMonthValToBePassed = "", 
				inpOthrGenIns1Val = inpOthrGenIns1.getValue(), inpOthrGenIns2Val = inpOthrGenIns2.getValue(), dtInvoiceDateVal = "", 
				inpOthrGenIns3Val = inpOthrGenIns3.getValue(), inpOthrGenIns4Val = inpOthrGenIns4.getValue(), invoiceDateDtToBePassed = "";
			
			// Changes for RFC# 7000018441 CD# 2000039133 - Removed Billing Instructions
			
			// Start of changes for RFC# 7000018441 CD# 2000039133 - Changing Payment Contact from display only to dropdown selection
			var inpPaymentContact = this.getView().byId("inpPaymentContact"), inpPaymentContactVal = inpPaymentContact.getSelectedItem().getText(), 
				inpPaymentContactCodeVal = inpPaymentContact.getSelectedKey(); 
			// End of changes for RFC# 7000018441 CD# 2000039133 - Changing Payment Contact from display only to dropdown selection
			
			// To pass the Invoice Date in format YYYYMMDD
			if(dtInvoiceDate.getDateValue()){
				var invoiceDateValMonth = dtInvoiceDate.getDateValue()?dtInvoiceDate.getDateValue().getMonth()+1:"", 
					invoiceDateDt = dtInvoiceDate.getDateValue()?dtInvoiceDate.getDateValue().getDate():"";
				if(invoiceDateValMonth < 10){
					invoiceDateMonthValToBePassed = "0" + String(invoiceDateValMonth);
				}
				else{
					invoiceDateMonthValToBePassed = String(invoiceDateValMonth);
				}
				if(invoiceDateDt < 10){
					invoiceDateDtToBePassed = "0" + String(invoiceDateDt);
				}
				else{
					invoiceDateDtToBePassed = String(invoiceDateDt);
				}
				dtInvoiceDateVal = String(dtInvoiceDate.getDateValue().getFullYear()) + invoiceDateMonthValToBePassed + invoiceDateDtToBePassed;
			}
			else{
				dtInvoiceDateVal = "";
			}
			
			// Fetch the line items from the table
			var oItemsTable = this.byId("tblAccountCode"), aSelectedIndices = oItemsTable.getSelectedIndices(), aHeaderItems = [];
			if(aSelectedIndices.length === 0){
				MessageBox.error(i18n.getText("Validation.LineItems"),{});
				return;
			}
			else{
				for(var i=0; i<aSelectedIndices.length; i++){
					var sPath = this.byId("tblAccountCode").getContextByIndex(aSelectedIndices[i]).sPath, 
						oItemObj = oItemsTable.getModel("AccountingModel").getProperty(sPath);
					// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Adding Currency property
					aHeaderItems.push({
					    "ItemDesc": oItemObj.ItemDesc,
					    "CommodityDesc": oItemObj.CommodityDesc,
					    "TicDesc": oItemObj.TICDesc,
					    "Quantity": oItemObj.Quantity === "" ? "0.00" : oItemObj.Quantity,
					    "UOM": oItemObj.UOM,
					    "UnitPrice": oItemObj.UnitPrice === "" ? "0.00" : String(oItemObj.UnitPrice),
					    "NetPrice": String(oItemObj.ItemNetAmount) === "" ? "0.00" : String(oItemObj.ItemNetAmount),
					    "Currency": inpInvoiceCurrVal?inpInvoiceCurrVal:"",
					    "GlAccount": oItemObj.GLAccount,
					    "CostCenter": oItemObj.CostCenter,
					    "ProfitCenter": oItemObj.ProfitCenter,
					    "Wbs": oItemObj.WBS,
					    "TicCode": oItemObj.TIC
					});
					// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Adding Currency property
				}
			}
			// Validation for mandatory fields
			// Validation for Line items - Commodity Description, Type of Transaction & Cost Center/WBS are mandatory
			for(var j=0; j<aHeaderItems.length; j++){
				if(aHeaderItems[j].CommodityDesc === "" || aHeaderItems[j].TicDesc === "" || 
						(aHeaderItems[j].CostCenter === "" && aHeaderItems[j].Wbs === "")){
					MessageBox.error(i18n.getText("Validation.LineItemsMandatory"),{});
					return;
				}
			}
			// Company code is mandatory
			if(!inpCompanyCodeVal){
				MessageBox.error(i18n.getText("Validation.CompanyCode"),{});
				inpCompanyCode.setValueState("Error");
				inpCompanyCode.setValueStateText(i18n.getText("ValueStateText.inpCompanyCode"));
				return;
			}
			else{
				inpCompanyCode.setValueState("None");
			}
			// Vendor code is mandatory
			if(!inpVendorCodeVal){
				MessageBox.error(i18n.getText("Validation.VendorCode"),{});
				inpVendorCode.setValueState("Error");
				inpVendorCode.setValueStateText(i18n.getText("ValueStateText.inpVendorCode"));
				return;
			}
			else{
				inpVendorCode.setValueState("None");
			}
			
			// Changes for RFC# 7000018441 CD# 2000039133 - Removed Billing Instructions
			
			// Create the Payload
			oCreateData.Companycode = inpCompanyCodeVal; oCreateData.CompanycodeDesc = inpCompanyNameVal;
			oCreateData.Vendor = inpVendorCodeVal; oCreateData.VendorDesc = inpVendorNameVal;
			oCreateData.Permittedpayee = inpPermittedPayeeCodeVal; 
			oCreateData.PermittedpayeeDesc = inpPermittedPayeeNameVal.split("–").length>0 ? inpPermittedPayeeNameVal.split("–")[0].trim() : inpPermittedPayeeNameVal;
			oCreateData.TemplateDate = dtDateTemplateCompletedVal; oCreateData.ReqAlias = inpRequesterAliasVal; 
			oCreateData.ReqName = inpRequesterFullNameVal; oCreateData.ReqGin = inpRequesterGINVal; 
			oCreateData.ReqEmail = inpRequesterEmailVal; 
			// Changes for RFC# 7000018441 CD# 2000039133 - Removed Approver Details
			oCreateData.CrName = inpDefaultUserFullNameVal; oCreateData.CrEmail = inpDefaultUserEmailIdVal; 
			oCreateData.BillAddress = txtAreaBillInvoiceToVal; oCreateData.InvNumber = inpInvoiceNumVal; 
			oCreateData.InvDate = dtInvoiceDateVal; oCreateData.InvNet = inpInvoiceNetAmtVal === "" ? "0.00" : inpInvoiceNetAmtVal;
			oCreateData.InvTax = inpTaxAmtVal === "" ? "0.00" : inpTaxAmtVal;							
			oCreateData.InvGross = inpInvoiceGrossAmtVal === "" ? "0.00" : inpInvoiceGrossAmtVal;
			oCreateData.InvCurr = inpInvoiceCurrVal; 
			// Start of changes for RFC# 7000008934 CD# 2000031315 - Modified payload according to new display only Specific Billing Instructions
			// Changes for RFC# 7000018441 CD# 2000039133 - Removed Billing Instructions
			// End of changes for RFC# 7000008934 CD# 2000031315 - Modified payload according to new display only Specific Billing Instructions
			oCreateData.GenInstruct1 = inpOthrGenIns1Val; oCreateData.GenInstruct2 = inpOthrGenIns2Val; 
			oCreateData.GenInstruct3 = inpOthrGenIns3Val; oCreateData.GenInstruct4 = inpOthrGenIns4Val; 
			// Start of changes for RFC# 7000018441 CD# 2000039133 - Adding Payment field
			oCreateData.Payment = inpPaymentContactCodeVal,
			// End of changes for RFC# 7000018441 CD# 2000039133 - Adding Payment field
			oCreateData.HeaderToItem = aHeaderItems;	
			oCreateData.HeaderToReturnMsg = []; oCreateData.HeaderToForm = {
				    "FileName": "",
				    "XstringData": ""
				  }; 
			// create operation
			this.getOwnerComponent().getModel().create("/HeaderDatas", oCreateData, {
				success: function(oData, response) {
					// Generating & downloading pdf file
					var base64 = oData.HeaderToForm.XstringData, FileName = oData.HeaderToForm.FileName, 
						serviceResponse = oData.HeaderToReturnMsg.results[0].Message, a = document.createElement("a");
					a.href = "data:application/octet-stream;base64,"+base64;
					a.download = FileName+".pdf";
					a.click();
					MessageBox.success(serviceResponse);	
					that.onClear();
				},
				error: function(oError) {	
					var message = JSON.parse(oError.responseText), msgText = message.error.message.value;
					MessageBox.show(msgText, MessageBox.Icon.ERROR);
				}
			});					
		},
		// To calculate the total value for column Total based on Quantity & Unit Price in line items table
		calculateTotalPrice: function(oEvent){ 
			var InputId = oEvent.oSource.sId, InputSource = oEvent.oSource, inputControl = sap.ui.getCore().byId(InputId), 
				inputBinding = inputControl.mBindingInfos.value.parts[0], bindingModel = inputBinding.model, 
				oBindingContextObj = oEvent.oSource.getBindingContext(bindingModel).getObject(), 
				iQuantity = parseFloat(oBindingContextObj["Quantity"]), iUnitPrice = parseFloat(oBindingContextObj["UnitPrice"]);
			// Clear Total value if either of or both Quantity & Unit Price is/are cleared
			if(isNaN(iQuantity) || isNaN(iUnitPrice)){
				oBindingContextObj["ItemNetAmount"] = "";
				this.getModel(bindingModel).refresh(true);	
				this.calculateNetAmount();
				return;
			}
			else{
				// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
				var zeroDecimalFlag = this.getView().getModel("AppBaseDataModel").getProperty("/zeroDecimalFlag");
				oBindingContextObj["Quantity"] = iQuantity.toFixed(3);
				if(zeroDecimalFlag === "X"){
					var i18n = this.getResourceBundle();
					sap.m.MessageToast.show(i18n.getText("zeroDecimalCurrencyMsg"));
					oBindingContextObj["UnitPrice"] = Math.round(iUnitPrice);
					var iTotal = oBindingContextObj["Quantity"]*oBindingContextObj["UnitPrice"];
					oBindingContextObj["ItemNetAmount"] = Math.round(iTotal);
					this.calculateNetAmount();
					var invNetAmtExTaxVal = this.getView().byId("inpInvNetAmt").getValue(), 
						invNetAmtVal = this.getView().byId("inpInvoiceNetAmt").getValue(), 
						invTaxAmtVal = this.getView().byId("inpTaxAmt").getValue(), 
						invGrossAmtVal = this.getView().byId("inpInvoiceGrossAmt").getValue();
					this.getView().byId("inpInvNetAmt").setValue(Math.round(invNetAmtExTaxVal));
					this.getView().byId("inpInvoiceNetAmt").setValue(Math.round(invNetAmtVal));
					this.getView().byId("inpTaxAmt").setValue(Math.round(invTaxAmtVal));
					this.getView().byId("inpInvoiceGrossAmt").setValue(Math.round(invGrossAmtVal));
				}
				else{
					oBindingContextObj["UnitPrice"] = iUnitPrice.toFixed(2);
					var iTotal = oBindingContextObj["Quantity"]*oBindingContextObj["UnitPrice"];
					oBindingContextObj["ItemNetAmount"] = parseFloat(iTotal).toFixed(2);
					this.calculateNetAmount();
				}
				// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
				this.getModel(bindingModel).refresh(true);
			}
		},
		// To calculate net amount of all line items Total values to be displayed below the table
		calculateNetAmount: function(){							
			var accountingData = this.getView().getModel("AccountingModel").getData(), sum = 0, 
				taxAmount = this.getView().byId("inpTaxAmt").getValue();
			for(var i=0;i<accountingData.length;i++){
				if(accountingData[i].ItemNetAmount !== "")	
					sum+= parseFloat(accountingData[i].ItemNetAmount);									
			}							
			this.getView().byId("inpInvNetAmt").setValue(sum.toFixed(2));
			this.getView().byId("inpInvoiceNetAmt").setValue(sum.toFixed(2));
			if(taxAmount){
				this.getView().byId("inpInvoiceGrossAmt").setValue((parseInt(sum)+parseInt(taxAmount)).toFixed(2));
			}
			else{
				this.getView().byId("inpInvoiceGrossAmt").setValue(sum.toFixed(2));
			}
			
		},
		// Start of changes for RFC# 7000008934 CD# 2000031315 - Restricting number of digits after decimal point for Quantity, Price & Total
		// To restrict Quantity & Unit Price fields to 3 & 2 digits respectively after decimal point
		restrictDecimalDigits: function(oEvent){
			var colName = oEvent.getSource().data("colName"), i18n = this.getResourceBundle(), maxDecimalDigits;
			if(colName === i18n.getText("NonPOTblColQty")){
				maxDecimalDigits = 3;
			}
			else if(colName === i18n.getText("NonPOTblColUnitPrice")){
				maxDecimalDigits = 2;
			}
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			  maxFractionDigits: maxDecimalDigits,
			  decimalSeparator: "."
			});
			if(oEvent.getSource().getValue()){
				oEvent.getSource().setValue(oNumberFormat.format(oEvent.getSource().getValue()));
				this.calculateTotalPrice(oEvent);
			}
	    },
		// End of changes for RFC# 7000008934 CD# 2000031315 - Restricting number of digits after decimal point for Quantity, Price & Total
	    
	    // Start of changes for RFC# 7000015093 CD# 2000033080 - Adding tab to display history
	    // To get the history of created template reports
	    handleOnClickGetHistory: function(){
	    	var oCompanyCodeMultiInput = this.getView().byId("multiInput_CompanyCode"), oVendorMultiInput = this.getView().byId("multiInput_VendorCode"), 
	    		aCompCodeMultiInputTokens = oCompanyCodeMultiInput.getTokens(), aVendorMultiInputTokens = oVendorMultiInput.getTokens(), 
	    		oRequestorMultiInput = this.getView().byId("multiInput_Requester"), aRequestorMultiInputTokens = oRequestorMultiInput.getTokens(), 
	    		oTemplateReportsHistoryModel = new JSONModel(), i18n = this.getResourceBundle(), that = this, sPath = "/HistoryDatas", 
	    		templateDateFrom = this.getView().byId("historyFromDateFilter").getDateValue(), templateDateFromDt = "", templateDateFromMonth = "", 
	    		templateDateTo = this.getView().byId("historyToDateFilter").getDateValue(), templateDateToDt = "", templateDateToMonth = "",
	    		aCompCodeFilters = [], aVendorFilters = [], aRequesterFilters = [], aFilters = [], aFiltersAll = [];
	    	
	    	this.getView().setModel(oTemplateReportsHistoryModel, "templateReportsHistoryModel");
	    	// set dates as double digit if date value is less than 10
    		if(templateDateFrom.getDate()<10){
    			templateDateFromDt = "0" + String(templateDateFrom.getDate());
    		}
    		else{
    			templateDateFromDt = String(templateDateFrom.getDate());
    		}
    		if(templateDateTo.getDate()<10){
    			templateDateToDt = "0" + String(templateDateTo.getDate());
    		}
    		else{
    			templateDateToDt = String(templateDateTo.getDate());
    		}
    		// set months as double digit if month value is less than 10
    		/* Start of changes for RFC# 7000021101 CD# 2000044024 - Get History Date Issue 
    		// Adding 1 to Months in if conditions as Months start from 0 in JS and October month caused issue */
    		if((templateDateFrom.getMonth()+1)<10){
    			templateDateFromMonth = "0" + String(templateDateFrom.getMonth()+1);
    		}
    		else{
    			templateDateFromMonth = String(templateDateFrom.getMonth()+1);
    		}
    		if((templateDateTo.getMonth()+1)<10){
    			templateDateToMonth = "0" + String(templateDateTo.getMonth()+1);
    		}
    		else{
    			templateDateToMonth = String(templateDateTo.getMonth()+1);
    		}
    		/* End of changes for RFC# 7000021101 CD# 2000044024 - Get History Date Issue 
    		// Adding 1 to Months in if conditions as Months start from 0 in JS and October month caused issue */
	    		
    		var tmpltDtFromFormatted = String(templateDateFrom.getFullYear()) + String(templateDateFromMonth) + templateDateFromDt, 
	    		tmpltDtToFormatted = String(templateDateTo.getFullYear()) + String(templateDateToMonth) + templateDateToDt;
	    	
	    	// Company Code and Template dates mandatory validation
	    	if(aCompCodeMultiInputTokens.length>0 && templateDateFrom && templateDateTo){
	    		this.getView().byId("templateReportsHistory").setBusy(true);
	    		// Company Code filter parameters
		    	if(aCompCodeMultiInputTokens.length === 1){
		    		aFilters.push(new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, aCompCodeMultiInputTokens[0].getText()));
		    	}
				else if(aCompCodeMultiInputTokens.length > 1){
					for(var i=0; i<aCompCodeMultiInputTokens.length; i++){
						aCompCodeFilters.push(new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, aCompCodeMultiInputTokens[i].getText()));
					}
					aFilters.push(new sap.ui.model.Filter({
                        filters: aCompCodeFilters,
                        and: false
                    })); 
				}
		    	// Vendor filter parameters
		    	if(aVendorMultiInputTokens.length === 1){
		    		aFilters.push(new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, aVendorMultiInputTokens[0].getText()));
				}
				else if(aVendorMultiInputTokens.length > 1){
					for(var i=0; i<aVendorMultiInputTokens.length; i++){
						aVendorFilters.push(new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, aVendorMultiInputTokens[i].getText()));
					}
					aFilters.push(new sap.ui.model.Filter({
                        filters: aVendorFilters,
                        and: false
                    }));
				}
		    	// Requester filter parameters
				if(aRequestorMultiInputTokens.length === 1){
					aFilters.push(new sap.ui.model.Filter("ReqGin", sap.ui.model.FilterOperator.EQ, aRequestorMultiInputTokens[0].getKey()));
				}
				else if(aRequestorMultiInputTokens.length > 1){
					for(var i=0; i<aRequestorMultiInputTokens.length; i++){
						aRequesterFilters.push(new sap.ui.model.Filter("ReqGin", sap.ui.model.FilterOperator.EQ, aRequestorMultiInputTokens[i].getKey()));
					} 
					aFilters.push(new sap.ui.model.Filter({
                        filters: aRequesterFilters,
                        and: false
                    }));
				}
                
				// Template Date From and Template Date To parameters
				aFilters.push(new sap.ui.model.Filter("TemplateDateFrom", sap.ui.model.FilterOperator.EQ, tmpltDtFromFormatted));
				aFilters.push(new sap.ui.model.Filter("TemplateDateTo", sap.ui.model.FilterOperator.EQ, tmpltDtToFormatted));
				
				aFiltersAll.push(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
				
		    	oCompanyCodeMultiInput.setValueState("None");
		    	this.getView().byId("historyFromDateFilter").setValueState("None");
		    	this.getView().byId("historyToDateFilter").setValueState("None");
		    	
		    	that.getOwnerComponent().getModel().read(sPath, {
					async: true,
					filters: aFiltersAll,
					success: function(oData, oResponse) {
						that.getView().byId("templateReportsHistory").setBusy(false);
						if(oData.results.length>0){
							oTemplateReportsHistoryModel.setData({"templateReports": oData.results});
							oTemplateReportsHistoryModel.refresh(true);
						}
						else{
							sap.m.MessageToast.show(i18n.getText("GetHistoryResponseMsg"));
						}
					},
					error: function(oError){
						that.getView().byId("templateReportsHistory").setBusy(false);
						var message = JSON.parse(oError.responseText), msgText = message.error.message.value;
						sap.m.MessageBox.show(msgText, MessageBox.Icon.ERROR);
					}
				});
	    	}
	    	else{
	    		oCompanyCodeMultiInput.setValueState("Error");
	    		oCompanyCodeMultiInput.setValueStateText(i18n.getText("history.valueStateText.compCodeMandatory"));
	    		
	    		templateDateFrom.setValueState("Error");
	    		templateDateFrom.setValueStateText(i18n.getText("history.valueStateText.templateDateFromMandatory"));
	    		
	    		templateDateTo.setValueState("Error");
	    		templateDateTo.setValueStateText(i18n.getText("history.valueStateText.templateDateToMandatory"));
	    	}
	    },
	    // Function to handle Template Creation From Date changes as per requirements
	    handleTmpltCrtFromDateChange: function(oEvent){
			var oCreationDateFrom = oEvent.getSource(), oCreationDateTo = this.byId("historyToDateFilter"), 
				differenceInTime = oCreationDateTo.getDateValue().getTime() - oCreationDateFrom.getDateValue().getTime(), 
				differenceInDays = parseInt(differenceInTime / (1000 * 3600 * 24));
			if((new Date(oCreationDateFrom.getDateValue()).getTime()) > (new Date(oCreationDateTo.getDateValue()).getTime())){
				// set Template Creation To Date to 1 month later from selected Template Creation From Date
				oCreationDateTo.setDateValue(new Date(
						oCreationDateFrom.getDateValue().getFullYear(), 
						oCreationDateFrom.getDateValue().getMonth()+1, 
						oCreationDateFrom.getDateValue().getDate()));
			}
			else if(differenceInDays > 30){
				// set Template Creation To Date to 1 month later from selected Template Creation From Date
				oCreationDateTo.setDateValue(new Date(
						oCreationDateFrom.getDateValue().getFullYear(), 
						oCreationDateFrom.getDateValue().getMonth()+1, 
						oCreationDateFrom.getDateValue().getDate()));
			}
		},
		// Function to handle Template Creation To Date changes as per requirements
		handleTmpltCrtToDateChange: function(oEvent){
			var oCreationDateFrom = this.byId("historyFromDateFilter"), oCreationDateTo = oEvent.getSource(), 
				differenceInTime = oCreationDateTo.getDateValue().getTime() - oCreationDateFrom.getDateValue().getTime(), 
				differenceInDays = parseInt(differenceInTime / (1000 * 3600 * 24));
			if((new Date(oCreationDateFrom.getDateValue()).getTime()) > (new Date(oCreationDateTo.getDateValue()).getTime())){
				// set Template Creation From Date to 1 month prior from selected Template Creation To Date
				oCreationDateFrom.setDateValue(new Date(
						oCreationDateTo.getDateValue().getFullYear(), 
						oCreationDateTo.getDateValue().getMonth()-1, 
						oCreationDateTo.getDateValue().getDate()));
			}
			else if(differenceInDays > 30){
				// set Template Creation From Date to 1 month prior from selected Template Creation To Date
				oCreationDateFrom.setDateValue(new Date(
						oCreationDateTo.getDateValue().getFullYear(), 
						oCreationDateTo.getDateValue().getMonth()-1, 
						oCreationDateTo.getDateValue().getDate()));
			}
		},
	    // End of changes for RFC# 7000015093 CD# 2000033080 - Adding tab to display history
	    
	    // Start of changes for RFC# 7000015093 CD# 2000033080 - URN history Copy functionality
	    // To get the data of clicked URN and copy in the input fields of template form
	    handleOnClickURN: function(oEvent){
	    	var that = this, selectedURN = oEvent.getSource().getText(), sPath = "/HeaderDatas", filter = [], 
	    		oSelectedURNDataModel = new JSONModel(), taxAmount = this.getView().byId("inpTaxAmt").getValue();
	    	this.getView().setModel(oSelectedURNDataModel, "SelectedURNDataModel");
	    	filter.push(new sap.ui.model.Filter("Urn", sap.ui.model.FilterOperator.EQ, selectedURN));
	    	that.getOwnerComponent().getModel().read(sPath, {
				async: true,
				filters: filter,
				urlParameters: {
				    "$expand": "HeaderToItem"
				  },
				success: function(oData, oResponse) {
					if(oData.results.length>0){
						oSelectedURNDataModel.setData({"URNData": oData.results});
						// Set Company Code and name
						that.getView().byId("inpCompanyCode").setValue(oSelectedURNDataModel.getData().URNData[0].Companycode);
						that.getView().byId("inpCompanyName").setValue(oSelectedURNDataModel.getData().URNData[0].CompanycodeDesc);
				    	// Set Vendor Code
						that.getView().byId("inpVendorCode").setValue(oSelectedURNDataModel.getData().URNData[0].Vendor);
						that.getView().byId("inpVendorCode").setEnabled(true);
				    	// Set Vendor Name
						that.getView().byId("inpVendorName").setValue(oSelectedURNDataModel.getData().URNData[0].VendorDesc);
				    	// Set Permitted Payee Code
						that.getView().byId("inpPermittedPayeeCode").setValue(oSelectedURNDataModel.getData().URNData[0].Permittedpayee);
						that.getView().byId("inpPermittedPayeeCode").setEnabled(true);
				    	// Set Permitted Payee Name
						that.getView().byId("inpPermittedPayeeName").setValue(oSelectedURNDataModel.getData().URNData[0].PermittedpayeeDesc);
				    	
				    	// Set Requester details
						if(window["sap-ushell-config"]){
							var shellConfig = window["sap-ushell-config"].services.Container.adapter.config, sRequestorEmail = shellConfig.email;
						}
						// Set Requester Alias
				    	if(oSelectedURNDataModel.getData().URNData[0].ReqAlias){				
				    		that.getView().byId("inpRequesterAlias").setValue(oSelectedURNDataModel.getData().URNData[0].ReqAlias);
				    	}
				    	else{
				    		that.getView().byId("inpRequesterAlias").setValue(sRequestorEmail.split("@")[0]);
				    	}
				    	// Set Requester Name
				    	if(oSelectedURNDataModel.getData().URNData[0].ReqName){
				    		that.getView().byId("inpRequesterFullName").setValue(oSelectedURNDataModel.getData().URNData[0].ReqName);
				    	}
				    	else{
				    		that.getView().byId("inpRequesterFullName").setValue(shellConfig.fullName);
				    	}
				    	// Set Requester GIN
				    	if(oSelectedURNDataModel.getData().URNData[0].ReqGin){
				    		that.getView().byId("inpRequesterGIN").setValue(oSelectedURNDataModel.getData().URNData[0].ReqGin);	
				    	}
				    	else{
				    		that.getView().byId("inpRequesterGIN").setValue(shellConfig.id);
				    	}
				    	// Set Requester Email
						if(oSelectedURNDataModel.getData().URNData[0].ReqEmail){
							that.getView().byId("inpRequesterEmail").setValue(oSelectedURNDataModel.getData().URNData[0].ReqEmail);
						}
						else{
							that.getView().byId("inpRequesterEmail").setValue(sRequestorEmail);
						}
				    	
						// Changes for RFC# 7000018441 CD# 2000039133 - Removed Approver Details
				    	
				    	// Set Line items table data
				    	var oTable = that.byId("tblAccountCode"), oModel = oTable.getModel("AccountingModel"), invTotalAmount = 0, 
				    		initialAccountingData = [], oLineItemsData = oSelectedURNDataModel.getData().URNData[0].HeaderToItem.results;
						if(oLineItemsData.length>0){
							for(var i=0; i<oLineItemsData.length; i++){
								var oLineItem = {
										ItemDesc : oLineItemsData[i].ItemDesc, 
										CommodityDesc : oLineItemsData[i].CommodityDesc, 
										TICDesc : oLineItemsData[i].TicDesc, 
										Quantity : oLineItemsData[i].Quantity,  
										UOM : oLineItemsData[i].UOM,
										UnitPrice : oLineItemsData[i].UnitPrice, 
										ItemNetAmount : oLineItemsData[i].NetPrice, 
										GLAccount : oLineItemsData[i].GlAccount, 
										CostCenter : oLineItemsData[i].CostCenter, 
										ProfitCenter : oLineItemsData[i].ProfitCenter, 
										WBS : oLineItemsData[i].Wbs, 
										TIC : oLineItemsData[i].TicCode, 
										WBSEnable : oLineItemsData[i].CostCenter?false:true, 
										CostCenterEnable : oLineItemsData[i].Wbs?false:true, 
										editable : true, 
										newItem : true, 
										removeItem : false
								}
								invTotalAmount+= parseInt(oLineItemsData[i].NetPrice);
								initialAccountingData.push(oLineItem);
							}
							oModel.setData(initialAccountingData);
							oModel.refresh(true);
							oTable.clearSelection(true);
							that.byId("inpInvNetAmt").setValue(invTotalAmount);
							that.byId("inpInvoiceNetAmt").setValue(invTotalAmount);
							if(taxAmount){
								that.byId("inpInvoiceGrossAmt").setValue(parseInt(invTotalAmount)+parseInt(taxAmount));
							}
							else{
								that.byId("inpInvoiceGrossAmt").setValue(invTotalAmount);
							}
						}	
				    	
				    	// Set billing details
						that.getView().byId("txtAreaBillInvoiceTo").setValue(oSelectedURNDataModel.getData().URNData[0].BillAddress);
						that.getView().byId("inpBillIns1").setValue(oSelectedURNDataModel.getData().URNData[0].BillInstruct1);
				    	// Set invoice details
						that.getView().byId("inpInvoiceNum").setValue(oSelectedURNDataModel.getData().URNData[0].InvNumber);
						if(oSelectedURNDataModel.getData().URNData[0].InvDate){
							var invoiveDate = new Date(oSelectedURNDataModel.getData().URNData[0].InvDate.substr(0,4), 
									oSelectedURNDataModel.getData().URNData[0].InvDate.substr(4,2)-1, 
									oSelectedURNDataModel.getData().URNData[0].InvDate.substr(6,2))
							that.getView().byId("dtInvoiceDate").setDateValue(invoiveDate);
						}
						else{
							that.getView().byId("dtInvoiceDate").setDateValue("");
						}
						
						that.getView().byId("inpInvoiceNetAmt").setValue(oSelectedURNDataModel.getData().URNData[0].InvNet);
						that.getView().byId("inpTaxAmt").setValue(oSelectedURNDataModel.getData().URNData[0].InvTax);
						that.getView().byId("inpInvoiceGrossAmt").setValue(oSelectedURNDataModel.getData().URNData[0].InvGross);
						that.getView().byId("inpInvoiceCurr").setValue(oSelectedURNDataModel.getData().URNData[0].InvCurr);
				    	// Set other general instructions
						that.getView().byId("inpOthrGenIns1").setValue(oSelectedURNDataModel.getData().URNData[0].GenInstruct1);
						that.getView().byId("inpOthrGenIns2").setValue(oSelectedURNDataModel.getData().URNData[0].GenInstruct2);
						that.getView().byId("inpOthrGenIns3").setValue(oSelectedURNDataModel.getData().URNData[0].GenInstruct3);
						that.getView().byId("inpOthrGenIns4").setValue(oSelectedURNDataModel.getData().URNData[0].GenInstruct4);
					}
				},
				error: function(oError){
					var message = JSON.parse(oError.responseText), msgText = message.error.message.value;
					MessageBox.show(msgText, MessageBox.Icon.ERROR);
				}
			});
	    },
	    // To always show Invoice Gross Amount as sum of Invoice Net Amount and Tax Amount if Invoice Net Amount is changed
	    handleInvoiceNetAmountChange: function(oEvent){
	    	var netAmount = oEvent.getSource().getValue(), taxAmount = this.getView().byId("inpTaxAmt").getValue(), grossAmount;
	    	// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
	    	var zeroDecimalFlag = this.getView().getModel("AppBaseDataModel").getProperty("/zeroDecimalFlag");
			if(!Number.isInteger(netAmount) && zeroDecimalFlag === "X"){
				var i18n = this.getResourceBundle();
				sap.m.MessageToast.show(i18n.getText("zeroDecimalCurrencyMsg"));
				this.getView().byId("inpInvoiceNetAmt").setValue(Math.round(netAmount));
				netAmount = this.getView().byId("inpInvoiceNetAmt").getValue();
				if(taxAmount){
		    		grossAmount = parseInt(netAmount) + parseInt(taxAmount);
		    	}
		    	else{
		    		grossAmount = parseInt(netAmount);
		    	}
			}
			// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies
			else{
		    	// Start of changes for RFC# 7000015093 CD# 2000033080 : Included decimals in summation, hence used parseFloat
		    	if(taxAmount){
		    		grossAmount = (parseFloat(netAmount) + parseFloat(taxAmount)).toFixed(2);
		    	}
		    	else{
		    		grossAmount = (parseFloat(netAmount)).toFixed(2);
		    	}
		    	// End of changes for RFC# 7000015093 CD# 2000033080 : Included decimals in summation, hence used parseFloat
			}
			this.getView().byId("inpInvoiceGrossAmt").setValue(grossAmount);
	    },
	    // To always show Invoice Gross Amount as sum of Invoice Net Amount and Tax Amount if Tax Amount is changed
	    handleTaxAmountChange: function(oEvent){
	    	var taxAmount = oEvent.getSource().getValue(), netAmount = this.getView().byId("inpInvoiceNetAmt").getValue(), grossAmount;
	    	// Start of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies 
	    	var zeroDecimalFlag = this.getView().getModel("AppBaseDataModel").getProperty("/zeroDecimalFlag");
			if(!Number.isInteger(taxAmount) && zeroDecimalFlag === "X"){
				var i18n = this.getResourceBundle();
				sap.m.MessageToast.show(i18n.getText("zeroDecimalCurrencyMsg"));
				this.getView().byId("inpTaxAmt").setValue(Math.round(taxAmount));
				taxAmount = this.getView().byId("inpTaxAmt").getValue();
				if(netAmount){
		    		grossAmount = parseInt(netAmount) + parseInt(taxAmount);
		    	}
		    	else{
		    		grossAmount = parseInt(netAmount);
		    	}
			}
			// End of changes for RFC# 7000015093 CD# 2000033080 Phase 2 - Handling ZeroDecimal currencies
	    	else{
		    	// Start of changes for RFC# 7000015093 CD# 2000033080 : Included decimals in summation, hence used parseFloat
		    	if(netAmount){
		    		grossAmount = (parseFloat(netAmount) + parseFloat(taxAmount)).toFixed(2);
		    	}
		    	else{
		    		grossAmount = (parseFloat(netAmount)).toFixed(2);
		    	}
		    	// End of changes for RFC# 7000015093 CD# 2000033080 : Included decimals in summation, hence used parseFloat
	    	}
			this.getView().byId("inpInvoiceGrossAmt").setValue(grossAmount);
	    },
	    // End of changes for RFC# 7000015093 CD# 2000033080 - URN history Copy functionality
	    
	    // Start of changes for RFC# 7000015093 CD# 2000033080 - Adding Clear button to clear all the input fields at once
	    // To clear all the input fields on the screen
	    onClear: function(){
	    	// Clear Company Code & Name
	    	this.getView().byId("inpCompanyCode").setValue("");
	    	this.getView().byId("inpCompanyName").setValue("");
	    	// Clear & disable Vendor Code
	    	this.getView().byId("inpVendorCode").setValue("");
	    	this.getView().byId("inpVendorCode").setEnabled(false);
	    	// Clear & disable Vendor Name
	    	this.getView().byId("inpVendorName").setValue("");
	    	this.getView().byId("inpVendorName").setEnabled(false);
	    	// Clear & disable Permitted Payee Code
	    	this.getView().byId("inpPermittedPayeeCode").setValue("");
	    	this.getView().byId("inpPermittedPayeeCode").setEnabled(false);
	    	// Clear & disable Permitted Payee Name
	    	this.getView().byId("inpPermittedPayeeName").setValue("");
	    	this.getView().byId("inpPermittedPayeeName").setEnabled(false);
	    	// Clear & reset Requester details to default
	    	if(window["sap-ushell-config"]){				
				var shellConfig = window["sap-ushell-config"].services.Container.adapter.config, sRequestorEmail = shellConfig.email;
				this.getView().byId("inpRequesterAlias").setValue(sRequestorEmail.split("@")[0]);
				this.getView().byId("inpRequesterFullName").setValue(shellConfig.fullName);
				this.getView().byId("inpRequesterGIN").setValue(shellConfig.id);								
				this.getView().byId("inpRequesterEmail").setValue(sRequestorEmail);
				// Reset Recipient of the Template to default 
		    	this.getView().byId("inpRecpOfTmpltEmail1").setValue(sRequestorEmail);
			}
	    	else{
	    		this.getView().byId("inpRequesterAlias").setValue("");
				this.getView().byId("inpRequesterFullName").setValue("");
				this.getView().byId("inpRequesterGIN").setValue("");								
				this.getView().byId("inpRequesterEmail").setValue("");
				this.getView().byId("inpRecpOfTmpltEmail1").setValue("");
	    	}
	    	
	    	// Changes for RFC# 7000018441 CD# 2000039133 - Removed Approver Details
	    	
	    	// Clear items table
	    	var oTable = this.byId("tblAccountCode"), oModel = oTable.getModel("AccountingModel"); 
			if(oModel.getData().length > 0){
				var tableRowData = oModel.getData()[0];
				if(tableRowData.ItemDesc !== '' || tableRowData.CommodityDesc !== '' || tableRowData.TICDesc !== '' || 
					tableRowData.Quantity !== '' || tableRowData.UOM !== '' || tableRowData.UnitPrice !== '' || 
					tableRowData.ItemNetAmount !== '' || tableRowData.sGLAccount !== '' || tableRowData.CostCenter !== '' || 
					tableRowData.ProfitCenter !== '' || tableRowData.WBS !== '' || tableRowData.TIC !== ''){
					var initialAccountingData = oModel.getData();
					var initialBlankLineItem = {
							ItemDesc : '', CommodityDesc : '', TICDesc : '', Quantity : '',  UOM : '',UnitPrice : '', ItemNetAmount : '', sGLAccount : '', 
							CostCenter : '', ProfitCenter : '', WBS : '', TIC : '', WBSEnable : true, CostCenterEnable : true, editable : true, 
							newItem : true, removeItem : false
					};
					initialAccountingData.splice(0, oModel.getData().length, initialBlankLineItem);
					oModel.setData(initialAccountingData);
					oModel.refresh(true);
					oTable.clearSelection(true);
				}
				this.byId("inpInvNetAmt").setValue("");
				this.byId("inpInvoiceNetAmt").setValue("");
				this.byId("inpInvoiceGrossAmt").setValue("");
			}
			// Clear billing details
	    	this.getView().byId("txtAreaBillInvoiceTo").setValue("");
	    	// Clear invoice details
	    	this.getView().byId("inpInvoiceNum").setValue("");
	    	this.getView().byId("dtInvoiceDate").setDateValue(new Date({}));
	    	this.getView().byId("inpInvoiceNetAmt").setValue("");
	    	this.getView().byId("inpTaxAmt").setValue("");
	    	this.getView().byId("inpInvoiceGrossAmt").setValue("");
	    	this.getView().byId("inpInvoiceCurr").setValue("");
	    	// Clear other general instructions
	    	this.getView().byId("inpOthrGenIns1").setValue("");
	    	this.getView().byId("inpOthrGenIns2").setValue("");
	    	this.getView().byId("inpOthrGenIns3").setValue("");
	    	this.getView().byId("inpOthrGenIns4").setValue("");
	    }
	    // End of changes for RFC# 7000015093 CD# 2000033080 - Adding Clear button to clear all the input fields at once
	});
});