  self.logger = new Logger ();
  self.config = new UserConfig ();

  chrome.tabs.onUpdated.addListener (function (tabId, changeInfo, tab) {
    if (changeInfo.status != 'loading') return;
    //if (changeInfo.status != 'complete') return;
    
    var pi = new PageInfo (tab.url);
    pi.config = self.config;
    if (pi.isAllowedURL ()) {
      logger.add ('Loading <' + pi.url + '>...');
    } else {
      logger.add ('URL <' + pi.url + '> is not allowed');
      return;
    }
    
    pi.title = tab.title;
    pi.originalTitle = tab.title;
    pi.parsePageMetadata (tabId, function () {
      if (this.url != tab.url) {
        logger.add ('Canonical URL of page <' + tab.url + '> is <' + this.url + '>');
        if (!pi.isAllowedURL ()) {
          logger.add ('URL <' + pi.url + '> is not allowed');
        }
      }
      
      chrome.browserAction.setPopup ({
        tabId: tabId,
        popup: pi.getEntryPopupURL (),
      });
      
      if (tab.incognito) {
        if (this.url != tab.url) {
          logger.add ('Stars for URL <' + pi.url + '> is not retrieved because the tab is in incognito mode');
        }
        return;
      } else if (!pi.isAutoRetrievalAllowedURL ()) {
        if (this.url != tab.url) {
          logger.add ('Retrieval of stars for URL <' + pi.url + '> without explicit user action is not allowed');
        }
        return;
      }
      
      pi.getTotalStarCount (function (n) {
        if (n > 0) {
          updateBAStarCount (tabId, n);
        }
      });
    });
    
    if (tab.incognito) {
      logger.add ('Stars for URL <' + pi.url + '> is not retrieved because the tab is in incognito mode');
    } else if (!pi.isAutoRetrievalAllowedURL ()) {
      logger.add ('Retrieval of stars for URL <' + pi.url + '> without explicit user action is not allowed');
      return;
    }
    
//    pi.ifURLHasSiteConfig (function (domain, siteConfig) {
//      logger.add ('Use SiteConfig for domain "' + domain + '" (SiteConfig retrieved at ' + (new Date (PageInfo.siteConfigsTimestamp)) + ')');
      var extConfig = {
        tld: config.get ('tld') == 'jp' ? 'jp' : 'com',
        iconType: config.get ('iconType'),
        nameType: config.get ('nameType'),
        useIconStar: config.get ('useIconStar') == 'true' ? true : false,
      };
      chrome.tabs.executeScript (tabId, {
        code: "document.documentElement.setAttribute ('data-hatena-star-chrome-config', '" + JSON.stringify (extConfig) + "')"
      }, function () {
        chrome.tabs.executeScript (tabId, {
          file: 'load-hatena-star.js',
          // allFrames: true,
        });
      });
//    });
  });
  
  function addStar (url, title, starCounts, token, nextCode) {
    if (starCounts.yellow || starCounts.green || starCounts.red || starCounts.blue || starCounts.purple) {
      //
    } else {
      return;
    }
    
    var self = this;
    logger.add ('Adding stars to <' + url + '>...', {data: starCounts});
    var xhr = new XMLHttpRequest ();
    var paletteURL = 'http://' + config.getDomain ('s') + '/colorpalette.multiple';
    xhr.open ('POST', paletteURL, true);
    xhr.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          getRKS (function (rks) {
            var xhr = new XMLHttpRequest ();
            var addURL = 'http://' + config.getDomain ('s') + '/star.add_multi.json?uri=' + encodeURIComponent (url) + '&rks=' + encodeURIComponent (rks);
            xhr.open ('GET', addURL, true);
            xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                if (xhr.status < 400) {
                  logger.add ('Stars added to <' + url + '>', {data: starCounts});
                  var json = JSON.parse (xhr.responseText);
                  nextCode.apply (self, [json.stars]);
                }
              }
            };
            xhr.send (null);
          });
        }
      }
    };
    xhr.send
        ('uri=' + encodeURIComponent (url) +
         '&title=' + encodeURIComponent (title) +
         '&yellow_count=' + (starCounts.yellow || 0) +
         '&green_count=' + (starCounts.green || 0) +
         '&red_count=' + (starCounts.red || 0) +
         '&blue_count=' + (starCounts.blue || 0) +
         '&purple_count=' + (starCounts.purple || 0) +
         '&token=' + encodeURIComponent (token));
  } // addStar
  
  function getCurrentUser (nextCode, opts) {
    var self = this;
    if (self.myInfo && !(opts && opts.fromServer)) {
      setTimeout (function () {
        nextCode.apply (self, [self.myInfo]);
      }, 1);
      return;
    }
    
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', 'http://' + config.getDomain ('n') + '/applications/my.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          if (json) {
            var user = new UserInfo ({nanoJSON: json, config: config});
            self.myInfo = user;
            nextCode.apply (self, [user]);
          }
        }
      }
    };
    xhr.send (null);
  } // getCurrentUser
  
  function getRKS (nextCode) {
    var tthis = this;
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', 'http://' + config.getDomain ('s') + '/entries.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          if (json.rks) {
            self.userRKS = json.rks;
            nextCode.apply (tthis, [self.userRKS]);
          }
        }
      }
    };
    xhr.send (null);
  } // getRKS
  
  function getRKM (nextCode) {
    var tthis = this;
    var xhr = new XMLHttpRequest ();
    xhr.open ('GET', 'http://' + config.getDomain ('n') + '/touch/setting/', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var div = document.createElement ('div');
          div.innerHTML = xhr.responseText;
          var rkm = div.querySelector('input[name=rkm]');
          if (rkm && rkm.value) {
            self.userRKM = rkm.value;
            nextCode.apply (tthis, [self.userRKM]);
          }
        }
      }
    };
    xhr.send (null);
  } // getRKM
  
  function updateBAStarCount (tabId, n) {
    chrome.browserAction.setBadgeText ({
      text: n > 9999 ? '*' : n.toString (),
      tabId: tabId,
    });
  } // updateBAStarCount
  
  self.userAgentName = chrome.i18n.getMessage ('hatenastar_everywhere') + ' (Chrome)';
  logger.add ("background.html initialized");

/* ***** BEGIN LICENSE BLOCK *****
 * Copyright 2011-2013 Wakaba <wakaba@suikawiki.org>.  All rights reserved.
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
