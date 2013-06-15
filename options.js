  var bg = chrome.extension.getBackgroundPage ();
  var config = bg.config;
  
  var PageInfo = bg.PageInfo;

  var ids = ['disallowedURLs', 'allowedURLs'];
  ids.forEach (function (id) {
    var el = document.getElementById (id);
    el.value = config.get (id);
    el.onchange = function () {
      config.set (id, el.value);
    }; // onchange
  });
  
  var accountForUser = document.getElementById ('account-for-user');
  var accountForGuest = document.getElementById ('account-for-guest');
  function updateAccountInfo () {
    var tld = config.get ('tld');
    document.getElementById ('community-' + tld).checked = true;
    bg.getCurrentUser (function (user) {
      if (user.urlName) {
        accountForUser.hidden = false;
        accountForGuest.hidden = true;
        user.fillHTML (accountForUser.getElementsByClassName ('user-info')[0]);
        document.getElementById ('logout-link').href = 'http://' + config.getDomain ('www') + '/logout?location=http://' + config.getDomain ('s') + '/';
      } else {
        accountForUser.hidden = true;
        accountForGuest.hidden = false;
        document.getElementById ('login-link').href = 'http://' + config.getDomain ('www') + '/login?location=http://' + config.getDomain ('s') + '/';
        document.getElementById ('register-link').href = 'http://' + config.getDomain ('www') + '/register?location=http://' + config.getDomain ('s') + '/';
      }
    }, {fromServer: true});
  } // updateAccountInfo
  updateAccountInfo ();
  
  ['jp', 'com'].forEach (function (value) {
    document.getElementById ('community-' + value).onchange = function () {
      config.set ('tld', value);
      updateAccountInfo ();
    }; // onchange
  });
  
  ['default', 'face', 'icon'].forEach (function (value) {
    document.getElementById ('iconType-' + value).onchange = function () {
      config.set ('iconType', value);
    }; // onchange
  });
  document.getElementById ('iconType-' + config.get ('iconType')).checked = true;
  
  ['nickname', 'hatenaid'].forEach (function (value) {
    document.getElementById ('nameType-' + value).onchange = function () {
      config.set ('nameType', value);
    }; // onchange
  });
  document.getElementById ('nameType-' + config.get ('nameType')).checked = true;
  
  ['true', 'false'].forEach (function (value) {
    document.getElementById ('useIconStar-' + value).onchange = function () {
      config.set ('useIconStar', value == 'true');
    }; // onchange
  });
  document.getElementById ('useIconStar-' + config.get ('useIconStar')).checked = true;
  
  var siteConfig = document.getElementById ('siteconfig');
  siteConfig.getElementsByTagName ('time')[0].textContent = new Date (PageInfo.siteConfigsTimestamp).toLocaleString ();
  siteConfig.getElementsByTagName ('button')[0].onclick = function () {
    PageInfo.siteConfigsTimestamp = 0;
    var pi = new PageInfo ('http://www.hatena.com/');
    pi.config = config;
    pi.getSiteConfigs (function () {
      siteConfig.getElementsByTagName ('time')[0].textContent = new Date (PageInfo.siteConfigsTimestamp).toLocaleString ();
    });
  }; // onclick

document.getElementById ('logout-link').onclick = function () {
  return confirm(this.getAttribute ('data-confirm'));
};

document.getElementById ('urls-revert-button').onclick = function () {
  if (confirm(this.getAttribute ('data-confirm'))) {
    config.delete ('allowedURLs');
    config.delete ('disallowedURLs');
    location.reload ();
  }
};

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
