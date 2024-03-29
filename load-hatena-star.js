/* Run as a content script */

var starScript = document.createElement ("script");
starScript.src = chrome.extension.getURL ('load-hatena-star-content.js?' + Math.random ());
starScript.charset = 'utf-8';
document.body.appendChild (starScript);

if (/(?:^|\.)s[^.]*\.hatena\.(?:ne\.jp|com)/.test (location.hostname)) {
  var topBox = document.getElementById ('top-box');
  if (topBox) {
    var more = topBox.getElementsByClassName ('more')[0];
    if (more) {
      var a = document.createElement ('a');
      a.className = 'icon-arrow2-blue';
      a.href = chrome.extension.getURL ('options.html');
      a.textContent = chrome.i18n.getMessage ('options_full');
      more.appendChild (a);
      
      a = document.createElement ('a');
      a.className = 'icon-arrow2-blue';
      a.href = '/siteconfig';
      a.textContent = chrome.i18n.getMessage ('siteconfigwiki');
      more.appendChild (a);
      
      var style = document.createElement ('style');
      style.textContent = '#top-box p.more a { display: block; margin-left: 200px; text-align: left }';
      document.body.appendChild (style);
    }
  }
}

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
