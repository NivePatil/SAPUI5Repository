sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * This function is used to convert date and time as per UTC date and time. This function should be used when date is passed
		 * using filter paramters to backend. 
		 * @param {date} inpDate - Accept any date
		 * @returns 
		 */
		fnAdjustTimeZoneDiff: function (inpDate) {
			if (inpDate) {
				var iTimeZoneOffset = inpDate.getTimezoneOffset() * 60 * 1000;
				var iNewDateTime = inpDate.getTime() - iTimeZoneOffset;
				inpDate = new Date(iNewDateTime);
			}
			return inpDate;
		}
	};

}, true);