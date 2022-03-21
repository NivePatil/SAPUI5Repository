/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["com/slb/cpf/online/nonpo/zcpfnpotmplte/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
