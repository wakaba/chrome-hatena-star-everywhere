    var bg = chrome.extension.getBackgroundPage ();
    var logger = bg.logger;
    
    var param = {};
    var query = (location.search || '').replace (/^\?/, '').split (/[&;]/).forEach (function (v) {
      var w = v.split (/=/, 2).map (function (v) { return decodeURIComponent (v) });
      param[w[0]] = w[1];
    });
    
    var starEntryInfo = document.getElementById ('star-entry-info');
    var userAvailStarCountEl = document.getElementById ('user-avail-star-count');
    var totalStarCountEl = document.getElementById ('total-star-count');
    var starUserList = document.getElementById ('star-user-list');
    var starUserTemplate = starUserList.getElementsByClassName ('template')[0];
    var starCommentList = document.getElementById ('star-comment-list');
    var starCommentTemplate = starCommentList.getElementsByClassName ('template')[0];
    var starCommentForm = document.getElementById ('star-comment-form');
    var haikuNoteList = document.getElementById ('haiku-note-list');
    var haikuNoteTemplate = haikuNoteList.getElementsByClassName ('template')[0];
    var haikuNoteMore = haikuNoteList.getElementsByClassName ('more')[0];
    var haikuNoteForm = document.getElementById ('haiku-note-form');
    
    if (param.url) {
      setTimeout (function () { openURL (param.url, param.title) }, 100);
    } else {
      chrome.tabs.getSelected (null, function (tab) {
        if (tab) {
          setTimeout (function () { openURL (tab.url, tab.title) }, 100);
        }
      });
    }
    
    getMyInfo (function (user) {
      var urlName = user.urlName;
      if (urlName) {
        var css = 'article[data-owner-url-name="' + urlName + '"] .delete-button, li[data-owner-url-name="' + urlName + '"] .delete-button { display: block !important }';
        var style = document.createElement ('style');
        style.textContent = css;
        document.body.appendChild (style);
        
        var links = document.getElementsByClassName ('login-links');
        for (var i = 0; i < links.length; i++) {
          links[i].hidden = true;
        }
      } else {
        var loginURL = 'https://' + bg.config.getDomain ('www') + '/login?location=http://' + bg.config.getDomain ('s') + '/';
        var registerURL = 'https://' + bg.config.getDomain ('www') + '/register?location=http://' + bg.config.getDomain ('s') + '/';
        var links = document.getElementsByClassName ('link-login');
        for (var i = 0; i < links.length; i++) {
          links[i].href = loginURL;
        }
        links = document.getElementsByClassName ('link-register');
        for (var i = 0; i < links.length; i++) {
          links[i].href = registerURL;
        }
      }
      
      user.fillHTML (document.getElementById ('stars').getElementsByTagName ('h1')[0].getElementsByClassName ('user-info')[0]);
    }, {fromServer: true});
    
    var tabs = document.getElementById ('tabs');
    var tabButtons = tabs.getElementsByClassName ('tab-button');
    var tabButtonsL = tabButtons.length;
    for (var i = 0; i < tabButtonsL; i++) (function (button) {
      button.onclick = function () {
        for (var i = 0; i < tabButtonsL; i++) {
          tabButtons[i].classList.remove ('selected');
        }
        button.classList.add ('selected');
      };
    }) (tabButtons[i]);
    tabButtons[0].classList.add ('selected');
    
    location.href = '#stars';
    
    function openURL (url, title) {
      logger.add ('Opening <' + url + '>...');
      
      var pi = new PageInfo (url);
      self.pageInfo = pi;
      pi.config = bg.config;
      pi.title = title;
      
      starEntryInfo.getElementsByClassName ('entry-title')[0].textContent = pi.title;
      starEntryInfo.getElementsByClassName ('entry-url')[0].textContent = pi.url;
      
      updateTotalStarCounts ();
      
      pi.getStarEntry (function (json) {
        showEntry (json);
      });
      pi.getHaikuEntriesByWord (pi.url, function (json) {
        showHaikuEntries (json);
      });
      
      updateAvailUserStarCounts ();
    } // openURL
    
    function updateTotalStarCounts () {
      self.pageInfo.getTotalStarCount (function () {
        showTotalStarCounts (this.starCounts, {});
      });
    } // updateTotalStarCounts
    
    function showTotalStarCounts (sc1, sc2) {
      var total = 0;
      ['yellow', 'green', 'red', 'blue', 'purple'].forEach (function (starColor) {
        var el = totalStarCountEl.getElementsByClassName ('star-' + starColor)[0];
        var count = sc1[starColor] || 0;
        count += sc2[starColor] || 0;
        if (count) {
          el.textContent = count;
          el.hidden = false;
          total += count;
        } else {
          el.hidden = true;
        }
      });
      totalStarCountEl.hidden = total == 0;
      
      if (total > 0) {
        chrome.tabs.getSelected (null, function (tab) {
          if (tab) bg.updateBAStarCount (tab.id, total);
        });
      }
    } // showTotalStarCounts
    
    function showEntry (json) {
      if (json.colored_stars) {
        json.colored_stars.forEach (function (v) {
          showStars (v.color, v.stars);
        });
      }
      if (json.stars) {
        showStars ('yellow', json.stars);
      }
      if (json.comments) {
        showStarComments (json.comments, parseInt (json.can_comment));
      }
    } // showEntry
    
    var starByUser = {};
    function showStars (starColor, stars, opts) {
      stars.forEach (function (star) {
        var color = starColor || star.color;
        
        if (opts && opts.incrementStarCounts && self.pageInfo && self.pageInfo.starCounts) {
          self.pageInfo.starCounts[color]++;
          self.pageInfo.starCounts.total++;
        }
        
        var urlName = star.name;
        if (starByUser[urlName] && starByUser[urlName][color] && starByUser[urlName][color][star.quote || '']) {
          var starCount = starByUser[urlName][color][star.quote || ''];
          starCount.textContent = parseInt (starCount.textContent) + parseInt (star.count || 1);
          return;
        }
        
        var li = starUserTemplate.cloneNode (true);
        li.hidden = false;
        var user = new UserInfo ({starJSON: star, config: bg.config});
        user.fillHTML (li.getElementsByClassName ('user-info')[0]);
        li.getElementsByClassName ('star-image')[0].src = 'http://s.hatena.com/images/star-' + color + '.gif';
        var starCount = li.getElementsByClassName ('star-count')[0];
        starCount.textContent = star.count || 1;
        starCount.className += ' star-' + color;
        if (star.quote) {
          li.getElementsByClassName ('star-quote')[0].textContent = star.quote.replace (/<br \/>/g, '\n').replace (/&lt;/g, '<');
        }
        
        li.getElementsByClassName ('delete-button')[0].onclick = function () {
          deleteStar (color, star.quote, li);
        };
        li.setAttribute ('data-owner-url-name', star.name);
        
        starByUser[urlName] = starByUser[urlName] || {};
        starByUser[urlName][color] = starByUser[urlName][color] || {};
        starByUser[urlName][color][star.quote || ''] = starCount;
        starUserList.appendChild (li);
      });
    } // showStars
    
    function showStarComments (comments, canComment) {
      comments.forEach (insertStarComment);
      
      if (canComment) {
        starCommentForm.hidden = false;
        document.getElementById ('menu-comments').hidden = false;
        document.getElementById ('menu-comment-count').textContent = comments.length;
        getMyInfo (function (user) {
          user.fillHTML (starCommentForm.getElementsByClassName ('user-info')[0]);
        });
        starCommentForm.getElementsByTagName ('form')[0].onsubmit = function () {
          var form = this;
          var body = form.elements.body.value;
          if (body == '') return false;
          postStarComment ({
            url: self.pageInfo.url,
            title: self.pageInfo.title,
            body: body,
          }, function (json) {
            insertStarComment (json);
            form.elements.submit.disabled = false;
            form.getElementsByClassName ('indicator')[0].hidden = true;
          });
          form.elements.body.value = '';
          form.elements.submit.disabled = true;
          form.getElementsByClassName ('indicator')[0].hidden = false;
          return false;
        };
      }
    } // showStarComments
    
    function postStarComment (args, nextCode) {
      var self = this;
      bg.getRKS (function (rks) {
        var xhr = new XMLHttpRequest ();
        var postURL = 'http://' + bg.config.getDomain ('s') + '/comment.add.json?uri=' + encodeURIComponent (args.url) + '&title=' + encodeURIComponent (args.title) + '&body=' + encodeURIComponent (args.body) + '&rks=' + encodeURIComponent (rks);
        xhr.open ('GET', postURL, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status < 400) {
              var json = JSON.parse (xhr.responseText);
              nextCode.apply (self, [json]);
            }
          }
        };
        xhr.send (null);
      });
    } // postStarComment
    
    function insertStarComment (comment) {
      var li = starCommentTemplate.cloneNode (true);
      li.hidden = false;
      li.className = '';
      var user = new UserInfo ({starJSON: comment, config: bg.config});
      user.fillHTML (li.getElementsByClassName ('user-info')[0]);
      li.getElementsByClassName ('comment-body')[0].textContent = comment.body.replace (/<br \/>/g, '\n').replace (/&lt;/g, '<');
      li.getElementsByClassName ('delete-button')[0].onclick = function () {
        if (confirm (this.getAttribute ('data-confirm'))) {
          deleteStarComment (comment.id, li);
        }
      };
      li.setAttribute ('data-owner-url-name', comment.name);
      starCommentList.insertBefore (li, starCommentForm);
    } // json
    
    function updateAvailUserStarCounts () {
      self.pageInfo.getAvailUserStarCounts (function (counts) {
        ['yellow', 'green', 'red', 'blue', 'purple'].forEach (function (color) {
          var button = userAvailStarCountEl.getElementsByClassName ('add-star-' + color)[0];
          button.onclick = function () {
            addStarLater (color);
          };

          var el = userAvailStarCountEl.getElementsByClassName ('star-' + color)[0];
          
          if (color == 'yellow') {
            el.textContent = "\u221E";
            el.hidden = false;
            button.hidden = false;
            button.disabled = false;
          } else if (counts[color]) {
            el.textContent = counts[color];
            el.hidden = false;
            button.hidden = false;
            button.disabled = false;
          } else if (color == 'purple') {
            el.hidden = true;
            button.hidden = true;
            button.disabled = true;
          } else {
            el.textContent = 0;
            el.hidden = false;
            button.hidden = false;
            button.disabled = true;
          }
        });
      });
    } // updateUserAvailStarCounts
    
    self.nextAddStarCounts = {};
    function addStarLater (color) {
      if (!self.nextAddStarCounts[color]) {
        self.nextAddStarCounts[color] = 1;
      } else {
        self.nextAddStarCounts[color]++;
      }
      clearTimeout (self.addStarTimer);
      self.addStarTimer = setTimeout (function () {
        addStar ();
      }, 1000);
      showTotalStarCounts (self.pageInfo.starCounts, self.nextAddStarCounts);
    } // addStarLater
    addEventListener ('beforeunload', addStar, false);
    
    function addStar () {
      bg.addStar (self.pageInfo.url, self.pageInfo.title, self.nextAddStarCounts, self.pageInfo.userAddStarToken, function (stars) {
        if (!stars) return;
        showStars (null, stars, {incrementStarCounts: true});
        updateAvailUserStarCounts ();
        updateTotalStarCounts ();
      });
      self.nextAddStarCounts = {};
    } // addStar
    
    function deleteStar (color, quote, li) {
      bg.getRKS (function (rks) {
        var xhr = new XMLHttpRequest ();
        var deleteURL = 'http://' + bg.config.getDomain ('s') + '/star.delete.json?uri=' + encodeURIComponent (self.pageInfo.url) + '&quote=' + encodeURIComponent (quote) + '&color=' + encodeURIComponent (color) + '&rks=' + encodeURIComponent (rks);
        xhr.open ('GET', deleteURL, true);
        var sc = li.getElementsByClassName ('star-count')[0];
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status < 400) {
              var json = JSON.parse (xhr.responseText);
              if (json && json.result && json.result.decremented) {
                //
              } else {
                li.hidden = false;
                sc.textContent = parseInt (sc.textContent) + 1;
              }
              updateTotalStarCounts (self.pageInfo.starCounts, {});
            }
          }
        };
        xhr.send (null);
        var count = parseInt (sc.textContent);
        count--;
        sc.textContent = count;
        li.hidden = count == 0;
        var diff = {};
        diff[color] = -1;
        showTotalStarCounts (self.pageInfo.starCounts, diff);
      });
    } // deleteStar
    
    function deleteStarComment (id, li) {
      bg.getRKS (function (rks) {
        var xhr = new XMLHttpRequest ();
        var deleteURL = 'http://' + bg.config.getDomain ('s') + '/comment.delete.json?comment_id=' + encodeURIComponent (id) + '&rks=' + encodeURIComponent (rks);
        xhr.open ('GET', deleteURL, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status < 400) {
              var json = JSON.parse (xhr.responseText);
              if (json && json.result && parseInt (json.result)) {
                //
              } else {
                li.hidden = false;
              }
            }
          }
        };
        xhr.send (null);
        li.hidden = true;
      });
    }
    
    function getMyInfo (nextCode, opts) {
      bg.getCurrentUser (nextCode, opts);
    } // getMyInfo

function showHaikuEntries (entries) {
  entries.forEach (insertHaikuEntry);

  document.getElementById ('menu-note-count').textContent = entries.length;
  haikuNoteMore.getElementsByTagName ('a')[0].href = 'http://' + bg.config.getDomain ('h') + '/target?word=' + encodeURIComponent (self.pageInfo.url);
  
  getMyInfo (function (user) {
    user.fillHTML (haikuNoteForm.getElementsByClassName ('user-info')[0]);
    if (user.urlName) {
      var form = haikuNoteForm.getElementsByTagName ('form')[0];
      form.elements.body.disabled = false;
      form.elements.submit.disabled = false;
    }
  });
  haikuNoteForm.getElementsByTagName ('form')[0].onsubmit = function () {
    var form = this;
    var body = form.elements.body.value;
    if (body == '') return false;
    postHaikuEntry ({
      word: self.pageInfo.url,
      body: body,
    }, function (json) {
      insertHaikuEntry (json);
      form.elements.submit.disabled = false;
      form.getElementsByClassName ('indicator')[0].hidden = true;
    });
    form.elements.body.value = '';
    form.elements.submit.disabled = true;
    form.getElementsByClassName ('indicator')[0].hidden = false;
    return false;
  };
} // showHaikuEntries

function insertHaikuEntry (entry) {
  var li = haikuNoteTemplate.cloneNode (true);
  li.hidden = false;
  li.className = '';
  var user = new UserInfo ({haikuJSON: entry.user, config: bg.config});
  user.fillHTML (li.getElementsByClassName ('user-info')[0]);
  var body = li.getElementsByClassName ('entry-body')[0];
  body.textContent = entry.text.substring (entry.keyword.length + 1);
  li.getElementsByClassName ('delete-button')[0].onclick = function () {
    if (confirm (this.getAttribute ('data-confirm'))) {
      deleteHaikuEntry (entry.user.name, entry.id, function () {
        li.hidden = true;
      });
    }
  };
  li.getElementsByClassName ('timestamp')[0].textContent = entry.created_at;
  li.setAttribute ('data-owner-url-name', entry.user.screen_name);
  haikuNoteList.insertBefore (li, haikuNoteMore);
} // insertHaikuEntry

function postHaikuEntry (args, nextCode) {
  var self = this;
  bg.getRKM (function (rkm) {
    var xhr = new XMLHttpRequest ();
    var postURL = 'http://' + bg.config.getDomain ('h') + '/api/statuses/update.json';
    xhr.open ('POST', postURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          nextCode.apply (self, [json]);
        }
      }
    };
    xhr.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    var data = 'keyword=' + encodeURIComponent (args.word) +
        '&status=' + encodeURIComponent (args.body) +
        '&source=' + encodeURIComponent (bg.userAgentName) +
        '&rkm=' + encodeURIComponent (rkm);
    xhr.send (data);
  });
} // postHaikuEntry

function deleteHaikuEntry (name, id, nextCode) {
  var self = this;
  bg.getRKM (function (rkm) {
    var xhr = new XMLHttpRequest ();
    var postURL = 'http://' + bg.config.getDomain ('h') + '/api/statuses/destroy/' + id + '.json';
    xhr.open ('POST', postURL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status < 400) {
          var json = JSON.parse (xhr.responseText);
          nextCode.apply (self, [json]);
        }
      }
    };
    xhr.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded');
    var data = 'author_url_name=' + name + '&rkm=' + encodeURIComponent (rkm);
    xhr.send (data);
  });
} // deleteHaikuEntry

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
