//add actions to the poll template

Template.poll.events({
	'click .raleigh':function(e) {

		if ($(e.currentTarget.parentElement).find('div.checkmark').length == 0) {
			$(e.currentTarget).before('<div class="checkmark"></div>');
		}
		
		Campuses.insert({name:'Raleigh'});
	},
	'click .hollysprings':function() {
		Campuses.insert({name:'Holly Springs'});
	},
	'click .morrisville':function() {
		Campuses.insert({name:'Morrisville'});
	}

});