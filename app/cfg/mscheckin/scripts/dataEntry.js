DataEntryView = Backbone.view.extend({

	initialize:function(whichModel, templatePath, controllerPath) {
		//set a link to the custom model defined
		this.model = whichModel;
		this.templatePath = templatePath;
		this.controllerPath = controllerPath;
		this.el = '#contentPanel';
	},

	render:function() {

		var thisView = this;

		//load in the template for data entry based on the path that gets 
		$.get('templates/configscreen.html',function(data) {
			thisView.template = _.template(data);
			$(thisView.el).html(html);

			$(thisView.el).find('#dataEntry').animate(
				{opacity:'show'},
				{
					duration:300,
					start:function() {
					//change the height of the panel once the template is loaded
					var height =  $(thisView.el).prop('scrollHeight');
					$(thisView.el).css('height',height);
				}
				}
			);

		});





	}





});