/*
 * Copyright 2015 SLB declaration of used JS files
 */
jQuery.sap.declare("com.slb.sup.vessel.tracker.zsupvesltrckr.util.Helper");
jQuery.sap.require("sap.m.MessageBox");

function resetTableFilterSort(table) {
	if (table) {
		var iColCounter = 0;
		table.clearSelection();
		var iTotalCols = table.getColumns().length;
		var oListBinding = table.getBinding();
		if (oListBinding) {
			oListBinding.aSorters = null;
			oListBinding.aFilters = null;
			oListBinding.refresh(true);
		}
		for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
			table.getColumns()[iColCounter].setSorted(false);
			table.getColumns()[iColCounter].setFilterValue("");
			table.getColumns()[iColCounter].setFiltered(false);
		}
	}

}
function readOdataAndReturnPromise(oModel, path, urlParams, filterParams) {
	// create a new defered promise
	var promise = jQuery.Deferred();
	oModel.read(path, {
		urlParameters: urlParams,
		filters: filterParams,
		success: function (oData, oResponse) {
			// resolve the promise remove
			promise.resolve(oData);
		},
		error: function (oResponse) {
			promise.reject(oResponse);
		}
	});

	return promise;
}