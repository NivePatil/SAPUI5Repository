/*
 * Copyright 2015 SLB declaration of used JS files
 */
jQuery.sap.declare("com.slb.sup.lh.shipment.monitor.zsuplhshpdsh.util.Helper");
jQuery.sap.require("sap.m.MessageBox");



/*function displayMessage(msgType, usrMsg, bDetails, detailsMsg, fnAfterClose) {
    var icon;
    switch (msgType.toUpperCase()) {
    case "ERROR":
	icon = sap.m.MessageBox.Icon.ERROR;
	break;
    case "QUESTION":
	icon = sap.m.MessageBox.Icon.QUESTION;
	break;
    case "SUCCESS":
	icon = sap.m.MessageBox.Icon.SUCCESS;
	break;
    case "WARNING":
	icon = sap.m.MessageBox.Icon.WARNING;
	break;
    default:
	icon = sap.m.MessageBox.Icon.INFORMATION;
	break;
    }
    if (bDetails)
	sap.m.MessageBox.show(usrMsg, {
	    icon : icon,
	    title : msgType,
	    styleClass : "displayMessageBox",
	    actions : [ sap.m.MessageBox.Action.OK ],
	    // id: "messageBoxId1", //If this is added, then it will only create
	    // one instance of the messagebox at a time.
	    defaultAction : sap.m.MessageBox.Action.OK,
	    details : detailsMsg,
	    onClose : fnAfterClose
	});
    else
	sap.m.MessageBox.show(usrMsg, {
	    icon : icon,
	    title : msgType,
	    styleClass : "displayMessageBox",
	    actions : [ sap.m.MessageBox.Action.OK ],
	    // id: "messageBoxId1", //If this is added, then it will only create
	    // one instance of the messagebox at a time.
	    defaultAction : sap.m.MessageBox.Action.OK,
	    onClose : fnAfterClose
	});
}*/

/**
 * 
 */
/*function geti18nModel() {
    var oBundleUrl = "./i18n/i18n.properties";
    // trace("Loading I18N from : " + oBundleUrl);
    I18N = new sap.ui.model.resource.ResourceModel({
	bundleUrl : oBundleUrl
    });
    return I18N;
}*/

function resetTableFilterSort(table) {
  
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
     // table.getModel().refresh(true);
     for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
            table.getColumns()[iColCounter]
                          .setSorted(false);
            table.getColumns()[iColCounter]
                          .setFilterValue("");
            table.getColumns()[iColCounter]
                          .setFiltered(false);
     }
}

}
function readOdataAndReturnPromise(oModel, path, urlParams) {
    // create a new defered promise
    var promise = jQuery.Deferred();
    oModel.read(path, {
	urlParameters : urlParams,
	success : function(oData, oResponse) {
	    // resolve the promise remove
	    promise.resolve(oData);
	},
	error : function(oResponse) {
	    promise.reject(oResponse);
	}
    });

    return promise;
}
function checkDuplicatePropertyInArray(mainArr,propertyNamesArr){
	var concatString='',bCompareVal=false,duplicateString;
	var aConcatValues = mainArr.map(function(value) {
	 	concatString = '';
	 	for(var i=0;i<propertyNamesArr.length;i++){
	 		concatString += value[propertyNamesArr[i]]+",";
	 	}
	    return concatString
	  });
		bCompareVal =  aConcatValues.some(function(value, index, array) { 
				duplicateString = value;
		       return aConcatValues.indexOf(value) !== aConcatValues.lastIndexOf(value);  
		     })
		return [bCompareVal,duplicateString];
}


function removeDuplicateUsingFilter(arr){
	   
	var obj = {},newArr;

	for ( var i=0, len=arr.length; i < len; i++ )
	    obj[arr[i]['ExtHuId']] = arr[i];

	newArr = new Array();
	for ( var key in obj )
		newArr.push(obj[key]);
	return newArr;
}

function removeDeliveryDuplicateUsingFilter(arr){
	   
	var obj = {},newArr;

	for ( var i=0, len=arr.length; i < len; i++ )
	    obj[arr[i]['DeliveryNum']] = arr[i];

	newArr = new Array();
	for ( var key in obj )
		newArr.push(obj[key]);
	return newArr;
} 

/*function getServiceUrl(sServiceUrl) {
	  //for local testing prefix with proxy
	  //if you and your team use a special host name or IP like 127.0.0.1 for localhost please adapt the if statement below 
	  if (window.location.hostname == "localhost") {
	      return "proxy" + sServiceUrl;
	  } else {
	      return sServiceUrl;
	  }
}
function fnFieldsValidation(NonSLBFlag,Pstyp,IbdExistInd,IbdRequired,RetItem){
	var enabled = true;
	if(RetItem){
		enabled=false;
	}else if(NonSLBFlag){	//Non SLB -(CUSL)
		if(Pstyp === "3") //Sub con items
		{
			if(!(IbdExistInd) && !(IbdRequired)){ //Sub con with IBD not required and IBD doesnt exist
				enabled = false;
			}else if(IbdExistInd || IbdRequired){
				enabled = true;
			}
		}
	}
	return enabled;
}*/
