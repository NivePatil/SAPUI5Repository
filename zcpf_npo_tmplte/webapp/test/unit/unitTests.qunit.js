/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comslb.cpf.online.nonpo./zcpf_npo_tmplte/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
