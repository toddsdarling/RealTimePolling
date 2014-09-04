CheckInKiosk
============

We had different clients all using various versions of check-in to work with our ChMS.  This allowed them to capture people's data and track headcount for various events.

Supporting these different versions became difficult so I created a single codebase that could do check-in.  There was a common core set of functionality (looking up people, actually performing the check-in) that ALL clients used.  

Then, each client had custom screens that could be plugged in (for example if one client needed to capture different data) to meet their needs.

There's a simple admin screen built for the end user to switch between clients and also to configure some basic options of how the check-in should work. 

This pulls everything into a common core codebase while maintaining certain custom functionality for the different clients.

All development was done using Foundation for the front-end framework, Backbone for the Javascript framework, a core library of API functions I developed and PHP for the server-side code.  Also utilized Grunt and Bower for managing packages and building a final distribution (those files are not checked in here).
