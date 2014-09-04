/* this function sets whatever element you pass it to the "waiting" color that's defined
This is used to show the user the site is doing something
*/

function waitingColor(element) {
	$(element).css('background','rgba(214, 81, 38, .5)');
}

function normalColor(element) {
	$(element).css('background','rgba(153,153,153,.5);');
}

function successColor(element) {
	$(element).css('background','rgba(147, 195, 75, .5)');
}

//thank you to Stack Overflow (http://stackoverflow.com/questions/690781/debugging-scripts-added-via-jquery-getscript-function)
//for this script. This allows us to debug the models and views loaded dynamically
function loadScripts(url, callback) {
      var head = document.getElementsByTagName("head")[0];
      var script = document.createElement("script");
      script.src = url;

      // Handle Script loading
      {
         var done = false;

         // Attach handlers for all browsers
         script.onload = script.onreadystatechange = function(){
            if ( !done && (!this.readyState ||
                  this.readyState == "loaded" || this.readyState == "complete") ) {
               done = true;
               if (callback)
                  callback();

               // Handle memory leak in IE
               script.onload = script.onreadystatechange = null;
            }
         };
      }

      head.appendChild(script);

      // We handle everything using the script element injection
      return undefined;

}