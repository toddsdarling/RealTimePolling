NoConfigView = Backbone.View.extend({

	initialize:function() {
		this.router = HCC_CheckInKiosk.appRouter;
		this.el = "#contentPanel";
		this.render();
	},

	render:function() {

		var thisView = this;

		$.get('templates/noconfig.html',function(data) {
			thisView.template = _.template(data);
			$(thisView.el).html(thisView.template);
		});

	}
});

ConfigScreen = Backbone.View.extend({

	initialize:function() {
		this.router = HCC_CheckInKiosk.appRouter;
		this.el = '#contentPanel';
		this.render();
	},

	render:function() {
		//get the list of config files
		var thisView = this;
		var configArray = HCC_CheckInKiosk.configManager.getConfigList();
		
		$.get('templates/configscreen.html',function(data) {

			thisView.template = _.template(data);

			var buttonList = '';

			//loop through and create buttons for each config file
			$.each(configArray,function(index,value) {
				buttonList += '<a href="#" data-directory="' + value.configDirectory + '" class="button configButton">' + value.configDisplayName + '</a>&nbsp;&nbsp;';
			});			

			var html = thisView.template({buttonList:buttonList});
			
			$(thisView.el).html(html);

			//set up listeners for buttons
			$('.configButtons a').click(function(e) {	
				e.preventDefault();
				//load the config file from the directory specified
				var directory = $(this).attr('data-directory');
				//trigger load event on config manager
				HCC_CheckInKiosk.configManager.trigger('hcc:loadConfig', directory);
			
			});




		});		

	}

});

ScanFormView = Backbone.View.extend({

	initialize:function() {
		this.el = '#contentPanel';
		this.router = HCC_CheckInKiosk.appRouter;
	},

	render:function() {

		var thisView = this;
		
		$.get('templates/scanForm.html',function(data) {
			
			thisView.template = _.template(data);

			var html = thisView.template();

			//swap out logo in the header
			$('#siteLogo').attr('src', 'cfg/'+ HCC_CheckInKiosk.configManager.currentConfig.configDirectory + '/' + HCC_CheckInKiosk.configManager.currentConfig.logo);

			$(thisView.el).html(html);

			//change the height of the panel once the template is loaded
			var height =  $(thisView.el).prop('scrollHeight');
			$(thisView.el).css('height',height);

			if ($('p.checkin-subtitle').length != 0) {
				$('p.checkin-subtitle').text(HCC_CheckInKiosk.configManager.currentConfig.displayname)
			} else {
				$(thisView.el).before('<p class="checkin-subtitle">' + HCC_CheckInKiosk.configManager.currentConfig.displayname + '</p>');
			}


			//set up action for form
			$(thisView.el).find('form').submit(function(e) {
				e.preventDefault();
				$(thisView.el).find('#scanForm-panel').css('background','rgba(214, 81, 38, .5)');

				thisView.showWaitingScreen();

				var formData = $('form').serialize() + '&method=searchBarCode';

				//call the lookup function on the model
				$.ajax({
					url:'lib/controller.php',
					type:'POST',
					data: whichData,
					success:this.barCodeResults,
					error:this.barCodeError,
					context:this,
					dataType:'json'
				});

			});

			//set up action for button click
			$(thisView.el).find('a#scanForm-nobc').click(function(e) {
				//navigate to fname, lname, dob lookup here
				thisView.router.navigate('lookUp',{trigger:true});
			});

			//if the form field loses focus, if the user presses anything EXCEPT the "no barcode" button, return focus to the form field
			$('body').click(function(e) {
				e.preventDefault();
				if ($(e.target).is('#scanForm-nobc')) {
					//trigger click action for button here
					$('a#scanForm-nobc').click;
				} else {
					$('input#scanForm-bc').focus();	
				}
			});

			$('input#scanForm-bc').focus();


		}, 'html');
	},


	barCodeResults:function(data,textStatus,obj) {
		
		var results = $.parseJSON(obj.responseText);

		if (results.action == 'singleMatch') {
			try {
				HCC_CheckInKiosk.appModel.set('fname',results.fname); 
			} catch (e) {

			}
			
			//show confirmation screen
			this.showConfirmationScreen();
		} else if (results.action = 'noMatch') {
			this.trigger('showNoMatchScreen');
		}

	},

	lookUpError:function(data,textStatus,obj) {

	}, 

	showWaitingScreen:function() {

		var thisView = this;
		//store the contents of the h1 and h2 tags in the view so we can restore them
		thisView.mainTitle = $(thisView.el).find('h1').text();
		thisView.secondaryTitle = $(thisView.el).find('h2').text();

		$(thisView.el).find('h1').text('Please wait...');
		$(thisView.el).find('h2').fadeOut(300);
		$(thisView.el).find('#scanForm-nobc').fadeOut(300);
	}, 

	showConfirmationScreen:function() {

		var thisView = this;

		var elementToChange = $(thisView.el).find('#scanForm-panel');
		waitingColor(elementToChange);

		$(thisView.el).find('h1').text(this.mainTitle);
		$(thisView.el).find('h2').text('Welcome, ' + HCC_CheckInKiosk.appModel.get('fname') + '! You are checked in.');
		$(thisView.el).find('h2').fadeIn(300);

		setTimeout(_.bind(thisView.resetScreen, thisView), 1000);

	},

	showNoMatchScreen:function() {

		var thisView = this;
		
		$(thisView.el).find('h1').text(this.mainTitle);
		$(thisView.el).find('h2').text('Could not find a match for this barcode. Please try again or press the "No Barcode" button to search by name and date of birth');
		$(thisView.el).find('h2').fadeIn(300);
		
		setTimeout(thisView.resetScreen,500);		
	},

	resetScreen:function() {
	
		//re-render the view
		this.render();

	}
});

LookUpFormView = Backbone.View.extend({

	initialize:function() {
		this.el = '#contentPanel';
		this.model = HCC_CheckInKiosk.appModel;
		this.router = HCC_CheckInKiosk.router;
	},	

	render:function() {

		var thisView = this;

		//load in the template
		$.get('templates/lookUpForm.html',function(data) {

			var templateData = {
					'fname': '',
					'lname': '',
					'dobmonth':'',
					'dobday':'',
					'dobyear':''
			};

			try {
				var storedData = localStorage.getItem('hcc-checkinkiosk-lookup');

				if (storedData != null) {
					templateData = JSON.parse(storedData);
				}

			} catch (e) {
				//templateData is already set as blank above
				//so no need to handle error
			}

			thisView.template = _.template(data);

			var html = thisView.template(templateData);
		
			$(thisView.el).html(html);

			$(thisView.el).find('#lookUp').animate(
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

			//set up form action
			$(thisView.el).find('a#checkInBtn').click(function(e) {
				e.preventDefault();
				thisView.validateLookUpForm($(thisView.el).find('#lookUpForm')[0]);
			});

		}, 'html');


	},

	validateLookUpForm:function(whichForm) {

		var thisView = this;

		//get all the select, input type and make sure they all have values
		$(whichForm).find('input,select').each(function() {
			
			if ($(this).val() == '') {
				$(this).addClass('error');	
			} else {
				$(this).removeClass('error');	
			}			
		});

		//do another check to make sure any numbers in the DOB aren't negative
		if ($('#userDobMonth').val() < 0) {
			$('#userDobMonth').addClass('error');
		}

		if ($('#userDobDay').val() < 0) {
			$('#userDobDay').addClass('error');	
		}

		if ($('#userDobYear').val() < 0) {
			$('#userDobYear').addClass('error');		
		}						

		//if NOTHING has the error class, go ahead and submit the form
		if ($(whichForm).find('input.error').length == 0) {

			$('p.error').css('display', 'none');

			var formData = {
				fname: $('#userFname').val(),
				lname: $('#userLname').val(),
				dobmonth: $('#userDobMonth').val(),
				dobday: $('#userDobDay').val(),
				dobyear: $('#userDobYear').val(),
				method: 'lookUp'
			};

			//if you're doing a local db lookup, send the db name onto the controller			
			if (HCC_CheckInKiosk.configManager.currentConfig.uselocaldb == true) {
				formData.localdbserver = HCC_CheckInKiosk.configManager.currentConfig.localdbserver;
				formData.localdbuser = HCC_CheckInKiosk.configManager.currentConfig.localdbuser;
				formData.localdbpassword = HCC_CheckInKiosk.configManager.currentConfig.localdbpassword;
				formData.localdbname = HCC_CheckInKiosk.configManager.currentConfig.localdbname;
				formData.localdbtable = HCC_CheckInKiosk.configManager.currentConfig.localdbtable;
				formData.localdbdobcolumn = HCC_CheckInKiosk.configManager.currentConfig.localdbdobcolumn;
			}

			//store info in localStorage in case the user needs to go back to the form
			try {

				var storageData = {
					fname: $('#userFname').val(),
					lname: $('#userLname').val(),
					dobmonth: $('#userDobMonth').val(),
					dobday: $('#userDobDay').val(),
					dobyear: $('#userDobYear').val()
				}
				//store form data in local storage
				localStorage.setItem('hcc-checkinkiosk-lookup', JSON.stringify(storageData));

			} catch(e) {
				//this can silently fail...if no local storage, the user will just have to 
				//enter their info again
			}

			//show waiting screen
			this.showWaitingScreen();

			//send the data on.
			$.ajax({
				url:"lib/controller.php",
				type:"POST",
				data:formData,
				success:thisView.searchResults,
				error:thisView.searchError,
				context:this,
				dataType:"json"					
			});

		} else {
			$('p.error').css('display', 'block');
		}


	},

	searchResults:function(data,textStatus,obj) {

		switch (data.action) {
			case 'noMatch':
				this.showNoMatchScreen();
				break;
			case 'singleMatch':
				this.showConfirmationScreen();
				break;
			case 'multipleMatch':
				this.showNoMatchScreen();
				break;
		}

	}, 

	searchError:function(data,textStatus,obj) {
		//this would be if the search couldn't be performed
	},

	showWaitingScreen:function() {

		var thisView = this;
		//store the contents of the h1 and h2 tags in the view so we can restore them
		$(thisView.el).find('h2').text('Searching...please wait');
		var elementToChange = $(thisView.el);
		waitingColor(elementToChange);

		$(thisView.el).find('form#lookUpForm').fadeOut(300, function() {
			var elem = $(thisView.el).clone().css({"height":"auto","position":"absolute","left":"-10000px"}).appendTo('body');
			height = elem.css("height");
			$(thisView.el).css('height',height);
			elem.remove();
		});				
	},

	showNoMatchScreen:function() {

		var thisView = this;

		$(thisView.el).find('h2').text('We could not find a record for you');
		$(thisView.el).find('h2').after('<p style="text-align:center">Are you sure you entered your information correctly? You can try again, or if you\'re new, click the "I\'m new" button.</p>').fadeIn(300);
		//add in Try Again and I'm New buttons
		$(thisView.el).find('h2 + p').after('<div class="row"><div class="small-5 small-centered columns"><a id="tryAgainBtn" class="button radius large" href="#">Try Again</a> <a id="ImNewBtn" class="button radius large" href="#">I\'m New</a></div></div>');

		//add in actions for try again btn
		$(thisView.el).find('#tryAgainBtn').click(function() {
			var elementToChange = $(thisView.el);
			normalColor(elementToChange);
			thisView.render();
		});

		//add in actions for "new/update" button.
		//THIS is the custom part as each ministry will have different "new/update forms"
		$(thisView.el).find('#ImNewBtn').click(function() {
			//set the element for the data entry view
			HCC_CheckInKiosk.dataEntryView.el = thisView.el;
			//navigate to the data entry view
			HCC_CheckInKiosk.appRouter.navigate('dataEntry', {trigger:true});
			//set back to normal color
			normalColor($(thisView).el);
		});

	},

	showConfirmationScreen: function() {
		//TODO - build confirmation screen from successful checkin with lookup
	},

	showErrors:function(errorArray) {

		$('p.error').fadeIn(300);

		$('input').removeClass('errorField');

		//loop through the error messages, outlining each form field in red.
		$.each(errorArray,function(errorIndex,errorValue) {
			if (!$('input[name='+errorValue.name+']').hasClass('errorField')) {
				$('input[name='+errorValue.name+']').addClass('errorField');	
			} else {
				$('input[name='+errorValue.name+']').removeClass('errorField');	
			}

			if (errorValue.name == 'dobYear' || errorValue.name == 'dobDay' || errorValue.name == 'dobMonth') {
				$('input[name=dobYear]').addClass('errorField');
				$('input[name=dobDay]').addClass('errorField');
				$('input[name=dobMonth]').addClass('errorField');		
			} else {
				$('input[name=dobYear]').removeClass('errorField');
				$('input[name=dobDay]').removeClass('errorField');
				$('input[name=dobMonth]').removeClass('errorField');						
			}
		});
	}, 

	formComplete:function() {
		$('input').removeClass('errorField');
	},

	showProgress:function() {

		var thisView = this;

		$(thisView.el).css('background','rgba(214, 81, 38, .5)');
		$(thisView.el).find('h1').text('Please wait...');
		$(thisView.el).find('#lookUpForm').fadeOut(300);
		$(thisView.el).css('height','250px');
	}

});




