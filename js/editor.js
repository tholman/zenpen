var editor = (function() {
  'use strict';
  
  /**
   * Add trim function to strings
   *
   * @return string
   */
  String.prototype.trim = function(){
    return this.replace(/^\s+|\s+$/g, ''); 
  };
  
  /**
   * Get text from DOM nodes
   *
   * @param object el DOM node element
   * @return string
   */
  function get_text(el) {
    var ret = " ";
    var length = el.childNodes.length;
    for (var i = 0; i < length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType !== 8) {
        if (node.nodeType !== 1) {
          ret += node.nodeValue;
        } else {
          ret += get_text(node);
        }
      }
    }
    
    return ret.trim();
  }

  /**
   * Check if element has parent with a special tag name
   *
   * @param object element DOM node element
   * @param string parent Parent's DOM tag name
   * @return bool
   */
  function hasParent(element, parent) {
    if (element.tagName.toLowerCase() === 'html') {
      return false; }
  
    if (element.parentNode.tagName.toLowerCase() === parent.toLowerCase()) {
      return true;
    } else {
      return hasParent(element.parentNode, parent);
    }
  }
  
  /**
   * Check if element has parent with a special id attribute
   *
   * @param object element DOM node element
   * @param string parent Parent's id
   * @return bool
   */
  function hasParentWithID(element, parent) {
    if (element.tagName.toLowerCase() === 'html') {
      return false; }
  
    if (element.parentNode.id.toLowerCase() === parent.toLowerCase()) {
      return true;
    } else {
      return hasParentWithID(element.parentNode, parent);
    }
  }
  
  /**
   * Check if object has element
   *
   * @param object nodeList Object of node items
   * @param string name Element's name to search for
   *
   * @return bool
   */
  function hasNode(nodeList, name) {
    return !!nodeList[name];
  }
  
  /**
   * Get list of elements in node
   *
   * @param object element DOM node element
   * @return object
   */
  function findNodes(element) {
    var nodeNames = {};
  
    while (element.parentNode) {
      nodeNames[element.nodeName] = true;
      element = element.parentNode;
  
      if (element.nodeName === 'A') {
        nodeNames.url = element.href;
      }
    }
  
    return nodeNames;
  }
  
  /**
   * Check if browser has support for HTML storage
   *
   * @return bool
   */
  function supportsHtmlStorage() {
    try {
      return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * ToolTip Constructor
   *
   * @param string id ToolTip's HTML container element ID
   * @param object editor ZepPen Editor object for bindings
   */
  var ToolTip = function(id, editor) {
    // Initialize
    this.id = id;
    this.editor = editor;
    this.el = document.getElementById(this.id);
    
    // Default handlers
    this.linkSelection = this.timeoutClose = this.isOpen = this.url = null;    
    
    // Set view mode
    this.setMode('buttons');
    
    // Listen for events
    var that = this;
    
    this.el.addEventListener('click', function(event) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Check if click on known action
      if (event.target.attributes['data-action'] && ['link', 'bold', 'italic', 'quote'].indexOf(event.target.attributes['data-action'].value) > -1) {
        var action = event.target.attributes['data-action'].value;
          
        // Run action and update bubbles if styles have changed
        that.runAction(action);
        that.updatePosition();
        
        // Quit
        return;
      }
      
      // Check if click on input element
      if (event.target.tagName.toLowerCase() === 'input') {
        that.focusInput();
        
        // Quit
        return;
      }
    });
  };
  
  /**
   * Change focus from URL input field back to content editor
   */
  ToolTip.prototype.blurInput = function() {
    this.el.querySelector("input").blur();
    this.editor.content.focus();
  };
  
  /**
   * Set focus to URL input field
   */
  ToolTip.prototype.focusInput = function() {
    this.el.querySelector("input").focus();
    this.el.querySelector("input").select();
  };
  
  /**
   * Set URL input value
   *
   * @param string text URL input value
   */
  ToolTip.prototype.setInput = function(text) {
    var tmp = text.replace(location.href, '');
    this.el.querySelector("input").value = tmp === '#' ? '' : tmp;
  };
  
  /**
   * Update basic font styles to current selection
   */
  ToolTip.prototype.applyStyles = function() {
    if (this.actionStatus('bold')) {
      this.runAction('bold');
    }
    
    if (this.actionStatus('italic')) {
      this.runAction('italic');
    }
  };
  
  /**
   * Run action
   *
   * @param string action Action key
   */
  ToolTip.prototype.runAction = function(action) {
    switch (action) {
      // Run native font style actions
      case 'bold':
      case 'italic':
        document.execCommand(action, false);
        
        this.actionToggle(action);
        break;
      // Run blockquote action
      case 'quote':
        var nodeNames = findNodes(window.getSelection().focusNode);
        
        if (hasNode(nodeNames, 'BLOCKQUOTE')) {
          document.execCommand('formatBlock', false, 'p');
        } else {
          document.execCommand('formatBlock', false, 'blockquote');
        }
        
        this.actionToggle(action);
        break;
      // Run link action
      case 'link':
        var curURL = '#';
        var selection = window.getSelection();
        var range = document.createRange();
        var that = this;
        
        nodeNames = findNodes(window.getSelection().focusNode);
        
        /**
         * Select text and update styles
         */
        var __updateLinkStyles = function() {
          range.selectNodeContents(document.getElementById('current-link'));
          selection.removeAllRanges();
          selection.addRange(range);
          
          that.applyStyles();
        };
        
        /**
         * Update link in editor
         *
         * @param string url URL
         * @param string name Label
         */
        var __updateLink = function(url, name) {
          document.execCommand('insertHTML', false, '<a href="' + url + '" id="current-link">' + name + '</a>');
          
          __updateLinkStyles();
        };
        
        // Get current URL anchor if selection already is a link
        if (hasNode(nodeNames, "A")) {
          curURL = nodeNames.url;
        }
        
        if (this.getMode('buttons')) {
          // Switch from button view to expanded URL view
          this.setMode('url');
          
          // Update input value and focus input field
          __updateLink(curURL, window.getSelection().toString());
          this.setInput(curURL);
          this.focusInput();
          
          // Swtich active state if needed
          if (!this.actionStatus(action)) {
            this.actionOn(action); 
          }
        } else if (this.getMode('url') && this.actionStatus(action)) {
          // Switch from expanded URL view to button view
          this.setMode('buttons');
          
          // Update text styles if needed
          __updateLinkStyles();
          
          if (this.el.querySelector('input').value === '') {
            // Link has no URL, so it will be unlinked
            this.actionOff(action);
            
            document.execCommand('unLink', false);
            this.applyStyles();
          } else {
            // Link as URL, set state to active and change HTML content
            this.actionOn(action);
            that.updateButtonStates();
            
            curURL = this.el.querySelector('input').value;
            __updateLink(curURL, window.getSelection().toString());
          }
          
          // Update button states
          that.updateButtonStates();
          
          // Remove temp element attributes if set
          if (document.getElementById('current-link')) {
            document.getElementById('current-link').removeAttribute('id');
          }
        }
        
        break;
    }
    
    // Update HTML storage
    this.editor.writeStorage();
  };
  /**
   * Set ToolTip view mode
   *
   * @param string mode View mode
   */
  ToolTip.prototype.setMode = function(mode) {
    this.el.setAttribute('data-mode', mode);
  };
  
  /**
   * Get current ToolTip view mode or compare with given view mode
   *
   * @param string comp Optional view name to compare with
   * @param string or bool
   */
  ToolTip.prototype.getMode = function(comp) {
    if (!comp) {
      return this.el.attributes['data-mode'].value;
    } else {
      return comp === this.el.attributes['data-mode'].value;
    }
  };
  
  /**
   * Toogle ToolTip option button
   * 
   * @param string action Action name
   */
  ToolTip.prototype.actionToggle = function(action) {
    if (this.actionStatus(action)) {
      this.actionOff(action);
    } else {
      this.actionOn(action);
    }
  };
  
  /**
   * Get action status
   *
   * @param string action Action name
   * @return bool
   */
  ToolTip.prototype.actionStatus = function(action) {
    return document.querySelector('button[data-action="' + action + '"]').className === 'active';
  };
  
  /**
   * Switch action on
   * 
   * @param string action Action name
   */
  ToolTip.prototype.actionOn = function(action) {
    var item = document.querySelector('button[data-action="' + action + '"]');
    item.className = 'active';
  };
  
  /**
   * Switch action off
   * 
   * @param string action Action name
   */
  ToolTip.prototype.actionOff = function(action) {
    var item = document.querySelector('button[data-action="' + action + '"]');
    item.className = '';
  };
  
  /**
   * Update button states
   */
  ToolTip.prototype.updateButtonStates = function() {
    var currentNodeList = findNodes(window.getSelection().focusNode);
    var nodeMapping = {b: 'bold', i: 'italic', blockquote: 'quote', a: 'link'};
    
    for (var n in nodeMapping) {
      if (hasNode(currentNodeList, n.toUpperCase())) {
        this.actionOn(nodeMapping[n]);
      } else {
        this.actionOff(nodeMapping[n]);
      }
    }  
  };
  
  /**
   * Show ToolTip
   */
  ToolTip.prototype.show = function() {
    if (this.timeoutClose) {
      clearTimeout(this.timeoutClose); }
    
    this.el.querySelector('input').value = '';
    this.updatePosition();
    this.updateButtonStates();
    this.el.className = "text-options active";
    this.isOpen = true;
  };
  
  /**
   * Close ToolTip
   */
  ToolTip.prototype.close = function() {
    if (this.timeoutClose) {
      clearTimeout(this.timeoutClose); }
    
    if (document.getElementById('current-link')) {
      document.getElementById('current-link').removeAttribute('id'); }
    
    this.setMode('buttons');
    this.el.className = "text-options fade";
    
    var that = this;
    
    // Maybe set to display: none?
    this.timeoutClose = setTimeout(function() {
      that.el.style.top = "100%";
      that.el.style.left = "100%";
    }, 260);
    
    this.isOpen = false;
  };
  
  /**
   * Update ToolTip position
   */
  ToolTip.prototype.updatePosition = function() {
    var selection = window.getSelection();
    
    try {
      var range = selection.getRangeAt(0);
      var boundary = range.getBoundingClientRect();
      
      var newTop = parseFloat(boundary.top - 5 + window.pageYOffset);
      var newLft = parseFloat((boundary.left + boundary.right)/2 - 5);
      
      if (newTop === -5 && newLft === -5) {
        return;
      }
      
      this.el.style.top = newTop + "px";
      this.el.style.left = newLft + "px";
    } catch (e) {
      
    }
  };
  
  /**
   * ZenPen Editor constructor
   */
  var ZenPen = function(id) {
    this.id = id;
    this.lastSelection = null;
    this.downOnOption = false;
    this.watcher = [];
    
    
    this.headline = document.getElementById(this.id).querySelector('[data-type="headline"]');
    this.content  = document.getElementById(this.id).querySelector('[data-type="content"]');
    
    this.bar = new ToolTip(this.id + '-bar', this);
    
    this.watchForSelection();
  };
  
  /**
   * Add callback for change event
   *
   * @param function callback Callback
   */
  ZenPen.prototype.change = function(callback) {
    this.watcher.push(callback);
  };
  
  /**
   * Count words in ZenPen without headline
   * 
   * @return int
   */
  ZenPen.prototype.countWords = function() {
    var text = get_text(this.content);
  
    if (text === "") {
      return 0;
    }
    
    return text.split(/\s+/).length;
  };
  
  /**
   * Update ToolTip position
   */
  ZenPen.prototype.updatePosition = function() {
    this.bar.updatePosition();
  };
  
  /**
   * Bind needed elements
   */
  ZenPen.prototype.watchForSelection = function() {
    var that = this;
    
    // Click on ToolTip
    document.addEventListener("mousedown", function(ev) {
      if (that.clickIsOnBar(ev)) {
        ev.preventDefault();
      }
    });
    
    // Starting to select text in content box. This will be called after
    // mousedown if no 'preventDefault' is called before
    if (this.content) {
      this.content.addEventListener("selectstart", function() {
        that.bar.close();
      });
    }
    
    // Starting to select text in headline box. This will be called after
    // mousedown if no 'preventDefault' is called before
    if (this.headline) {
      this.headline.addEventListener("selectstart", function() {
        that.bar.close();
      });
    }
    
    // Maybe needed for some future magic
    this.content.addEventListener("selectionchange", function() {

    });
    
    // Show ToolTip if mouse button is released after selecting text. Needs to
    // have a little timeout to wait for the user's browser to update the
    // current text selection.
    window.addEventListener("mouseup", function(event) {
      setTimeout(function() {
        if (that.clickIsOnBar(event)) {
          
        } else if (that.hasSelection() && that.clickIsInside(event)) {
          that.bar.show();
        } else {
          that.bar.close();
        }
      }, 10);
    });
    
    // Close ToolTip if key is pressed someout outside the ToolTip's input and
    // save changes to HTML storage
    document.addEventListener("keydown", function() {
      // TODO: Just close if content is chanegd
      if (window.getSelection().focusNode && window.getSelection().focusNode.tagName && window.getSelection().focusNode.tagName.toLowerCase() === 'span') {
        return;
      }
      
      // Close ToolTip and update HTML storage
      that.bar.close();
      that.writeStorage();
    });
    
    // Update ToolTip position after browser is resized
    window.addEventListener('resize', function() {
      that.bar.updatePosition();
    });
    
    // Update ToolTip position if text is scrolled
    var scrollEnabled = true;
    document.body.addEventListener( 'scroll', function() {
      if ( !scrollEnabled ) {
        return;
      }
      
      scrollEnabled = true;      
      that.bar.updatePosition();
      
      // Smooth scrolling
      return setTimeout(function() {
        scrollEnabled = true;
      }, 250);
    });

  };
  
  /**
   * Check if user clicked inside ZenPen content editor
   *
   * @param object event Click event
   * @return bool
   */
  ZenPen.prototype.clickIsInside = function(event) {
    return event.target.tagName.toLowerCase() === 'article' || hasParent(event.target, 'article');
  };
  
  /**
   * Check if user clicked on ToolTip
   *
   * @param object event Click event
   * @return bool
   */
  ZenPen.prototype.clickIsOnBar = function(event) {
    return event.target.id.toLowerCase() === 'article' || hasParentWithID(event.target, this.bar.id);
  };
  
  /**
   * Check if user has selected text
   *
   * @return bool
   */
  ZenPen.prototype.hasSelection = function() {
    return Math.abs(window.getSelection().focusOffset - window.getSelection().baseOffset) > 0;
  };
  
  /**
   * Check local HTML storage for saved artcile
   */
  ZenPen.prototype.checkStorage = function() {
    if (!supportsHtmlStorage()) {
      return; }

    if (localStorage.header) {
      this.headline.innerHTML = localStorage.header;
    }
    
    if (localStorage.content) {
      this.content.innerHTML = localStorage.content;
    }
  };
  
  /**
   * Update local HTML storage
   */
  ZenPen.prototype.writeStorage = function() {
    if (!supportsHtmlStorage()) {
      return; }
    
    localStorage.header = this.headline.innerHTML;
    localStorage.content = this.content.innerHTML;
    
    this.updateWatchers();
  };
    
  /**
   * Update watcher for changes
   */
  ZenPen.prototype.updateWatchers = function() {
    for (var i = 0, m = this.watcher.length; i < m; i++) {
      this.watcher[i](this);
    }
  };
   
    
  var ZPEditor = null;

  return {
    init: function(ID) {
      ZPEditor = new ZenPen(ID);
      ZPEditor.checkStorage();
    },
    change: function(cb) {
      ZPEditor.change(cb);
    },
    getWordCount: function() {
      return ZPEditor.countWords();
    }
  };
})();