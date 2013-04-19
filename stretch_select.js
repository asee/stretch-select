YUI.add('stretch-select', function (Y) {
  function StretchSelect(config) {
    StretchSelect.superclass.constructor.apply(this, arguments);
  }

  StretchSelect.NAME = "stretch-select";
  StretchSelect.ATTRS = { };

  Y.extend(StretchSelect, Y.Widget, {
    domTemplate : '\
    <div class="stretch-select">\
      <div id="open" class="stretch-select-open">\
        <div id="open-body" class="stretch-select-open-body"></div>\
        <div class="stretch-select-open-controls">\
          <div>\
            <a href="#" id="select-all" class="stretch-select-button first">Select All</a>\
          </div>\
          <div>\
            <a href="#" id="select-none" class="stretch-select-button">Select None</a>\
          </div>\
        </div>\
        <div style="clear:both"/></div>\
      </div>\
      <div class="stretch-select-closed-wrapper">\
        <div id="closed" class="stretch-select-closed">\
          <div id="arrow" class="stretch-select-arrow">&#9660;</div>\
          <div id="closed-text" class="stretch-select-closed-text">\
            <div class="total"/></div>\
            <div class="summary"/></div>\
          </div>\
        </div>\
      </div>\
      <div style="clear:both"></div>\
    </div>',



    values         : {},  // holds the possible values and their states
    baseElement    : null,
    formObj        : null,
    openBox        : null,
    openBoxBody    : null,
    closedBox      : null,
    closedTotal    : null,
    closedSummary  : null,
    id             : null,
    open           : null,  // is the box open?
    selectAll_btn  : null,
    selectNone_btn : null,



    initializer: function(config) {
      var element = config['container'];

      // Create a wrapper and apply the base template
      var wrapper = Y.Node.create('<div class="stretch-select-wrapper"></div>');
      wrapper.setHTML(this.domTemplate);
      element.append(wrapper);

      // Initialize variables based on the template
      var formObj       = element.one('select'),
          open          = element.one('#open'),
          openBody      = open.one('#open-body'),
          closed        = element.one('#closed'),
          closedTotal   = closed.one('.total'),
          closedSummary = closed.one('.summary'),
          selectAll     = element.one('#select-all'),
          selectNone    = element.one('#select-none'),
          values        = {};

      // Make the actual select box disappear
      formObj.setStyles({position: 'absolute', left: '-12340px'});

      // Extract values from form object and add them to the UI
      var i = 0;
      formObj.get('options').each(function(opt) {
        var row   = Y.Node.create('<div></div>'),
            rowID = Y.guid(),
            label = opt.getHTML().replace(/^\s+|\s+$/g,'');

        // Create the internal object
        values[opt.get('value')] = {
          value:    opt.get('value'),    // value of the form element
          label:    label,        // visible text on the element
          selected: opt.get('selected'), // is it selected?
          optIdx:   i,            // the index of the option in the select
          row:      row           // the actual row in the DOM
        };

        // Render a row in the UI
        row.addClass('stretch-select-row');
        var chkText = (opt.get('selected') ? ' checked="checked"' : '');
        row.setHTML('\
          <input type="checkbox" value="'+opt.get('value')+'"'+chkText+'/>\
          <label for="'+rowID+'">'+label+'</label>');
        openBody.append(row);

        i++;
      });

      // Initialize elements inside DOM nodes
      open.addClass('hidden');

      // Attach variables to object
      this.baseElement = element;
      this.openBox = open;
      this.openBoxBody = openBody;
      this.closedBox = closed;
      this.open = false;
      this.formObj = formObj;
      this.closedTotal = closedTotal;
      this.closedSummary = closedSummary;
      this.selectAll_btn = selectAll;
      this.selectNone_btn = selectNone;
      this.values = values;

      // Bind events
      this.bindUI();
      this.summarize();
    },



    bindUI: function() {
      var base       = this.baseElement,
          closed     = this.closedBox,
          open       = this.openBox,
          openBody   = this.openBoxBody,
          selectAll  = this.selectAll_btn,
          selectNone = this.selectNone_btn;


      closed.on('click', this._openBox, this);


      openBody.on('mousewheel', function(e) {
        var target   = e.currentTarget,
            delta    = e.wheelDelta * -30,
            currentY = target.get('scrollTop');

        e.preventDefault();
        target.set('scrollTop', currentY + delta);
      });


      openBody.delegate('click', function(e){
        // Mark the actual form element and sync it to the UI
        var chk    = e.currentTarget.one('input'),
            chkVal = chk.get('value'),
            vals   = this.values,
            val    = vals[chkVal],
            idx    = val.optIdx,
            opt    = this.formObj.get('options').getDOMNodes()[idx];

        // Toggle it
        chk.set('checked', !val.selected);
        val.selected = !val.selected;

        // Update actual form element
        opt.selected = chk.get('checked');

        // Fire event as if the user had changed it normally
        this.formObj.simulate('change');

        // e.stopPropagation();
      }, '.stretch-select-row', this);


      base.on('clickoutside', this._closeBox, this);


      selectAll.on('click', function(e){
        this.setAll(true);
        e.preventDefault();
      }, this);

      selectNone.on('click', function(e){
        this.setAll(false);
        e.preventDefault();
      }, this);
    },


    _openBox : function(e) {
      var closed = this.closedBox,
          open   = this.openBox;

      closed.addClass('hidden');
      open.removeClass('hidden');
      this.open = true;

      this._positionBox();
    },


    _closeBox : function(e) {
      var closed = this.closedBox,
          open   = this.openBox;

      this.summarize();
      open.addClass('hidden');
      closed.removeClass('hidden');
      this.open = false;
    },


    _positionBox : function() {
      if(Y.UA.ie && Y.UA.ie < 8) {
        return "IE7 can't have nice things";
      }

      // confirm that the entire box is visible
      var open       = this.openBox,
          openHeight = parseInt(open.getComputedStyle('height')),
          viewBottom = Y.DOM.winHeight() + Y.DOM.docScrollY();

      // reset the position of the box
      open.setStyle('top', '0px');
      var openBottom = open.getY() + openHeight;

      // is the bottom of the SS box below the bottom of the viewport, given
      // 15 pixels of padding?
      if(openBottom > (viewBottom + 10)) {
        // if so, pull the bottom up
        open.setStyle('top', (viewBottom - openBottom - 10) + 'px');
      }
    },


    // Sets all boxes to true/false depending on state var
    setAll : function(state) {
      var vals = this.values;

      for(var k in vals) {
        var val = vals[k],
            opt = this.formObj.get('options').getDOMNodes()[val.optIdx],
            row = val.row;
            chk = row.one('input');

        chk.set('checked', state);
        val.selected = state;
        opt.selected = state;
      }

      // Fire event as if the user had changed it normally
      this.formObj.simulate('change');
    },




    summarize: function() {
      var summary  = '',
          total    = '',
          selected = [],
          vals     = this.values;

      for(idx in vals){
        var val = vals[idx];
        if(val.selected) {
          selected.push(val.label);
        }
      }

      if(selected.length == 0) {
        total = '0 selected';
        summary = '';
      } else {
        total = String(selected.length) + ' selected: ';
        summary = selected.join(", ");
      }

      this.closedTotal.setHTML(total);
      this.closedSummary.setHTML(summary);
    }
  });



  Y.StretchSelect = StretchSelect;


}, '0.0.1', {
  requires:['widget', 'node', 'base', 'node-event-simulate', 'event-outside']
});



YUI().use('node', 'stretch-select', function(Y) {
  Y.on("domready", function() {
    Y.all('.stretch-select-holder').each(function(elt) {
      ss = new Y.StretchSelect({
        container: elt
      });
    });
  });
});