//mix in the Backbone Events class


function ConfigManager() {
	//mixin the Backbone events class
	_.extend(this, Backbone.Events);
	//this holds the list of config files to select from as declared in main.json
	this.configList = Array();
	//this holds the current config properties
	this.currentConfig = {};
	//load in the list of config files
	this.loadConfigList();
	//set up event listener for when a config is selected
	this.on('hcc:loadConfig', function(data) {
		this.loadConfig(data);
	});
	//set up event listener to go to config screen to change configs
	//set up listener for config keystroke
	$(document).keyup(function(e) {
		if (e.keyCode == 67 && e.ctrlKey) {					
			//enter config screen
			HCC_CheckInKiosk.appRouter.navigate('configScreen',{trigger:true});
		}
	});
}

ConfigManager.prototype.checkConfig = function() {
	//check local storage for config
    try {
        var config = JSON.parse(localStorage.getItem('hcc-checkIn-config'));

        if (!config) {
            //show no config view here
            this.trigger('hcc:noConfig');
        } else {
            this.loadConfig(config.configDirectory);
        }
    } catch (e) {
        //no local storage here, trigger no config view
        this.trigger('hcc:noConfig');
    }
}

ConfigManager.prototype.loadConfigList = function() {

	var thisConfig = this;
	var configArray = Array();

	$.getJSON('cfg/main.json',function(data) {

		$.each(data.configFiles,function(key,value) {
			thisConfig.configList.push(value);
		});

	});
}

ConfigManager.prototype.getConfigList = function() {

	if (this.configList.length > 0) {
		return this.configList;
	} else {
		return false;
	}

}

ConfigManager.prototype.loadConfig = function(configDirectory) {
	
	var thisConfig = this;

	thisConfig.currentConfig.configDirectory = configDirectory;
	
	//load in the config file
	$.getJSON('cfg/'+ configDirectory + '/config.json', function(data) {
		//put all the config values into the object
		$.each(data, function(index,value) {
			thisConfig.currentConfig[index] = value;
		});
	});

	loadScripts('cfg/'+ configDirectory + '/scripts/model.js', function () {
		HCC_CheckInKiosk.appModel = new CheckInModel();
		//set the model info that needs to be set from the config
		HCC_CheckInKiosk.appModel.set({f1Status: thisConfig.f1status});
	});

	//load in data entry view script
	loadScripts('cfg/'+ configDirectory + '/scripts/dataEntry.js', function () {
		//create the data entry view to be used later in the application. 
		//pass it the app model and it's config path
		HCC_CheckInKiosk.dataEntryView = new DataEntryView(HCC_CheckInKiosk.appModel,'cfg/'+ configDirectory);
	});

	//save the config to localStorage for this session
	try {
		localStorage.setItem('hcc-checkIn-config', JSON.stringify(thisConfig.currentConfig));
	} catch(e) {
		//could not save to localStorage
	}

	console.log('config loaded');

	//trigger config loaded event
	HCC_CheckInKiosk.trigger('hcc:configLoaded');
}

