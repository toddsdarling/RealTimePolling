/*global CheckInKiosk, $*/


window.HCC_CheckInKiosk = {
    init: function () {
        'use strict';
        _.extend(this, Backbone.Events);
        this.appRouter = new AppRouter();
        Backbone.history.start({silent:true});
        //navigate back to ready state
        this.appRouter.navigate('');
        //listen for config change events. When this is fired, the new config will have been loaded
        this.on('hcc:configLoaded', function(e){
            this.appRouter.navigate('scan', {trigger:true});
        }, this);
        //listen for noconfig events. The config manager will fire this if there's no config present
        this.on('hcc:noConfig', function(e){
            this.appRouter.navigate('noConfig', {trigger:true});
        }, this);

    }
};

$(document).ready(function () {    
    HCC_CheckInKiosk.init();
    //instantiate config manager
    HCC_CheckInKiosk.configManager = new ConfigManager();
    //check config
    HCC_CheckInKiosk.configManager.checkConfig();

    /*
    if (!appConfig) {
        //show no config view
        HCC_CheckInKiosk.appRouter.navigate('noConfig',{trigger:true});
    } else {
        //load config here..just need to pass it the directory and it will
        //load the config file from there
        HCC_CheckInKiosk.configManager.loadConfig(appConfig.configDirectory);
    } */


});