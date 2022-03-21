/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["com/slb/sup/lh/shipment/monitor/zsuplhshpdsh/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
