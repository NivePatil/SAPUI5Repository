/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comslbsuplhshipmentmonitor/zsup_lh_shp_dsh/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
