
var PageInfo = function () {
  this.init.apply (this, arguments);
}; // PageInfo

PageInfo.siteConfigs = {};
PageInfo.siteConfigsTimestamp = 0;
PageInfo.siteConfigsMaxAge = 60*60*24;

PageInfo.prototype = {
  init: function (url) {
    this.url = url;
  }, // init
  
  title: null,
  originalTitle: null,
  config: null,
  
  getSiteConfigs: function (nextCode) {
    var self = this;
    var now = (new Date).getTime ();
    if (this.siteConfigsTimestamp + this.siteConfigsMaxAge > now) {
      setTimeout (function () {
        nextCode.apply (self, [self.siteConfigs]);
      }, 1);
      return;
    }
    
    var url = 'http://' + this.config.getDomain ('s') + '/siteconfig.json';
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          PageInfo.siteConfigsTimestamp = (new Date).getTime ();
          nextCode.apply (self, [json]);
        }
      }
    };
    xhr.send (null);
  }, // getSiteConfigs
  
  isAllowedURL: function () {
    var url = this.url;
    if (!/^https?:\/\//.test (url)) return false;
    return true;
  }, // isAllowedURL
  
  isAutoRetrievalAllowedURL: function () {
    // 1.
    if (!this.isAllowedURL ()) {
      return false;
    }
    
    var url = this.url;
    
    // 2.
    var disallowed = false;
    try {
      this.config.get ('disallowedURLs').split (/\r?\n/).filter (function (s) { return !!s.length }).forEach (function (pattern) {
        if (new RegExp (pattern).test (url)) {
          disallowed = true;
          throw true;
        }
      });
    } catch (e) { }
    
    if (disallowed) {
      // 3.
      try {
        this.config.get ('allowedURLs').split (/\r?\n/).filter (function (s) { return !!s.length }).forEach (function (pattern) {
          if (new RegExp (pattern).test (url)) {
            disallowed = false;
            throw true;
          }
        });
      } catch (e) { }
    }
    
    return !disallowed;
  }, // isAutoRetrievalAllowedURL
  
  ifURLHasSiteConfig: function (nextCode) {
    var m = this.url.match (/^https?:\/\/([^/]+)\//);
    var domain = m[1];
    if (!domain) return;
    var self = this;
    this.getSiteConfigs (function (siteConfigs) {
      var def = siteConfigs[domain];
      if (!def) {
        domain = domain.replace (/^[^.]+\./, '*.');
        def = siteConfigs[def];
      }
      if (def) {
        nextCode.apply (self, [domain, def]);
      }
    });
  }, // ifURLHasSiteConfig
  
  getEntryPopupURL: function () {
    return "entry.html?url=" + encodeURIComponent (this.url) + '&title=' + encodeURIComponent (this.title) + '&original_title=' + encodeURIComponent (this.originalTitle);
  }, // entryPopupURL
  
  getStarEntry: function (nextCode) {
    var self = this;
    var entryURL = 'http://' + self.config.getDomain ('s') + '/entry.json?uri=' + encodeURIComponent (this.url);
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', entryURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          var entry = json.entries[0];
          if (entry) nextCode.apply (self, [entry]);
        }
      }
    }; // onreadystatechange
    xhr.send (null);
  }, // getStarEntry
  
  getHaikuEntriesByWord: function (word, nextCode) {
    var self = this;
    var entriesURL = 'http://' + self.config.getDomain ('h') + '/api/statuses/keyword_timeline.json?word=' + encodeURIComponent (word);
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', entriesURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          nextCode.apply (self, [json]);
        }
      }
    };
    xhr.send (null);
  }, // getHaikuEntriesByWord
  
  getTotalStarCount: function (nextCode) {
    var self = this;
    if (this.starCounts) {
      setTimeout (function () {
        nextCode.apply (self, [self.starCounts.total]);
      }, 1);
    }
    
    var url = 'http://s.st-hatena.com/entry.count.image?uri=' + encodeURIComponent (this.url);
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var starCounts = {yellow: 0, green: 0, red: 0, blue: 0, purple: 0};
          var counts = xhr.getResponseHeader ('X-Hatena-Star-Count') || '';
          counts.split (/,\s+/).forEach (function (v) {
            var w = v.split (/=/, 2);
            starCounts[w[0]] = parseInt (w[1]);
          });
          
          starCounts.total = starCounts.yellow + starCounts.green + starCounts.red + starCounts.blue + starCounts.purple;
          self.starCounts = starCounts;
          nextCode.apply (self, [starCounts.total]);
        }
      }
    }; // onreadystatechange
    xhr.send (null);
  }, // getTotalStarCount
  
  parsePageMetadata: function (tabId, nextCode) {
    var self = this;
    this.installPageMetadataParser (tabId, function () {
      chrome.tabs.sendRequest (tabId, {command: 'parsePageMetadata'}, function (res) {
        if (res.url) self.url = res.url;
        if (res.title) self.title = res.title;
        nextCode.apply (self, []);
      });
    });
  }, // parsePageMetadata
  installPageMetadataParser: function (tabId, nextCode) {
    var self = this;
    chrome.tabs.executeScript (tabId, {file: "page-metadata-parser.js"}, function () {
      nextCode.apply (self, []);
    });
  }, // installPageMetadataParser
  
  getAvailUserStarCounts: function (nextCode) {
    var self = this;
    var paletteURL = 'http://' + self.config.getDomain ('s') + '/colorpalette.smartphone?uri=' + encodeURIComponent (this.url);
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', paletteURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var div = document.createElement ('div');
          div.innerHTML = xhr.responseText;
          var form = div.getElementsByTagName ('form')[0];
          if (form && form.elements && form.elements.token && form.elements.token.value) {
            self.userAddStarToken = form.elements.token.value;
          }
          var counts = {};
          ['green', 'red', 'blue', 'purple'].forEach (function (color) {
            var el = div.querySelector ('[id=star-count-' + color + ']');
            if (!el) return;
            counts[color] = parseInt (el.textContent.replace (/\s+/g, ''));
          });
          nextCode.apply (self, [counts]);
        }
      }
    }; // onreadystatechange
    xhr.send (null);
  }, // getAvailUserStarCounts
}; // PageInfo.prototype

var UserInfo = function () {
  this.init.apply (this, arguments);
}; // UserInfo

UserInfo.displayNameCache = {};

UserInfo.prototype = {
  init: function (args) {
    if (args.starJSON) {
      this.urlName = args.starJSON.name;
      this.displayName = UserInfo.displayNameCache[this.urlName] || args.starJSON.name;
    } else if (args.haikuJSON) {
      this.urlName = args.haikuJSON.screen_name;
      this.displayName = args.haikuJSON.name;
      this.hasNickname = true;
      if (this.urlName) {
        UserInfo.displayNameCache[this.urlName] = this.displayName;
      }
    } else if (args.nanoJSON) {
      this.urlName = args.nanoJSON.url_name;
      this.displayName = args.nanoJSON.display_name;
      this.hasNickname = true;
      if (this.urlName) {
        UserInfo.displayNameCache[this.urlName] = this.displayName;
      }
    }
    this.config = args.config;
  }, // init
  
  config: null,
  
  getURL: function () {
    if (this.urlName) {
      return 'http://' + this.config.getDomain ('www') + '/' + this.urlName + '/';
    } else {
      return null;
    }
  }, // getURL
  getIconURL: function () {
    if (this.urlName) {
      return 'http://n.hatena.com/' + this.urlName + '/profile/image?size=16&type=' + this.config.get ('iconType');
    } else {
      return 'http://n.hatena.com/sample/profile/image?size=16&guest=1&type=' + this.config.get ('iconType');
    }
  }, // getIconURL
  
  fillHTML: function (el) {
    var template = document.documentElement.getAttribute ('data-user-template') || '';
    el.innerHTML = template;
    
    var url = this.getURL ();
    el.getElementsByClassName ('profile-image-link')[0].href = url;
    el.getElementsByClassName ('profile-image')[0].src = this.getIconURL ();
    var nicknameEl = el.getElementsByClassName ('nickname-link')[0];
    nicknameEl.href = url;
    if (this.config.get ('nameType') == 'hatenaid') {
      nicknameEl.textContent = this.urlName || this.displayName;
    } else {
      nicknameEl.textContent = this.displayName;
    }
    nicknameEl.title = 'id:' + this.urlName
  }, // fillHTML
}; // UserInfo.prototype


/* ***** BEGIN LICENSE BLOCK *****
 * Copyright 2011 Wakaba <wakaba@suikawiki.org>.  All rights reserved.
 *
 * This program is free software; you can redistribute it and/or 
 * modify it under the same terms as Perl itself.
 *
 * Alternatively, the contents of this file may be used 
 * under the following terms (the "MPL/GPL/LGPL"), 
 * in which case the provisions of the MPL/GPL/LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of the MPL/GPL/LGPL, and not to allow others to
 * use your version of this file under the terms of the Perl, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the MPL/GPL/LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the Perl or the MPL/GPL/LGPL.
 *
 * "MPL/GPL/LGPL":
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * <http://www.mozilla.org/MPL/>
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Hatena Star Everywhere code.
 *
 * The Initial Developer of the Original Code is Wakaba.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Wakaba <wakaba@suikawiki.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the LGPL or the GPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
