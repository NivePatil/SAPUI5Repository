sap.ui.define([], function() {
	"use strict";

	return {
		showOnlyMaterialGrp: function(sValue){
			var aTitle = sValue.split("-");
			return aTitle[0];
		},
		formatDateOutput: function(sValue){
			var year = sValue.substring(0,4), month = sValue.substring(4,6), date = sValue.substring(6), inputDate = new Date(year, month-1, date);
			var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
	            	pattern: "dd-MMM-yyyy"
	            });
			var formattedDate = oFormat.format(inputDate);
	        return formattedDate;
		}
	};

},/* bExport= */true);