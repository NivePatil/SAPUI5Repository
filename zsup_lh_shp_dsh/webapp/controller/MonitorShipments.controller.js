sap.ui.define(
    [ "com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/controller/BaseController",
            "sap/ui/model/json/JSONModel",
            "com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/util/formatter",
            "sap/ui/table/TablePersoController",
            "sap/ui/core/util/Export",
            "sap/ui/core/util/ExportTypeCSV",
            "com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/util/Helper",
            "sap/m/Token",
            "sap/m/MessageBox",
            "sap/ui/model/Filter"
    ],
    function(BaseController, JSONModel, formatter, TablePersoController, Export, ExportTypeCSV, Helper,Token,MessageBox,Filter) {
        "use strict";

        return BaseController.extend("com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.controller.MonitorShipments",
                        {

            formatter : formatter,
            
            // ---------------------------------------------
            // INITIALIZATION
            // ---------------------------------------------
             
            
            onInit : function() {
                
                this.monShipArr = [];
                this.copyActtoPlannedDateDep = 0;
                this.copyActtoPlannedDate = 0;
                this.copyPldArrToActArrDate =0;
                
                var headerTableModel = new JSONModel({
                    HeaderTableBusy:false,
                    //Start of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
                    fromDateInSelection: new Date(),
                    toDateInSelection : new Date()
                    //End of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
                });
                
                this.setModel(headerTableModel,"headerTableModel");
                //this.getMainModel().setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                // model used to save invoice data before update
                var tempInvoiceModel = new JSONModel([]);
                this.setModel(tempInvoiceModel,"tempInvoiceModel");
                //create counters model
                
                var counterData = {
                        cnt_total_shipment : 0,
                        cnt_shipment_lh_pending : 0,
                        cnt_shipment_lh_under_review : 0,
                        cnt_shipment_lh_approved : 0
                    };
                    var shipCountersModel = new JSONModel(counterData);
                    this.setModel(shipCountersModel,"shipCountersModel");
                    this.getModel("shipCountersModel").refresh();
                    
                    //HLS shipment model for Inbound and Outbound created for download
                    var HlsInbOutbModel = new JSONModel([]);
                    this.setModel(HlsInbOutbModel,"HlsInbOutbModel");
                    
                    
                    
                //Success call of read request entityset - ShipmentSet
                this.getMainModel().attachEvent("requestCompleted", function (oEvent) {
                    var oParams = oEvent.getParameters();
                    
                    var index = oParams.url.indexOf("ShipmentSet");
                //	if(oParams.url.includes("ShipmentSet")){
                    if(index !== -1){
                    if(oParams.response.headers.counters === "X"){ //Counters are returned by the service
                        
                        this.getModel("shipCountersModel").setProperty("/cnt_total_shipment",oParams.response.headers.cnt_total_shipment);
                        this.getModel("shipCountersModel").setProperty("/cnt_shipment_lh_pending",oParams.response.headers.cnt_shipment_ie_pending);
                        this.getModel("shipCountersModel").setProperty("/cnt_shipment_lh_under_review",oParams.response.headers.cnt_shipment_ie_under_review);
                        this.getModel("shipCountersModel").setProperty("/cnt_shipment_lh_approved",oParams.response.headers.cnt_shipment_ie_approved);
                        
                        this.getModel("shipCountersModel").refresh();
                    }
                    
                    this.getModel("headerTableModel").setProperty("/HeaderTableBusy",false);
                    
                    if(oParams.url.indexOf("$count") !== -1){
                        this.getModel("headerTableModel").setProperty("/totalCount",parseInt(oParams.response.responseText));
                    }
                    
                    }
                    
                }, this);
                
                var oTableMonitorShipment = this.getView().byId("TblMonitorShipments");
                //open Table perso dialog
                this.oTblPersContMonShip = new TablePersoController({
                    table : oTableMonitorShipment
                });	
                
                
                var valueHelpModel = new JSONModel([]);
                this.setModel(valueHelpModel, "valueHelpModel");
                
                //Start of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button : IE Pre Clr text Model
                var ShipmentIETextModel = new JSONModel([]);
                this.setModel(ShipmentIETextModel, "ShipmentIETextModel");
                //End of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button : IE Pre Clr text Model

                
                //IE Preclearance f4 ValueHelpModel
                var IEVHModel = new JSONModel([]);
                this.setModel(IEVHModel, "IEVHModel");
                
                //forwarding agent f4 ValueHelpModel
                var FFVHModel = new JSONModel([]);
                this.setModel(FFVHModel, "FFVHModel");
                
                //Shipment Status F4 value help model
                var SHStatusModel = new JSONModel([]);
                this.setModel(SHStatusModel, "SHStatusModel");
                
                //Ship To Country F4 value help model
                var SHCountryModel = new JSONModel([]);
                this.setModel(SHCountryModel, "SHCountryModel");
                //ship from country model
                var SHFromCountryModel = new JSONModel([]);
                this.setModel(SHFromCountryModel, "SHFromCountryModel");
                //plant f4 value model
                var PlantModel = new JSONModel([]);
                this.setModel(PlantModel, "PlantModel");
                //cost model to display shipmnt costs
                var costModel = new JSONModel();
                this.setModel(costModel,"costModel");
                //invoice models to display all invoices
                var InvoiceModel = new JSONModel();
                this.setModel(InvoiceModel,"InvoiceModel");
//							this.dateValidation();
                //start of changes CD #2000025529: variant management for table
                
                // Personalization from ushell service to persist the settings
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
                    this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
                    var oPersId = {
                                    container: "LhTablePersonalization", 
                                    item: "TblMonitorShipments" // id of table        
                                };
                    // define scope 
                    var oScope = {
                                    keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
                                    writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
                                    clientStorageAllowed: true
                                };
                    // Get a Personalizer
                    var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
                    this.oPersonalizationService.getContainer("LhTablePersonalization", oScope, oComponent).fail(function() {}).done(function(oContainer) {
                            this.oContainerLhTable = oContainer;
                            this.oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(this.oContainerLhTable);
                            // get variant set which is stored in back end
                            this.oLhTableVariantSet = this.oVariantSetAdapter.getVariantSet("TblMonitorShipmentsSet");
                            if (!this.oLhTableVariantSet) { //if not in back end, then create one
                                this.oLhTableVariantSet = this.oVariantSetAdapter.addVariantSet("TblMonitorShipmentsSet");
                            }
                            // array to store the existing variants
                            var aVariants = [];
                            // now get the existing variants from the backend to show as list
                            for (var key in this.oLhTableVariantSet.getVariantNamesAndKeys()) {
                                //if (this.oLhTableVariantSet.getVariantNamesAndKeys().hasOwnProperty(key)) {
                                    var oVariantItemObject = {};
                                    oVariantItemObject.Key = this.oLhTableVariantSet.getVariantNamesAndKeys()[key];
                                    oVariantItemObject.Name = key;
                                    aVariants.push(oVariantItemObject);
                                //}
                            }
                            // create JSON model and attach to the variant management UI control
                            var oLhTableVariantsModel = new JSONModel();
                             oLhTableVariantsModel.setData({"LhTableVariants": aVariants});
                            this.getOwnerComponent().setModel(oLhTableVariantsModel, "LhTableVariantsModel");
                            // enable save button
                            var oVariantMgmtControlLhTbl = this.getView().byId("LhVariantManagement");
                            /*oVariantMgmtControlLhTbl.oVariantSave.onAfterRendering = function(){
                                this.setEnabled(true);
                            };*/
                            // set custom variant selected by user as default
                            if(this.oLhTableVariantSet._oVariantSetData.currentVariant !== null){
                                oVariantMgmtControlLhTbl.setDefaultVariantKey(this.oLhTableVariantSet._oVariantSetData.currentVariant);
                            }
                    }.bind(this));
                    // create table perso controller
                    this.oLhTablePersoService = new TablePersoController({
                        table: this.getView().byId("TblMonitorShipments"),
                        persoService: oPersonalizer
                    });
                    }
//							end of changes CD #2000025529: variant management for table
                
//							start of variant for selection screen
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {

                    var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
                    this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
                    var oPersId = {
                            container: "TablePersonalisation", //any
                            item: "DemoTableUI"                //any- I have used the table name 
                            };
                    // define scope 
                    var oScope = {
                            keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
                            writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
                            clientStorageAllowed: true
                                };
                    // Get a Personalizer
         
                    var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
                    this.oPersonalizationService.getContainer("TablePersonalisation", oScope, oComponent)
                        .fail(function() {})
                        .done(function(oContainer) {
                            this.oContainer = oContainer;
                            this.oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(this.oContainer);
                            // get variant set which is stored in backend
                                        this.oVariantSet = this.oVariantSetAdapter.getVariantSet("DemoTableUISet");
                                         
                            if (!this.oVariantSet) { //if not in backend, then create one
                                this.oVariantSet = this.oVariantSetAdapter.addVariantSet("DemoTableUISet");
                                        }
                            
                            
                                        // array to store the existing variants
                                      var  Variants = [];
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
                                        if(VariantsScreen !== undefined){
                                        
                                      var VariantsModel = new JSONModel([]);

                                      this.getView().byId("Variants").setModel(VariantsModel,"VariantsModel");
                                      this.getView().byId("Variants").getModel("VariantsModel").setData(Variants);
                                      
                                    // enable save button
                                        
                                        /*VariantsScreen.oVariantSave.onAfterRendering = function(){
                                            this.setEnabled(true);
                                        };*/
                                        // set custom variant selected by user as default
                                        if(this.oVariantSet._oVariantSetData.currentVariant !== null){
                                            VariantsScreen.setDefaultVariantKey(this.oVariantSet._oVariantSetData.currentVariant);
                                        }
                                        }
                        
                        }.bind(this));

                            }
//							end of variant for selection screen
            }, 
            //start of changes CD #2000025529: variant management selection screen methods
        onSave: function(oEvent) {
                                // get variant parameters:
        var VariantParam = oEvent.getParameters();
                         
        var shipObj = { };
         
        var FwdAgent = this.getView().byId("id_FreightForwarder").getTokens();
        var aFwd=[];
        if(FwdAgent.length){
            for(var i=0; i<FwdAgent.length; i++){
                aFwd.push([FwdAgent[i].getProperty("key"),FwdAgent[i].getProperty("text")])
                            }	
                            shipObj.freightForwardObj = aFwd;
        }
    
        var sHType = this.getView().byId("id_SHType").getSelectedKey();
    //	   shipObj.ShipTypeObj.push(sHType);
           shipObj.ShipTypeObj=sHType;
           
            var statusArr = this.getView().byId("id_SHStatus").getTokens();
             var aStastus = [];
            if(statusArr.length){
             for(var i=0; i<statusArr.length; i++){
             aStastus.push([statusArr[i].getProperty("key"),statusArr[i].getProperty("text")]);
               }
               shipObj.ShipStatusObj = aStastus;
            }
            
             var iEPreClrArr = this.getView().byId("id_IEPreClearence").getTokens();
             var aIEpre = [];
            if(iEPreClrArr.length){
             for(var i=0; i<iEPreClrArr.length; i++){
             aIEpre.push([iEPreClrArr[i].getProperty("key"),iEPreClrArr[i].getProperty("text")]);
               }	
                shipObj.IEStatusObj = aIEpre;
            }
            
             var shipToCountryArr = this.getView().byId("id_ShipToCountry").getTokens();
             var aShipTo = [];
            if(shipToCountryArr.length){
              for(var i=0; i<shipToCountryArr.length; i++){
              aShipTo.push([shipToCountryArr[i].getProperty("key"),shipToCountryArr[i].getProperty("text")]);
               }
                shipObj.ShipToCountryObj= aShipTo;	
            }
            
            var shipFromCountryArr = this.getView().byId("id_ShipFromCountry").getTokens();
            var aShipFrom = [];
            if(shipFromCountryArr.length){
             for(var i=0; i<shipFromCountryArr.length; i++){
                  aShipFrom.push([shipFromCountryArr[i].getProperty("key"),shipFromCountryArr[i].getProperty("text")]);
               }
                shipObj.ShipFromCountryObj = aShipFrom;	
            }
            
            var plantArr = this.getView().byId("id_Plant").getTokens();
            var aPlant = [];
            if(plantArr.length){
             for(var i=0; i<plantArr.length; i++){
              aPlant.push([plantArr[i].getProperty("key"),plantArr[i].getProperty("text")]); 
               }
                shipObj.PlantObj = aPlant;	
            } 
                
             var shipmentNoFrom = this.getView().byId("id_ShipmentNo").getValue();
             shipObj.ShipNoFromObj = shipmentNoFrom;	
             
            var shipmentNoTo = this.getView().byId("id_ShipmentNo2").getValue();
             shipObj.ShipNotoObj = shipmentNoTo;	
           
             shipObj.ShipCrtDtFromObj = this.getView().byId("id_CreationDateFrom").getValue();
             
             shipObj.ShipCrtDtToObj = this.getView().byId("id_CreationDateFrom").getValue();;
             
             var openSHOnly = this.getView().byId("chkBoxId_OpenSHOnly").getSelected();	
             
             //Start of changes for GAP#DIS-G-54784
             var directSalesOnly = this.getView().byId("chkBoxId_DirectSalesOnly").getSelected();	
             //End of changes for GAP#DIS-G-54784
             shipObj.directSalesOnly = directSalesOnly; 
             var i18n = this.getResourceBundle();
    
            //end of object and array creation
            
              
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
                    this.oVariant.setItemValue("ColumnsVal",JSON.stringify(shipObj));
                    if (VariantParam.def === true) {
                        this.oVariantSet.setCurrentVariantKey(this.oVariant.getVariantKey());
                    }
                    
                    
                    this.oContainer.save().done(function() {
                        // Tell the user that the personalization data was saved
                        sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
                    }.bind(this));
                }
    //        }
            },
        onSelect: function(oEvent) {
             
            var selectedKey = oEvent.getParameters().key;
            if(selectedKey === "*standard*"){
                // disable save button
                var selectedVariant = "Standard";
                var VariantsScreen = this.getView().byId("Variants");
                /*VariantsScreen.oVariantSave.onAfterRendering = function(){
                    this.setEnabled(false);
                };*/
            }else{
                for (var i = 0; i < oEvent.getSource().getVariantItems().length; i++) {
                     if (oEvent.getSource().getVariantItems()[i].getProperty("key") === selectedKey) {
                        var selectedVariant = oEvent.getSource().getVariantItems()[i].getProperty("text");
                        //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                        this.selectedVariant = selectedVariant;
                       // End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                        break;
                     }
                }
            }
        
         this._setSelectedVariantToSelectionScreen(selectedVariant);
        
        },
    
        _setSelectedVariantToSelectionScreen: function(oSelectedVariant) {
            var oToken;
            if (oSelectedVariant) {
                    if(oSelectedVariant === "Standard"){
                        this.getView().byId("id_FreightForwarder").removeAllTokens();
                        this.getView().byId("id_SHStatus").removeAllTokens();
                        this.getView().byId("id_IEPreClearence").removeAllTokens();
                        this.getView().byId("id_ShipToCountry").removeAllTokens();
                        this.getView().byId("id_ShipFromCountry").removeAllTokens();
                        this.getView().byId("id_Plant").removeAllTokens();
                        
                        this.byId("id_SHStatus").setTokens([new Token({text: "Planned", key: "0"}),new Token({text: "Planning completed", key: "1"})]);
                        //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                        this.getView().byId("chkBoxId_DirectSalesOnly").setSelected(false);
                        this.getView().byId("id_SHType").setSelectedKey("Z005");
                        this.getView().byId("chkBoxId_OpenSHOnly").setSelected(true);
                        //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                    }
                    else{
                var sVariant = this.oVariantSet.getVariant(this.oVariantSet.getVariantKeyByName(oSelectedVariant));
                var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));
                
                // fill fields according to the saved variant
                
                this.getView().byId("id_SHType").setSelectedKey(aColumns.ShipTypeObj);
                
                if(!(aColumns.freightForwardObj ==undefined) && !aColumns.freightForwardObj == 0){
                var	aTokens = [];
                for(var i=0; i<aColumns.freightForwardObj.length; i++){
                  oToken = new sap.m.Token({
                        key: aColumns.freightForwardObj[i][0],
                        text: aColumns.freightForwardObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_FreightForwarder").setTokens(aTokens);
                }
                else{
                    this.getView().byId("id_FreightForwarder").setTokens([]);
                }
                
                if(!(aColumns.ShipStatusObj ==undefined) && !aColumns.ShipStatusObj == 0){
                aTokens = [];
                var oToken;
                for(var i=0; i<aColumns.ShipStatusObj.length; i++){
                     oToken = new sap.m.Token({
                        key: aColumns.ShipStatusObj[i][0],
                        text: aColumns.ShipStatusObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_SHStatus").setTokens(aTokens);
                }
                else{
                    this.getView().byId("id_SHStatus").setTokens([]);
                }
                
                if(!(aColumns.IEStatusObj ==undefined) && !aColumns.IEStatusObj == 0){
                aTokens = [];
                var oToken;
                for(var i=0; i<aColumns.IEStatusObj.length; i++){
                      oToken = new sap.m.Token({
                        key: aColumns.IEStatusObj[i][0],
                        text: aColumns.IEStatusObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_IEPreClearence").setTokens(aTokens);
                }
                else{
                this.getView().byId("id_IEPreClearence").setTokens([]);
                }
                
                if(!(aColumns.ShipToCountryObj ==undefined) && !aColumns.ShipToCountryObj == 0){
                aTokens = [];
                var oToken;
                for(var i=0; i<aColumns.ShipToCountryObj.length; i++){
                    oToken = new sap.m.Token({
                        key: aColumns.ShipToCountryObj[i][0],
                        text: aColumns.ShipToCountryObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_ShipToCountry").setTokens(aTokens);
                }
                else{
                    this.getView().byId("id_ShipToCountry").setTokens([]);
                }
                
                
                if(!(aColumns.ShipFromCountryObj  == undefined) && !aColumns.ShipFromCountryObj == 0){
                aTokens = [];
                var oToken;
                for(var i=0; i<aColumns.ShipFromCountryObj.length; i++){
                     oToken = new sap.m.Token({
                        key: aColumns.ShipFromCountryObj[i][0],
                        text: aColumns.ShipFromCountryObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_ShipFromCountry").setTokens(aTokens);
                }
                else{
                    this.getView().byId("id_ShipFromCountry").setTokens([]);
                }
                
                if(!(aColumns.PlantObj  ==undefined) && !aColumns.PlantObj == 0){
                aTokens = [];
                var oToken;
                for(var i=0; i<aColumns.PlantObj.length; i++){
                     oToken = new sap.m.Token({
                        key: aColumns.PlantObj[i][0],
                        text: aColumns.PlantObj[i][1]
                        });
                    aTokens.push(oToken);
                }
                this.getView().byId("id_Plant").setTokens(aTokens);
                }
                else{
                    this.getView().byId("id_Plant").setTokens([]);
                }
    
                if(!(aColumns.ShipNoFromObj === undefined) && !aColumns.ShipNoFromObj === 0){
                this.getView().byId("id_ShipmentNo").setValue(aColumns.ShipNoFromObj);
                }
                else{
                    this.getView().byId("id_ShipmentNo").setValue("");
                }
    
                if(aColumns.ShipNotoObj !== undefined && aColumns.ShipNotoObj !== 0){
                this.getView().byId("id_ShipmentNo2").setValue(aColumns.ShipNotoObj);
                }
                else{
                    this.getView().byId("id_ShipmentNo2").setValue("");
                }
                
                if(!(aColumns.ShipCrtDtFromObj === undefined) && !aColumns.ShipCrtDtFromObj === 0){
                this.getView().byId("id_CreationDateFrom").setValue(aColumns.ShipCrtDtFromObj);
                }
                else{
                    this.getView().byId("id_CreationDateFrom").setValue("");
                }
    
                if(!(aColumns.ShipCrtDtToObj === undefined) && !aColumns.ShipCrtDtToObj === 0){
                this.getView().byId("id_CreationDateTo").setValue(aColumns.ShipCrtDtToObj);
                }
                else{
                    this.getView().byId("id_CreationDateTo").setValue("");
                }
                
                if(!(aColumns.openSHOnly ==undefined) && !aColumns.openSHOnly == 0){
                this.getView().byId("chkBoxId_OpenSHOnly").setSelected(aColumns.openSHOnly);
                }
                else{
                    this.getView().byId("chkBoxId_OpenSHOnly").setSelected(aColumns.openSHOnly);
                }
                //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                /*if(!(aColumns.directSalesOnly ==undefined) && !aColumns.directSalesOnly == 0){
                this.getView().byId("chkBoxId_DirectSalesOnly").setSelected(aColumns.directSalesOnly);
                }
                else{
                    this.getView().byId("chkBoxId_DirectSalesOnly").setSelected(aColumns.directSalesOnly);
                }
                */
                
                
                this.getView().byId("chkBoxId_DirectSalesOnly").setSelected(aColumns.directSalesOnly);
                //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                //enable disable
                
                if(aColumns.ShipTypeObj=="Z006" ){
                    this.getView().byId("id_ShipFromCountry").setEnabled(true);
                    this.getView().byId("id_ShipToCountry").setEnabled(true);
                    
                }
                
                if(aColumns.ShipTypeObj=="Z004"){
                    this.getView().byId("id_ShipToCountry").setEnabled(false);
                    this.getView().byId("id_ShipFromCountry").setEnabled(true);
                    this.getView().byId("id_ShipToCountry").destroyTokens();
                    
                }
                
                else if(aColumns.ShipTypeObj=="Z005"){
                    
                    this.getView().byId("id_ShipFromCountry").setEnabled(false);
                    this.getView().byId("id_ShipToCountry").setEnabled(true);
                    this.getView().byId("id_ShipFromCountry").destroyTokens();
                }
                //end
            }
                }
            
        },						
        onManage: function(oEvent) {
            var aParameters = oEvent.getParameters();
            // rename variants
            if (aParameters.renamed.length > 0) {
                aParameters.renamed.forEach(function(aRenamed) {
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
                aParameters.deleted.forEach(function(aDelete) {
                    this.oVariantSet.delVariant(aDelete);
                }.bind(this));
            }
            //  Save the Variant Container
            this.oContainer.save().done(function() {
                // Tell the user that the personalization data was saved
                sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
            });
        },				
            
//						end of changes CD #2000025529: variant management for selection screen
            
                //validations of dates on header screen
                
            dateValidation:function(){
//							this.getView().byId("PlanCheckInDt").setMinDate(new Date());
//							this.getView().byId("PlanCheckInDt").setMaxDate(new Date("9999-12-31"));
                
                var currDate = new Date(),
                 savedDate = this.getView().byId("PlanCheckInDt").getValue();
                
            if(this.getView().byId("PlanCheckInDt").getValue() !== ""){
                if(currDate <  savedDate ){		
                    this.getView().byId("PlanCheckInDt").setMinDate(new Date(this.getView().byId("PlanCheckInDt").getValue()));
            }
            else{
                this.getView().byId("PlanCheckInDt").setMinDate(new Date());
            }
            
                }
                else{
                    this.getView().byId("PlanCheckInDt").setMinDate(new Date());
                    this.getView().byId("PlanCheckInDt").setValue(new Date())
                }

//							this.getView().byId("PlannedDepDt").setMinDate(new Date());
                if(this.getView().byId("PlannedDepDt").getValue() !== ""){
                    this.getView().byId("PlannedDepDt").setMinDate(new Date(this.getView().byId("PlannedDepDt").getValue()));
                }
                else{
                    this.getView().byId("PlannedDepDt").setMinDate(new Date());
                }
//							this.getView().byId("PlannedDepDt").setMaxDate(new Date("9999-12-31"));
                
//							this.getView().byId("ActualDepartureDt").setMinDate(new Date("0001-01-01"));
                this.getView().byId("ActualDepartureDt").setMaxDate(new Date());
                
//							this.getView().byId("PlannedArrivalDt").setMinDate(new Date());
                if(this.getView().byId("PlannedArrivalDt").getValue() !== ""){
                    this.getView().byId("PlannedArrivalDt").setMinDate(new Date(this.getView().byId("PlannedArrivalDt").getValue()));
                }
                else{
                    this.getView().byId("PlannedArrivalDt").setMinDate(new Date());
                }
//							this.getView().byId("PlannedArrivalDt").setMaxDate(new Date("9999-12-31"));
                
//							this.getView().byId("ActualArvDate").setMinDate(new Date("0001-01-01"));
                this.getView().byId("ActualArvDate").setMaxDate(new Date());
                this.getView().byId("ActCheckInDt").setMaxDate(new Date());
            },
            
            onAfterRendering:function(){
                
                this.OnClickSelectionScreen(); //Opens the selection screen dialog oninitial launch of the application
//							this.getView().byId("id_SHStatus").setEnabled(false);
                this.shStatusToken();
                 this.getView().byId("id_SHType").setSelectedKey("Z005");
                 
                 
//						 	start of variant-header table
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
                    var oPersonalizationService = sap.ushell.Container.getService("Personalization");
                    var oPersId = {
                                    container: "LhTablePersonalization", 
                                    item: "TblMonitorShipments" // id of table        
                                };
                    // define scope 
                    var oScope = {
                                    keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                                    writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                                    clientStorageAllowed: true
                                };
                    // Get a Personalizer
                    var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
                    oPersonalizationService.getContainer("LhTablePersonalization", oScope, oComponent).fail(function() {}).done(function(oContainer) {
                            var oContainer = oContainer;
                            var oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContainer);
                            // get variant set which is stored in back end
                            var oLhTableVariantSet = oVariantSetAdapter.getVariantSet("TblMonitorShipmentsSet");
                            
                            if(oLhTableVariantSet && (oLhTableVariantSet._oVariantSetData.currentVariant !== null)){
                                if(oLhTableVariantSet._oVariantSetData.variants[oLhTableVariantSet._oVariantSetData.currentVariant]){
                                    this._setSelectedVariantToTable(oLhTableVariantSet._oVariantSetData.variants[oLhTableVariantSet._oVariantSetData.currentVariant].name);
                                    var LhVariantManagement = this.getView().byId("LhVariantManagement");
                                    if(LhVariantManagement){
                                        LhVariantManagement.oVariantText.setText(oLhTableVariantSet._oVariantSetData.variants[oLhTableVariantSet._oVariantSetData.currentVariant].name);
                                        LhVariantManagement.setInitialSelectionKey(oLhTableVariantSet._oVariantSetData.currentVariant);
                                    }
                                }
                            } 
                            
                            
                            
                            
                            // enable save button
                            var oVariantMgmtControlLhTbl = this.getView().byId("LhVariantManagement");
                            /*oVariantMgmtControlLhTbl.oVariantSave.onAfterRendering = function(){
                                this.setEnabled(true);
                            };*/
                            // set custom variant selected by user as default
                            if(this.oLhTableVariantSet._oVariantSetData.currentVariant !== null){
                                oVariantMgmtControlLhTbl.setDefaultVariantKey(this.oLhTableVariantSet._oVariantSetData.currentVariant);
                            }
                    }.bind(this));
                }
                 
                 //end of variant-header table
                 
//							start of changes CD #2000025529: variant management	- selection screen
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {

                    var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
                    this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
                    var oPersId = {
                            container: "TablePersonalisation", //any
                            item: "DemoTableUI"                //any- I have used the table name 
                            };
                    // define scope 
                    var oScope = {
                            keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
                            writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
                            clientStorageAllowed: true
                                };
                    // Get a Personalizer
         
                    var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
                    this.oPersonalizationService.getContainer("TablePersonalisation", oScope, oComponent)
                        .fail(function() {})
                        .done(function(oContainer) {
                            var oContainer = oContainer;
                             var oVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContainer);
                            // get variant set which is stored in backend
                                     var variantSet = oVariantSetAdapter.getVariantSet("DemoTableUISet");
                                      
                                       //default variant
                                        if(variantSet && (variantSet._oVariantSetData.currentVariant !== null)){
                                            if(variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant]){
                                                this._setSelectedVariantToSelectionScreen(variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant].name);
                                                //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                                                this.selectedVariant = variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant].name;
                                                //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                                                var VariantsScreen = this.getView().byId("Variants");
                                                if(VariantsScreen){
                                                VariantsScreen.oVariantText.setText(variantSet._oVariantSetData.variants[variantSet._oVariantSetData.currentVariant].name);
                                                VariantsScreen.setInitialSelectionKey(variantSet._oVariantSetData.currentVariant);
                                            }
                                            }
                                        }
                                        
                                        //end default
                        
                                    // enable save button
                                        var VariantsScreen = this.getView().byId("Variants");
                                        /*VariantsScreen.oVariantSave.onAfterRendering = function(){
                                            this.setEnabled(true);
                                        };*/
                                        // set custom variant selected by user as default
                                        if(this.oVariantSet._oVariantSetData.currentVariant !== null){
                                            VariantsScreen.setDefaultVariantKey(this.oVariantSet._oVariantSetData.currentVariant);
                                        }
                        
                        
                        }.bind(this));

                            }
                
//							end of changes CD #2000025529: variant management
                this.dateValidation();
            },
            
shStatusToken:function(){
    this.byId("id_SHStatus").setTokens([new Token({text: "Planned", key: "0"}),new Token({text: "Planning completed", key: "1"})]);
},
        


//-----------------------------Selection Screen Dialog Open---------------------------------------
            
OnClickSelectionScreen: function(evt) {
    
if (!this._oDialogSelectionScreen) {
this._oDialogSelectionScreen = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.SelectionScreenFrag",this);
this.getView().addDependent(this._oDialogSelectionScreen);
}
jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(),this._oDialogSelectionScreen);
this._oDialogSelectionScreen.open();


//Set default value to shipment status f4
 //Commented line defect id #24530
//this.onSelectionChangeSHType();
                            },

setSelectionScreenVariantEditMode: function(){
    this.getView().byId("Variants").currentVariantSetModified(true);
},						
onSelectionChangeSHType:function(oEvent){
    
        //---Begin of defect id #24530
        //Shipment type validation if user enters any values other than the ones provided in the combo box
         
          var i18n = this.getResourceBundle();	
          var oValidatedComboBox = oEvent.getSource();
          var sSelectedKey = oValidatedComboBox.getSelectedKey();
          var sValue = oValidatedComboBox.getValue();
          if (!sSelectedKey && sValue) {
            oValidatedComboBox.setValueState("Error");
            oValidatedComboBox.setValueStateText(i18n.getText("sHType.Validation"));
            return;
          } 
          
          else if(!sValue){
              oValidatedComboBox.setValueState("Error");
                oValidatedComboBox.setValueStateText(i18n.getText("sHType.Validation"));
                return;
          }
          
          else {
            oValidatedComboBox.setValueState("None");
          }
    
        //---End of defect id #24530
    
    var SHType= this.getView().byId("id_SHType").getSelectedKey();
    this.getView().byId("id_ShipToCountry").setEnabled(true);
    if(SHType=="Z006"){
        this.getView().byId("id_ShipFromCountry").setEnabled(true);
        this.getView().byId("id_ShipToCountry").setEnabled(true);
        
    }
    
    if(SHType=="Z004"){
        this.getView().byId("id_ShipFromCountry").setEnabled(true);
        this.getView().byId("id_ShipToCountry").setEnabled(false);
        this.getView().byId("id_ShipToCountry").destroyTokens();
        
    }
    
    else if(SHType=="Z005"){
        
        this.getView().byId("id_ShipFromCountry").setEnabled(false);
        this.getView().byId("id_ShipToCountry").setEnabled(true);
        this.getView().byId("id_ShipFromCountry").destroyTokens();
    }
    this.setSelectionScreenVariantEditMode();
},							
                        
//-----------------------------Selection Screen Dialog close---------------------------------------						

handleSelectionScreenClose:function(){
this._oDialogSelectionScreen.close();   
},	

//--------------------------Personalize setting for Monitor Shipment---------------------------

OnClickPersonalizeMonitorShipment:function(evt){
/*jQuery.sap.syncStyleClass(this.getView(),this._oPersonalizationDialog);
this.oTblPersContMonShip.openDialog();*/
// Start of changes for CD# 2000025529 : Apply Variant Management to the  table
this.oLhTablePersoService.openDialog({
    ok: this.onObdSalesOrdersPersoDonePressed.bind(this)
});
//			this.oLhTablePersoService._oDialog.attachConfirm(this, this.onObdSalesOrdersPersoDonePressed.bind(this));
var that=this;
setTimeout(function(){
    that.oLhTablePersoService._oDialog.attachConfirm(that, that.onObdSalesOrdersPersoDonePressed.bind(that));
},3000,that);
// End of changes for CD# 2000025529 : Apply Variant Management to the table
},
// Start of changes for CD# 2000025529 : Apply Variant Management to the table
onObdSalesOrdersPersoDonePressed: function(oEvent) {
var that=this;
this.oLhTablePersoService.savePersonalizations();
this.getView().byId("LhVariantManagement").currentVariantSetModified(true);
},

// To store the variant with the columns settings including the order to the back end
onSaveVariantAs: function(oEvent) {
// get variant parameters
var oVariantParam = oEvent.getParameters();
// get columns data
var aColumnsData = [];
this.getView().byId("TblMonitorShipments")._getVisibleColumns().forEach(function(oColumn, index) {
    var aColumn = {};
    aColumn.fieldName = oColumn.getProperty("name");
    aColumn.Id = oColumn.getId();
    aColumn.index = index;
    aColumn.Visible = oColumn.getVisible();
    aColumn.filterProperty = oColumn.getProperty("filterProperty");
    aColumn.sortProperty = oColumn.getProperty("sortProperty");
    aColumn.defaultFilterOperator = oColumn.getProperty("defaultFilterOperator");
//				aColumn.sorted = oColumn.getProperty("sorted");
//				aColumn.sortOrder = oColumn.getProperty("sortOrder");
    aColumnsData.push(aColumn);
});

//get if the variant exists or add new variant
var sVariantKey = this.oLhTableVariantSet.getVariantKeyByName(oVariantParam.name);
if (sVariantKey) {
    this.oLhTableVariant = this.oLhTableVariantSet.getVariant(sVariantKey);
} 
else {
    this.oLhTableVariant = this.oLhTableVariantSet.addVariant(oVariantParam.name);
}

//this.oLhTableVariant = this.oLhTableVariantSet.addVariant(oVariantParam.name);

var i18n = this.getResourceBundle();

if (this.oLhTableVariant) {
    this.oLhTableVariant.setItemValue("ColumnsVal", JSON.stringify(aColumnsData));
    if (oVariantParam.def === true) {
        this.oLhTableVariantSet.setCurrentVariantKey(this.oLhTableVariant.getVariantKey());
    }
    this.oContainerLhTable.save().done(function() {
        // Tell the user that the personalization data was saved
        sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
    });
}
},
// To read the service and change the table columns accordingly on selection of variant
onSelectVariant: function(oEvent) {
var selectedKey = oEvent.getParameters().key;
var oVariantMgmtControlLhTbl = this.getView().byId("LhVariantManagement");
if(selectedKey === "*standard*"){
    // disable save button
    var selectedVariant = "Standard";
    /*oVariantMgmtControlLhTbl.oVariantSave.onAfterRendering = function(){
        this.setEnabled(false);
    };*/
}
else{
    /*oVariantMgmtControlLhTbl.oVariantSave.onAfterRendering = function(){
        this.setEnabled(true);
    };*/
    for (var i=0; i<oEvent.getSource().getVariantItems().length; i++) {
        if (oEvent.getSource().getVariantItems()[i].getProperty("key") === selectedKey) {
            var selectedVariant = oEvent.getSource().getVariantItems()[i].getProperty("text");
            break;
        }
    }
}
this._setSelectedVariantToTable(selectedVariant);
},
// To convert the stored values back into the array & modify the table and refresh the table control to show that data on the screen
_setSelectedVariantToTable: function(oSelectedVariant) {
if (oSelectedVariant && oSelectedVariant!=="Standard") {
    var sVariant = this.oLhTableVariantSet.getVariant(this.oLhTableVariantSet.getVariantKeyByName(oSelectedVariant));
    var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));
    // Hide all columns first
    this.getView().byId("TblMonitorShipments").getColumns().forEach(function(oColumn) {
        oColumn.setVisible(false);
    });
    // re-arrange columns according to the saved variant
    aColumns.forEach(function(aColumn) {
        var aTableColumn = $.grep(this.getView().byId("TblMonitorShipments").getColumns(), function(el, id) {
            return el.getProperty("name") === aColumn.fieldName; 
        });
        if (aTableColumn.length > 0) {
            aTableColumn[0].setVisible(aColumn.Visible);
            aTableColumn[0].setFilterProperty(aColumn.filterProperty);
            aTableColumn[0].setSortProperty(aColumn.sortProperty);
            aTableColumn[0].setDefaultFilterOperator(aColumn.defaultFilterOperator);
            aTableColumn[0].setSorted(aColumn.sorted);
            aTableColumn[0].setSortOrder(aColumn.sortOrder);
            this.getView().byId("TblMonitorShipments").removeColumn(aTableColumn[0]);
            this.getView().byId("TblMonitorShipments").insertColumn(aTableColumn[0], aColumn.index);
        }
    }.bind(this));
}
// null means the standard variant is selected or the variant which is not available, then show all columns
else {
    this.getView().byId("TblMonitorShipments").getColumns().forEach(function(oColumn) {
        oColumn.setVisible(true);
    });
}
},
// To manage the variants. User can change the name or delete the variant or can make anyone of them as default.
onManageVariants: function(oEvent) {
var aParameters = oEvent.getParameters();
var i18n = this.getResourceBundle();
// rename variants
if (aParameters.renamed.length > 0) {
    aParameters.renamed.forEach(function(aRenamed) {
        var sVariant = this.oLhTableVariantSet.getVariant(aRenamed.key),
        sItemValue = sVariant.getItemValue("ColumnsVal");
        // delete the variant 
        this.oLhTableVariantSet.delVariant(aRenamed.key);
        // after delete, add a new variant
        var oNewVariant = this.oLhTableVariantSet.addVariant(aRenamed.name);
        oNewVariant.setItemValue("ColumnsVal", sItemValue);
    }.bind(this));
}
// default variant change
if (aParameters.def !== "*standard*") {
    this.oLhTableVariantSet.setCurrentVariantKey(aParameters.def);
} 
else {
    this.oLhTableVariantSet.setCurrentVariantKey(null);
}
// Delete variants
if (aParameters.deleted.length > 0) {
    aParameters.deleted.forEach(function(aDelete) {
        this.oLhTableVariantSet.delVariant(aDelete);
    }.bind(this));
}
//  Save the Variant Container
this.oContainerLhTable.save().done(function() {
    // Tell the user that the personalization data was saved
    sap.m.MessageToast.show(i18n.getText("PersonalisationSave"));
});
},
// End of changes for CD# 2000025529 : Apply Variant Management to the Outbound Sales Orders table

//-------------------------Refresh button functionality------------------------------------

OnClickRefresh:function(){

this.getView().getModel().resetChanges();
//CD:2000027653:refresh
this.monShipArr =[];
//end CD:2000027653:refresh

var oTabMonShip = this.getView().byId("TblMonitorShipments");
resetTableFilterSort(oTabMonShip); 
this.handleSelectionScreenSave(); 
var keys = Object.keys(oTabMonShip.getModel().oData);

 //Setting the flag to N sets all the shipment numbers (changed or unchanged) to a default value state
for(var rowIndex = 0 ;rowIndex<keys.length;rowIndex++){
    if(keys[rowIndex].indexOf("ShipmentSet(")>=0){
        oTabMonShip.getModel().oData[keys[rowIndex]].flag = "N";
    }
}	


},

//----------------------Selection Screen Save---------------------------------------------
handleSelectionScreenSave : function(){
//CD:2000027653:refresh
this.monShipArr = [];
this.dateValidation();
//end CD:2000027653
var filters = this.handleSelectionParameters();
if(filters && filters.length >0){
    this.getModel("headerTableModel").setProperty("/HeaderTableBusy",true);
    var idMonShipTable = this.getView().byId("TblMonitorShipments");
    
    idMonShipTable.bindRows({

    path: "/ShipmentSet",

    filters: filters

 });
    this.getView().byId("id_Plant").setValueState("None");
        resetTableFilterSort(idMonShipTable); 
        
        
        this._oDialogSelectionScreen.close(); 
        
        //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
        var directSalesCheckState = this.getView().byId("chkBoxId_DirectSalesOnly").getSelected();
        if(directSalesCheckState){
            this.getView().byId("BtnSubmitShpInvoice").setVisible(true);
        }else{
            this.getView().byId("BtnSubmitShpInvoice").setVisible(false);
        }
        //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
}

    
},	 



handleSelectionParameters:function(){
     
         var that = this;
        var i18n = this.getResourceBundle();
         var sHType = this.getView().byId("id_SHType").getSelectedKey();
         //Start of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button functionality
        if(sHType === "Z004"){
            this.getView().byId("id_btnIEPreClr").setVisible(false);
        }
        else{
            this.getView().byId("id_btnIEPreClr").setVisible(true);
        }
        //End of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button functionality
//				
         var shipFromCountryArr = this.getView().byId("id_ShipFromCountry").getTokens();	
         var plantArr = this.getView().byId("id_Plant").getTokens();
        var shipmentNoFrom = this.getView().byId("id_ShipmentNo").getValue();
        var shipmentNoTo = this.getView().byId("id_ShipmentNo2").getValue();
        var FwdAgentArr = this.getView().byId("id_FreightForwarder").getTokens();	
//					
//					var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
//                        pattern: "yyyy-MM-ddTHH:mm:ss"
//                  });
//                  
//                  var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
//                        pattern: "yyyy-MM-ddT23:59:59"
//                  });
      
      
    //Start of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
        //Define formats for From and To dates
        var oFormatFrom = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "yyyy-MM-ddTHH:mm:ss"
        });
        
        var oFormatTo = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "yyyy-MM-ddTHH:mm:ss"
        });
        //End of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
      
      //Format the Shipment Creation Date into Odata Understandable format
      var sHCreationDateFrom = this.getView().byId("id_CreationDateFrom").getDateValue();
      var sHCreationDateTo = this.getView().byId("id_CreationDateTo").getDateValue();
      
//                  var sHCreationDateFromVal = formatter.fnAdjustTimeZoneDiff(sHCreationDateFrom);
//                  var sHCreationDateFromFormatted = oFormatFrom.format(sHCreationDateFromVal);                  
//                 
//                  
//                  var sHCreationDateTo = this.getView().byId("id_CreationDateTo").getDateValue();
//                  var sHCreationDateToVal = formatter.fnAdjustTimeZoneDiff(sHCreationDateTo.getDateValue());
//                  
//                  
      
      var sHCreationDateFromVal = formatter.fnAdjustTimeZoneDiff(sHCreationDateFrom);
        var sHCreationDateFromFormatted	= oFormatFrom.format(sHCreationDateFromVal); //Formatted From Date
        var sHCreationDateToVal = sHCreationDateTo;	
        var sHCreationDateToFormatted='';
        
        if(!sHCreationDateToVal){
            sHCreationDateToFormatted = sHCreationDateFromFormatted;
        }
        else{
            //Start of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
            sHCreationDateToVal.setHours(23,59,59,59);
            var shCreationDatetoTimeZoneVal=formatter.fnAdjustTimeZoneDiff(sHCreationDateToVal);
            sHCreationDateToFormatted = oFormatTo.format(shCreationDatetoTimeZoneVal); // Formatted To Date
            //End of RFC#7000016711:CD#2000043148:Date Format change for timezone issue
            //var sHCreationDateToFormatted = oFormatTo.format(sHCreationDateToVal); // Formatted To Date	
        }
        
        
        
      //mandatory fields
      var openSHOnly = this.getView().byId("chkBoxId_OpenSHOnly").getSelected();	
      if(!sHCreationDateFrom && !shipmentNoFrom && openSHOnly === false){
            MessageBox.error(i18n.getText("ErrorDate"));
            return;
        }					
 
        
        var statusArr = this.getView().byId("id_SHStatus").getTokens();	
        
        if(!statusArr.length){
            MessageBox.alert(i18n.getText("SelectionScreen.SHStatus"));
            this.getView().byId("id_SHStatus").setValueState("Error");
            this.getView().byId("id_SHStatus").setValueStateText(i18n.getText("SelectionScreen.SHType"));
            return;
        }
        else{
            this.getView().byId("id_SHStatus").setValueState("None");
        }
                            
        if(!sHType && !plantArr.length){
            MessageBox.alert(i18n.getText("SelectionScreen.SHPlant"));
            this.getView().byId("id_SHType").setValueState("Error");
            this.getView().byId("id_SHType").setValueStateText(i18n.getText("SelectionScreen.SHType"));
            this.getView().byId("id_Plant").setValueState("Error");
            this.getView().byId("id_Plant").setValueStateText(i18n.getText("SelectionScreen.Plant"));
            return;
        }

        
        if(!sHType && plantArr.length){
            MessageBox.alert(i18n.getText("SelectionScreen.SHType"));
            this.getView().byId("id_SHType").setValueState("Error");
            this.getView().byId("id_SHType").setValueStateText(i18n.getText("SelectionScreen.SHType"));
            this.getView().byId("id_Plant").setValueState("None");
            return;
        }
        
        if(!plantArr.length && sHType ){
            MessageBox.alert(i18n.getText("SelectionScreen.Plant"));
            this.getView().byId("id_Plant").setValueState("Error");
            this.getView().byId("id_Plant").setValueStateText(i18n.getText("SelectionScreen.Plant"));
            this.getView().byId("id_SHType").setValueState("None");
            return;
        }
        if(plantArr.length ){
        this.getView().byId("id_Plant").setValueState("None");
        }
        
        if(!FwdAgentArr.length){
            MessageBox.alert(i18n.getText("SelectionScreen.Fwd"));
            this.getView().byId("id_FreightForwarder").setValueState("Error");
            this.getView().byId("id_Plant").setValueStateText(i18n.getText("SelectionScreen.Fwd"));
            return;
        }
        if(FwdAgentArr.length){
            this.getView().byId("id_FreightForwarder").setValueState("None");
        }
        
     
        //Validation- Shipment No. From cannot be greater that Shipment No. To
        if(parseInt(shipmentNoFrom) > parseInt(shipmentNoTo)){ 
            this.getView().byId("id_ShipmentNo").setValueState("Error");
            MessageBox.alert(i18n.getText("SelectionScreen.SHNumberRange"));
            return;
            
        }
        else{
            this.getView().byId("id_ShipmentNo").setValueState("None");
        }
        
        //Validation - Shipment Crt. Date From cannot be more than Crt. Date To
        var crtDateFromDateVal = this.getView().byId("id_CreationDateFrom").getDateValue();
        var crtDateToDateVal = this.getView().byId("id_CreationDateTo").getDateValue();
        
        if(crtDateToDateVal !== null){
        if(crtDateFromDateVal > crtDateToDateVal){
            this.getView().byId("id_CreationDateFrom").setValueState("Error");
            MessageBox.alert(i18n.getText("SelectionScreen.CrDtRange"));
            return;
        }
        else{
            this.getView().byId("id_CreationDateFrom").setValueState("None");
        }
        }
        //Validation - Shipment Crt. Date From cannot be more than Crt. Date To
        
        var dateFrom = new Date(sHCreationDateFrom);
        var dateTo = new Date(sHCreationDateTo);
        var diffTime =Math.abs(dateFrom.getTime() - dateTo.getTime());
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if(diffDays > 180 ){
            MessageBox.error(i18n.getText("ToDateGreaterThanSixMonths"),{});
            return;
        }
        
        
        
        var filters = [];
        if(sHType){
            filters.push(new Filter("ShpmntType",sap.ui.model.FilterOperator.EQ,sHType));
        }
    
        if(statusArr.length){
         for(var i=0; i<statusArr.length; i++){
            var oFilter = new Filter("OverallStatus", sap.ui.model.FilterOperator.EQ,statusArr[i].getProperty("key"));
            filters.push(oFilter);
            }	
        }
         var iEPreClrArr = this.getView().byId("id_IEPreClearence").getTokens();
        if(iEPreClrArr.length){
         for(var i=0; i<iEPreClrArr.length; i++){
            var oFilter = new Filter("IePreclrStatus", sap.ui.model.FilterOperator.EQ,iEPreClrArr[i].getProperty("key"));
            filters.push(oFilter);
            }	
        }
        
        var FwdAgentArr = this.getView().byId("id_FreightForwarder").getTokens();
        if(FwdAgentArr.length){
         for(var i=0; i<FwdAgentArr.length; i++){
            var oFilter = new Filter("FwdAgent", sap.ui.model.FilterOperator.EQ,FwdAgentArr[i].getProperty("key"));
            filters.push(oFilter);
            }	
        }
        
         var shipToCountryArr = this.getView().byId("id_ShipToCountry").getTokens();
        if(shipToCountryArr.length){
          for(var i=0; i<shipToCountryArr.length; i++){
            var oFilter = new Filter("ShiptoCountry", sap.ui.model.FilterOperator.EQ,shipToCountryArr[i].getProperty("key"));
            filters.push(oFilter);	
            }
        }
        
        if(shipFromCountryArr.length){
         for(var i=0; i<shipFromCountryArr.length; i++){
            var oFilter = new Filter("ShipfromCountry", sap.ui.model.FilterOperator.EQ,shipFromCountryArr[i].getProperty("key"));
            filters.push(oFilter);	
            }
        }
        
        if(plantArr.length){
         for(var i=0; i<plantArr.length; i++){
            var oFilter = new Filter("Plant", sap.ui.model.FilterOperator.EQ,plantArr[i].getProperty("key"));
            filters.push(oFilter);	
            }
        }

        //shipment number from and to
        if(shipmentNoFrom && shipmentNoTo){
            filters.push(new Filter("ShipmentNum", sap.ui.model.FilterOperator.BT,shipmentNoFrom,shipmentNoTo ));
     }else if(shipmentNoFrom){
            if(shipmentNoFrom.length == 10){
                   filters.push(new Filter("ShipmentNum", sap.ui.model.FilterOperator.EQ,shipmentNoFrom));   
            }
            else if(shipmentNoFrom.length <= 8){
                   filters.push(new Filter("ShipmentNum", sap.ui.model.FilterOperator.Contains,shipmentNoFrom));
            }
            
            
     }else if(shipmentNoTo){
            if(shipmentNoTo.length == 10){
                   filters.push(new Filter("ShipmentNum", sap.ui.model.FilterOperator.EQ,shipmentNoTo));     
            }
            else if(shipmentNoTo.length <= 8){
                   filters.push(new Filter("ShipmentNum", sap.ui.model.FilterOperator.Contains,shipmentNoTo));
            }
     }

        //
        
        if(sHCreationDateFrom !== null){
            filters.push(new Filter("CreationDt", sap.ui.model.FilterOperator.BT,sHCreationDateFromFormatted,sHCreationDateToFormatted));
        }
        
        /*var oBusyDialog = new sap.m.BusyDialog();
        oBusyDialog.open();
        
        var idMonShipTable = this.getView().byId("TblMonitorShipments");
        
        idMonShipTable.bindRows({

        path: "/ShipmentSet",

        filters: filters

     });*/
        
        
        //---------------Setting the title of the page------------------
        var sHDesc = this.getView().byId("id_SHType").getSelectedItem().getAdditionalText(); 
        var staticPageTitle = this.getView().getModel("i18n").getResourceBundle().getText("FULLSCREEN_TITLE");
        this.getView().byId("pageShipmentHeader").setTitle(staticPageTitle.concat(sHDesc));
//hide columns for inbound shpmt		
//			 var shipmtTyp = this.getView().byId("id_SHType").getSelectedItem().getKey();
/*	 if(shipmtTyp === "Z002"){
     this.getView().byId("id_Col_PlannedDepDt").setVisible(false);
     this.getView().byId("id_Col_ActualDepartureDt").setVisible(false);
     this.getView().byId("id_Col_PlannedArrivalDt").setVisible(false);
     this.getView().byId("id_Col_ActualArvDate").setVisible(false);
 }*/
        
 return filters;
            
//				oBusyDialog.close();
 
//				this.getView().byId("id_Plant").setValueState("None");
        /*this._oDialogSelectionScreen.close(); 
        resetTableFilterSort(idMonShipTable); */
    },
    
    //----------------------on SelectionScreen Clear functionality----------------
    
    
    handleSelectionScreenClear:function(){
        this.getView().byId("id_SHType").setSelectedKey("Z005");
        this.getView().byId("id_Plant").setValueState("None");
        this.getView().byId("chkBoxId_OpenSHOnly").setValueState("None");
        this.getView().byId("id_CreationDateFrom").setValueState("None");
        this.getView().byId("id_CreationDateTo").setValueState("None");
        
//					this.getView().byId("id_FreightForwarder").clearSelection();
        this.getView().byId("id_FreightForwarder").destroyTokens();
        this.shStatusToken();
        this.getView().byId("id_IEPreClearence").destroyTokens();
        this.getView().byId("id_ShipToCountry").destroyTokens();
        
        this.getView().byId("id_ShipFromCountry").destroyTokens();
        
        this.getView().byId("id_Plant").destroyTokens();
        this.getView().byId("id_ShipmentNo").setValue("");
        this.getView().byId("id_ShipmentNo2").setValue("");
        this.getView().byId("id_CreationDateFrom").setValue("");
        this.getView().byId("id_CreationDateTo").setValue("");
        this.getView().byId("chkBoxId_OpenSHOnly").setSelected(true);
        
        this.getView().byId("id_ShipToCountry").setEnabled(true);
        this.getView().byId("id_ShipFromCountry").setEnabled(false);
        
        //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
        this.getView().byId("chkBoxId_DirectSalesOnly").setSelected(false);
        //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
        
    },
    
     onSelectCheckBox:function(){
         this.setSelectionScreenVariantEditMode();
        /*var checkBoxOpenSHOnly = this.getView().byId("chkBoxId_OpenSHOnly").getSelected();
        if(!checkBoxOpenSHOnly){
            this.getView().byId("id_SHStatus").destroyTokens();
            this.getView().byId("id_SHStatus").setEnabled(true);
        }
        else{
            this.shStatusToken();
            this.getView().byId("id_SHStatus").setEnabled(false);
        }*/
         
        
    }, 
    //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
    onSelectDirectSalesCheckBox : function(){
        //this.getView().byId("BtnSubmitShpInvoice").setVisible(false);
        this.setSelectionScreenVariantEditMode();
        var checkBoxDirectSalesOnly = this.getView().byId("chkBoxId_DirectSalesOnly").getSelected();
        var flagForSelectedPlants = false;
        if(!checkBoxDirectSalesOnly){
            this.getView().byId("BtnSubmitShpInvoice").setVisible(false);
            flagForSelectedPlants = false;
            
            this.setPlantDataWithVariant(this.selectedVariant);
        
        }
        else{
            this.getView().byId("BtnSubmitShpInvoice").setVisible(true);
            flagForSelectedPlants = true;
            this.callServiceToSelectPlants(flagForSelectedPlants);
        }
        
        
    },
    callServiceToSelectPlants : function(flagForSelectedPlants){
        var that=this,columns = ['Plant','Name'];
        var url="/F4_PlantSet"
        var urlParams = {
                             $filter:"DirectSales eq "+ flagForSelectedPlants
                         };

        var model =	this.getOwnerComponent().getModel();
        
        this.getModel('PlantModel').setData([]);
        this.getModel('PlantModel').refresh(true);
        this.byId("id_Plant").setTokens([]);
        var newToken = new Token({text: "", key: ""}),tokenArray = [],title,description;
        readOdataAndReturnPromise(model, url,urlParams).done(
                  function(response) {
                      var aData = response.results;
                      aData.forEach(function(currentValue,index){
                          currentValue['Title']=currentValue[columns[0]];
                          currentValue['Desc']=columns[1]?currentValue[columns[1]]:'';
                          
                          currentValue['Selected'] = true;
                          
                              
                          newToken = new Token({text: "", key: ""});
                          title = currentValue['Title'];
                          description = currentValue['Desc'];
                          newToken.setKey(title);
                          newToken.setText(description);
                          tokenArray.push(newToken);
                                
                                
                            that.byId("id_Plant").setTokens(tokenArray);
                            
                            /*for(var i = 0 ; i < tokenArray.length; i++){
                              currentValue['Selected'] = true;
                          }*/
                      
                        
                      });
                      
                if(response.results.length>100)
                     that.getModel('PlantModel').setSizeLimit(response.results.length);
                
                
                that.getModel('PlantModel').setData(aData);
                 that.getModel('PlantModel').refresh(true);
                        
                      
                  })
                  .fail(
                          function(oError) {
                              oDialog.setBusy(false);
                              var message = JSON.parse(oError.responseText);
                              MessageBox.error(
                                              message.error.message.value,
                                              {
                                                  styleClass : "sapUiSizeCompact"
                                              });
          });
    },
    setPlantDataWithVariant : function(selectedVariant)
    {
        var oToken;
        if (selectedVariant) {
                if(selectedVariant === "Standard"){
                    
                    this.getView().byId("id_Plant").removeAllTokens();
                    
                    
                }
                else{
                    if(this.oVariantSet !== undefined){
                        var sVariant = this.oVariantSet.getVariant(this.oVariantSet.getVariantKeyByName(selectedVariant));
                        var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));
                        
                        if(!(aColumns.PlantObj  ==undefined) && !aColumns.PlantObj == 0){
                        var aTokens = [];
                        var oToken;
                        for(var i=0; i<aColumns.PlantObj.length; i++){
                             oToken = new sap.m.Token({
                                key: aColumns.PlantObj[i][0],
                                text: aColumns.PlantObj[i][1]
                                });
                            aTokens.push(oToken);
                        }
                        this.getView().byId("id_Plant").setTokens(aTokens);
                        }
                        else{
                            this.getView().byId("id_Plant").setTokens([]);
                        }
                    }else{
                        this.callServiceToSelectPlants(false);
                    }
        }
        }else{
            this.callServiceToSelectPlants(false);
        }
    },
    //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
    //-----------------------------------------------------------------------------
    onClickShipmentContent:function(oEvent){
        var i18n = this.getResourceBundle();
        var tableShipmentContent = this.getView().byId("TblMonitorShipments");
        var tableShipmentContentIndices =tableShipmentContent.getSelectedIndices();
        var shKey = this.getView().byId("id_SHType").getSelectedItem().getKey();
        
        
        if(tableShipmentContentIndices.length == 0){
            MessageBox.alert(i18n.getText("ContentScreen.OneItem"));
            return;
        }
        
        if(tableShipmentContentIndices.length > 1 ){
            MessageBox.alert(i18n.getText("ContentScreen.notMultiple"));
            return;
            
        }
        
        if(tableShipmentContentIndices.length == 1 ){
            
            var shipmentNo = tableShipmentContent.getContextByIndex(tableShipmentContent.getSelectedIndices()).getObject().ShipmentNum;
            var shCondition = tableShipmentContent.getContextByIndex(tableShipmentContent.getSelectedIndices()).getObject().OverallStatus;
            
            // Start of changes for CD# 2000025529 : Adding Download Cl functionality to the I/E Shipment Content Delivery table - pass status
            var	shipmentStatus = tableShipmentContent.getContextByIndex(tableShipmentContent.getSelectedIndices()).getObject().OverallStatus, 
                 shipmentType = tableShipmentContent.getContextByIndex(tableShipmentContent.getSelectedIndices()).getObject().ShpmntType,
                 oShpStatusforDwnldClIEShpConDelModel = new JSONModel({"ShipmentNo": shipmentNo, "ShipmentStatus": shipmentStatus, "ShipmentType": shipmentType});
            this.getOwnerComponent().setModel(oShpStatusforDwnldClIEShpConDelModel, "ShpStatusforDwnldClIEShpConDelModel");
            
            
        this.getRouter().navTo(
         "ShipItems",
         {
                ShipmentId : shipmentNo, // shipmentNo// 
                ShipmentTypeId : shKey,
                OverallStatus : shCondition
         });
        }
    },
 
    //-----------------Update cost button functionality--------------------
    handleShpCostDialogClose : function() {

        if (this._oDialogShpCostFunc) {
            this._oDialogShpCostFunc
            .close();
        }
    },
    OnClickUpdateShpCost:function(oEvent){
        
        var shipmentTable = this.getView().byId("TblMonitorShipments");
        var i18n = this.getResourceBundle();
        
        if(shipmentTable.getSelectedIndices().length == 0){
            MessageBox.alert(i18n.getText("CostScreen.OneRow"));
            return;	
        }
        
        if(shipmentTable.getSelectedIndices().length > 1){
            MessageBox.alert(i18n.getText("CostScreen.MultipleRow"));
            return;	
        }
        
         if(shipmentTable.getSelectedIndices().length === 1){
                var indices = shipmentTable.getSelectedIndices();
                var	selectedObject = shipmentTable.getModel().getProperty(
                        shipmentTable.getContextByIndex(shipmentTable.getSelectedIndex()).sPath);
        
                var oModel = this.getMainModel();
                
            //check shipment status	
                  
                  var shipStatus = selectedObject.OverallStatus;
                  var shipmentType = this.getView().byId("id_SHType").getSelectedKey();
                  if(shipmentType === "Z005" || shipmentType === "Z006"){
                      
                         if(shipStatus !== "0" && shipStatus !== "1"){
                             MessageBox.error(i18n.getText("Cost.ShipStatus56"));
                             return;
                         }
                  }else if(shipmentType === "Z004"){
                       if(shipStatus !== "0" && shipStatus !== "1" && shipStatus !== "5"){
                            MessageBox.error(i18n.getText("Cost.ShipStatus4"));
                            return;
                        } 
                  }

                  /*if(shipStatus !== "0" && shipStatus !== "1"){
                       MessageBox.error(i18n.getText("Cost.ShipStatus"));
                       return;
                  }*/
                  //------------
                this.callServiceForCostData(selectedObject.ShipmentNum,selectedObject.FwdAgent,selectedObject.IndShpcostUpdPending,selectedObject.ShpcostUpdPndgDt);
        }
    },
    //method to pass data from header screen to cost update screen header and to open cost fragment and display cost data
         callServiceForCostData : function(shipmentNo,FwdAgent,IndShpcostUpdPending,ShpcostUpdPndgDt) {
                var that = this;
                var i18n = this.getResourceBundle();
                var oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.open();

                var oModel = this.getMainModel();
                var costArray = [];
                
                var filters = [];
                if( shipmentNo !== ''){
                    filters.push(new Filter("ShipmentNum",sap.ui.model.FilterOperator.EQ,shipmentNo));
                } 
                if(FwdAgent !== ''){
                    filters.push(new Filter("FwdAgent",sap.ui.model.FilterOperator.EQ,FwdAgent));
                } 
                
                                    oModel.read("/ShipmentCostSet",
                        {
                                        filters: filters,
                            success : function(
                                    oData,
                                    response) {
                                oBusyDialog.close();

                                if (oData.results.length >= 0) {
//															
                                    costArray = oData.results;

                                    for (var i = 0; i < costArray.length; i++) {
                                        costArray[i].editable = true;
                                        costArray[i].newItem = false;
                                        costArray[i].removeItem = false;
                                    }
                                
                                    
                                    that.getModel("costModel").setData(costArray);
                                    
                                    if (!that._oDialogShpCostFunc) {
                                        that._oDialogShpCostFunc = sap.ui
                                        .xmlfragment(
                                                that
                                                .getView()
                                                .getId(),
                                                "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.UpdateShmtCost",
                                                that);
                                        that
                                        .getView()
                                        .addDependent(
                                                that._oDialogShpCostFunc);
                                    }
                                    jQuery.sap
                                    .syncStyleClass(
                                            "sapUiSizeCompact",
                                            that
                                            .getView(),
                                            that._oDialogShpCostFunc);
                                    that._oDialogShpCostFunc.open();
                                    that.getView().byId("id_Shpnum").setText(shipmentNo);
                                    that.getView().byId("id_Agent").setText(FwdAgent);
                                    
                                    if(IndShpcostUpdPending){
                                    var	indShpcostUpdPending = "X";
                                        that.getView().byId("id_Dt").setVisible(true);
                                    that.getView().byId("id_UpdPending").setText(indShpcostUpdPending);
                                    that.getView().byId("id_UpdPendingDt").setVisible(true);
                                    that.getView().byId("id_LblUpdPending").setVisible(true);
                                    }
                                    else{
                                        that.getView().byId("id_LblUpdPending").setVisible(false);
                                        that.getView().byId("id_Dt").setVisible(false);
                                        that.getView().byId("id_UpdPendingDt").setVisible(false);
                                    }
                                }
                                else{
                                    MessageBox.alert(i18n.getText("NoData"));
                                }
                                

                            },
                            error : function(
                                    oError) {
//error handling is handled in errorHandler.js.
                                oBusyDialog.close();

                            }

                        }); 
            },
            
            handleInvoiceDialogClose : function() {

                if (this._oDialogSubmitFunc) {
                    this._oDialogSubmitFunc
                    .close();
                    this.getModel("tempInvoiceModel").setData([]);
                    this.getModel("tempInvoiceModel").refresh();
                    this.getView().byId("id_InvNo").setValue("");
                    this.getView().byId("id_InvDate").setValue("");
                    
                }
            },
            OnClickSubmitShp:function(oEvent){
                
                var shipmentTable = this.getView().byId("TblMonitorShipments");
                var i18n = this.getResourceBundle();
                
                if(shipmentTable.getSelectedIndices().length == 0){
                    MessageBox.alert(i18n.getText("InvScreen.OneRow"));
                }
                
                
                else if(shipmentTable.getSelectedIndices().length > 1){
                    MessageBox.alert(i18n.getText("InvScreen.MultipleRow"));
                }
                
                else if(shipmentTable.getSelectedIndices().length === 1){
                        var indices = shipmentTable.getSelectedIndices();
                        var	selectedObject = shipmentTable.getModel().getProperty(
                                shipmentTable.getContextByIndex(shipmentTable.getSelectedIndex()).sPath);
                        
                          //check shipment status	
                          var shipStatus = selectedObject.OverallStatus;
                          //Start of changes for RFC#7000022368 - Add Shipment status - 5 
                          //End of changes for RFC#7000022368 - Add Shipment status - 5 
                          if(shipStatus !== "5" && shipStatus !== "6" && shipStatus !== "7" ){
                               MessageBox.error(i18n.getText("Invoice.ShipStatus"));
                               return;
                          }
                          
                        this.callServiceForInvoiceData(selectedObject.ShipmentNum,selectedObject.FwdAgent);

                }
                
                    },
                    //open invoice fragment,et header data of fragment and set data into invoice table
                    callServiceForInvoiceData : function(ShipmentNo,FwdAgent) {
                        var that = this;

                        var oBusyDialog = new sap.m.BusyDialog();
                        oBusyDialog.open();

                        var oModel = this.getMainModel();
                        var filters = [];
                        if(ShipmentNo !== ''){
                            filters.push(new Filter("ShipmentNum",sap.ui.model.FilterOperator.EQ,ShipmentNo));
                        } 
                        if(FwdAgent !== ''){
                            filters.push(new Filter("FwdAgent",sap.ui.model.FilterOperator.EQ,FwdAgent));
                        } 
                        
                                            oModel.read("/ShipmentInvoiceSet",
                                {
                                                filters: filters,
                                    success : function(
                                            oData,
                                            response) {
                                        oBusyDialog.close();

                                        if (oData.results.length >= 0) {
                                            var invoiceArray = [];
                                            invoiceArray = oData.results;
                                            
                                            for (var i = 0; i < invoiceArray.length; i++) {
                                                invoiceArray[i].editable = false;
                                                invoiceArray[i].newItem = false;
                                                invoiceArray[i].removeItem = false;
                                            }
                                            
                                            
                                        that.getModel("InvoiceModel").setData(invoiceArray);
                                            
                                            if (!that._oDialogSubmitFunc) {
                                                that._oDialogSubmitFunc = sap.ui
                                                .xmlfragment(
                                                        that
                                                        .getView()
                                                        .getId(),
                                                        "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.SubmitShmtInvoice",
                                                        that);
                                                that
                                                .getView()
                                                .addDependent(
                                                        that._oDialogSubmitFunc);
                                            }
                                            jQuery.sap
                                            .syncStyleClass(
                                                    "sapUiSizeCompact",
                                                    that
                                                    .getView(),
                                                    that._oDialogSubmitFunc);
                                            that._oDialogSubmitFunc
                                            .open();
                                            that.getView().byId("id_shpno").setText(ShipmentNo);
                                            that.getView().byId("id_fwd").setText(FwdAgent);
                                        }
                                        else{
                                            MessageBox.alert(i18n.getText("NoData"));
                                        }

                                    },
                                    error : function(
                                            oError) {

                                        oBusyDialog.close();

                                    }

                                }); 

                    },
                    
                    //---Begin of defect id #24530
                    //-------Live change event for Carrier invoice Number--------
                    //allows only alpha numeric and special characters (- and _) and 18 characters
                    onLiveChangeCarrierInvNum:function(oEvent){
                        var vCarrierInvNum = oEvent.getSource().getValue();
                        vCarrierInvNum = vCarrierInvNum.replace(/[^a-zA-Z/0-9/\-/_/]/g,'');
                        oEvent.getSource().setValue(vCarrierInvNum);
                    },
                    //----End of defect id #24530
                    //--------for submit invoice add button
                    
                    handleAddPartnerInvoice : function() {
                        
                        var shipmentTable = this.getView().byId("TblMonitorShipments");
                        var indices = shipmentTable.getSelectedIndices();
                        var selectedObject = shipmentTable.getModel().getProperty(
                                shipmentTable.getContextByIndex(shipmentTable.getSelectedIndex()).sPath);
                        
                        var ShipmentNum = selectedObject.ShipmentNum;
                        if (ShipmentNum) {

                            var invoiceData = this.getView().getModel("InvoiceModel").getData();
                            var tempInvoiceModelData = this.getModel("tempInvoiceModel").getData();
                            
                            var emptyObj = {
                                    
                                    AccCode : '',
                                    AcccodeDesc : '',
                                    Amount : '',
                                    Currency : '',
                                    CarrierInvNum : '',
                                    VoucherId : '',
                                    editable : true,
                                    newItem : true,
                                    removeItem : false
                                    
                            };
                            if (invoiceData.length) {
                                var valcurrency = invoiceData[0].Currency;
                            
                                emptyObj.Currency = valcurrency;
                                
                                invoiceData.splice(0, 0,
                                        emptyObj);
                                
                                tempInvoiceModelData.push(emptyObj);
                            }
                            else{
                                
                                tempInvoiceModelData.push(emptyObj);
                                
                                invoiceData.push(emptyObj);
                            }
                                
                                        
                            //***set currency value 
                            if(valcurrency){
                                invoiceData[0].Currency= valcurrency;
                        }

                                this
                                .getView()
                                .getModel(
                                        "InvoiceModel")
                                        .setData(
                                                invoiceData);
                            
                        }
                    },
                //--------------for shpcost add 
                    
                    handleAddCost : function() {
                        
                        var shipmentTable = this.getView().byId("TblMonitorShipments");
                        var indices = shipmentTable.getSelectedIndices();
                        var selectedObject = shipmentTable.getModel().getProperty(
                                shipmentTable.getContextByIndex(shipmentTable.getSelectedIndex()).sPath);
                        
                        var ShipmentNum = selectedObject.ShipmentNum;
                        var FwdAgent = selectedObject.FwdAgent;
                        if (ShipmentNum) {

                            var partnerData = this.getModel("costModel").getData();
                            
                            var emptyObj = {
                                    ShipmentNum : ShipmentNum,
                                    FwdAgent : FwdAgent,
                                    AccCode : '',
                                    AcccodeDesc : '',
                                    id_D:false,
                                    Amount : '',
                                    Currency : '',
                                    editable : true,
                                    newItem : true,
                                    removeItem : false
                                    
                            };
                            if (partnerData.length != 0) {
                                var valcurrency = partnerData[0].Currency;
                                partnerData[0].FwdAgent = FwdAgent;
                                

                                partnerData.splice(0, 0,
                                        emptyObj);
                                
                            }
                            else{
                                partnerData.push(emptyObj);
                            }
                                
                                        
                            //***set currency value ,R value
                            if(valcurrency){
                             partnerData[0].Currency= valcurrency;
                             partnerData[0].FwdAgent = FwdAgent;
                        }

                                this
                                .getView()
                                .getModel(
                                        "costModel")
                                        .setData(
                                                partnerData);
                            
                        }
                    },
                    

/*		 
//*****************************************************************************
 */
                        
                        //common method for change fields
                /*	chgFields:function(sSelectedObject,objectField,fieldName){
                        
                        
                         
                        var flag = 0;
                                
                                 if(this.monShipArr.length !== 0){
                                     for(var i=0; i<this.monShipArr.length; i++){
                                         if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                             flag = 1;
                                             if(this.monShipArr[i].fieldName !== objectField){
                                             this.monShipArr[i].fieldName  = objectField;
                                            
                                         }
                                         }
                                          
                                     }
                                    if(flag === 0){ 
                                     this.monShipArr.push(sSelectedObject);
                                    }
                                 }
                                 else{
                                this.monShipArr.push(sSelectedObject);
                                 }
                            flag = 0;
                        
                    
                    },		*/
                    
                    
                    chgTrId:function(oEvent){
                        
                        
                         
                        var flag = 0;
                                
                                var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                var shipmentTable = this.getView().byId("TblMonitorShipments");
                                var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                sSelectedObject.TndrTrkid =oEvent.getSource().mProperties.value;
//											var fieldName = "TndrTrkid";
//											this.chgFields(sSelectedObject,sSelectedObject.TndrTrkid,fieldName);
                                
                                   if(this.monShipArr.length !== 0){
                                     for(var i=0; i<this.monShipArr.length; i++){
                                         if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                             flag = 1;
                                             if(this.monShipArr[i].TndrTrkid !== sSelectedObject.TndrTrkid){
                                             this.monShipArr[i].TndrTrkid  = sSelectedObject.TndrTrkid;
                                            
                                         }
                                         }
                                          
                                     }
                                     //initially flag has maintined to 0.if updated ship number is already present in array flag is set to 1 and we just changed the field value in array.
                                     //if updated ship number is not present in array then flag is zero and we push the record in array.
                                    if(flag === 0){ 
                                     this.monShipArr.push(sSelectedObject);
                                    }
                                 }
                                 else{
                                this.monShipArr.push(sSelectedObject);
                                 }
                            flag = 0; 
                        
                    
                    },
                        
                        //change fields
             
                    chgShipType:function(oEvent){
                            
                            var flag = 0;
                                    
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.ShpmntType =oEvent.getSource().mProperties.value;
//												var fieldName = "ShpmntType";
//												this.chgFields(sSelectedObject,sSelectedObject.ShpmntType,fieldName);
                                    
                                  if(this.monShipArr.length !== 0){
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].ShpmntType !== sSelectedObject.ShpmntType){
                                                 this.monShipArr[i].ShpmntType  = sSelectedObject.ShpmntType;
                                                
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                flag = 0; 
                            
                        
                        },			
                                                        
                        chgMasterAir:function(oEvent){
                            
                            var flag = 0;
                                    
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.AdditText2 =oEvent.getSource().mProperties.value;
//												var fieldName = "AdditText2";
//												this.chgFields(sSelectedObject,sSelectedObject.AdditText2,fieldName);
                                      if(this.monShipArr.length !== 0){
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].AdditText2 !== sSelectedObject.AdditText2){
                                                 this.monShipArr[i].AdditText2  = sSelectedObject.AdditText2;
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                flag = 0;
                             
                        return;
                        },
                        
                        chgBillExit:function(oEvent){
                            var flag = 0;
                                    
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.AdditText3 =oEvent.getSource().mProperties.value;
//												var fieldName = "AdditText3";
//												this.chgFields(sSelectedObject,sSelectedObject.AdditText3,fieldName);
                                      if(this.monShipArr.length !== 0){
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].AdditText3 !== sSelectedObject.AdditText3){
                                                 this.monShipArr[i].AdditText3  = sSelectedObject.AdditText3;
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                flag = 0;
                             
                        
                        },

                        chgHouseAir:function(oEvent){
                            var flag = 0;
                                    
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.AdditText1 =oEvent.getSource().mProperties.value;
//												var fieldName = "AdditText1";
//												this.chgFields(sSelectedObject,sSelectedObject.AdditText1,fieldName);
                                    
                                      if(this.monShipArr.length !== 0){
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].AdditText1 !== sSelectedObject.AdditText1){
                                                 this.monShipArr[i].AdditText1  = sSelectedObject.AdditText1;
                                                
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                flag = 0;
                         
                        },
                        chgContainerId:function(oEvent){
                            var flag = 0;
                                    
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.ContainerId =oEvent.getSource().mProperties.value;
//												var fieldName = "AdditText1";
//												this.chgFields(sSelectedObject,sSelectedObject.AdditText1,fieldName);
                                    
                                      if(this.monShipArr.length !== 0){
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].ContainerId !== sSelectedObject.ContainerId){
                                                 this.monShipArr[i].ContainerId  = sSelectedObject.ContainerId;
                                                
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                flag = 0;
                         
                        },
                         
                        chgAmount:function(oEvent){
                            var i18n = this.getResourceBundle();
                            var amount = oEvent.getSource().getValue();
                            if(amount.indexOf("-") === 0){
                                MessageBox.error(i18n.getText("cost.Amount"));
                                return;
                            }
                            var decIndex=amount.indexOf(".");
                            if(amount.indexOf(".") !== -1){
                            var limitDecimal=decIndex+3;
                            if(amount.charAt(limitDecimal) !==""){
                                MessageBox.error(i18n.getText("cost.limit"));
                                return;
                            }
                            }
                        },
                        
                        //limit dec for invoice
                        chgAmountInv:function(oEvent){
                            var i18n = this.getResourceBundle();
                            var amount = oEvent.getSource().getValue();
                            var decIndex=amount.indexOf(".");
                            var limitDecimal=decIndex+3;
                            if(amount.indexOf(".")  !== -1){
                            if(amount.charAt(limitDecimal) !==""){
                                MessageBox.error(i18n.getText("cost.limit"));
                                return;
                            }
                            }
                        },
                        
                        //=======onchange dates
//									 CD #2000025529: add field end date in save
                        OnChgDtEndPlng:function(oEvent){
                            var flag = 0;
                            
                                    var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                                    sSelectedObject.DtEndPlng =oEvent.getSource().mProperties.dateValue;
//												
                                    if(sSelectedObject.ShpmntType === "Z004"){
                                      if(this.monShipArr.length !== 0){
                                          
                                         for(var i=0; i<this.monShipArr.length; i++){
                                             if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                                 flag = 1;
                                                 if(this.monShipArr[i].DtEndPlng !== sSelectedObject.DtEndPlng){
                                                 this.monShipArr[i].DtEndPlng  = sSelectedObject.DtEndPlng;
                                                
                                             }
                                             }
                                              
                                         }
                                        if(flag === 0){ 
                                         this.monShipArr.push(sSelectedObject);
                                        }
                                     }
                                     else{
                                    this.monShipArr.push(sSelectedObject);
                                     }
                                    
                                flag = 0;
                                    }
                    },	
//		end  CD #2000025529:add field end date in save							
        onChgPchkDt:function(oEvent){
                var flag = 0;
                
                        var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                        var shipmentTable = this.getView().byId("TblMonitorShipments");
                        var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
                        sSelectedObject.PlanShpmntComplDt =oEvent.getSource().mProperties.dateValue;
//									var fieldName = "PlanShpmntComplDt";
//									this.chgFields(sSelectedObject,sSelectedObject.PlanShpmntComplDt,fieldName);
                        
                          if(this.monShipArr.length !== 0){
                             for(var i=0; i<this.monShipArr.length; i++){
                                 if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
                                     flag = 1;
                                     if(this.monShipArr[i].PlanShpmntComplDt !== sSelectedObject.PlanShpmntComplDt){
                                     this.monShipArr[i].PlanShpmntComplDt  = sSelectedObject.PlanShpmntComplDt;
                                    
                                 }
                                 }
                                  
                             }
                            if(flag === 0){ 
                             this.monShipArr.push(sSelectedObject);
                            }
                         }
                         else{
                        this.monShipArr.push(sSelectedObject);
                         }
                    flag = 0; 
        },	
//RFC 7000008843------
        onChgAchkDt:function(oEvent){
            
//						this.getView().byId("PlannedArrivalDt").setValueState("None");
            var flag = 0;
//						  this.copyActtoPlannedDate = 0;
//						var sSelectedObject1=oEvent.getSource().getParent().getBindingContext().getObject();
            var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
            var shipmentTable = this.getView().byId("TblMonitorShipments");
            var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
        sSelectedObject.ActShpmntComplDt =oEvent.getSource().mProperties.dateValue;
//					var fieldName = "ActShpmntComplDt";
//					this.chgFields(sSelectedObject,sSelectedObject.ActShpmntComplDt,fieldName);
        var i18n = this.getResourceBundle();

          if(this.monShipArr.length != 0){
             for(var i=0; i<this.monShipArr.length; i++){
                //CD:2000027653:add Z005
                 if(sSelectedObject.ShpmntType === "Z006" || sSelectedObject.ShpmntType === "Z005")
                //end CD:2000027653:add Z005
                 {
                     if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum ){
                        //update recent date 
                    if(this.copyActtoPlannedDate === 1){
                        this.monShipArr[i].PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                    }	 
                         
                 if(sSelectedObject.PlanShpmntEndDt === null){
             
                 MessageBox.error(i18n.getText("ArrivalDate"));
                 
                 }
                
                 if(sSelectedObject.PlanShpmntComplDt === null && sSelectedObject.PlanShpmntEndDt !== null){
//								 if(sSelectedObject.PlanShpmntComplDt === null || this.copyActtoPlannedDate === 1 ){
                     this.monShipArr[i].PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                     this.copyActtoPlannedDate = 1;
                     }
                 }
                //as below format is same in each if condition; condition-this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum has to keep separate as still changes are going on. 
                     if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum ){
                         flag = 1;
                         if(sSelectedObject.PlanShpmntComplDt === null && sSelectedObject.PlanShpmntEndDt !== null){
                             this.monShipArr[i].PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                         }
                         if( this.monShipArr[i].ActShpmntComplDt !== sSelectedObject.ActShpmntComplDt){
                        
                         this.monShipArr[i].ActShpmntComplDt  = sSelectedObject.ActShpmntComplDt;
                             
                     }
                     }
                      
                 
                    /*if(flag === 0){ 
                         this.monShipArr.push(sSelectedObject);
                        }*/
                     
                
                 }
                 //if planning end date is empty set this date to planning end date
                 else if(sSelectedObject.ShpmntType === "Z004")
                 {
                 if(sSelectedObject.DtEndPlng === null){
                     this.monShipArr[i].DtEndPlng = sSelectedObject.ActShpmntComplDt;
                 }

                 
                 if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum ){
                     flag = 1;
                     if(sSelectedObject.PlanShpmntComplDt === null || this.copyActtoPlannedDate === 1){
                         this.monShipArr[i].PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                         this.copyActtoPlannedDate = 1;
                     }
                     if( this.monShipArr[i].ActShpmntComplDt !== sSelectedObject.ActShpmntComplDt){
                        
                     this.monShipArr[i].ActShpmntComplDt  = sSelectedObject.ActShpmntComplDt;
                         
                 }
                 }
                  
             
                /*if(flag === 0){ 
                     this.monShipArr.push(sSelectedObject);
                    }*/
                 
                 }
                 
                // save updated date in array 
                 else{ 
                 
                 if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum ){
                     flag = 1;
                     if(sSelectedObject.PlanShpmntComplDt === null){
                         this.monShipArr[i].PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                     }
                     if( this.monShipArr[i].ActShpmntComplDt !== sSelectedObject.ActShpmntComplDt){
                        
                     this.monShipArr[i].ActShpmntComplDt  = sSelectedObject.ActShpmntComplDt;
                         
                 }
                 }
                  
             
                /*if(flag === 0){ 
                     this.monShipArr.push(sSelectedObject);
                    }*/
                 }
             }	
             
             //to give error message for blank planned arrival date
            //CD:2000027653:add Z005
             if(sSelectedObject.ShpmntType === "Z005" || sSelectedObject.ShpmntType === "Z006")
                //end CD:2000027653:add Z005
             {
                 if(flag === 0){ 
             if(sSelectedObject.PlanShpmntEndDt === null){
                 MessageBox.error(i18n.getText("ArrivalDate"));
                                                         }
             else{
                 this.monShipArr.push(sSelectedObject);
             }
              }
             }
             else{
                 this.monShipArr.push(sSelectedObject);
             }
             
         }
         else{
            //CD:2000027653:add Z005
             if(sSelectedObject.ShpmntType === "Z006" || sSelectedObject.ShpmntType === "Z005")
            // end CD:2000027653:	 
             {
             if(sSelectedObject.PlanShpmntEndDt === null){ 
                 MessageBox.error(i18n.getText("ArrivalDate"));
             }
            
             if(sSelectedObject.PlanShpmntComplDt === null && sSelectedObject.PlanShpmntEndDt !== null){
//							 if(sSelectedObject.PlanShpmntComplDt === null || this.copyActtoPlannedDate === 1 ){
                 sSelectedObject.PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                 this.copyActtoPlannedDate = 1;
             }
             this.monShipArr.push(sSelectedObject);
             }
             
             else if(sSelectedObject.ShpmntType === "Z004")
             {
             if(sSelectedObject.DtEndPlng === null){
                 sSelectedObject.DtEndPlng = sSelectedObject.ActShpmntComplDt;
             }
            
             if(sSelectedObject.PlanShpmntComplDt === null || this.copyActtoPlannedDate === 1){
                 sSelectedObject.PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                 this.copyActtoPlannedDate = 1;
             }
                this.monShipArr.push(sSelectedObject);
             }

             
             
             else{
                 if(sSelectedObject.PlanShpmntComplDt === null){
                     sSelectedObject.PlanShpmntComplDt = sSelectedObject.ActShpmntComplDt;
                     this.copyActtoPlannedDate = 1;
                 }
        this.monShipArr.push(sSelectedObject);
             }
         }
flag = 0;			 
},	
//----------
onChgPdepDt:function(oEvent){

var flag = 0;
//		var sSelectedObject1=oEvent.getSource().getParent().getBindingContext().getObject();
var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
var shipmentTable = this.getView().byId("TblMonitorShipments");
var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
sSelectedObject.PlanShpmntStartDt = oEvent.getSource().mProperties.dateValue;
//	var fieldName = "PlanShpmntStartDt";
//	this.chgFields(sSelectedObject,sSelectedObject.PlanShpmntStartDt,fieldName);

if(this.monShipArr.length !== 0){
for(var i=0; i<this.monShipArr.length; i++){
 if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
     flag =1;
     if( this.monShipArr[i].PlanShpmntStartDt !== sSelectedObject.PlanShpmntStartDt){
     this.monShipArr[i].PlanShpmntStartDt  = sSelectedObject.PlanShpmntStartDt;
 }
 }
 
}
if(flag === 0){ 
 this.monShipArr.push(sSelectedObject);
}
}
else{
this.monShipArr.push(sSelectedObject);
}
flag = 0; 

},	
//----------
onChgAdepDt:function(oEvent){
//		this.getView().byId("PlannedArrivalDt").setValueState("None");
var flag = 0;
//		  this.copyActtoPlannedDateDep = 0;
//		var sSelectedObject1=oEvent.getSource().getParent().getBindingContext().getObject();
var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
var shipmentTable = this.getView().byId("TblMonitorShipments");
var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
sSelectedObject.ActShpmntStartDt = oEvent.getSource().mProperties.dateValue;
var i18n = this.getResourceBundle();

//	var fieldName = "ActShpmntStartDt";
//	this.chgFields(sSelectedObject,sSelectedObject.ActShpmntStartDt,fieldName);

if(this.monShipArr.length != 0){
for(var i=0; i<this.monShipArr.length; i++){
 
 
 if(sSelectedObject.ShpmntType === "Z005" || sSelectedObject.ShpmntType === "Z006")
     {
     //below if condition is added to avoid repetition of error msg
     if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum ){
     if(sSelectedObject.PlanShpmntEndDt === null){
         
         /*this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
            this.copyActtoPlannedDateDep = 1;*/
         
         if(this.copyActtoPlannedDateDep === 1){
             this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
         }
         
        /* sSelectedObject.ActShpmntStartDt=null;
         this.getView().byId("ActualDepartureDt").setValue(null);*/
         
         MessageBox.error(i18n.getText("ArrivalDate"));
//					 this.getView().byId("PlannedArrivalDt").setValueState("Error");
    /*	 
         sSelectedObject.ActShpmntStartDt=null;
         this.monShipArr[i].ActShpmntStartDt=null;
         this.getView().byId("ActualDepartureDt").setValue(null);*/
     }
    
 if(sSelectedObject.PlanShpmntStartDt === null && sSelectedObject.PlanShpmntEndDt !== null){  
//			 if(sSelectedObject.PlanShpmntStartDt === null || this.copyActtoPlannedDateDep === 1){  
        this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
        this.copyActtoPlannedDateDep = 1;
 } 
     }
    //as below format is same in each if condition; condition-this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum has to keep separate as still changes are going on. 
         if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
             flag = 1;
             if(sSelectedObject.PlanShpmntStartDt === null && sSelectedObject.PlanShpmntEndDt !== null){  
                    this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
                }
             if( this.monShipArr[i].ActShpmntStartDt !== sSelectedObject.ActShpmntStartDt){
                     
             this.monShipArr[i].ActShpmntStartDt  = sSelectedObject.ActShpmntStartDt;
         }
         }
     
    /* if(flag === 0){ 
         this.monShipArr.push(sSelectedObject);
        }*/
         
        
        
    
     }
 
 //if planning end date is empty set this date to planning end date
 else if(sSelectedObject.ShpmntType === "Z004")
 {
 if(sSelectedObject.DtEndPlng === null){
     this.monShipArr[i].DtEndPlng = sSelectedObject.ActShpmntStartDt;
 }

     if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
     flag = 1;
     if(sSelectedObject.PlanShpmntStartDt === null || this.copyActtoPlannedDateDep === 1){  
            this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
            this.copyActtoPlannedDateDep =1;
        }
     if( this.monShipArr[i].ActShpmntStartDt !== sSelectedObject.ActShpmntStartDt){
              
     this.monShipArr[i].ActShpmntStartDt  = sSelectedObject.ActShpmntStartDt;
 }
 }

/* if(flag === 0){ 
 this.monShipArr.push(sSelectedObject);
         }*/
         
 
 }
 
// save updated date in array 
 
 else{
 if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
     flag = 1;
     if(sSelectedObject.PlanShpmntStartDt === null){  
            this.monShipArr[i].PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
            this.copyActtoPlannedDateDep = 1;
        }
     if( this.monShipArr[i].ActShpmntStartDt !== sSelectedObject.ActShpmntStartDt){
              
     this.monShipArr[i].ActShpmntStartDt  = sSelectedObject.ActShpmntStartDt;
 }
 }

/* if(flag === 0){ 
 this.monShipArr.push(sSelectedObject);
}*/
 }
}



if(sSelectedObject.ShpmntType === "Z005" || sSelectedObject.ShpmntType === "Z006")
{
 if(flag === 0){ 
if(sSelectedObject.PlanShpmntEndDt === null){
 MessageBox.error(i18n.getText("ArrivalDate"));
                                         }
else{
 this.monShipArr.push(sSelectedObject);
}
                 }
}
else{
 this.monShipArr.push(sSelectedObject);
}
 

}
else{
if(sSelectedObject.ShpmntType === "Z005" || sSelectedObject.ShpmntType === "Z006")
{
if(sSelectedObject.PlanShpmntEndDt === null){
 
/*	 sSelectedObject.ActShpmntStartDt=null;
 this.getView().byId("ActualDepartureDt").setValue(null);*/
 
 MessageBox.error(i18n.getText("ArrivalDate"));
//			 this.getView().byId("PlannedArrivalDt").setValueState("Error");
/* sSelectedObject.ActShpmntStartDt=null;
 this.getView().byId("ActualDepartureDt").setValue(null);*/
}

if(sSelectedObject.PlanShpmntStartDt === null && sSelectedObject.PlanShpmntEndDt !== null){  
//			 if(sSelectedObject.PlanShpmntStartDt === null){  
 sSelectedObject.PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
 this.copyActtoPlannedDateDep = 1;
} 
this.monShipArr.push(sSelectedObject);

}
//if planning end date is empty set this date to planning end date
else if(sSelectedObject.ShpmntType === "Z004")
{
if(sSelectedObject.DtEndPlng === null){
 sSelectedObject.DtEndPlng = sSelectedObject.ActShpmntStartDt;
}
if(sSelectedObject.PlanShpmntStartDt === null || this.copyActtoPlannedDateDep === 1){  
 sSelectedObject.PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
 this.copyActtoPlannedDateDep =1;
}
this.monShipArr.push(sSelectedObject);
}

// save updated date in array 

else{
 if(sSelectedObject.PlanShpmntStartDt === null){  
     sSelectedObject.PlanShpmntStartDt = sSelectedObject.ActShpmntStartDt;
     this.copyActtoPlannedDateDep = 1;
    }
 this.monShipArr.push(sSelectedObject);
}



}



flag = 0; 
},	

//----------
onChgParrDt:function(oEvent){
//	this.getView().byId("PlannedArrivalDt").setValueState("None");
var flag = 0;
//	var sSelectedObject1=oEvent.getSource().getParent().getBindingContext().getObject();
var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
var shipmentTable = this.getView().byId("TblMonitorShipments");
var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
sSelectedObject.PlanShpmntEndDt = oEvent.getSource().mProperties.dateValue;
//var fieldName = "PlanShpmntEndDt";
//this.chgFields(sSelectedObject,sSelectedObject.PlanShpmntEndDt,fieldName);

if(this.monShipArr.length != 0){
for(var i=0; i<this.monShipArr.length; i++){

if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
 flag = 1;
 if( this.monShipArr[i].PlanShpmntEndDt !== sSelectedObject.PlanShpmntEndDt){
 this.monShipArr[i].PlanShpmntEndDt  = sSelectedObject.PlanShpmntEndDt;
}
}

}
if(flag === 0){ 
this.monShipArr.push(sSelectedObject);
}
}
else{

this.monShipArr.push(sSelectedObject);
}
flag = 0; 
},	

//----------
onChgAarrDt:function(oEvent){

var flag = 0;
//	var sSelectedObject1=oEvent.getSource().getParent().getBindingContext().getObject();
var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
var shipmentTable = this.getView().byId("TblMonitorShipments");
var sSelectedObject = shipmentTable.getModel().getProperty(sPath);
sSelectedObject.ActShpmntEndDt = oEvent.getSource().mProperties.dateValue;
//var fieldName = "ActShpmntEndDt";
//this.chgFields(sSelectedObject,sSelectedObject.ActShpmntEndDt,fieldName);
/*if(sSelectedObject.PlanShpmntEndDt === null){ // 
this.monShipArr[i].PlanShpmntEndDt =  sSelectedObject.ActShpmntEndDt;
}*/
if(this.monShipArr.length != 0){
for(var i=0; i<this.monShipArr.length; i++){


//if planning end date is empty set this date to planning end date
if(sSelectedObject.ShpmntType === "Z004")
{
if(sSelectedObject.DtEndPlng === null){
 this.monShipArr[i].DtEndPlng = sSelectedObject.ActShpmntEndDt;
}
}

// save updated date in array 


if(sSelectedObject.PlanShpmntEndDt === null ||  this.copyPldArrToActArrDate === 1){  
 this.monShipArr[i].PlanShpmntEndDt =  sSelectedObject.ActShpmntEndDt;
 this.copyPldArrToActArrDate = 1;
}


if(this.monShipArr[i].ShipmentNum === sSelectedObject.ShipmentNum){
 flag =1;
 if(this.monShipArr[i].ActShpmntEndDt !== sSelectedObject.ActShpmntEndDt){
     if(sSelectedObject.PlanShpmntEndDt === null){ // 
         this.monShipArr[i].PlanShpmntEndDt =  sSelectedObject.ActShpmntEndDt;
     }
 this.monShipArr[i].ActShpmntEndDt  = sSelectedObject.ActShpmntEndDt;
}
}
}
if(flag === 0){ 

this.monShipArr.push(sSelectedObject);
}
}
else{
if(sSelectedObject.PlanShpmntEndDt === null){  
sSelectedObject.PlanShpmntEndDt =  sSelectedObject.ActShpmntEndDt;
this.copyPldArrToActArrDate =  1;
}
//if planning end date is empty set this date to planning end date
if(sSelectedObject.ShpmntType === "Z004")
{
if(sSelectedObject.DtEndPlng === null){
 sSelectedObject.DtEndPlng = sSelectedObject.ActShpmntEndDt;
}
}


this.monShipArr.push(sSelectedObject);
}
flag = 0; 
},	
        
                        
//------------------------------Batch update functionality-------------------------------------
 //-----------------------------------Ship From Country Fragment---------------------------------              
 handleShipFromCountryF4Open : function(oEvent){
        var url="/F4_CountrySet",title="Ship From Country";
        if(!this.VHFromCountryDialog){
            this.VHFromCountryDialog = sap.ui.xmlfragment("fragment5","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.SelectionScreenShipFromCountry",this);
             this.getView().addDependent(this.VHFromCountryDialog);
        }
        
        this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel(),url,['Country_Code','Country'],'',title,this.VHFromCountryDialog);
        this.setSelectionScreenVariantEditMode();
    },  
 //------------------------------------------------------------------------------------------------- 
 handleIEPreClrF4Open :function(oEvent){
     var url="/F4_IE_Pre_ClearanceSet",title="I/E PreClearance Status";
     if(!this.VHIEDialog){
         this.VHIEDialog = sap.ui.xmlfragment("fragment2","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.DialogIEPreClr",this);
          this.getView().addDependent(this.VHIEDialog);
     }
     
       this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel(),url,['IE_PreClear_Code','IE_PreClear_Desc'],'',title,this.VHIEDialog);
       this.setSelectionScreenVariantEditMode();
 },
 
 //------------------------------------------------------------------------------------------------- 
 handleFreightForwarderF4Open :function(oEvent){
     var url="/F4_FwdAgentSet",title="Freight Forwarding Agent";
     if(!this.VHFWDialog){
         this.VHFWDialog = sap.ui.xmlfragment("fragment9","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.ForwardingAgent",this);
          this.getView().addDependent(this.VHFWDialog);
     }
     
       this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel("frghtForwarderModel"),url,['FwdAgent','FwdAgntName'],'',title,this.VHFWDialog);
       this.setSelectionScreenVariantEditMode();
 },
 
//------------------------------------------------------------------------------------------------- 
 handleSHStatusF4Open : function(oEvent){
     var url="/F4_Shipment_StatusSet",title="Shipment Status";
     if(!this.VHSHDialog){
         this.VHSHDialog = sap.ui.xmlfragment("fragment3","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.DialogSHStatus",this);
          this.getView().addDependent(this.VHSHDialog);
     }
    
      this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel(),url,['Ship_Status_Code','Ship_Status_Desc'],'',title,this.VHSHDialog);
      this.setSelectionScreenVariantEditMode();
 },
//-------------------------------------------------------------------------------------------------     
 
 handleShipToCountryF4Open : function(oEvent){
     var url="/F4_CountrySet",title="Country";
     if(!this.VHCountryDialog){
         this.VHCountryDialog = sap.ui.xmlfragment("fragment4","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.DialogSHCountry",this);
          this.getView().addDependent(this.VHCountryDialog);
     }
     
     this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel(),url,['Country_Code','Country'],'',title,this.VHCountryDialog);
     this.setSelectionScreenVariantEditMode();
     
 },
//-------------------------------------------------------------------------------------------------     
 
 handlePlantsF4Open : function(oEvent){
     var url="/F4_PlantSet",title="Shipment Plants";
     if(!this.PlantDialog){
         this.PlantDialog = sap.ui.xmlfragment("fragment8","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.Plant",this);
          this.getView().addDependent(this.PlantDialog);
     }
    //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
     var selectedDirectSales = this.getView().byId("chkBoxId_DirectSalesOnly").getSelected();
     var urlParams = {
                 $filter:"DirectSales eq "+ selectedDirectSales
             };
    //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
     this.handleValueHelpOpen(oEvent,this.getOwnerComponent().getModel(),url,['Plant','Name'],urlParams,title,this.PlantDialog,selectedDirectSales);
     this.setSelectionScreenVariantEditMode();
 },
 
 selectionScreenShipNoChange : function(){
    this.setSelectionScreenVariantEditMode();
 },
 
 onSelectionScreenTokenChange : function(){
     this.setSelectionScreenVariantEditMode();
 },
 
 handleSelectionScreenChangeDate : function(){
     this.setSelectionScreenVariantEditMode();
 },
//----------------------------------generic methods for Value help F4------------------------------
 handleValueHelpOpen:function(oEvent,model,url,columns,urlParams,title,oDialog,selectedDirectSales){
      var that=this;
      this._InputId = oEvent.oSource.sId;
      this._InputSource = oEvent.oSource;
      
      var selectedTokens = that.byId(that._InputId).getTokens();
      var i18n = this.getResourceBundle();
      //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
    if(title === "Shipment Plants"){
          this.getModel('PlantModel').setData([]);
        this.getModel('PlantModel').refresh(true);
    }
    //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
        
            readOdataAndReturnPromise(model, url,urlParams).done(
              function(response) {
                  var aData = response.results;
                  aData.forEach(function(currentValue,index){
                      currentValue['Title']=currentValue[columns[0]];
                      currentValue['Desc']=columns[1]?currentValue[columns[1]]:'';
                      
                      //currentValue['Selected'] = false;
                      for(var i = 0 ; i < selectedTokens.length; i++){
                      //Start of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                          if(selectedDirectSales && title === i18n.getText("shipmentPlants")){
                              currentValue['Selected'] = true;
                          }
                      //End of GAP#6000000204,DIS-G-54784:LH Fiori Dashboard - Enable actual cost submission - Direct Sales Only
                          else{
                          if(selectedTokens[i].getProperty("key") === currentValue.Title)
                              currentValue['Selected'] = true;
                          }
                      }
                      
                  });
                  
                  if(title === "Ship From Country"){
                     if(response.results.length>100)
                          that.getModel('SHFromCountryModel').setSizeLimit(response.results.length);
                     that.getModel('SHFromCountryModel').setData(aData);
                      that.getModel('SHFromCountryModel').refresh(true);
                  }else if(title === "I/E PreClearance Status"){
                      if(response.results.length>100)
                           that.getModel('IEVHModel').setSizeLimit(response.results.length);
                      that.getModel('IEVHModel').setData(aData);
                       that.getModel('IEVHModel').refresh(true);
                  }else if(title === "Shipment Status"){
                      if(response.results.length>100)
                           that.getModel('SHStatusModel').setSizeLimit(response.results.length);
                      that.getModel('SHStatusModel').setData(aData);
                       that.getModel('SHStatusModel').refresh(true);
                  }else if(title === "Freight Forwarding Agent"){
                      if(response.results.length>100)
                           that.getModel('FFVHModel').setSizeLimit(response.results.length);
                      that.getModel('FFVHModel').setData(aData);
                       that.getModel('FFVHModel').refresh(true);
                  }else if(title === "Country"){
                      if(response.results.length>100)
                           that.getModel('SHCountryModel').setSizeLimit(response.results.length);
                      that.getModel('SHCountryModel').setData(aData);
                       that.getModel('SHCountryModel').refresh(true);
                  }
                  else if(title === "Shipment Plants"){
                  
                        if(response.results.length>100)
                               that.getModel('PlantModel').setSizeLimit(response.results.length);
                            var aData = response.results;
                            that.getModel('PlantModel').setData(aData);
                           that.getModel('PlantModel').refresh(true);
                    }
                  
              })
              .fail(
                      function(oError) {
                          oDialog.setBusy(false);
                          var message = JSON.parse(oError.responseText);
                          MessageBox.error(
                                          message.error.message.value,
                                          {
                                              styleClass : "sapUiSizeCompact"
                                          });
      });
 //}
      // open value help dialog
      oDialog.open();
      oDialog.setTitle(title);
      
  },
      
  handleValueHelpSearch : function (evt) {
      var sValue = evt.getParameter("value");
      var oFilters=[new Filter([
      new Filter("Title",sap.ui.model.FilterOperator.Contains, sValue),
      new Filter("Desc",sap.ui.model.FilterOperator.Contains, sValue)],false)];
      evt.getSource().getBinding("items").filter(oFilters);
  },

  handleValueHelpClose : function (evt) {
      var oSelectedContexts = evt.getParameter("selectedContexts"),newToken = new Token({text: "", key: ""}),tokenArray = [],sPath,title,description;
      if (oSelectedContexts) {
          var _InputId = sap.ui.getCore().byId(this._InputId);
          
          for(var i = 0;i < oSelectedContexts.length;i++){
              newToken = new Token({text: "", key: ""});
              sPath = oSelectedContexts[i].sPath;
              title = oSelectedContexts[i].getModel().getProperty(sPath).Title;
              description = oSelectedContexts[i].getModel().getProperty(sPath).Desc;
              newToken.setKey(title);
              newToken.setText(description);
              tokenArray.push(newToken);
          }
          
          _InputId.setTokens(tokenArray);
      }
      
      //_InputId.setValue(oSelectedItem.getTitle());
      evt.getSource().getBinding("items").filter([]);
  
  },
  
/*	//start of changes CD #2000025529: variant management
    onPerscoDonePressed: function(oEvent) {
        this.oTablepersoService .savePersonalizations();
        },
        //end of changes CD #2000025529: variant management
*/  
//----------------------------On click of FA Tracking ID button-------------------------------
    onPressFATrackIdBtn:function(oEvt){
    
        var i18n = this.getResourceBundle();
    var tableShipmentContent = this.getView().byId("TblMonitorShipments");
    var fATrackingIdUrl = this.getModel().getProperty(oEvt.getSource().getBindingContext().getPath()).TndrTrkid;				
    window.open(fATrackingIdUrl, "", false);
        
    },
//---------------------------batch update on save------------------------------------------------------------------     
    onClickUpdateShipmentSAVE:function(oEvent){
        
        var shipNumber;
         var updateToSave = 0;
         var that = this;
         var i18n = this.getResourceBundle();
          var batchChanges = [];
         var oBusyDialog = new sap.m.BusyDialog();
        oBusyDialog.open();
         //var oModel= this.getOwnerComponent().getModel(); 
          
             var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                 pattern: "yyyy-MM-ddTHH:mm:ss"
                             }); 
              
             if(this.monShipArr.length !== 0){
          
         for(var i = 0; i<this.monShipArr.length; i++){

        
            var oEntry= {};
            oEntry.ShipmentNum = this.monShipArr[i].ShipmentNum;
            oEntry.TndrTrkid = this.monShipArr[i].TndrTrkid;
            oEntry.ShippingTyp = this.monShipArr[i].ShippingTyp;
            oEntry.ContainerId = this.monShipArr[i].ContainerId;
            
            var referDate = this.monShipArr[i].CreationDt;
            
//					 CD #2000025529:add field end date	
            if(this.monShipArr[i].DtEndPlng){
                oEntry.DtEndPlng = oFormat.format(this.monShipArr[i].DtEndPlng); 
            }
            else{
                oEntry.DtEndPlng = null;
            }
//					end  CD #2000025529 : add field end date				
            if(this.monShipArr[i].PlanShpmntComplDt){
                oEntry.PlanShpmntComplDt = oFormat.format(this.monShipArr[i].PlanShpmntComplDt); 
            }
            else if((this.copyActtoPlannedDateDep === 1 || this.copyActtoPlannedDate === 1) || this.monShipArr[i].PlanShpmntEndDt !== null){
//							oEntry.PlanShpmntComplDt = this.monShipArr[i].PlanShpmntComplDt;
                oEntry.PlanShpmntComplDt = this.monShipArr[i].ActShpmntComplDt;
            }
            else{
                oEntry.PlanShpmntComplDt = null;
            }
            
            /*if(this.monShipArr[i].ActShpmntComplDt){
                //error message if plan shipment end date is blank,don't pass actual shipment completion date to save
                
                if(this.monShipArr[i].OverallStatus === "1" && (this.monShipArr[i].ShpmntType === "Z005" || this.monShipArr[i].ShpmntType === "Z006")){
                if(this.monShipArr[i].PlanShpmntEndDt){
                oEntry.ActShpmntComplDt = oFormat.format(this.monShipArr[i].ActShpmntComplDt); 
                }
                else{
//								 MessageBox.error(i18n.getText("ArrivalDate"));	
//								 MessageBox.error(this.monShipArr[i].ShipmentNum +"Please enter Planned arrival date");	
                     MessageBox.error("Shipment Number: '"+this.monShipArr[i].ShipmentNum+"' :Please enter Planned arrival date");	
                    if(i === this.monShipArr.length-1){
                        updateToSave = 1;
                        shipNumber = this.monShipArr[i].ShipmentNum;
                     continue;
                    }
                    else{
                        continue;
                    }
                }
                }
                
                else{
                    oEntry.ActShpmntComplDt = oFormat.format(this.monShipArr[i].ActShpmntComplDt); 
                }
                //end
                
            }
            else{
//							oEntry.ActShpmntComplDt = this.monShipArr[i].ActShpmntComplDt;
                oEntry.ActShpmntComplDt = null;
            }*/
            
            if(this.monShipArr[i].PlanShpmntStartDt){
            oEntry.PlanShpmntStartDt = oFormat.format(this.monShipArr[i].PlanShpmntStartDt);
            }
            else if((this.copyActtoPlannedDateDep === 1 || this.copyActtoPlannedDate === 1) || this.monShipArr[i].PlanShpmntEndDt !== null){
//							oEntry.PlanShpmntStartDt = this.monShipArr[i].PlanShpmntStartDt;
                oEntry.PlanShpmntStartDt = this.monShipArr[i].ActShpmntStartDt;
            }
            else{
                oEntry.PlanShpmntStartDt = null;
            }
        /*	if(this.monShipArr[i].ActShpmntStartDt){
                
                //error message if plan shipment end date is blank,don't pass actual shipment completion date to save
                if(this.monShipArr[i].OverallStatus === "1" && (this.monShipArr[i].ShpmntType === "Z005" || this.monShipArr[i].ShpmntType === "Z006")){
                if(this.monShipArr[i].PlanShpmntEndDt){	
            oEntry.ActShpmntStartDt =  oFormat.format(this.monShipArr[i].ActShpmntStartDt);
                }
                else{
//								MessageBox.error(i18n.getText("ArrivalDate"));
                     MessageBox.error("Shipment Number '"+this.monShipArr[i].ShipmentNum+"' :Please enter Planned arrival date");	
                        if(i === this.monShipArr.length-1){
                            updateToSave = 1;
                            shipNumber = this.monShipArr[i].ShipmentNum;
                             continue;
                            }
                            else{
                                continue;
                            }
                }
            }
                
                else{
                    oEntry.ActShpmntStartDt =  oFormat.format(this.monShipArr[i].ActShpmntStartDt);
                }
            }
            else{
//							oEntry.ActShpmntStartDt = this.monShipArr[i].ActShpmntStartDt;
                oEntry.ActShpmntStartDt = null;
            }*/
            
            if(this.monShipArr[i].PlanShpmntEndDt){
            oEntry.PlanShpmntEndDt =  oFormat.format(this.monShipArr[i].PlanShpmntEndDt);
            }
            else{
//							oEntry.PlanShpmntEndDt = this.monShipArr[i].PlanShpmntEndDt;	
                oEntry.PlanShpmntEndDt = null;	
            }
            if(this.monShipArr[i].ActShpmntEndDt){
            oEntry.ActShpmntEndDt =  oFormat.format(this.monShipArr[i].ActShpmntEndDt);
            }
            else{
//							oEntry.ActShpmntEndDt =this.monShipArr[i].ActShpmntEndDt;
                oEntry.ActShpmntEndDt = null;
            }
            
        
        
            oEntry.OverallStatus = this.monShipArr[i].OverallStatus;
            oEntry.OvrStaText = this.monShipArr[i].OvrStaText;
             
            oEntry.AdditText1 = this.monShipArr[i].AdditText1;
            oEntry.AdditText2 = this.monShipArr[i].AdditText2;
            oEntry.AdditText3 = this.monShipArr[i].AdditText3;
            
            //update act date
            
            if(this.monShipArr[i].ActShpmntComplDt){
                //error message if plan shipment end date is blank,don't pass actual shipment completion date to save
                
                if(this.monShipArr[i].OverallStatus === "1" && (this.monShipArr[i].ShpmntType === "Z005" || this.monShipArr[i].ShpmntType === "Z006")){
                if(this.monShipArr[i].PlanShpmntEndDt){
                oEntry.ActShpmntComplDt = oFormat.format(this.monShipArr[i].ActShpmntComplDt); 
                }
                else{
//								 MessageBox.error(i18n.getText("ArrivalDate"));	
//								 MessageBox.error(this.monShipArr[i].ShipmentNum +"Please enter Planned arrival date");	
//								 MessageBox.error("Shipment Number: '"+this.monShipArr[i].ShipmentNum+"' :Please enter Planned arrival date");	
                    if(i === this.monShipArr.length-1){
                        updateToSave = 1;
                        shipNumber = this.monShipArr[i].ShipmentNum;
                     continue;
                    }
                    else{
                        continue;
                    }
                }
                }
                
                else{
                    oEntry.ActShpmntComplDt = oFormat.format(this.monShipArr[i].ActShpmntComplDt); 
                }
                //end
                
            }
            else{
//							oEntry.ActShpmntComplDt = this.monShipArr[i].ActShpmntComplDt;
                oEntry.ActShpmntComplDt = null;
            }
            
            if(this.monShipArr[i].ActShpmntStartDt){
                
                //error message if plan shipment end date is blank,don't pass actual shipment completion date to save
                if(this.monShipArr[i].OverallStatus === "5" && (this.monShipArr[i].ShpmntType === "Z005" || this.monShipArr[i].ShpmntType === "Z006")){
                if(this.monShipArr[i].PlanShpmntEndDt){	
            oEntry.ActShpmntStartDt =  oFormat.format(this.monShipArr[i].ActShpmntStartDt);
                }
                else{
//								MessageBox.error(i18n.getText("ArrivalDate"));
//								 MessageBox.error("Shipment Number '"+this.monShipArr[i].ShipmentNum+"' :Please enter Planned arrival date");	
                        if(i === this.monShipArr.length-1){
                            updateToSave = 1;
                            shipNumber = this.monShipArr[i].ShipmentNum;
                             continue;
                            }
                            else{
                                continue;
                            }
                }
            }
                
                else{
                    oEntry.ActShpmntStartDt =  oFormat.format(this.monShipArr[i].ActShpmntStartDt);
                }
            }
            else{
//							oEntry.ActShpmntStartDt = this.monShipArr[i].ActShpmntStartDt;
                oEntry.ActShpmntStartDt = null;
            }	
            
            
            //
            
            
            
            
            
                this.getMainModel().setDeferredGroups(["updateSave"]);
                this.getMainModel().setChangeGroups({	
            "ShipmentSet": {
                groupId: "updateSave",  
                changeSetId: i+1
            }
        });
            
            this.getMainModel().update("/ShipmentSet('"+this.monShipArr[i].ShipmentNum+"')",oEntry,{
            groupId: "updateSave",  
            changeSetId: i+1
        });
         }
         
         //if come from continue /break statement
         if(updateToSave === 1){
      this.getMainModel().setDeferredGroups(["updateSave"]);
        this.getMainModel().setChangeGroups({	
    "ShipmentSet": {
        groupId: "updateSave",  
        changeSetId: i+1
    }
});
    
    this.getMainModel().update("/ShipmentSet('"+shipNumber+"')",oEntry,{
    groupId: "updateSave",  
    changeSetId: i+1
}); 
       shipNumber = null;
       updateToSave = 0;

         }  
         //end of continue
         
         //Submit Changes for Batch update
    //	this.handleSubmitChangesBatchUpdate(this.getMainModel(),"updateSave");
         var oModel = this.getMainModel();
         oModel.submitChanges({groupId: "updateSave",
            
            success:function(data){
                 var successArr =[];
                    var faliureArr = [];
                    for(var i= 0; i<=data.__batchResponses.length-1; i++){
                        if(data.__batchResponses[i].message){
                               
                            if(data.__batchResponses[i].response.statusCode !== "204"){
                                if(data.__batchResponses[i].response.headers.shipmentnum){
                                faliureArr.push(data.__batchResponses[i].response.headers.shipmentnum);
                                }
                            }
                            
                        }	
                        else{
                            if(data.__batchResponses[i].__changeResponses){
                             if(data.__batchResponses[i].__changeResponses[0].statusCode === "204"){
                                 if(data.__batchResponses[i].__changeResponses){//replace [0] by [i] to generalize
                                 if(data.__batchResponses[i].__changeResponses[0].headers.shipmentnum){	
                                     
                                 successArr.push(data.__batchResponses[i].__changeResponses[0].headers.shipmentnum);
                                     }
                                 }
                                }
                        }//1st if
                        }
                    }
                    
                    var oTabMonShipTable = that.getView().byId("TblMonitorShipments");
                    var keys = Object.keys(oTabMonShipTable.getModel().oData);
                    for(var rowIndex = 0 ;rowIndex<keys.length;rowIndex++){
                        //Set the value state of all the shipments in the monitor shipment table to Default by setting the flaf to "N"
                        if(keys[rowIndex].indexOf("ShipmentSet(")>=0){
                            oTabMonShipTable.getModel().oData[keys[rowIndex]].flag = "N";
                        }
                    }
                    
                    if(successArr.length !== 0){
                        var truncateZeroSucShip = [];
                        for(var r=0; r < successArr.length; r++){
                            truncateZeroSucShip.push(successArr[r].replace(/^0+/, '')); //Truncate the leading zeros in the success Array
                            var successShipNums = truncateZeroSucShip.toString();
                        }
                        MessageBox.success(
                                "Shipment Numbers: '"+successShipNums+"' Updated successfully!", {
                                    title: "Success",
//							    				onClose: null
                                    onClose: function(oAction){
                                        oBusyDialog.close();//Close the busy indicator so that user will not be able to click on any control
                                    }
                                }
                                
                            );
                        
                        for(var index=0; index < that.monShipArr.length; index++){
                    
                            //********following line has been commented for the app to run in IE browser as includes is not recognized******//
                            
                            //if(truncateZeroSucShip.includes(that.MonShipArr[index].ShipmentNum))
                            if(truncateZeroSucShip.indexOf(that.monShipArr[index].ShipmentNum) !== -1)
                                //*********following line has been commented for the app to run in IE browser as includes is not recognized*******// 
                                //if(truncateZeroSucShip.includes(that.MonShipArr[index].ShipmentNum)){
                                if(truncateZeroSucShip.indexOf(that.monShipArr[index].ShipmentNum) !== -1){//check if the shipment is updated with success  
                                oTabMonShipTable.getModel().oData["ShipmentSet('"+that.monShipArr[index].ShipmentNum+"')"].flag = "S";//if yes then set the custom property flag to S
                            }
                            
                            else{
                                oTabMonShipTable.getModel().oData["ShipmentSet('"+that.monShipArr[index].ShipmentNum+"')"].flag = "E";//if error then set the custom property to E
                            }
                        }
                    }
                    
                    if (faliureArr.length !== 0){
                        var truncateZeroFailShip =[];
                        for(var k=0; k < faliureArr.length; k++){
                             truncateZeroFailShip.push(faliureArr[k].replace(/^0+/, ''));//Truncate the leading zeros in the failiure Array
                                var failiureShipNums = truncateZeroFailShip.toString();
                            
                        }
                        oBusyDialog.close();
                    /*	MessageBox.error(
                                "Error Occured while updating following Shipment Numbers: '"+failiureShipNums+"'",{
                                    title: "Error",
//							    				onClose: null
                                    onClose: function(oAction){
                                        oBusyDialog.close();//Close the busy indicator so that user will not be able to click on any control
                                    }
                                }
                            );*/
                        
//						    		var oTabMonShipTable = that.getView().byId("TblMonitorShipments");
                        

                        for(var index=0; index < that.monShipArr.length; index++){
                            //******following line has been commented for the app to run in IE browser as includes is not recognized****// 
                        //if(truncateZeroFailShip.includes(that.MonShipArr[index].ShipmentNum)){
                            if(truncateZeroFailShip.indexOf(that.monShipArr[index].ShipmentNum) !== -1){//check if the shipment is updated with success
                            oTabMonShipTable.getModel().oData["ShipmentSet('"+that.monShipArr[index].ShipmentNum+"')"].flag = "E"; //if error then set the custom property to E
                        }
                        
                        else{
                            oTabMonShipTable.getModel().oData["ShipmentSet('"+that.monShipArr[index].ShipmentNum+"')"].flag = "S"; //if yes then set the custom property flag to S
                        }
                    
                        }
                        
                    }
                    //set the timeout for the busy dialog
                    setTimeout(function() {

                        oBusyDialog.close();

                    }, 4000);
                    if(faliureArr.length == 0 && successArr.length == 0)
                    {
                        MessageBox.error(
                                JSON.parse((data.__batchResponses[0].response.body)).error.message.value,{
                                    title: "Error",
                                    onClose: null
                                }
                            );
                    }
                    that.monShipArr =[];
                    
                    that.copyActtoPlannedDateDep = 0;
                    that.copyActtoPlannedDate = 0;
                    that.copyPldArrToActArrDate =0;
                    //return;
                    
                    },
                
                /*error:function(err){
                    var err = data.__batchResponses[i].response.body;
                    var errorMessage = JSON.parse(err).error.message.value;
                    MessageBox.error(errorMessage);
                }*/
                    //handle in error handler.js
                    error : function(
                            oError) {
                    }
                    });
             }	
             
             else{
                 MessageBox.warning(i18n.getText("Update.UpdateAtleastOneRecord"),{});
                 oBusyDialog.close();
                return;
             }
//	 					that.monShipArr =[];
    },

// Submit Changes to backend for batch update
/*	handleSubmitChangesBatchUpdate : function(oModel,groupId){
    
    oModel.submitChanges({groupId: groupId,
        
        success:function(data){
        //	oModel.refresh();
        
        if(groupId === "updateSave"){
        for(var i = 0 ; i < data.__batchResponses.length-1; i++){
            
             if(data.__batchResponses[i].response){
                if(data.__batchResponses[i].response.statusCode !=="204"){
                 
                 var errorMessages = errorMessages + JSON.parse(data.__batchResponses[i].response.body).error.message.value + "\n";
                }
             }   
        }
         if(errorMessages){
                 MessageBox.error(
                     errorMessages, {
                            title: "Error",
                            onClose: null
                        }
                    );  
             }else{
                 MessageBox.success(
                         that.i18n.getText("Header.approveSuccess"), {
                                title: "Success",
                                onClose: null
                            }
                        );  
             }
        }
        },
    
    error:function(err){
       // alert("error occurred: " + err);
        var errorMessage = JSON.parse(err.response.body).error.message.value;
        MessageBox.error(errorMessage);
    }});
    
},*/
 
 //=====================================

 

 
 
//---------------------------------------------------------------------------------------------     
             
                                                                              
                    //	saveCostUpdate: save shipment update cost fragment
                        
                        saveCostUpdate:function(oEvent){
                                 var that = this;
                                
                                 var i18n = this.getResourceBundle();
                                 var oBusyDialog = new sap.m.BusyDialog();
                                 oBusyDialog.open();
                                var bAllItemSuccess=false,itemStatus='';
                                var ShipNum = this.getView().byId("id_Shpnum").getText();
                                 var accCodeObj = [];
                                     
                                     var newIdRarr = [];
                                var idRarr = this.getView().getModel("costModel").getData();
                                for(var j=0; j<idRarr.length; j++){
                                    if(idRarr[j].id_D !== true){
                                        newIdRarr.push(idRarr[j]);
                                    }
                                }
                                
                                
                                    
                                     //-------
                                
                                      if(newIdRarr.length !== 0){
                                         var Prev_Curr;
                                          if(newIdRarr.length > 1){
                                           Prev_Curr = newIdRarr[newIdRarr.length-1].Currency;
                                          }
                                         for(var i = 0; i<newIdRarr.length; i++){
                                             if(!newIdRarr[i].AccCode || !newIdRarr[i].Currency || !newIdRarr[i].Amount){
                                                 oBusyDialog.close();
                                                 MessageBox.error(i18n.getText("CostScreen.values")); 
                                                 return;
                                                 }
                                             if(Prev_Curr){
                                             if(newIdRarr[i].Currency !== Prev_Curr){
                                                 oBusyDialog.close();
                                                 MessageBox.error(i18n.getText("CostScreen.Currency"));
                                                 return;
                                             }
                                             }
                                             //check negative amount
                                             if(newIdRarr[i].Amount.indexOf("-") === 0){
                                                 oBusyDialog.close();
                                                 MessageBox.error(i18n.getText("cost.Amount"));
                                                 return;
                                             }
                                             //decimal limit
                                                var amount = newIdRarr[i].Amount;
                                                var decIndex=amount.indexOf(".");
                                                var limitDecimal=decIndex+3;
                                                if(amount.indexOf(".")  !== -1){
                                                if(amount.charAt(limitDecimal) !==""){
                                                     oBusyDialog.close();
                                                    MessageBox.error(i18n.getText("cost.limit"));
                                                    return;
                                                }
                                                }
                                                 
                                                //delete unwanted parameters 
//								            			 delete newIdRarr[i].id_R;
                                             delete newIdRarr[i].id_D;
                                             delete newIdRarr[i].newItem;
                                             delete newIdRarr[i].removeItem;
                                             delete newIdRarr[i].editable;
                                         } 
                                    
                                     
                                 var CreateCostObj = {
                                         "d" : {
                                             "ShipmentNum" : ShipNum,
                                             "ShipmentCost" : newIdRarr,
                                             "Messages":[]
                                     }
                                 };
                                 var oModel = this.getOwnerComponent().getModel();
                                 this.openMessagePopover(oEvent);
                                 oModel.create("/ShipmentSet",CreateCostObj,{
                                                     success : function(oData,response) {
                                                         if(oData.Messages&&oData.Messages.results&&oData.Messages.results.length){
                                                             var results = oData.Messages.results;
                                                             oBusyDialog.close();
                                                             that.handleMessagePopoverPress(results); 
                                                             //To check if returnMessage Contains any single success flag, i.e. all items are success as per discussion
                                                             results.some(function(obj){
                                                                 if(obj.Type === 'S'){
                                                                     bAllItemSuccess=true;
                                                                     return false;
                                                                 }
                                                             });
                                                             if(bAllItemSuccess){
                                                                 itemStatus = 'S';
                                                             }else{
                                                                 itemStatus = 'X';
                                                             }
                                                             
                                                         }
                                                         that.getView().byId("partnerTable").getModel('costModel').refresh(true);
//							 										 
                                                         
                                                         that.newIdRarr = [];
                                                                                                   
                                                     },
                                                     error:function(oError){
//							 								 
                                                         oBusyDialog.close();
                                                         that.getView().byId("partnerTable").getModel('costModel').refresh(true);
                                                         var message = JSON.parse(oError.responseText);
                                                         MessageBox.error(
                                                         message.error.message.value,
                                                         {
                                                             styleClass : "sapUiSizeCompact"
                                                         });
                                                         oBusyDialog.close();
                                                     }
                                                 });
                                 
                                 }
                                 
                                     else{
                                         oBusyDialog.close();
                                         MessageBox.error("No shipment to update");
                                            if (this._oDialogShpCostFunc) {
                                                 this._oDialogShpCostFunc
                                                 .close();
                                             }	
                                     }
                             }, 
                             
                             
                             

                             
                             
                                                                  
        //===save invoice======================
     
                             
                             saveInvoiceUpdate:function(oEvent){
                                 var that = this;
                                 var i18n = this.getResourceBundle();
                                 var oBusyDialog = new sap.m.BusyDialog();
                                 oBusyDialog.open();
                                 var carrformmInvDt;
                           //validations
                                 var id_InvNo = this.getView().byId("id_InvNo").getValue();
                                 if(id_InvNo == ""){
                                        this.getView().byId("id_InvNo").setValueState("Error");
                                        oBusyDialog.close();
                                        this.getView().byId("id_InvNo").setValueStateText("Enter Invoice Carrier Number");
                                        return;
                                    }
                                    else{
                                        this.getView().byId("id_InvNo").setValueState("None");
                                    }
                                 
                                 var id_InvDate = this.getView().byId("id_InvDate").getValue();
                                 if(id_InvDate == ""){
                                        this.getView().byId("id_InvDate").setValueState("Error");
                                        oBusyDialog.close();
                                        this.getView().byId("id_InvDate").setValueStateText("Enter carrier Invoice Date");
                                        return;
                                    }
                                    else{
                                        this.getView().byId("id_InvDate").setValueState("None");
                                    }
                                            
                                
                                var bAllItemSuccess=false,itemStatus='';
                                var ShipNum = this.getView().byId("id_shpno").getText();
                                var carrInvNo = this.getView().byId("id_InvNo").getValue();
                                
                                var FwdAgent = this.getView().byId("id_fwd").getText();
                                var carrInvDt = this.getView().byId("id_InvDate").getDateValue();
                                if(carrInvDt !== null){
                                carrformmInvDt = formatter.convertDate(carrInvDt);
                                }
                                var carrSubmdt = new Date();
                                carrSubmdt = formatter.convertDate(carrSubmdt);
                                
                            
                                    
                                     //check for non changes rows with id_R= true
                                     
                                
                                var tempInvoiceModelData = this.getModel("tempInvoiceModel").getData();
                                    
                                var invoiceModelData = this.getModel("InvoiceModel").getData();
                                
                                for(var i = 0 ; i < invoiceModelData.length;i++){
                                    if(!invoiceModelData[i].newItem && (!invoiceModelData[i].CarrierInvNum || !invoiceModelData[i].VoucherId)){
                                        
                                        if(carrInvNo === invoiceModelData[i].CarrierInvNum){
                                             MessageBox.error(i18n.getText("Invoice.invNo"));
                                             oBusyDialog.close();
                                             return;
                                        }
                                        if(invoiceModelData[i].AcccodeType !== "W"){
                                        tempInvoiceModelData.push(invoiceModelData[i]);
                                        }
                                    }
                                }
                                
                                //check for carr inv number duplication
                                //writing diffrent loop because few times newly added acc code already exist in invoiceModelData so previous loop may not execute
                                for(var i = 0 ; i < invoiceModelData.length;i++){
                                    if(carrInvNo === invoiceModelData[i].CarrierInvNum){
                                         MessageBox.error(i18n.getText("Invoice.invNo")); 
                                         oBusyDialog.close();
                                         return;
                                    }
                                }
                            //check duplicate currency and delete unwanted parameters	
                                 if(tempInvoiceModelData.length !== 0){
                                     var prev_InvCurrency;
                                     if(tempInvoiceModelData.length > 1){
                                   prev_InvCurrency = tempInvoiceModelData[tempInvoiceModelData.length-1].Currency;
                                     }
                                         for(var i = 0; i<tempInvoiceModelData.length; i++){
                                             
                                             if(!tempInvoiceModelData[i].AccCode || !tempInvoiceModelData[i].Currency || !tempInvoiceModelData[i].Amount){
                                                 MessageBox.error(i18n.getText("CostScreen.values")); 
                                                 oBusyDialog.close();
                                                 return;
                                                 }
                                             if(prev_InvCurrency){
                                             if(tempInvoiceModelData[i].Currency !== prev_InvCurrency){
                                                 MessageBox.error(i18n.getText("CostScreen.Currency")); 
                                                 oBusyDialog.close();
                                                 return;
                                             }
                                             }
                                            
                                                    var amount = tempInvoiceModelData[i].Amount;
                                                    var decIndex=amount.indexOf(".");
                                                    var limitDecimal=decIndex+3;
                                                    if(amount.indexOf(".")  !== -1){
                                                    if(amount.charAt(limitDecimal) !==""){
                                                        MessageBox.error(i18n.getText("cost.limit"));
                                                        oBusyDialog.close();
                                                        return;
                                                    }
                                                    }
                                                
                                             
                                             delete tempInvoiceModelData[i].newItem;
                                             delete tempInvoiceModelData[i].removeItem;
                                             delete tempInvoiceModelData[i].editable;
                                             tempInvoiceModelData[i].CarrierInvNum = carrInvNo;
                                             tempInvoiceModelData[i].VoucherId = carrInvNo;
                                             tempInvoiceModelData[i].CarrierInvDt = carrformmInvDt;
                                             tempInvoiceModelData[i].CarrierSubmDt = carrSubmdt;
                                             tempInvoiceModelData[i].ShipmentNum = ShipNum;
                                             tempInvoiceModelData[i].FwdAgent = FwdAgent;
                                        
                                         } 
                                         
                                    
                                         
                                         var CreateInvObj = {
                                                     "d" : {
                                                         
                                                         "ShipmentInvoice" : tempInvoiceModelData,
                                                         "Messages":[]
                                                 }
                                             };	 
                                  
                                 var oModel = this.getOwnerComponent().getModel();
                                 this.openMessagePopover(oEvent); 
                             
                                 oModel.create("/ShipmentSet",CreateInvObj,{
                                                     success : function(oData,response) {
                                                         if(oData.Messages&&oData.Messages.results&&oData.Messages.results.length){
                                                             var results = oData.Messages.results;
                                                             oBusyDialog.close();
                                                             that.handleMessagePopoverPress(results);  
                                                             
                                                             that.getModel("tempInvoiceModel").setData([]);
                                                             
//						 												
                                                             that.callServiceForInvoiceData(ShipNum,FwdAgent);
                                                         }
                                                     },
                                                     error:function(oError){
                                                         oBusyDialog.close();
                                                          that.getView().byId("invoiceTable").getModel('InvoiceModel').refresh(true);
                                                          var message = JSON.parse(oError.responseText);
                                                         MessageBox.error(
                                                         message.error.message.value,
                                                         {
                                                             styleClass : "sapUiSizeCompact"
                                                         });
                                                     }
                                                 });
                                 
                                     }
                                 
                                     else{
                                         oBusyDialog.close();
//							            			 MessageBox.error("No Invoice to update");
                                         MessageBox.error(i18n.getText("NoInvoice"));
                                     }
                             }, 
                                                                      
                         //f4 shipping type------------
                             
                             
                             
                         //f4 for account code in invoice ------------------
                             
                             handleAccountTypeF4Open : function(oEvent){
                                 var url="/F4_AccCodeSet";
                                 var title= 'Account Code';//this.getResourceBundle().getText("F4TitleShippingType"); i18n text can be maintained later
                                 if(!this.AccCodeDialog){
                                     this.AccCodeDialog = sap.ui.xmlfragment("fragment6","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.ValueHelpDialog",this);
                                     this.getView().addDependent(this.AccCodeDialog);
                                 }
                                 this.handleValueHelpOpen_ST(oEvent,this.getOwnerComponent().getModel(),url,['AccCode','AcccodeDesc'],'',title,this.AccCodeDialog);
                                    
                             },            
                             
                             handleCurrencyF4Open : function(oEvent){
                                 var url="/F4_CurrencySet";
                                 var title= 'Currency code';//this.getResourceBundle().getText("F4TitleShippingType"); i18n text can be maintained later
                                 if(!this.CurrencyDialog){
                                     this.CurrencyDialog = sap.ui.xmlfragment("fragment7","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.ValueHelpDialog",this);
                                     this.getView().addDependent(this.CurrencyDialog);
                                 }
                                 this.handleValueHelpOpen_ST(oEvent,this.getOwnerComponent().getModel(),url,['Currency','Description'],'',title,this.CurrencyDialog);
                                    
                             },   
                             
                           
                             
                             
                      //------------------------------------------------------       
                             //Value help functions
                             
                             handleShippingTypeF4Open : function(oEvent){
                                 var url="/F4_Shipping_TypeSet";
                                 var title= 'Shipping Type';//this.getResourceBundle().getText("F4TitleShippingType"); i18n text can be maintained later
                                 if(!this.VHSHTypeDialog){
                                     this.VHSHTypeDialog = sap.ui.xmlfragment("fragment1","com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.ValueHelpDialog",this);
                                     this.getView().addDependent(this.VHSHTypeDialog);
                                 }
                                 //ShpCond to pass as a filter parameter
                                 var sPath=oEvent.getSource().getParent().getBindingContext().getPath();
                                    var shipmentTable = this.getView().byId("TblMonitorShipments");
                                    var shipCond = shipmentTable.getModel().getProperty(sPath).ShpCond;
                                 var urlParams = {
                                         $filter:"ShpCond eq '"+ shipCond +"'"
                                     };
                                    this.handleValueHelpOpen_ST(oEvent,this.getOwnerComponent().getModel(),url,['ShippingTyp','ShptypDesc'],urlParams,title,this.VHSHTypeDialog);
                                    
                             },
                             
                             
                             //generic methods for Value help F4
                             handleValueHelpOpen_ST:function(oEvent,model,url,columns,urlParams,title,oDialog){
                                 var that=this;
                                 this._InputId = oEvent.oSource.sId;
                                 this._InputSource = oEvent.oSource;
                                 this.getModel('valueHelpModel').setData([]);
                                 //readOdataAndReturnPromise is implemented in Helper.js class
                                 readOdataAndReturnPromise(model, url,urlParams).done(
                                         function(response) {
                                             
                                             var aData = response.results;
                                             aData.forEach(function(currentValue,index){
                                                 currentValue.Title=currentValue[columns[0]];
                                                 currentValue.Desc=columns[1]?currentValue[columns[1]]:'';
                                                 
                                                 
                                             });
                                             
                                             
                                             that.getModel('valueHelpModel').setSizeLimit(response.results.length);
                                             that.getModel('valueHelpModel').setData(aData);
                                              that.getModel('valueHelpModel').refresh(true);
                                             oDialog.setBusy(false);
                                             
                                             
                                         })
                                         .fail(
                                                 function(oError) {
                                                     oDialog.setBusy(false);
                                                     var message = JSON.parse(oError.responseText);
                                                     MessageBox.error(
                                                                     message.error.message.value,
                                                                     {
                                                                         styleClass : "sapUiSizeCompact"
                                                                     });
                                 });
                                 oDialog.open();
                                 oDialog.setTitle(title);
                                 oDialog.setBusy(true);
                                 
                                 
                             },
                             
                             //Common value help search method
                             handleValueHelpSearch_ST : function (evt) {
                                 
                                 var sValue = evt.getParameter("value");
                                 var oFilters=[new Filter([
                                 new Filter("Title",sap.ui.model.FilterOperator.Contains, sValue),
                                 new Filter("Desc",sap.ui.model.FilterOperator.Contains, sValue)],false)];
                                 evt.getSource().getBinding("items").filter(oFilters);
                             },
                             
                              
                              
                             //Common valuehelp close method
                            handleValueHelpClose_ST : function (evt) {

                                
                                var flag = 0;
                                var i18n = this.getResourceBundle();
                                 var oSelectedItem = evt.getParameter("selectedItem");
                                 var shipmentHeaderTable = this.getView().byId("TblMonitorShipments");
                                 if (oSelectedItem) {
                                        var _InputId = sap.ui.getCore().byId(this._InputId);
                                        //If condition will work when we press F4 in Table row, it will pick up row context and set value
                                        if(_InputId.mBindingInfos && _InputId.mBindingInfos.value && _InputId.mBindingInfos.value.parts[0]){
                                              var inputBinding = _InputId.mBindingInfos.value.parts[0];
                                              
                                              
                                              
                                              var bindingModel = inputBinding.model;
                                              
                                              if(bindingModel === "costModel"){
                                              var desc= this.getView().byId("id_AccDesc").mBindingInfos.text.parts[0];
                                              }
                                              if(bindingModel === "InvoiceModel"){
                                              var desc= this.getView().byId("id_AccDescInv").mBindingInfos.text.parts[0];
                                              }
                                              if(bindingModel === "InvoiceModel" || bindingModel === "costModel"){
                                                  
                                                  //check duplicate acc code
                                                  if(bindingModel === "costModel"){
                                                  var partnerArr = [],
                                                  accCodeObj = [];
                                                  partnerArr =	this.getView().getModel("costModel").getData();

                                                  if(partnerArr.length !== 0){
                                             for(var j=0; j<partnerArr.length; j++){
                                            
                                             accCodeObj.push(partnerArr[j].AccCode);
                                             }
                                            // if(accCodeObj.includes(oSelectedItem.getTitle())== true){
                                             if(accCodeObj.indexOf(oSelectedItem.getTitle()) !== -1){
                                                 MessageBox.error(i18n.getText("cost.AccCode"));
                                               return;
                                            }
                                                  
                                             }
                                                  }
                                                  //--------------------
                                                     
                                                     var bindingPath = inputBinding.path;
                                                     var descPath = desc.path;
                                                     
                                              this._InputSource.getBindingContext(bindingModel).getObject()[bindingPath]=oSelectedItem.getTitle();
                                              this.getModel(bindingModel).setProperty(bindingPath,oSelectedItem.getTitle());
                                              
                                              if(bindingPath !== "Currency"){
                                              this._InputSource.getBindingContext(bindingModel).getObject()[descPath]=oSelectedItem.getDescription();
                                              this.getModel(bindingModel).setProperty(bindingPath,oSelectedItem.getDescription());
                                              }      
                                                     this.getModel(bindingModel).refresh(true);
                                              }else{
                                                     var sPath = this._InputSource.getParent().getBindingContext().sPath;
                                              shipmentHeaderTable.getBinding("rows").getModel().getProperty(sPath).ShippingTyp = oSelectedItem.getTitle();
                                              shipmentHeaderTable.getBinding("rows").getModel().getProperty(sPath).ShptypDesc = oSelectedItem.getDescription();
                                              
                                              //to update global array for save
                                              
//                                                          var selectedsPath = that.oSource.getParent().getBindingContext().getPath(); //get the selected Path Ex. /ShipmentSet('1186')
                                              var selectedIndex = this._InputSource.getParent(sPath).getIndex();//Gives the selected index of the item
                                              var selectedObj = this._InputSource.getParent().getBindingContext().getObject();
                                              if(!selectedObj.old_ShipType){ //new_forwardingAgent will contain initial value. Check if the initial value is changed
                                                  selectedObj.old_ShipType = selectedObj.ShippingTyp; 
                                              }
                                               if(this.monShipArr.length !== 0){
                                                   for(var i=0; i<this.monShipArr.length; i++){
                                                       if(this.monShipArr[i].ShipmentNum === selectedObj.ShipmentNum){
                                                           flag = 1;
                                                           if(this.monShipArr[i].ShippingTyp !== selectedObj.ShippingTyp){
                                                           this.monShipArr[i].ShippingTyp  = selectedObj.ShippingTyp;
                                                          
                                                       }
                                                       }
                                                        
                                                   }
                                                  if(flag === 0){ 
                                                   this.monShipArr.push(selectedObj);
                                                  }
                                               }
                                               else{
                                              this.monShipArr.push(selectedObj);
                                               }
                                          flag = 0;
                                      
                                              //-----------------------------------------------------
                                              
                                                     this.getOwnerComponent().getModel().updateBindings(); 
                                              }
                                        }else{
                                              //Else condition will work when we press F4 as free control, where we don't need table context
                                        if(_InputId.sId =="__xmlview1--inp_Departure"){
                                              var DepCode = oSelectedItem.getTitle();
                                              var DepDesc = oSelectedItem.getDescription();
                                              _InputId.setValue(DepCode.concat("-"+DepDesc));
                                        }
                                        
                                        else if(_InputId.sId =="__xmlview1--inp_Destination"){
                                              var DestCode = oSelectedItem.getTitle();
                                              var DestDesc = oSelectedItem.getDescription();
                                              _InputId.setValue(DestCode.concat("-"+DestDesc));
                                        }
                                        
                                        else{
                                               _InputId.setValue(oSelectedItem.getTitle());
                                        }
                                        
                                        }
//                                                    this._InputSource.setValueState('None');
                                 }
                               evt.getSource().getBinding("items").filter([]);
                           
                            },

                             handleLinkPress:function(evt){
                                  var link = evt.oSource.mProperties.href;
                                  if(link.indexOf("https") === -1){
                                      window.open("https://"+link, "", false);
                                  }
                                
                                  else{
                                      window.open(link, "", false);
                                  }
                                  
                                  
                              },			
                              
                               
                             //Open function for TCP Screen
                               OnClicktcp:function(){
                                  var i18n = this.getResourceBundle();
                               var tableMonShip = this.getView().byId("TblMonitorShipments");
                                           var tableMonShipIndices =tableMonShip.getSelectedIndices();
                                                  
                                                   if(tableMonShipIndices.length == 0){
                                                         MessageBox.alert(i18n.getText("Tcp.OneRow"));

                                                        return;
                                                  }
                                                  
                                                   if(tableMonShipIndices.length > 1 ){
                                                         MessageBox.alert(i18n.getText("Tcp.MultipleRow"));
                                                         return;
                                                        
                                                   }
                                                  
                                                   if(tableMonShipIndices.length == 1 ){
                                                        var shipmentNo = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().ShipmentNum;       
                                                         var departure = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().DeparturePoint;
                                                        var departureDesc = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().DepPointDesc;
                                                        var destination = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().DestinationPoint;
                                                        var destinationDesc =  tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().DestPointDesc;
                                                       
                                                        //defect Id #24530
                                                        //declare the following variable to be used later
                                                        var costPendingInd = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().IndNoShpmntCost; 
                                                        
                                                        //check shipmnt status
                                                        
                                                        var shipStatus = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().OverallStatus;
                                                        if(shipStatus !== "0"){
                                                             MessageBox.error(i18n.getText("Tcp.ShipStatus"));
                                                             return;
                                                        }
                                                        
                                                        //Begin of defect Id #24530
                                                        //Check if cost pending indicator is "X" for a selected line item in the monitor shipment header table.
                                                        if(costPendingInd ==="X"){
                                                             MessageBox.error(i18n.getText("Tcp.CostPending"));
                                                             return;
                                                        }
                                                        //End of defect Id #24530
                                                        //------------
                                                         if (!this._oDialogTCPScreen) {
                                                        this._oDialogTCPScreen = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.TransportationConnectionPoint",this);
                                                      this.getView().addDependent(this._oDialogTCPScreen);
                                                        }
                                                  jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(),this._oDialogTCPScreen);
                                                         this._oDialogTCPScreen.open();
                                   
                                                   this.getView().byId("inp_Departure").setValue(departure.concat("-"+departureDesc));
                                                  this.getView().byId("inp_Destination").setValue(destination.concat("-"+destinationDesc));
                                                  
                                                   }
                                       
                               },
                               
                               //Close function for TCP Screen
                               handleTCPScreenClose:function(){
                               var departure = this.getView().byId("inp_Departure");
                               var destination = this.getView().byId("inp_Destination");
                               departure.setValueState("None");
                               destination.setValueState("None");
                               
                                this._oDialogTCPScreen.close();
                               
                               },
                               
                               //Save function for TCP Screen
                               handleTCPScreenSave:function(){
                                   var shipmentNo;
                                   var i18n = this.getResourceBundle();
                                   var oBusyDialog = new sap.m.BusyDialog();
                                   oBusyDialog.open();
                                   var tableMonShip = this.getView().byId("TblMonitorShipments");
                                   var tableMonShipIndices =tableMonShip.getSelectedIndices();
                              
                                   if(tableMonShipIndices.length == 1 ){
                                       shipmentNo = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().ShipmentNum;       
                                   }
                                   
                                  
                                   var departure = this.getView().byId("inp_Departure");
                                   var destination = this.getView().byId("inp_Destination");
                               
                                   var departureVal = departure.getValue().split("-")[0];
                                   var destinationVal = destination.getValue().split("-")[0];
                                   var that = this;   
                                   var oEntry ={};
                                   
                                   /*
                                    * Start of changes for GAP#	6000000297
                                    * Variable declaration
                                    * Validation -  if Transportation Planning Point is "9545", ShipToCountry is "MX"
                                    */
                                   
                                   var shipmentTPP = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().TranspPlanPt;
                                   var shipmentShipToCountry = tableMonShip.getContextByIndex(tableMonShip.getSelectedIndices()).getObject().ShiptoCountry;
                                 
                                   /*
                                    * End of changes for GAP#	6000000297
                                    */
                                   
                                   /*if(!departureVal || !destinationVal){
                                       MessageBox.alert(i18n.getText("TCPScreen.DepDestValidation1"))
                                      // this.getView().byId("id_SHStatus").setValueState("Error");
                                       }*/
                               
                                   if(departureVal !== "" && destinationVal ===""){
                                       MessageBox.alert(i18n.getText("TCPScreen.DestinationValidation"));
                                       departure.setValueState("Error");
                                       destination.setValueState("None");
                                       oBusyDialog.close();
                                       return;
                                   }
                               
                                   if(destinationVal !== "" && departureVal ===""){
                                       MessageBox.alert(i18n.getText("TCPScreen.DepartureValidation"));
                                       destination.setValueState("Error");
                                       departure.setValueState("None");
                                       oBusyDialog.close();
                                       return;
                                   }
                               
                                    if(departureVal == destinationVal){
                                        if(!departureVal === "" && !destinationVal === ""){
                                           MessageBox.alert(i18n.getText("TCPScreen.DestDepValidation"));
                                           destination.setValueState("Error");
                                           departure.setValueState("Error");
                                           oBusyDialog.close();
                                           return;
                                        }
                                   }
                               
                                if(departureVal === destinationVal){
                                       MessageBox.alert(i18n.getText("TCPScreen.DestDepValidation"));
                                       destination.setValueState("Error");
                                       departure.setValueState("Error");
                                       oBusyDialog.close();
                                       return;
                               }
                                
                                /*
                                 * Start of changes for GAP#6000000297
                                 * Check if selected Shipment TPP is 9545 and Ship to country is Mexico,
                                 * If yes, user has to select destination TPP as "US_PFX_RO" else give error
                                 */
                                if(shipmentTPP === "9545" && shipmentShipToCountry === "MX")
                                   {
                                       if(destinationVal !== "US_PFX_RO")
                                       {
                                           MessageBox.error(i18n.getText("TCPScreen.errorMexico"));
                                           destination.setValueState("Error");
                                           departure.setValueState("Error");
                                           oBusyDialog.close();
                                           return;
                                       }
                                   }
                                 //End of changes for GAP#6000000297
                                
                                
                                oEntry.DeparturePoint = departureVal;
                                oEntry.DestinationPoint = destinationVal;
                                
                                var oModel = this.getOwnerComponent().getModel();
                                oModel.update("/ShipmentSet('"+shipmentNo+"')",oEntry,{
                                     success : function(oData,response) {
                                         // defect #24530 - close busy dialog on success
                                         oBusyDialog.close();
                                            var msg = response.headers.shipmentnum.replace(/^0+/, '');
                                            
                                            MessageBox.success("The Transportation Connection Points have been updated for Shipment Number: " +msg,{            
                                                  actions : [MessageBox.Action.OK],    
                                                  onClose : function(sAction){    
                                                      oBusyDialog.close();
                                                        
                                                  } 
                                            });
                                            oModel.refresh();
                                            that.handleSelectionScreenSave();
                                     },

                                     error : function(oError) {
                                        // defect #24530 - close busy dialog on error
                                         oBusyDialog.close();
                                     }

                               });
                               /*setTimeout(function() {

                                    oBusyDialog.close();

                                }, 4000);*/
                                this._oDialogTCPScreen.close();
                                
                               },
                               
                               //download
        
                               OnClickDownload : function(){
                                   var downloadThreshold = 10000;
                                   if(this.getModel("headerTableModel").getProperty("/totalCount") > downloadThreshold){
                                       this.openConfirmationBox(downloadThreshold);
                                   }else{
                                       this.callShipmentHeaderData();
                                   }
                                   
                               },
                               callShipmentHeaderData : function(){
                                   var filters = this.handleSelectionParameters();
                                   
                                   this.getModel("headerTableModel").setProperty("/HeaderTableBusy",true);
                                   
                                   var that = this;
                                   var oModel = this.getOwnerComponent().getModel();
                                    oModel.read("/ShipmentSet",{
                                       filters : filters,
                                       success : function(oData,oResponse){
                                           that.getModel("headerTableModel").setProperty("/HeaderTableBusy",false);
                                               
                                               that.getModel("HlsInbOutbModel").setData(oData.results);
                                               that.getModel("HlsInbOutbModel").refresh();
                                               
                                               
                                               if(that.getModel("HlsInbOutbModel").getData().length)
                                                 that.downloadToExcel(that.getModel("HlsInbOutbModel"),that.getView().byId("TblMonitorShipments").getColumns());
                                               
                                               
                                               else{
                                                   MessageBox.error(that.getResourceBundle().getText("Download.NoDataToDownload"));
                                               }
                                           
                                       },
                                       error : function(oError){
                                           that.getModel("headerTableModel").setProperty("/HeaderTableBusy",false);
                                           var errorMessage = oError.response.statusText;
                                           MessageBox.error(errorMessage);
                                       }
                                   });	
                               },
                               openConfirmationBox : function(downloadThreshold){
                                   var i18n = this.getResourceBundle();
                                   var that=this;
                                   MessageBox.confirm(
                                           (this.getResourceBundle().getText("downloadConfirmMsg",[downloadThreshold])), {
                                               
                                                       actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                                                       onClose: function(oAction) {
                                                         if (oAction === sap.m.MessageBox.Action.YES) {
                                                             that.callShipmentHeaderData();
                                                         }else if(oAction === sap.m.MessageBox.Action.NO){
                                                             
                                                             sap.m.MessageToast.show(that.getResourceBundle().getText("IncreaseSelectionCriteria"));
                                                         }
                                                         }
                                                       }
                                           
                                       );
                               },				                   
                               
                               /*OnClickDownload:function(oEvent){
                                    
                                    
                                },	*/				                   
                                    onLiveChangeCurrency:function(oEvent){
                                        //catch -ve
                                        var i18n = this.getResourceBundle();
                                        var amount = oEvent.getSource().getValue();
                                        if(amount.indexOf("-") === 0){
                                            MessageBox.error(i18n.getText("cost.Amount"));
                                            return;
                                        }
                                        //
                                         var vAmount = oEvent.getSource().getValue();
                                         var val = vAmount;
                                         var re = /^([0-9]+[\.]?[0-9]?[0-9]?|[0-9]+)$/g;
                                         var re1 = /^([0-9]+[\.]?[0-9]?[0-9]?|[0-9]+)/g;
                                         if (re.test(val)) {
                                                       var indexOfDot = vAmount.indexOf(".");
                                                       if(indexOfDot == "-1"){
                                                                      var length = vAmount.length;
                                                                      if(length>14){
                                                                                    vAmount = vAmount.slice(0,-1);
                                                                                    oEvent.getSource().setValue(vAmount);
                                                                                    oEvent.getSource().setValue(vAmount +".00");
                                                                      }
                                                                      if(length==14 && !oEvent.oSource.mProperties.value.includes(".")){
                                                                                    oEvent.getSource().setValue(vAmount +".00");
                                                                      }
                                                       }
                                         } else {
                                                       val = re1.exec(val);
                                                       if (val) {
                                                                     oEvent.getSource().setValue(val[0]);
                                                       } else {
                                                                      oEvent.getSource().setValue("");
                                                       }
                                         }
                                         
                                         },
                                         
                                         //--- Begin of defect id #24530
                                         //The following methodes for opening/searching/selecting departure and destination points with Odata Model
                                       //--------------------------Departure F4 Open--------------------------------
                                          //function to open the Departure fragment
                                         handleDepartureF4Open : function(oEvent){
                                            var title="Departure";
                                            
                                               if(!this.VHDepartureDialog){
                                                 this.VHDepartureDialog = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.Departure",this);
                                                 this.getView().addDependent(this.VHDepartureDialog);
                                             }
                                               
                                              this.getView().byId("id_SrchFieldDeparture").setValue("");
                                              var that=this;

                                              // bind the List items to the data collection
                                              var idDepList = this.getView().byId("id_DepartureList");
                                              idDepList.bindItems({
                                              path :"/F4_Departure_PointSet",
                                              sorter :new sap.ui.model.Sorter("DeparturePoint"),
                                                              
                                              template :new sap.m.StandardListItem({
                                              title :"{DeparturePoint}",
                                              description :"{DepPointDesc}"
                                                                  
                                              })
                                                  
                                                          
                                              });
                                               
                                             this.VHDepartureDialog.open();
                                             this.VHDepartureDialog.setTitle(title);
                                             this.selectedDepartures = [];
                                            
                                             
                                           },		                             
                            
                                          //Function triggered when the user changes the selection in the list 
                                          departureSelectionChange : function(oEvent){
                                              var obj = {};
                                              
                                              if(oEvent.getParameter("listItem").getProperty("selected")){
                                                  obj = {};
                                                  obj.description = oEvent.getParameter("listItem").getProperty("description");
                                                  obj.title = oEvent.getParameter("listItem").getProperty("title");
                                                  this.selectedDepartures.push(obj)
                                              }else{
                                                  for(var i = 0 ; i < this.selectedVendors.length;i++){
                                                      if(this.selectedDepartures[i].title === oEvent.getParameter("listItem").getProperty("title")){
                                                          this.selectedDepartures.splice(i,1);
                                                      }
                                                  }
                                              }
                                          },		                  			 
                                         
                                          //function to search a value entered in the search field
                                           _handleDepartureF4Search:function(){
                                             
                                             //Event for Searching
                                             var oSearchField = this.getView().byId("id_SrchFieldDeparture");
                                             var that = this;
                                             var oList = this.getView().byId("id_DepartureList");
                                             this.filterByDepartureCodeOrDesc();
                                         },	
                                         
                                         //Function called inside  _handleDepartureF4Search, we pass the code/Desc of the departure point in the filter to get a filtered data in the list
                                         filterByDepartureCodeOrDesc : function(){
                                             var rBVenCode = this.getView().byId("id_DepartureCode").getSelected();
                                             var vDepartureVal=this.getView().byId("id_SrchFieldDeparture").getValue();
                                             var codeAndDescArr = [],parameter = "";
                                             if(rBVenCode){
                                                 parameter = "DeparturePoint";
                                             }
                                             else{
                                                 parameter = "DepPointDesc";
                                                 
                                             }
                                             var oFilter = [
                                                            new Filter(parameter,sap.ui.model.FilterOperator.Contains,vDepartureVal)
                                                        ];
                                             codeAndDescArr.push(new Filter(oFilter,false))
                                             this.getView().byId("id_DepartureList").getBinding("items").filter(codeAndDescArr);
                                         },
                                         
                                         //Function triggered when the user clicks on the cancel button
                                         _handleDepartureF4Close:function(evt){
                                             this.getView().byId("id_SrchFieldDeparture").setValue("");
                                              this.VHDepartureDialog.close();
                                         },
                                         
                                         //Function triggered on the select event of the List
                                         handleValueHelpDepartureClose:function(evt){
                                             var listId = this.getView().byId("id_DepartureList");
                                                  var DepCode= listId.getSelectedItem().mProperties.title;
                                                  var DepDesc = listId.getSelectedItem().mProperties.description;
                                                  var _InputId = this.getView().byId("inp_Departure");
                                                  _InputId.setValue(DepCode.concat("-"+DepDesc));
                                                  
                                               this.VHDepartureDialog.close();
                                           
                                         }, 

                                           //--------------------------Destination F4 Open--------------------------------

                                       //function to open the Destination fragment	
                                         handleDestinationF4Open : function(oEvent){
                                            var title="Destination";
                                            
                                               if(!this.VHDestinationDialog){
                                                 this.VHDestinationDialog = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.Destination",this);
                                                 this.getView().addDependent(this.VHDestinationDialog);
                                             }
                                               
                                              this.getView().byId("id_SrchFieldDestination").setValue("");
                                              var that=this;

                                              // bind the List items to the data collection
                                              var idDestList = this.getView().byId("id_DestinationList");
                                              idDestList.bindItems({
                                              path: "/F4_Destination_PointSet",
                                              sorter: new sap.ui.model.Sorter("DestinationPoint"),
                                              template: new sap.m.StandardListItem({
                                              title: "{DestinationPoint}",
                                              description: "{DestPointDesc}"
                                                                  
                                              })
                                                  
                                                          
                                              });
                                               
                                             this.VHDestinationDialog.open();
                                             this.VHDestinationDialog.setTitle(title);
                                             this.selectedDestinations = [];
                                            
                                             
                                           },		                             
                            
                                          //Function triggered when the user changes the selection in the list  
                                          destinationSelectionChange : function(oEvent){
                                              var obj = {};
                                              
                                              if(oEvent.getParameter("listItem").getProperty("selected")){
                                                  obj = {};
                                                  obj.description = oEvent.getParameter("listItem").getProperty("description");
                                                  obj.title = oEvent.getParameter("listItem").getProperty("title");
                                                  this.selectedDestinations.push(obj)
                                              }else{
                                                  for(var i = 0 ; i < this.selectedVendors.length;i++){
                                                      if(this.selectedDestinations[i].title === oEvent.getParameter("listItem").getProperty("title")){
                                                          this.selectedDestinations.splice(i,1);
                                                      }
                                                  }
                                              }
                                          },		                  			 
                                         
                                      //function to search a value entered in the search field
                                           _handleDestinationF4Search:function(){
                                             
                                             //Event for Searching
                                             var oSearchField = this.getView().byId("id_SrchFieldDestination");
                                             var that = this;
                                             var oList = this.getView().byId("id_DestinationList");
                                             this.filterByDestinationCodeOrDesc();
                                         },	
                                         
                                       //Function called inside  _handleDestinationF4Search, we pass the code/Desc of the destination point in the filter to get a filtered data in the list 
                                         filterByDestinationCodeOrDesc : function(){
                                             var rBVenCode = this.getView().byId("id_DestinationCode").getSelected();
                                             var vDestinationVal=this.getView().byId("id_SrchFieldDestination").getValue();
                                             var codeAndDescArr = [],parameter = "";
                                             if(rBVenCode){
                                                 parameter = "DestinationPoint";
                                             }
                                             else{
                                                 parameter = "DestPointDesc";
                                                 
                                             }
                                             var oFilter = [
                                                            new Filter(parameter,sap.ui.model.FilterOperator.Contains,vDestinationVal)
                                                        ];
                                             codeAndDescArr.push(new Filter(oFilter,false))
                                             this.getView().byId("id_DestinationList").getBinding("items").filter(codeAndDescArr);
                                         },
                                         
                                       //Function triggered when the user clicks on the cancel button
                                         _handleDestinationF4Close:function(evt){
                                             this.getView().byId("id_SrchFieldDestination").setValue("");
                                              this.VHDestinationDialog.close();
                                         },
                                         
                                         //Function triggered on the select event of the List
                                         handleValueHelpDestinationClose:function(evt){
                                             var listId = this.getView().byId("id_DestinationList");
                                                  var DepCode= listId.getSelectedItem().mProperties.title;
                                                  var DepDesc = listId.getSelectedItem().mProperties.description;
                                                  var _InputId = this.getView().byId("inp_Destination");
                                                  _InputId.setValue(DepCode.concat("-"+DepDesc));
                                                  
                                               this.VHDestinationDialog.close();
                                         },			                             
                                         //-----End of defect id #24530
                                         
                                         
                                         
//-------------------------------onExit function-------------------------------------													
    onExit:function(){
        
        if (this._oDialogSelectionScreen) {
            this._oDialogSelectionScreen.destroy();
        }
    
        if (this._ValueHelpDialog) {
            this._ValueHelpDialog.destroy();
        }
        
        if (this._oDialogIEpreClrScreen) {
            this._oDialogIEpreClrScreen.destroy();
        }
        
        
},

//Start of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button functionality
OnClickIEClrPreInstr:function(oEvent){
var i18n = this.getResourceBundle();
var tabShipMon = this.getView().byId("TblMonitorShipments");

if(tabShipMon.getSelectedIndices().length === 0){
    MessageBox.alert(i18n.getText("IEPreClr.NoShipmentSelected"),{});
    return;	
}


if(tabShipMon.getSelectedIndices().length > 1){
    MessageBox.alert(i18n.getText("IEPreClr.MultipleSelectionNotAllowed"),{});
    return;	
}

if(tabShipMon.getSelectedIndices().length === 1 ){
    
    var iePreClr = tabShipMon.getContextByIndex(tabShipMon.getSelectedIndices()).getObject().IePreclrStatus ;	
    var shipmentNo = tabShipMon.getContextByIndex(tabShipMon.getSelectedIndices()).getObject().ShipmentNum;
    
    if(iePreClr === "Z001"){
        MessageBox.alert(i18n.getText("IEPreClr.IEPreClrNotApplicable",[shipmentNo]));
        return;
    }

        else{
        
        //code for ieClearence Instruction popup
        var that = this;
        var oModel = this.getOwnerComponent().getModel();
            
            oModel.read("/ShipmentTextSet('"+shipmentNo+"')",{
            success: function(oData, oResponse){
                if (oData.IePreclrInstructions) {
                that.getModel("ShipmentIETextModel").setData(oData);
                if (!that._oDialogIEpreClrScreen) {
                    that._oDialogIEpreClrScreen = new sap.ui.xmlfragment(
                            "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.IEPreClrButtonFrag", that);
                    that.getView().addDependent(that._oDialogIEpreClrScreen);

                }
                
                that._oDialogIEpreClrScreen.open();
                }
                else{
                    MessageBox.alert(i18n.getText("NoData"));

                }
            },
            error: function(oError){
                MessageBox.error(i18n.getText("IEPreClr.Error"),{});
            }
        }); 
    }
}

},
//IE Pre Clr fragment close code
handleIEPreClrF4Cancel:function(){
this._oDialogIEpreClrScreen.close();
},

onTblMonShipColumnMove : function(oEvent){
this.getView().byId("LhVariantManagement").currentVariantSetModified(true);
}

//End of RFC#7000014339:CD#2000032191:I/E PreClr Instructions button functionality								
                    
                     
        });
});