stretch-select
==============

stretch-select is an improved version of <select multiple="true"> that does away with the holding shift or control hassle.  It is implemented in YUI 3.

Getting Started
---------------
1. Download the JavaScript and CSS and put them into a place your application can add them.
2. Create a div with a class of .stretch-select-holder.
3. Put your select tag inside the div (don't forget the multiple attribute).

The select will be converted to a stretch select as soon as the page loads.  Simply edit the CSS to suit your application and you'll be ready to go.

Goodies
-------
* Stretch select operates on the select element itself.  You don't have to worry about checkboxes from form submissions.
* You can attach events to the original DOM element and have the behave as expected (change only so far).
