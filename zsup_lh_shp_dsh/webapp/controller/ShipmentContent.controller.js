sap.ui.define(
    [ "com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/controller/BaseController",
            "sap/ui/model/json/JSONModel", 
            "sap/ui/Device",
            "com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/util/formatter",
            "sap/ui/core/routing/History", 
            "sap/ui/table/TablePersoController",
            "sap/m/MessageBox",
            "sap/ui/model/Filter", 
            "sap/ui/core/Fragment",
    ],
    function(BaseController, JSONModel, Device, formatter, History, TablePersoController,MessageBox,Filter) {
        "use strict";

        return BaseController.extend("com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.controller.ShipmentContent",
                        {

            formatter : formatter,
            OverallStatus : '',
            // ---------------------------------------------
            // INITIALIZATION
            // ---------------------------------------------

            onInit : function() {
                
                var that = this;
                
var oViewModel = new JSONModel();
var itemOriginalModel = new JSONModel([]);
this.setModel(itemOriginalModel,"itemOriginalModel");
this.getRouter().getRoute("ShipItems").attachPatternMatched(this._onObjectMatched,this);


//--------------open Table perso dialog-------------------------------
//		this.oTableShipmentContent = new TablePersoController(this);
//		var oTableShipmentContent = this.getView().byId("TblShpConDelivery");
//		this.oTableShipmentContent.setTable(oTableShipmentContent);

var oTableShipmentContent = this.getView().byId("TblShpConDelivery");
//open Table perso dialog
this.oTableShipmentContent = new TablePersoController({
table : oTableShipmentContent
});
//------------------------------------------------------------------
//Create Deliveries table model
var DelvModel = new JSONModel([]);//used for Delv download funtionality 
this.setModel(DelvModel,"ShipmentContentDelvModel"); 
//Output Type table model
        var OutputTypeModel = new JSONModel([]); 
        this.setModel(OutputTypeModel,"OutputTypeModel");
        
        // Start of changes for CD# 2000025529 : Apply Variant Management to the table
        // Personalization from ushell service to persist the settings
        if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
            this.oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oPersId = {
                            container: "ContentTablePersonalization", 
                            item: "TblShpConDelivery" // id of table        
                        };
            // define scope 
            var oScope = {
                            keyCategory: this.oPersonalizationService.constants.keyCategory.FIXED_KEY,
                            writeFrequency: this.oPersonalizationService.constants.writeFrequency.LOW,
                            clientStorageAllowed: true
                        };
            // Get a Personalizer
            var oPersonalizer = this.oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
            this.oPersonalizationService.getContainer("ContentTablePersonalization", oScope, oComponent).fail(function() {}).done(function(oContainer) {
                    this.oContentContainer = oContainer;
                    this.oContentVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(this.oContentContainer);
                    // get variant set which is stored in back end
                    this.oContentVariantSet = this.oContentVariantSetAdapter.getVariantSet("TblShpConDelivery");
                    if (!this.oContentVariantSet) { //if not in back end, then create one
                        this.oContentVariantSet = this.oContentVariantSetAdapter.addVariantSet("TblShpConDelivery");
                    }
                    // array to store the existing variants
                    var aVariants = [];
                    // now get the existing variants from the backend to show as list
                    for (var key in this.oContentVariantSet.getVariantNamesAndKeys()) {
                        //if (this.oContentVariantSet.getVariantNamesAndKeys().hasOwnProperty(key)) {
                            var oVariantItemObject = {};
                            oVariantItemObject.Key = this.oContentVariantSet.getVariantNamesAndKeys()[key];
                            oVariantItemObject.Name = key;
                            aVariants.push(oVariantItemObject);
                        //}
                    }
                    // create JSON model and attach to the variant management UI control
                    var oContentVariantsModel = new JSONModel();
                     oContentVariantsModel.setData({"ContentVariants": aVariants});
                    this.getOwnerComponent().setModel(oContentVariantsModel, "ContentVariantsModel");
                    //enable save button
                    var oVariantMgmtControlContentTbl = this.getView().byId("ContentVariantManagement");
                    /*oVariantMgmtControlContentTbl.oVariantSave.onAfterRendering = function(){
                        this.setEnabled(true);
                    };*/
                    // set custom variant selected by user as default
                    if(this.oContentVariantSet._oVariantSetData.currentVariant !== null){
                        oVariantMgmtControlContentTbl.setDefaultVariantKey(that.oContentVariantSet._oVariantSetData.currentVariant);
                    }
            }.bind(this));
            // create table perso controller
            this.oObdSTOTablePersoService = new TablePersoController({
                table: this.getView().byId("TblShpConDelivery"),
                persoService: oPersonalizer
            });
            }
            // End of changes for CD# 2000025529 : Apply Variant Management to table		 

},

onAfterRendering : function(oEvent){
// Start of changes for CD# 2000025529 : Apply default variant selected by user to the table & set the variant text
if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
var oPersonalizationService = sap.ushell.Container.getService("Personalization");
var oPersId = {
            container: "ContentTablePersonalization", 
            item: "TblShpConDelivery" // id of table        
        };
// define scope 
var oScope = {
            keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
            writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
            clientStorageAllowed: true
        };
// Get a Personalizer
var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
oPersonalizationService.getContainer("ContentTablePersonalization", oScope, oComponent).fail(function() {}).done(function(oContainer) {
    var oContentContainer = oContainer;
    var oContentVariantSetAdapter = new sap.ushell.services.Personalization.VariantSetAdapter(oContentContainer);
    // get variant set which is stored in back end
    var oContentVariantSet = oContentVariantSetAdapter.getVariantSet("TblShpConDelivery");
    if(oContentVariantSet && (oContentVariantSet._oVariantSetData.currentVariant !== null)){
        if(oContentVariantSet._oVariantSetData.variants[oContentVariantSet._oVariantSetData.currentVariant]){
            this._setSelectedContentVariantToTable(oContentVariantSet._oVariantSetData.variants[oContentVariantSet._oVariantSetData.currentVariant].name);
            var oVariantMgmtControlContentTbl = this.getView().byId("ContentVariantManagement");
            oVariantMgmtControlContentTbl.oVariantText.setText(oContentVariantSet._oVariantSetData.variants[oContentVariantSet._oVariantSetData.currentVariant].name);
            oVariantMgmtControlContentTbl.setInitialSelectionKey(oContentVariantSet._oVariantSetData.currentVariant);

        }
    }
}.bind(this));
}
// End of changes for CD# 2000025529 : Apply default variant selected by user 
                        },
                        
_onObjectMatched:function(oEvent){
var that = this;
var originalData = [];
var i18n = this.getResourceBundle();
var sObjectId = oEvent.getParameter("arguments").ShipmentId;
var shType = oEvent.getParameter("arguments").ShipmentTypeId;
this.OverallStatus = oEvent.getParameter("arguments").OverallStatus;
this.ShipmentTypeId = oEvent.getParameter("arguments").ShipmentTypeId;
this.getView().byId("inpShipmentNo").setValue(sObjectId);

//set overall satus in json
var OverallStatus=this.OverallStatus;

//defect Id #24530
//set shipment Type in json
var shType = this.shType

var statusModel = new JSONModel();
this.getView().setModel(statusModel,"statusModel");

var editableFlag = false;
//		start of changes CD #2000025529: add condition as OverallStatus=1
if(this.OverallStatus === "0" || this.OverallStatus === "1" ){
editableFlag = true;
}
//		end of changes CD #2000025529
this.getModel("statusModel").setProperty("/editable",editableFlag);
this.getModel("statusModel").refresh();

// Start of changes for CD# 2000025529 : Adding Download Cl functionality to the I/E Shipment Content Delivery table - get status
var shipmentStatus = this.getOwnerComponent().getModel("ShpStatusforDwnldClIEShpConDelModel").getData().ShipmentStatus;

var shipmentDataToGetPDF = {
    "Shipment": sObjectId,
    "Output": "",
    "ShipmentStatus": shipmentStatus,
    "IsInitial": ""
}, oShipmentDataForDwnldCIModel = new JSONModel(shipmentDataToGetPDF);
this.getView().setModel(oShipmentDataForDwnldCIModel, "ShipmentDataForDwnldCIModel");
// End of changes for CD# 2000025529 : Adding Download Cl functionality to the I/E Shipment Content Delivery table - get status


//---------------Set title for Shipment Content-----------------------------------------
var staticPageTitle = this.getView().getModel("i18n").getResourceBundle().getText("SHIPMENT_CONTENT_TITLE");
that.getView().byId("pageShipmentContent").setTitle(staticPageTitle.concat(sObjectId));

//-----------------------------------------------------------------
var printButton = this.getView().byId("BtnPrintDocs");
var BtnIEShpContDelDownloadCl = this.getView().byId("BtnIEShpContDelDownloadCl");
var sObjectIdShipType = oEvent.getParameter("arguments").ShipmentTypeId; 

// Start of changes for RFC# 7000013627 - 'Download Documents' button not visible for Shipment Status 0 and 1
if(sObjectIdShipType === "Z004" || shipmentStatus === "0" || shipmentStatus === "1"){
BtnIEShpContDelDownloadCl.setVisible(false);

}
else {
BtnIEShpContDelDownloadCl.setVisible(true);
}
// End of changes for RFC# 7000013627 - 'Download Documents' button not visible for Shipment Status 0 and 1
if(sObjectIdShipType === "Z004" || shipmentStatus === "0" ){

printButton.setVisible(false);


}
else if (sObjectIdShipType == "Z005"){
printButton.setVisible(true);
}

else{
printButton.setVisible(true);
}

//		start of RFC#7000013937:CD#2000031553 : For ZPAK print button function visibility

var ZPAKPrintButton = this.getView().byId("BtnZPAKPrintDocs");

if((sObjectIdShipType === "Z005" || sObjectIdShipType === "Z006")&&( shipmentStatus === "0" )){
ZPAKPrintButton.setVisible(true);
}
else {
ZPAKPrintButton.setVisible(false);
}
//		end of RFC#7000013937:CD#2000031553 : For ZPAK print button function visibility	 

var filters = [];
if(sObjectId !== ''){
filters.push(new Filter("ShipmentNum",sap.ui.model.FilterOperator.EQ,sObjectId));
}
//set ship to country and from country visible

if(shType == "Z005"){
this.getView().byId("id_ToCountry").setVisible(true);
this.getView().byId("id_fromCountry").setVisible(false);
}else if(shType == "Z006"){
this.getView().byId("id_ToCountry").setVisible(true);
this.getView().byId("id_fromCountry").setVisible(true);
this.getView().byId("id_ShiptoParty").setVisible(true);
this.getView().byId("id_SoldtoParty").setVisible(true);
}
else{
this.getView().byId("id_ToCountry").setVisible(false);
this.getView().byId("id_fromCountry").setVisible(true);
}
var urlParams = {};
var oBusyDialog = new sap.m.BusyDialog();
oBusyDialog.open();
var sPath = "/ShipmentItemSet";

this.getOwnerComponent().getModel().read(sPath, {
async: true,
filters : filters,
urlParameters: {
    "$expand":"HandlingUnits"
},
success: function(oData, oResponse) {
    
    oBusyDialog.close();
    
    var oModel = new JSONModel(oData.results);
    
    var idShipConTable = that.getView().byId("TblShpConDelivery");
    //*********************************************
    var idHandlingUnitDetailTable = that.getView().byId("TblShpConHU");//Handling Unit Table
    
    idShipConTable.setModel(oModel,"ShipmentContentDelvModel");
    
    //*********************************************
    idHandlingUnitDetailTable.setModel(oModel,"HandlingUnitModel"); //Handling Unit Table
    
    
    

    //remove duplicates
     
    
    //-------------------------
    var arrDlv =idShipConTable.getModel("ShipmentContentDelvModel").getData();
    that.hUobj ={};
    
    var aHUnit = [],aTempHUnit=[],finalHUArray=[];
    for (var i=0; i < arrDlv.length; i++){
        aTempHUnit = arrDlv[i].HandlingUnits;
        for(var j=0; j < aTempHUnit.results.length; j++){
            that.hUobj =	aTempHUnit.results[j];	
            aHUnit.push(that.hUobj);
        }
    }
    
    
    //Removing duplicate entries from Handling Unit Table
    finalHUArray = removeDuplicateUsingFilter(aHUnit);
    //maintain backend data in another json model to compare updates
    
    
    originalData = $.extend(true,[],finalHUArray);
      that.getModel("itemOriginalModel").setData(originalData);
    
    var oModelHU = new JSONModel(finalHUArray);
    idHandlingUnitDetailTable.setModel(oModelHU,"HandlingUnitModel");
    idHandlingUnitDetailTable.getModel("HandlingUnitModel").refresh();
    
    
    if(oModel.oData.length === 0){
        
        MessageBox.error(i18n.getText("ShipmentContent.NoData"),{});	
//					MessageBox.error("No Data Exists with the given filter Parameters!");
        idShipConTable.getModel("ShipmentContentDelvModel").refresh(true);
            
        //*********************************************
        idHandlingUnitDetailTable.getModel("ShipmentContentDelvModel").refresh(true); //Handling Unit Table
        
     
        //----------------------Count For HU-------------------------------------
        that.getView().byId("idPanelShipmentContentHU").setHeaderText(that.getResourceBundle().getText("PanelTitleHandlingUnit",(idHandlingUnitDetailTable.getModel("HandlingUnitModel").getData().length + "")));
        
        //----------------------Count For Delivery-------------------------------------
        that.getView().byId("idPanelShipmentContentDelv").setHeaderText(that.getResourceBundle().getText("PanelTitleDelivery",(idShipConTable.getModel("ShipmentContentDelvModel").getData().length + "")));	
            
        
        //-----------------Code for clearing Filter and Sorting on Shipment Content Table -----------------------	
        that.resetTableFilterSort(that.getView().byId("TblShpConDelivery").sId); 
        //----------------------------------------------------------------------------------------
        //***************----Code for clearing Filter and Sorting on Handling Unit Detail Table --------
        that.resetTableFilterSort(that.getView().byId("TblShpConHU").sId); 
        //**********---------------------------------------------------------------------------------
        return;
        }

    else{
        oBusyDialog.close();
        idShipConTable.getModel("ShipmentContentDelvModel").refresh(true);
        //-----------------Code for clearing Filter and Sorting on Shipment Content Table -----------------------	
        that.resetTableFilterSort(that.getView().byId("TblShpConDelivery").sId); 
        //----------------------------------------------------------------------------------------
        idHandlingUnitDetailTable.getModel("HandlingUnitModel").refresh(true);
        //**********------Code for clearing Filter and Sorting on Handling Unit Details Table -----------------------	
        that.resetTableFilterSort(that.getView().byId("TblShpConHU").sId); 
        //**************-------------------------------------------------
        
        
        sap.m.MessageToast.show(i18n.getText("ShipmentContent.Data"),{});	
        
//----------------------Count For HU-------------------------------------
        
        that.getView().byId("idPanelShipmentContentHU").setHeaderText(that.getResourceBundle().getText("PanelTitleHandlingUnit",(idHandlingUnitDetailTable.getModel("HandlingUnitModel").getData().length + "")));
        
        //----------------------Count For Delivery-------------------------------------
            
        that.getView().byId("idPanelShipmentContentDelv").setHeaderText(that.getResourceBundle().getText("PanelTitleDelivery",(idShipConTable.getModel("ShipmentContentDelvModel").getData().length + "")));
        
    //--------------------------------------------------------------------------------	
        
    }

},
error: function(oError) { 
    MessageBox.error(i18n.getText("ShipmentContent.NoData"),{});
}
});


},

// Start of changes for CD# 2000025529 : Adding Download Cl functionality to the I/E Shipment Content Delivery table
handleIEShpContDelDownloadClPress: function(){
var shipmentStatus = this.getOwnerComponent().getModel("ShpStatusforDwnldClIEShpConDelModel").getData().ShipmentStatus, 
oShipmentData = this.getView().getModel("ShipmentDataForDwnldCIModel").getData(), 
shipmentType = this.getOwnerComponent().getModel("ShpStatusforDwnldClIEShpConDelModel").getData().ShipmentType, 
oModel = this.getOwnerComponent().getModel();
if(shipmentType === "Z005"){
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/Output", "ZCOM");
}
else if(shipmentType === "Z006"){
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/Output", "ZDRP");
}
if(shipmentStatus === "1"){
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/IsInitial", "X");
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/ShipmentStatus", "1");
this.handleDwnldCIPdf();
}
else if(shipmentStatus === "5" || shipmentStatus === "6" || shipmentStatus === "7"){
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/IsInitial", "");
this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/ShipmentStatus", "5");

//start of RFC#7000013627: Download CI - opening fragment of output options before existing fragment
if (!this.oDialogDwnldClBtnOutputOptions) {
    this.oDialogDwnldClBtnOutputOptions = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.DownloadClBtnOutputOptions",this);
    this.getView().addDependent(this.oDialogDwnldClBtnOutputOptions);
}
this.oDialogDwnldClBtnOutputOptions.open();
//End of RFC#7000013627: Download CI opening fragment of output options before existing fragment
}
},
handleDwnldClBtnOptionsLHShpmntContDelDialogClose: function(){
this.oDialogDwnldClBtnOptionsLHShpmntContDel.close();
this.handleDwnldCIPdf();
},
// Close the dialog for Download CI option selection
handleDwnldClBtnOptionsLHShpmntContDelDialogCancel: function(){
this.oDialogDwnldClBtnOptionsLHShpmntContDel.close();
},

//start of RFC#7000013627: Download CI -opening fragment of output options before existing fragment
handleDwnldClBtnOutputOptionsDialogClose: function(){
this.oDialogDwnldClBtnOutputOptions.close();
var id_Output = this.getView().byId("id_Grp1").getSelectedButton().getText();
if(id_Output === "ZPAK-Packing List" || id_Output === "ZCSD-Consolidated Shipping Doc"){
this.handleDwnldOutputOptions();
}
else{
var aDwnldClBtnOptionsLHShpmntContDelData = [
    {"Key": "InitialCl", "Text": "Draft Cl"},
    {"Key": "FinalCl", "Text": "Final Cl"}
];
var oDwnldClBtnOptionsLHShpmntContDelModel = new JSONModel({"DwnldClBtnOptionsData": aDwnldClBtnOptionsLHShpmntContDelData});
this.getView().setModel(oDwnldClBtnOptionsLHShpmntContDelModel, "DwnldClBtnOptionsLHShpmntContDelModel");
if (!this.oDialogDwnldClBtnOptionsLHShpmntContDel) {
    this.oDialogDwnldClBtnOptionsLHShpmntContDel = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.DownloadClBtnOptions",this);
    this.getView().addDependent(this.oDialogDwnldClBtnOptionsLHShpmntContDel);
}
this.oDialogDwnldClBtnOptionsLHShpmntContDel.open();
}
},
// Close the dialog for Download CI option selection
handleDwnldClBtnOutputOptionsDialogCancel: function(){
this.oDialogDwnldClBtnOutputOptions.close();
},

//call URL according to selectedoptions.for ZCOM open fragment for download options 
handleDwnldOutputOptions: function(){
var outputType;
var id_Output = this.getView().byId("id_Grp1").getSelectedButton().getText();
id_Output = id_Output.split("-");
var sOutput = id_Output[0];  
var	sShipmentNo = this.getOwnerComponent().getModel("ShpStatusforDwnldClIEShpConDelModel").getData().ShipmentNo, 
 oModel = this.getOwnerComponent().getModel();
if(sOutput === "ZPAK"){
outputType = "PL";
}
else{
outputType = "SHP";
}

var sURL = "/PrintPdfSet(Output='" + sOutput + "',Document='" + sShipmentNo + "',ShipmentStatus='',IsInitial='',Application='',OutputType='" + outputType + "',Printer='')/$value";
oModel.read(sURL, {
        success : function(oData, oResponse) {
            var pdfURL = oResponse.requestUri, html = new sap.ui.core.HTML(), oPanel = new sap.m.Panel();
            html.setContent("<iframe src='" + pdfURL + "' width='0' height='0'></iframe>");
            oPanel.addContent(html);
            oPanel.placeAt("content");
        },
        error : function(oError) {
            //error handled in ErrorHandler.js
        }
});
},

//End of RFC#7000013627: Download CI-opening fragment of output options before existing fragment

handleDwnldCIPdf: function(){
var sOutput = this.getView().getModel("ShipmentDataForDwnldCIModel").getProperty("/Output"), 
sShipmentNo = this.getOwnerComponent().getModel("ShpStatusforDwnldClIEShpConDelModel").getData().ShipmentNo, 
 oModel = this.getOwnerComponent().getModel();

if(this.getView().getModel("ShipmentDataForDwnldCIModel").getProperty("/ShipmentStatus") === "5"){
var downloadCIType = this.getView().byId("cb_OBDDwnldClBtnOptionsLHShpmntContDel").getSelectedKey();
if(downloadCIType === "InitialCl"){
    this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/ShipmentStatus", "1");
    this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/IsInitial", "X");
}
else if(downloadCIType === "FinalCl"){
    this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/ShipmentStatus", "5");
    this.getView().getModel("ShipmentDataForDwnldCIModel").setProperty("/IsInitial", "");
}
}
var sIsInitial = this.getView().getModel("ShipmentDataForDwnldCIModel").getProperty("/IsInitial");
// URL - /ZSUP_GOLD_IES_DASHBOARD_SRV/PrintPdfSet(Output='ZDRP',Document='2135',ShipmentStatus='1',IsInitial='X')/$value
var shipmentStatus = this.getView().getModel("ShipmentDataForDwnldCIModel").getProperty("/ShipmentStatus"), 
sURL = "/PrintPdfSet(Output='" + sOutput + "',Document='" + sShipmentNo + "',ShipmentStatus='" + shipmentStatus + "',IsInitial='" + sIsInitial + "',Application='',OutputType='CI',Printer='')/$value";
//    	,ShipmentStatus='',IsInitial='',Application='"+ applicationType+ "',OutputType=''
oModel.read(sURL, {
        success : function(oData, oResponse) {
            var pdfURL = oResponse.requestUri, html = new sap.ui.core.HTML(), oPanel = new sap.m.Panel();
            html.setContent("<iframe src='" + pdfURL + "' width='0' height='0'></iframe>");
            oPanel.addContent(html);
            oPanel.placeAt("content");
        },
        error : function(oError) {
            //error handled in ErrorHandler.js
        }
});
},
// End of changes for CD# 2000025529 : Adding Download Cl functionality 
//-----------------------------Personalization Screen Dialog Open---------------------------------------
OnClickPersonalizeShipmentContent: function(evt) {
/*jQuery.sap.syncStyleClass(this.getView(),this._oPersonalizationDialog);
this.oTableShipmentContent.openDialog();*/
// Start of changes for CD# 2000025529 : Apply Variant Management to the Outbound STO table
this.oObdSTOTablePersoService.openDialog({
ok: this.onObdSTOPersoDonePressed.bind(this)
});
var that=this;
setTimeout(function(){
that.oObdSTOTablePersoService._oDialog.attachConfirm(that, that.onObdSTOPersoDonePressed.bind(that));
},3000,that);
//		this.oObdSTOTablePersoService._oDialog.attachConfirm(this, this.onObdSTOPersoDonePressed.bind(this));
// End of changes for CD# 2000025529 : Apply Variant Management to the Outbound STO table

},
//Start of changes for CD# 2000025529 : Apply Variant Management to the table
onObdSTOPersoDonePressed: function(oEvent) {
this.oObdSTOTablePersoService.savePersonalizations();
this.getView().byId("ContentVariantManagement").currentVariantSetModified(true);
},
// To store the variant with the columns settings including the order to the back end
onSaveSTOVariantAs: function(oEvent) {
// get variant parameters
var oVariantParam = oEvent.getParameters();
// get columns data
var aColumnsData = [];
this.getView().byId("TblShpConDelivery")._getVisibleColumns().forEach(function(oColumn, index) {
var aColumn = {};
aColumn.fieldName = oColumn.getProperty("name");
aColumn.Id = oColumn.getId();
aColumn.index = index;
aColumn.Visible = oColumn.getVisible();
aColumn.filterProperty = oColumn.getProperty("filterProperty");
aColumn.sortProperty = oColumn.getProperty("sortProperty");
aColumn.defaultFilterOperator = oColumn.getProperty("defaultFilterOperator");
//		aColumn.sorted = oColumn.getProperty("sorted");
//		aColumn.sortOrder = oColumn.getProperty("sortOrder");
aColumnsData.push(aColumn);
});

//get if the variant exists or add new variant
var sVariantKey = this.oContentVariantSet.getVariantKeyByName(oVariantParam.name);
if (sVariantKey) {
this.oObdSTOVariant = this.oContentVariantSet.getVariant(sVariantKey);
} 
else {
this.oObdSTOVariant = this.oContentVariantSet.addVariant(oVariantParam.name);
}

//this.oObdSTOVariant = this.oContentVariantSet.addVariant(oVariantParam.name);
if (this.oObdSTOVariant) {
this.oObdSTOVariant.setItemValue("ColumnsVal", JSON.stringify(aColumnsData));
if (oVariantParam.def === true) {
this.oContentVariantSet.setCurrentVariantKey(this.oObdSTOVariant.getVariantKey());
}
this.oContentContainer.save().done(function() {
// Tell the user that the personalization data was saved
sap.m.MessageToast.show("Personalization data saved!");
});
}
},
// To read the service and change the table columns accordingly on selection of variant
onSelectSTOVariant: function(oEvent) {
var selectedKey = oEvent.getParameters().key;
var oVariantMgmtControlContentTbl = this.getView().byId("ContentVariantManagement");
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
this._setSelectedContentVariantToTable(selectedVariant);
},
// To convert the stored values back into the array & modify the table and refresh the table control to show that data on the screen
_setSelectedContentVariantToTable: function(oSelectedVariant) {
if (oSelectedVariant && oSelectedVariant!=="Standard") {
var sVariant = this.oContentVariantSet.getVariant(this.oContentVariantSet.getVariantKeyByName(oSelectedVariant));
var aColumns = JSON.parse(sVariant.getItemValue("ColumnsVal"));
// Hide all columns first
this.getView().byId("TblShpConDelivery").getColumns().forEach(function(oColumn) {
oColumn.setVisible(false);
});
// re-arrange columns according to the saved variant
aColumns.forEach(function(aColumn) {
var aTableColumn = $.grep(this.getView().byId("TblShpConDelivery").getColumns(), function(el, id) {
    return el.getProperty("name") === aColumn.fieldName;
});
if (aTableColumn.length > 0) {
    aTableColumn[0].setVisible(aColumn.Visible);
    this.getView().byId("TblShpConDelivery").removeColumn(aTableColumn[0]);
    this.getView().byId("TblShpConDelivery").insertColumn(aTableColumn[0], aColumn.index);
}
}.bind(this));
}
// null means the standard variant is selected or the variant which is not available, then show all columns
else {
this.getView().byId("TblShpConDelivery").getColumns().forEach(function(oColumn) {
oColumn.setVisible(true);
});
}
},
// To manage the variants. User can change the name or delete the variant or can make anyone of them as default.
onManageSTOVariants: function(oEvent) {
var aParameters = oEvent.getParameters();
// rename variants
if (aParameters.renamed.length > 0) {
aParameters.renamed.forEach(function(aRenamed) {
var sVariant = this.oContentVariantSet.getVariant(aRenamed.key),
sItemValue = sVariant.getItemValue("ColumnsVal");
// delete the variant 
this.oContentVariantSet.delVariant(aRenamed.key);
// after delete, add a new variant
var oNewVariant = this.oContentVariantSet.addVariant(aRenamed.name);
oNewVariant.setItemValue("ColumnsVal", sItemValue);
}.bind(this));
}
// default variant change
if (aParameters.def !== "*standard*") {
this.oContentVariantSet.setCurrentVariantKey(aParameters.def);
} 
else {
this.oContentVariantSet.setCurrentVariantKey(null);
}
// Delete variants
if (aParameters.deleted.length > 0) {
aParameters.deleted.forEach(function(aDelete) {
this.oContentVariantSet.delVariant(aDelete);
}.bind(this));
}
//  Save the Variant Container
this.oContentContainer.save().done(function() {
// Tell the user that the personalization data was saved
sap.m.MessageToast.show("Personalization data saved!");
});
},
onTblDelShipContentColumnMove : function(oEvent){
this.getView().byId("ContentVariantManagement").currentVariantSetModified(true);
},
// End of changes for CD# 2000025529 : Apply Variant Management to the table

                        
                        
//---------------------------------------------------------------------------------------------

                        onColFilterDelv:function(oEvt){
                            
                        
                        this.filterVal = oEvt.mParameters.value;
                        var HUTable = this.getView().byId("TblShpConHU");
                        var oListBinding = HUTable.getBinding();
                        if (oListBinding) {
                              oListBinding.aSorters = this.filterVal;
                              oListBinding.aFilters = this.filterVal;
                              //oListBinding.refresh(true);
                              HUTable.getColumns()[0].setSorted(true);
                              HUTable.getColumns()[0].setFilterValue(this.filterVal);
                              HUTable.getColumns()[0].setFiltered(true);
                              
                           
                       }
                         
                        },	
                        
                        onColFilterHU:function(oEvt){
                            
                        },
                        
                        
                        fireFilter:function(column,value){
                        var	column = this.getView().byId("TblShpConHU").getColumns()[0];
                        var value = this.filterVal;
                        
                        },
                        
                        //----------------------------Resetting Table Filter Sort------------------------------------
                        resetTableFilterSort : function(tableId) {
                            var table = this.getView().byId(
                                          tableId);
                            if (table) {
                                   var iColCounter = 0;
                                   table.clearSelection();
                                   var iTotalCols = table
                                                 .getColumns().length;
                                   var oListBinding = table
                                                 .getBinding();
                                   if (oListBinding) {
                                          oListBinding.aSorters = null;
                                          oListBinding.aFilters = null;
                                          oListBinding.refresh(true);
                                   }
                                   for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
                                          table.getColumns()[iColCounter]
                                                        .setSorted(false);
                                          table.getColumns()[iColCounter]
                                                        .setFilterValue("");
                                          table.getColumns()[iColCounter]
                                                        .setFiltered(false);
                                   }
                            }

                     },
                        
                //-----------------------------------------f4--wt unit------------------------------------------------
                   handleGrossWt:function(oEvent) {
                            
                            
                            
                            var that = this;
                            that.oSource= oEvent.getSource();
                            var oModel = this.getMainModel();
                            var GwtVal = this.getView().byId("id_Gwt").mProperties.value;
                            
                            var filters = [];
                            if(GwtVal !== ''){
                                filters.push(new Filter("WeightUnit",sap.ui.model.FilterOperator.EQ,GwtVal));
                            }
                            
                             
                            var sPath = "/F4_Weight_UnitSet";
                            this.getOwnerComponent().getModel().read(sPath, {
                                async: true,
                                filters : filters,
                                success: function(oData, oResponse) {

                                    var oGrossWtModel = new sap.ui.model.json.JSONModel(oData.results); //new JSONModel(oData.results);
                                    if (!that._oDialogGrossWtF4) {
                                        that._oDialogGrossWtF4 = new sap.ui.xmlfragment(
                                                "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.GrossWtF4", that);
                                        that.getView().addDependent(that._oDialogGrossWtF4);

                                    }
                                    sap.ui.getCore().byId("IdSearchGrossWt").setValue("");
                                    that._oDialogGrossWtF4.open();
                                    sap.ui.getCore().byId("ListIdGrossWt").setModel(oGrossWtModel,"GrossWtModel");


                                },
                                error: function(oError) { 

                                }
                            });

                        },

                        handleSrchGrossWt: function(oEvent) {

                            var sValue=oEvent.getParameters("value").query;
                            var andArr = [];
                            var oFilter = [
                                new Filter("WeightUnit",sap.ui.model.FilterOperator.Contains,sValue),
                                new Filter("UnitText",sap.ui.model.FilterOperator.Contains,sValue)
                            ];
                            andArr.push(new Filter(oFilter,false));
                            sap.ui.getCore().byId("ListIdGrossWt").getBinding("items").filter(andArr);
                            
                             
                     },				

                    onGrossWtListSelect:function(oEvent){  
                            
                            var that = this;
                            var flag = 0;
                            var listItem=oEvent.getParameter("listItem").getBindingContext("GrossWtModel").getObject();
                            var GwtCode = listItem.WeightUnit;
                            var TblShpConHU = this.getView().byId("TblShpConHU");
                            var sPath = that.oSource.getParent().getBindingContext("HandlingUnitModel").sPath;
                            var selectedObj =	that.oSource.getParent().getBindingContext("HandlingUnitModel").getProperty(sPath);
                            selectedObj.WeightUnit = oEvent.getSource().getSelectedItem().mProperties.title;
                         
                                this._oDialogGrossWtF4.close();
                                
                                TblShpConHU.getModel("HandlingUnitModel").refresh();
                        },


                        handleGrossWtF4SelectDialogclose:function(oEvent){
                            this._oDialogGrossWtF4.close();
                        },	
                     //f4 vol unit========================================================================================
                          handleVolUnit:function(oEvent) {
                                
                                
                                
                                var that = this;
                                that.oSource= oEvent.getSource();
                                var oModel = this.getMainModel();
                                var VolUnit = this.getView().byId("id_VolUnit").mProperties.value;
                                
                                var filters = [];
                                if(VolUnit !== ''){
                                    filters.push(new Filter("VolUnit",sap.ui.model.FilterOperator.EQ,VolUnit));
                                }
                                
                                 
                                var sPath = "/F4_Volume_UnitSet";
                                this.getOwnerComponent().getModel().read(sPath, {
                                    async: true,
                                    filters : filters,
                                    success: function(oData, oResponse) {

                                        var oVolUnitModel = new sap.ui.model.json.JSONModel(oData.results); //new JSONModel(oData.results);
                                        if (!that._oDialogVolUnitF4) {
                                            that._oDialogVolUnitF4 = new sap.ui.xmlfragment(
                                                    "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.VolUnitF4", that);
                                            that.getView().addDependent(that._oDialogVolUnitF4);

                                        }
                                        sap.ui.getCore().byId("IdSearchVolUnit").setValue("");
                                        that._oDialogVolUnitF4.open();
                                        sap.ui.getCore().byId("ListIdVolUnit").setModel(oVolUnitModel,"VolUnitModel");


                                    },
                                    error: function(oError) { 

                                    }
                                });

                            },

                            handleSrchVolUnit: function(oEvent) {

                                var sValue=oEvent.getParameters("value").query;
                                var andArr = [];
                                var oFilter = [
                                    new Filter("VolUnit",sap.ui.model.FilterOperator.Contains,sValue),
                                    new Filter("UnitText",sap.ui.model.FilterOperator.Contains,sValue)
                                ];
                                andArr.push(new Filter(oFilter,false));
                                sap.ui.getCore().byId("ListIdVolUnit").getBinding("items").filter(andArr);
                                
                                 
                         },				

                         onVolUnitListSelect:function(oEvent){  
                                
                                var that = this;
                                var flag = 0;
                                var listItem=oEvent.getParameter("listItem").getBindingContext("VolUnitModel").getObject();
                                var TblShpConHU = this.getView().byId("TblShpConHU");
                                var sPath = that.oSource.getParent().getBindingContext("HandlingUnitModel").sPath;
                                var selectedObj =	that.oSource.getParent().getBindingContext("HandlingUnitModel").getProperty(sPath);
                                selectedObj.VolUnit = oEvent.getSource().getSelectedItem().mProperties.title;
                                    this._oDialogVolUnitF4.close();
                                    
                                    TblShpConHU.getModel("HandlingUnitModel").refresh();
                            },


                            handleVolUnitF4SelectDialogclose:function(oEvent){
                                this._oDialogVolUnitF4.close();
                            },	
                             //f4  unit========================================================================================
                            handleLbhUnit:function(oEvent) {
                                    
                                    
                                    
                                    var that = this;
                                    that.oSource= oEvent.getSource();
                                    var oModel = this.getMainModel();
                                    var LbhUnit = this.getView().byId("id_LbhUnit").mProperties.value;
                                    //var FreightForwarderDesc = this.getView().byId("id_inp_FreightForwarder").mProperties.text;
                                    
                                    var filters = [];
                                    if(LbhUnit !== ''){
                                        filters.push(new Filter("Unit",sap.ui.model.FilterOperator.EQ,LbhUnit));
                                    }
                                    
                                     
                                    var sPath = "/F4_LWH_UnitSet";
                                    this.getOwnerComponent().getModel().read(sPath, {
                                        async: true,
                                        filters : filters,
                                        success: function(oData, oResponse) {

                                            var oLbhUnitModel = new sap.ui.model.json.JSONModel(oData.results); //new JSONModel(oData.results);
                                            if (!that._oDialogLbhUnitF4) {
                                                that._oDialogLbhUnitF4 = new sap.ui.xmlfragment(
                                                        "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.UnitF4", that);
                                                that.getView().addDependent(that._oDialogLbhUnitF4);

                                            }
                                            sap.ui.getCore().byId("IdSearchLbhUnit").setValue("");
                                            that._oDialogLbhUnitF4.open();
                                            sap.ui.getCore().byId("ListIdLbhUnit").setModel(oLbhUnitModel,"LbhUnitModel");


                                        },
                                        error: function(oError) { 

                                        }
                                    });

                                },

                                handleSrchLbhUnit: function(oEvent) {

                                    var sValue=oEvent.getParameters("value").query;
                                    var andArr = [];
                                    var oFilter = [
                                        new Filter("UomLwh",sap.ui.model.FilterOperator.Contains,sValue),
                                        new Filter("UnitText",sap.ui.model.FilterOperator.Contains,sValue)
                                    ];
                                    andArr.push(new Filter(oFilter,false));
                                    sap.ui.getCore().byId("ListIdLbhUnit").getBinding("items").filter(andArr);
                                    
                                     
                             },				

                             onLbhUnitListSelect:function(oEvent){  
                                    
                                    var that = this;
                                    var flag = 0;
                                    var listItem=oEvent.getParameter("listItem").getBindingContext("LbhUnitModel").getObject();
                                    
                                    var TblShpConHU = this.getView().byId("TblShpConHU");
                                    var sPath = that.oSource.getParent().getBindingContext("HandlingUnitModel").sPath;
                                    var selectedObj =	that.oSource.getParent().getBindingContext("HandlingUnitModel").getProperty(sPath);
                                    selectedObj.UomLwh = oEvent.getSource().getSelectedItem().mProperties.title;
                                      
                                        this._oDialogLbhUnitF4.close();
                                        
                                        TblShpConHU.getModel("HandlingUnitModel").refresh();
                                },


                                handleLwhF4SelectDialogclose:function(oEvent){
                                    this._oDialogLbhUnitF4.close();
                                },	
              
                                          
                     
                     
                     //---------------------------batch update on save------------------------------------------------------------------     
    
                     highlighHUs : function(results,huArray){
                         var shipmentNum="";
                         for(var i=0;i<huArray.length;i++){
                                
                                for(var j = 0;j < results.length;j++){
                                       shipmentNum = results[j].MessageV2.replace(/^0+/, '');
                                       if(huArray[i].ExtHuId === shipmentNum){
                                              if(results[j].Type === "S"){
                                                     huArray[i].customState = "Success";
                                              }else if(results[j].Type === "E"){
                                                     huArray[i].customState = "Error";
                                              }
                                       }
                                }
                                
                         }
                         this.getView().byId("TblShpConHU").getModel('HandlingUnitModel').refresh();
                  },

      
                     
                     
                     
                        
onExit: function() {
if (this._oPersonalizationDialog) {
this._oPersonalizationDialog.destroy();
}

},

//updated save function by comparing json models

handleItemsUpdate : function(oEvent) {

var that = this;
var originalItemsData =this.getModel("itemOriginalModel").getData();
var updatedItemsData = this.getView().byId("TblShpConHU").getModel("HandlingUnitModel").getData();

var itemDetail = {}, itemList = [];
for(var k=0; k<updatedItemsData.length; k++){
 if(updatedItemsData[k].ExtHuId === originalItemsData[k].ExtHuId){
     if ((updatedItemsData[k].GrossWeight !== originalItemsData[k].GrossWeight) ||
     (updatedItemsData[k].WeightUnit !== originalItemsData[k].WeightUnit) ||
     (updatedItemsData[k].Length !== originalItemsData[k].Length) ||
     (updatedItemsData[k].Width !== originalItemsData[k].Width) ||
     (updatedItemsData[k].Height !== originalItemsData[k].Height) ||
     (updatedItemsData[k].UomLwh !== originalItemsData[k].UomLwh) ||
     (updatedItemsData[k].Volume !== originalItemsData[k].Volume) ||
     (updatedItemsData[k].VolUnit !== originalItemsData[k].VolUnit)){
         itemDetail = {};
         itemDetail.ExtHuId = updatedItemsData[k].ExtHuId ;
         itemDetail.PckgObject = updatedItemsData[k].PckgObject ;
         itemDetail.ObjKey = updatedItemsData[k].ObjKey ;
         itemDetail.GrossWeight = updatedItemsData[k].GrossWeight ;
         itemDetail.WeightUnit = updatedItemsData[k].WeightUnit ;
         itemDetail.Length = updatedItemsData[k].Length ;
         itemDetail.Width = updatedItemsData[k].Width ;
         itemDetail.Height = updatedItemsData[k].Height ;
         itemDetail.UomLwh = updatedItemsData[k].UomLwh ;
         itemDetail.Volume = updatedItemsData[k].Volume ;
         itemDetail.VolUnit = updatedItemsData[k].VolUnit ;
         itemList.push(itemDetail);
     
     }
 }
}
     if(itemList.length !== 0){
            var bAllItemSuccess=false,itemStatus='';
            var title = this.getView().byId("pageShipmentContent").getTitle();
            title = title.split("- ");
            
             var CreateContentObj = {
                     "d" : {
                         "ShipmentNum" : title[1],
                         "Packages" :itemList,
                         "Messages":[]
                 }
             };
             var oModel = this.getMainModel();
      
             oModel.create("/ShipmentSet",CreateContentObj,{
                                 success : function(oData,response) {
                                     sap.ui.core.BusyIndicator.hide();
                                     if(oData.Messages&&oData.Messages.results&&oData.Messages.results.length){
                                         var results = oData.Messages.results;
                                         
                                         results.forEach(function(obj){
                                             if(obj.Type === 'S'){
                                             MessageBox.success(obj.MessageV1 +" "+ obj.MessageV2 +" "+ obj.MessageV3,
                                                     {
                                                         styleClass : "sapUiSizeCompact"
                                                     });
                                             }else{
                                                 MessageBox.error(obj.MessageV1 +" "+ obj.MessageV2 +" "+ obj.MessageV3,
                                                         {
                                                             styleClass : "sapUiSizeCompact"
                                                         });
                                             }
                                         });
                                         that.highlighHUs(results,that.getView().byId("TblShpConHU").getModel('HandlingUnitModel').getData());
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
                                     
                                     that.getView().byId("TblShpConHU").getModel('HandlingUnitModel').refresh(true);
                                                                                              
                                 },
                                 error:function(oError){
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
         MessageBox.error(
                    that.getResourceBundle().getText("ContentScreen.NoItem"),
                    {
                        title: "Error",
                        onClose: null,
                    }
                    );
                    
     }
     
 


},
//-----------------------------------------Print Docs functionality-----------------------------
//---------------opening the output type table fragment------------------

handlePrintOutputF4Open:function(){
    var i18n = this.getResourceBundle();
    var that = this;
    var filters = [];
    
    filters.push(new Filter("CcdName",sap.ui.model.FilterOperator.EQ,"Z_SUP_MDD0056_PRINT_OUTPUT_TYPE"));
    filters.push(new Filter("DelInd",sap.ui.model.FilterOperator.EQ,""));
    
    var sPath = "/F4_Print_OpTypeSet";
    this.getOwnerComponent().getModel().read(sPath, {
        async: true,
        filters : filters,
        success: function(oData, oResponse) {
            if(oData.results.length){
                
            that.getModel("OutputTypeModel").setData(oData.results);
            if (!that._oDialogOutputTypeFrag) {
                that._oDialogOutputTypeFrag = new sap.ui.xmlfragment(
                        "com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.OutputType", that);
                that.getView().addDependent(that._oDialogOutputTypeFrag);
            }
            that._oDialogOutputTypeFrag.open();
            }
            else{
                MessageBox.error(i18n.getText("outputTypes.NoData"));
            }
        },
        error: function(oError){

        }
    });
},		 


    handleOutputTypeClose:function(){
                    this._oDialogOutputTypeFrag.close();
                },
                
                handleOutputTypeOk:function(){
                    var tblOutputType = sap.ui.getCore().byId("TblOutputType");
                    var outTypeDesc =  tblOutputType.getContextByIndex(tblOutputType.getSelectedIndices()).getObject().OpTypeDesc;
                    this.getView().byId("inp_PrintOutputType").setValue(outTypeDesc);
                    this._oDialogOutputTypeFrag.close();
                }, 
     
                //Opening the Print fragment
                 OnClickPrintDocs:function(){
                     var i18n = this.getResourceBundle();
                     var tblShipCon = this.getView().byId("TblShpConDelivery");
                   var oModel = tblShipCon.getModel("ShipmentContentDelvModel").getData();
                     
                     
                     
                        if(!oModel.length){
                            MessageBox.warning(this.getResourceBundle().getText("PrintPopUp.NoDataToPrint"));						            		
                        }
                        else{
                            //check shipment status	
                            //this.getModel("statusModel").getProperty("editable") 
                            
                            //Start of defect Id #24530
                            //This code is commented as it is no longer a business requirement
                            
                            /* if(this.OverallStatus === "0" ){
                                   MessageBox.error(i18n.getText("Print.validation"));
                                   return;
                              }*/
                            //End of defect Id #24530
                            
                              //------------
                            if (!this._oDialogPrintScreen) {
                                this._oDialogPrintScreen = sap.ui.xmlfragment(this.getView().getId(),"com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.fragments.PrintF4",this);
                                this.getView().addDependent(this._oDialogPrintScreen);
                                }
                                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(),this._oDialogPrintScreen);
                                this._oDialogPrintScreen.open();
                                                                
                        }
                 },
                 
                 //Closing the Print fragment
                 handlePrintCloseButton:function(){
                     this._oDialogPrintScreen.close();
                     this.getView().byId("inp_PrintOutputType").setValue("");
                 }, 
                 
               //On clicking the Print button
                 onPrintPress:function(){
                     
                  var i18n = this.getResourceBundle();	 
                     var tblShpConDelivery = this.getView().byId("TblShpConDelivery");
                     var tblShpConDeliveryModel = tblShpConDelivery.getModel("ShipmentContentDelvModel");
                     var finalDelvArray = removeDeliveryDuplicateUsingFilter(tblShpConDeliveryModel.oData);
                    
                     var tblOutputType = sap.ui.getCore().byId("TblOutputType");
                     var outputType = tblOutputType.getContextByIndex(tblOutputType.getSelectedIndices()).getObject().OutputType;
                     var applicationType = tblOutputType.getContextByIndex(tblOutputType.getSelectedIndices()).getObject().Application;
                     var outputDevice = this.getView().byId("id_InpDeviceType").getValue();
                     var shipmentNum = this.getView().byId("pageShipmentContent").getTitle().split("- ")[1];
                     var that = this; 
                     
                                                      
                     var oBusyDialog = new sap.m.BusyDialog();
                    oBusyDialog.open();
                    
                   var oModel = this.getMainModel();
                var sRead =	"/PrintPdfSet(Output='"+ outputType+ "',Printer='"+ outputDevice+ "',Document='"+ shipmentNum+ "',ShipmentStatus='',IsInitial='',Application='"+ applicationType+ "',OutputType='')";
                //Begin of defect Id #24530
                //condition checks before the user presses the Print button
                if((this.ShipmentTypeId ==="Z005" || this.ShipmentTypeId ==="Z006") &&(this.OverallStatus ==="0" || this.OverallStatus ==="1" || this.OverallStatus ==="2"
                    || this.OverallStatus ==="5" || this.OverallStatus ==="6" || this.OverallStatus ==="7") && (outputType === "ZPAK" || outputType ==="ZCSD")){
                    if(applicationType=="V7"){
                        oModel.read(sRead +"/$value",

                                {
                                    success : function(oData,oResponse) {
                                        var pdfURL = oResponse.requestUri;
                                        var html = new sap.ui.core.HTML();
                                        html.setContent("<iframe src='"
                                                        + pdfURL
                                                        + "' width='0' height='0'></iframe>");
                                        var panel = new sap.m.Panel();
                                        panel.addContent(html);
                                        panel.placeAt("content");
                                        oBusyDialog.close();
                                    },
                                    error : function(oError) {
                                        //error handled in ErrorHandler.js
                                        oBusyDialog.close();
                                        that._oDialogPrintScreen.close();
                                    }
                                });
                    }
                    
                    else if (applicationType=="V2"){
                        oModel.setDeferredGroups(["printHlsGroupId"]);
                        oModel.setChangeGroups({
                            "PrintPdfSet": {
                                groupId: "printHlsGroupId",  
                                changeSetId: "1"
                            }
                        });
                        
                        for (var i=0; i < finalDelvArray.length; i++){
                            oModel.read("/PrintPdfSet(Output='"+ outputType+ "',Printer='"+ outputDevice+ "',Document='"+ finalDelvArray[i].DeliveryNum+ "',Application='"+ applicationType+ "')/$value",{
                                groupId: "printHlsGroupId",  
                                changeSetId: i+1
                            });
                        }
                        oModel.submitChanges({groupId: "printHlsGroupId",
                            
                            success:function(oData,oResponse) {
                                var pdfURL = oResponse.requestUri;
                                var html = new sap.ui.core.HTML();
                                html.setContent("<iframe src='"
                                                + pdfURL
                                                + "' width='0' height='0'></iframe>");
                                var panel = new sap.m.Panel();
                                panel.addContent(html);
                                panel.placeAt("content");
                            },
                        
                        error:function(err){
                        //error message handled in error handler.js	
                            
                            
                        }});
                    }
                }
                //Change - INC000023532251 , added outputType === "ZDRP"
                else if((this.ShipmentTypeId ==="Z005" || this.ShipmentTypeId ==="Z006") &&(this.OverallStatus ==="1" || this.OverallStatus ==="2"
                    || this.OverallStatus ==="5" || this.OverallStatus ==="6" || this.OverallStatus ==="7") && (outputType === "ZSIN" || outputType === "ZDRP" || outputType === "ZCOM")){
                    if(applicationType=="V7"){
                        oModel.read(sRead +"/$value",

                                {
                                    success : function(oData,oResponse) {
                                        var pdfURL = oResponse.requestUri;
                                        var html = new sap.ui.core.HTML();
                                        html.setContent("<iframe src='"
                                                        + pdfURL
                                                        + "' width='0' height='0'></iframe>");
                                        var panel = new sap.m.Panel();
                                        panel.addContent(html);
                                        panel.placeAt("content");
                                        oBusyDialog.close();
                                    },
                                    error : function(oError) {
                                        //error handled in ErrorHandler.js
                                        oBusyDialog.close();
                                        that._oDialogPrintScreen.close();
                                    }
                                });
                    }
                    
                    else if (applicationType=="V2"){
                        oModel.setDeferredGroups(["printHlsGroupId"]);
                        oModel.setChangeGroups({
                            "PrintPdfSet": {
                                groupId: "printHlsGroupId",  
                                changeSetId: "1"
                            }
                        });
                        
                        for (var i=0; i < finalDelvArray.length; i++){
                            oModel.read("/PrintPdfSet(Output='"+ outputType+ "',Printer='"+ outputDevice+ "',Document='"+ finalDelvArray[i].DeliveryNum+ "',Application='"+ applicationType+ "')/$value",{
                                groupId: "printHlsGroupId",  
                                changeSetId: i+1
                            });
                        }
                        oModel.submitChanges({groupId: "printHlsGroupId",
                            
                            success:function(oData,oResponse) {
                                var pdfURL = oResponse.requestUri;
                                var html = new sap.ui.core.HTML();
                                html.setContent("<iframe src='"
                                                + pdfURL
                                                + "' width='0' height='0'></iframe>");
                                var panel = new sap.m.Panel();
                                panel.addContent(html);
                                panel.placeAt("content");
                            },
                        
                        error:function(err){
                        //error message handled in error handler.js	
                            
                            
                        }});
                    }
                }
                
                else{
                     MessageBox.error(i18n.getText("Print.validation"));
                     oBusyDialog.close();
                     //that._oDialogPrintScreen.close();
                       return;
                }
                                 },	 
                     
                       //----End of defect Id #24530   
                                 
                                 
        //start of RFC#7000013937:CD#2000031553 : For ZPAK print button functionality
                                 onZPAKPrintPress:function(){
                                         
                                         var shipmentNum = this.getView().byId("pageShipmentContent").getTitle().split("- ")[1];
                                         var oBusyDialog = new sap.m.BusyDialog();
                                        oBusyDialog.open();
                                        
                                       var oModel = this.getMainModel();
                                    var sRead =	"/PrintPdfSet(Output='ZPAK',Printer='LOCL',Document='"+ shipmentNum+ "',ShipmentStatus='',IsInitial='',Application='V7',OutputType='')";
                                            oModel.read(sRead +"/$value",

                                                    {
                                                        success : function(oData,oResponse) {
                                                            var pdfURL = oResponse.requestUri;
                                                            var html = new sap.ui.core.HTML();
                                                            html.setContent("<iframe src='"
                                                                            + pdfURL
                                                                            + "' width='0' height='0'></iframe>");
                                                            var panel = new sap.m.Panel();
                                                            panel.addContent(html);
                                                            panel.placeAt("content");
                                                            oBusyDialog.close();
                                                        },
                                                        error : function(oError) {
                                                            //error handled in ErrorHandler.js
                                                            oBusyDialog.close();
                                                        }
                                                    });	
                                 },
                                 
        //End of RFC#7000013937:CD#2000031553 : For ZPAK print button functionality			             
                                 //-------------------------------Download Shipment Content Data------------------------------------------
                                 OnClickDownloadShipmentContent:function(oEvt){
                                     var tabShipConDelv = this.getView().byId("TblShpConDelivery");
                                     var oModel =  tabShipConDelv.getModel("ShipmentContentDelvModel");
                             
                                     
                                        if(oModel.getData().length)
                                          this.downloadToExcel(oModel,this.getView().byId("TblShpConDelivery").getColumns());
                                        else{
                                            MessageBox.warning(this.getResourceBundle().getText("Download.NoDataToDownload"));
                                        }
                                },
                                 //----------------------------------------Download HU Data------------------------------------			    
                                OnClickDownloadHU:function(oEvt){
                                    var tabShipConHU = this.getView().byId("TblShpConHU");
                                    var oModel = tabShipConHU.getModel("HandlingUnitModel");
                                        
                                    if(oModel.getData().length){
                                         this.downloadToExcel(oModel,this.getView().byId("TblShpConHU").getColumns());
                                        }else{
                                            MessageBox.warning(this.getResourceBundle().getText("Download.NoDataToDownload"));
                                        }
                                }, 
                                 
                                    /*downloadToExcel : function(oModel,totalColumns){
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
                                                                            
                                                                            if(totalColumns[i].mAggregations.template.mBindingInfos.value){
                                                                                columnObj.template.content = "{" +totalColumns[i].mAggregations.template.mBindingInfos.value.parts[0].path+"}";
                                                                            }
                                                                            else{
                                                                            columnObj.template.content = "{" +totalColumns[i].mAggregations.template.mBindingInfos.text.parts[0].path+"}";
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
                                                                            oExport.saveFile();
                                                                        }
                                                                        catch(oError) {
                                                                            sap.m.MessageToast.show(this.getResourceBundle().getText("exportToExcelError"));
                                                                            
                                                                        }
                                                                    
                                                        
                                                                    },	   */ 
                        });

});