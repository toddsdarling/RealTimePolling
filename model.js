//add the routes in 
Router.map( function () {
  this.route('poll', {
  	path: '/poll',
  	template: 'poll'
  });
});

Router.map( function () {
  this.route('results', {
  	path:'results',
  	template:'results'
  });
});

Campuses = new Meteor.Collection("campuses");

if (Meteor.isServer) {
    Campuses.remove({});
}

