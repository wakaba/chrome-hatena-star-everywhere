
var PageInfo = function () {
  this.init.apply (this, arguments);
}; // PageInfo

PageInfo.prototype = {
  init: function (url) {
    this.url = url;
  }, // init
  
  title: null,
  
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
      (localStorage['disallowed-urls'] || '^https://').split (/\r?\n/).filter (function (s) { return !!s.length }).forEach (function (pattern) {
        if (new RegExp (pattern).test (url)) {
          disallowed = true;
          throw true;
        }
      });
    } catch (e) { }
    
    if (disallowed) {
      // 3.
      try {
        (localStorage['allowed-urls'] || '').split (/\r?\n/).filter (function (s) { return !!s.length }).forEach (function (pattern) {
          if (new RegExp (pattern).test (url)) {
            disallowed = false;
            throw true;
          }
        });
      } catch (e) { }
    }
    
    return !disallowed;
  }, // isAutoRetrievalAllowedURL
  
  getEntryPopupURL: function () {
    return "entry.html?url=" + encodeURIComponent (this.url) + '&title=' + encodeURIComponent (this.title);
  }, // entryPopupURL
  
  getStarEntry: function (nextCode) {
    var entryURL = 'http://s.hatena.com/entry.json?uri=' + encodeURIComponent (this.url);
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', entryURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          var entry = json.entries[0];
          if (entry) nextCode.apply (this, [entry]);
        }
      }
    }; // onreadystatechange
    xhr.send (null);
  }, // getStarEntry
  
  getTotalStarCount: function (nextCode) {
    if (this.starCounts) {
      var self = this;
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
          this.starCounts = starCounts;
          nextCode.apply (this, [starCounts.total]);
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
}; // PageInfo.prototype

/* ***** BEGIN LICENSE BLOCK *****
 * Copyright 2011 Wakaba <w@suika.fam.cx>.  All rights reserved.
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
 *   Wakaba <w@suika.fam.cx>
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
