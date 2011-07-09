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
    
    if (param.url) {
      setTimeout (function () { openURL (param.url, param.title) }, 1);
    }
    
    getMyInfo (function (json) {
      var name = json.url_name;
      if (name) {
        var css = 'li[data-star-user-name="' + name + '"] .star-delete, li[data-comment-user-name="' + name + '"] .comment-delete { display: block !important }';
        var style = document.createElement ('style');
        style.textContent = css;
        document.body.appendChild (style);
      }
    });
    
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
      pi.title = title;
      
      starEntryInfo.getElementsByClassName ('entry-title')[0].textContent = pi.title;
      starEntryInfo.getElementsByClassName ('entry-url')[0].textContent = pi.url;
      
      updateTotalStarCounts ();
      
      pi.getStarEntry (function (json) {
        showEntry (json);
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
        
        if (opts && opts.incrementStarCounts && self.pageInfo.starCounts) {
          self.pageInfo.starCounts[color]++;
          self.pageInfo.starCounts.total++;
        }
        
        var urlName = star.name;
        if (starByUser[urlName] && starByUser[urlName][color] && starByUser[urlName][color][star.quote || '']) {
          var starCount = starByUser[urlName][color][star.quote || ''];
          starCount.textContent = parseInt (starCount.textContent) + parseInt (star.count || 1);
          return;
        }
        
        var nickname = urlName;
        var userURL = 'http://www.hatena.com/' + urlName + '/';
        var li = starUserTemplate.cloneNode (true);
        li.hidden = false;
        li.getElementsByClassName ('profile-image-link')[0].href = userURL;
        li.getElementsByClassName ('profile-image')[0].src = 'http://n.hatena.com/' + urlName + '/profile/image?size=16';
        var nicknameEl = li.getElementsByClassName ('nickname-link')[0];
        nicknameEl.href = userURL;
        nicknameEl.textContent = nickname;
        nicknameEl.title = 'id:' + urlName;
        li.getElementsByClassName ('star-image')[0].src = 'http://s.hatena.com/images/star-' + color + '.gif';
        var starCount = li.getElementsByClassName ('star-count')[0];
        starCount.textContent = star.count || 1;
        starCount.className += ' star-' + color;
        if (star.quote) {
          li.getElementsByClassName ('star-quote')[0].textContent = star.quote.replace (/<br \/>/g, '\n').replace (/&lt;/g, '<');
        }
        
        li.getElementsByClassName ('star-delete')[0].onclick = function () {
          deleteStar (color, star.quote, li);
        };
        li.setAttribute ('data-star-user-name', star.name);
        
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
        getMyInfo (function (json) {
          var urlName = json.url_name;
          var nickname = json.display_name;
          var userURL = 'http://www.hatena.com/' + urlName + '/';
          starCommentForm.getElementsByClassName ('profile-image-link')[0].href = userURL;
          starCommentForm.getElementsByClassName ('profile-image')[0].src = 'http://n.hatena.com/' + urlName + '/profile/image?size=16';
          var nicknameEl = starCommentForm.getElementsByClassName ('nickname-link')[0];
          nicknameEl.href = userURL;
          nicknameEl.textContent = nickname;
          nicknameEl.title = 'id:' + urlName;
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
        var postURL = 'http://s.hatena.com/comment.add.json?uri=' + encodeURIComponent (args.url) + '&title=' + encodeURIComponent (args.title) + '&body=' + encodeURIComponent (args.body) + '&rks=' + encodeURIComponent (rks);
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
      var urlName = comment.name;
      var nickname = urlName;
      var userURL = 'http://www.hatena.com/' + urlName + '/';
      var li = starCommentTemplate.cloneNode (true);
      li.hidden = false;
      li.getElementsByClassName ('profile-image-link')[0].href = userURL;
      li.getElementsByClassName ('profile-image')[0].src = 'http://n.hatena.com/' + urlName + '/profile/image?size=16';
      var nicknameEl = li.getElementsByClassName ('nickname-link')[0];
      nicknameEl.href = userURL;
      nicknameEl.textContent = nickname;
      nicknameEl.title = 'id:' + urlName;
      li.getElementsByClassName ('comment-body')[0].textContent = comment.body.replace (/<br \/>/g, '\n').replace (/&lt;/g, '<');
      li.getElementsByClassName ('comment-delete')[0].onclick = function () {
        if (confirm (this.getAttribute ('data-confirm'))) {
          deleteStarComment (comment.id, li);
        }
      };
      li.setAttribute ('data-comment-user-name', comment.name);
      starCommentList.insertBefore (li, starCommentForm);
    } // json
    
    function updateAvailUserStarCounts () {
      self.pageInfo.getAvailUserStarCounts (function (counts) {
        ['yellow', 'green', 'red', 'blue', 'purple'].forEach (function (color) {
          var button = userAvailStarCountEl.getElementsByClassName ('add-star-' + color)[0];
          button.onclick = function () {
            addStarLater (color);
          };

          if (color == 'yellow') return;
          
          var el = userAvailStarCountEl.getElementsByClassName ('star-' + color)[0];
          if (counts[color]) {
            el.textContent = counts[color];
            el.hidden = false;
            button.hidden = false;
          } else if (color == 'purple') {
            el.hidden = true;
            button.hidden = true;
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
        updateTotalStarCount ();
      });
      self.nextAddStarCounts = {};
    } // addStar
    
    function deleteStar (color, quote, li) {
      bg.getRKS (function (rks) {
        var xhr = new XMLHttpRequest ();
        var deleteURL = 'http://s.hatena.com/star.delete.json?uri=' + encodeURIComponent (self.pageInfo.url) + '&quote=' + encodeURIComponent (quote) + '&color=' + encodeURIComponent (color) + '&rks=' + encodeURIComponent (rks);
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
        var deleteURL = 'http://s.hatena.com/comment.delete.json?comment_id=' + encodeURIComponent (id) + '&rks=' + encodeURIComponent (rks);
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
    
    function getMyInfo (nextCode) {
      var self = this;
      if (self.myInfo) {
        setTimeout (function () {
          nextCode.apply (self, [self.myInfo]);
        }, 1);
        return;
      }
      
      var xhr = new XMLHttpRequest ();
      xhr.open ('GET', 'http://n.hatena.com/applications/my.json', true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status < 400) {
            var json = JSON.parse (xhr.responseText);
            if (json) {
              self.myInfo = json;
              nextCode.apply (self, [json]);
            }
          }
        }
      };
      xhr.send (null);
    } // getMyInfo
  
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
