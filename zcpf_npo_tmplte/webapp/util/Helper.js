/*
 * Copyright 2015 SLB declaration of used JS files
 */
jQuery.sap.declare("com.slb.cpf.online.nonpo.zcpfnpotmplte.util.Helper");

	function resetTableFilterSort(table) {
		if (table) {
		     var iColCounter = 0;
		     table.clearSelection();
		     var iTotalCols = table.getColumns().length, oListBinding = table.getBinding();
		     if (oListBinding) {
		    	 oListBinding.aSorters = null;
		    	 oListBinding.aFilters = null;
		    	 oListBinding.refresh(true);
		     }
		     // table.getModel().refresh(true);
		     for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
		            table.getColumns()[iColCounter].setSorted(false);
		            table.getColumns()[iColCounter].setFilterValue("");
		            table.getColumns()[iColCounter].setFiltered(false);
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
	function removeDuplicateUsingFilter(arr, parameter){
		var obj = {}, newArr;
		for ( var i=0, len=arr.length; i < len; i++ )
		    obj[arr[i][parameter]] = arr[i];
			newArr = new Array();
		for ( var key in obj )
			newArr.push(obj[key]);
		return newArr;
	}
