AppRouter = Backbone.Router.extend({

	routes: {
		'noConfig':'noConfig',
		'configScreen':'configScreen',
		'scan':'scan',
		'lookUp':'lookUp',
		'dataEntry':'dataEntry'
	},

	noConfig:function() {
		if (!HCC_CheckInKiosk.noConfigView) {
			HCC_CheckInKiosk.noConfigView = new NoConfigView();
		}
	}, 

	configScreen:function() {
		if (!HCC_CheckInKiosk.configScreen) {
			HCC_CheckInKiosk.configScreen = new ConfigScreen();
		}
	}, 

	scan:function() {
		console.log('go to scan');
		if (!HCC_CheckInKiosk.scanForm) {
			HCC_CheckInKiosk.scanForm = new ScanFormView();
		}

		HCC_CheckInKiosk.scanForm.render();
	},

	lookUp:function() {
		if (!HCC_CheckInKiosk.lookUpForm) {
			HCC_CheckInKiosk.lookUpForm = new LookUpFormView();
		}

		HCC_CheckInKiosk.lookUpForm.render();		
	},

	dataEntry:function() {
		if (!HCC_CheckInKiosk.dataEntryView) {
			HCC_CheckInKiosk.dataEntryView = new DataEntryView();
		}

		HCC_CheckInKiosk.dataEntryView.render();		
	}


});