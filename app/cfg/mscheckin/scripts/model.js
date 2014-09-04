CheckInModel = Backbone.Model.extend({

	defaults: {
         fname: '',
         dob: '',
			lname:'',
			email:'',
			gender:'',
			phone1:'',
			phone2:'',
			phone3:'',			
			grade:'',
			school:'',
			schoolID:'',
			schoolOther:'',
			address1:'',
			address2:'',
			city:'',
			zip:'',
			headfname:'',
			headlname:'',
			heademail:'',
			headphone1:'',
			headphone2:'',
			headphone3:'',	
			spousefname:'',
			spouselname:'',
			spouseemail:'',
			spousephone1:'',
			spousephone2:'',
			spousephone3:'',						
			pid:''
   },

   change: function() {
   		//this is where the syncing with localStorage will occur
   		if (this.hasChanged()) {
   			//write out to localStorage
   			localStorage.setItem('hcc-checkInPerson',JSON.stringify(this));
   		}
   },
   
   initialize:function() {
   		
   		var modelFromStorage = JSON.parse(localStorage.getItem('hcc-checkInPerson'));
   		
   		if (modelFromStorage) {
   			
   			for (var key in modelFromStorage) {
   				if (modelFromStorage.hasOwnProperty(key)) {
   					this.attributes[key] = modelFromStorage[key];
   				}
   			}
   		}
   		
   		//set all the attributes from the localStorage object to the attributes here
   		//save this to localStorage
   		localStorage.setItem('hcc-checkInPerson',JSON.stringify(this));
   },
   
   clearFromStorage:function() {
   		localStorage.removeItem('hcc-checkInPerson');
   }




});