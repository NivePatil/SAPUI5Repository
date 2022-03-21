/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comslbsupvesseltracker/zsup_vesl_trckr/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
