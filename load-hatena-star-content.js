/* Run in the content's environment */

(function () {
  if (self.Hatena && Hatena.Star && Hatena.Star.SiteConfig) return;
  
  var showStarScript = document.createElement ("script");
  var tld = document.documentElement.getAttribute ('data-hatena-star-chrome-tld') || '';
  if (tld == 'jp') {
    showStarScript.src = "http://s.hatena.ne.jp/js/HatenaStar.js";
  } else {
    showStarScript.src = "http://s.hatena.com/js/HatenaStar.js";
  }
  showStarScript.charset = 'utf-8';
  showStarScript.onload = function () {
    var orig_getStarEntries = Hatena.Star.EntryLoader.getStarEntries;
    Hatena.Star.EntryLoader.getStarEntries = function () {
      var entries = Hatena.Star.EntryLoader.entries;
      entries.forEach (function (entry) {
        var url = entry.uri;
        var m = url.match (/^(https?):\/\/([^\/]+)\/[^\#]*\#!(\/.*)/);
        if (m) {
          url = m[1] + '://' + m[2] + m[3];
        }
        
        if (url) {
          var m = url.match (/^https?:\/\/twitter\.com\/([^\/]+)\/status\/(.*)$/);
          if (m) {
            url = 'http://twitter.com/' + m[1] + '/statuses/' + m[2];
          }
        }
        entry.uri = url;
      });
      
      return orig_getStarEntries.apply (this, arguments);
    }; // getStarEntries
    
    var orig_get = Hatena.Star.EntryLoader.getEntryByENodeAndSelectors;
    Hatena.Star.EntryLoader.getEntryByENodeAndSelectors = function (eNode, selectors) {
      if (eNode && eNode.hatenaStarChromeENodeProcessed) {
        return null;
      }
      eNode.hatenaStarChromeENodeProcessed = true;
      return orig_get.apply (this, arguments);
    }; // getEntryByENodeAndSelectors
    
    Hatena.Star.ConfigLoader.addEventListener ('load', function () {
      insertSiteConfig ();
      Hatena.Star.EntryLoader.loadNewEntries ();
    });
    new Hatena.Star.ConfigLoader();
    
    window.addEventListener ('scroll', function () {
      loadStarLater ();
    }, true);
    window.addEventListener ('click', function () {
      loadStarLater ();
    }, true);
    
    var loadStarTimer = 0;
    var loadStarLater = function () {
      clearTimeout (loadStarTimer);
      loadStarTimer = setTimeout (function () {
        loadStar ();
      }, 1000);
    }; // loadStarLater
    var loadStar = function () {
      Hatena.Star.EntryLoader.loadNewEntries ();
    }; // loadStar
    loadStarLater ();
  }; // starScript.onload
  document.body.appendChild (showStarScript);
  
  var stopElementName = {
    div: true, section: true, article: true, nav: true, aside: true,
    blockquote: true, header: true, footer: true, p:true,
    hgroup: true, h1: true, h2: true, h3: true, h4: true, h5: true, h6: true,
    li: true, dt: true, dd: true, menu: true,
  };
  var insertStarContainer = function (refEl, url, title) {
    var parent = refEl.parentNode;
    var marker = parent;
    while (marker.parentNode) {
      var name = marker.localName.toLowerCase ();
      if (stopElementName[name]) {
        break;
      }
      marker = marker.parentNode;
    }
    marker = marker || parent;
    if (marker.hatenaStarChromeHasURL) {
      if (marker.hatenaStarChromeHasURL[url]) {
        return;
      }
    } else {
      marker.hatenaStarChromeHasURL = {};
    }
    marker.hatenaStarChromeHasURL[url] = true;
    
    var container = document.createElement ('span');
    container.className = 'hatena-star-chrome-can-star';
    container.innerHTML = '<a class=hatena-star-chrome-star-url hidden></a><span class=hatena-star-chrome-container></span>';
    container.firstChild.href = url;
    if (title) container.firstChild.textContent = title;
    parent.insertBefore (container, refEl.nextSibling);
  }; // insertStarContainer
  
  var insertSiteConfig = function () {
    if (!Hatena.Star.SiteConfig) Hatena.Star.SiteConfig = {};
    Hatena.Star.SiteConfig.entryNodes = Hatena.Star.SiteConfig.entryNodes || {};
    Hatena.Star.SiteConfig.entryNodes['.hatena-star-chrome-can-star'] = {
      container: '.hatena-star-chrome-container',
      title: '.hatena-star-chrome-star-url',
      uri: '.hatena-star-chrome-star-url'
    }
  }; // insertSiteConfig
  
  var links = document.links;
  var linksL = document.links.length;
  for (var i = 0; i < linksL; i++) {
    var link = links[i];
    var url = link.href;
    
    var m = url.match (/^http:\/\/b.hatena.ne.jp\/entry(?:\.touch)?\/(.+)/);
    if (m) {
      var url = m[1];
      url = url.replace (/%23/, '#');
      url = url.replace (/^s\//, 'https://');
      if (!url.match (/^https?:\/\//)) {
        url = 'http://' + url;
      }
      insertStarContainer (link, url, null);
      continue;
    }
    
    var classes = link.className;
    if (/\bmixi-check-button\b/.test (classes)) {
      var url = link.getAttribute ('data-url');
      if (url) {
        insertStarContainer (link, url, null);
        continue;
      }
    }
  }
  
  var iframes = document.getElementsByTagName ('iframe');
  var iframesL = iframes.length;
  for (var i = 0; i < iframesL; i++) {
    var iframe = iframes[i];
    var src = iframe.src;
    if (src.replace (/^http:\/\/platform0.twitter.com\/widgets\/tweet_button.html\?/, '')) {
      var params = {};
      src.split (/[&;]/).map (function (v) { return v.split (/=/, 2).map (function (v) { try { return decodeURIComponent (v) } catch (e) { return v } }) }).forEach (function (v) { params[v[0]] = v[1] });
      if (params.url) {
        insertStarContainer (iframe, params.url, params.text);
      }
    }
  }
}) ();

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
