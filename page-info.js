
var PageInfo = function () {
  this.init.apply (this, arguments);
}; // PageInfo

PageInfo.prototype = {
  init: function (url) {
    this.url = url;
  }, // init
  
  getEntryPopupURL: function () {
    return "entry.html?url=" + encodeURIComponent (this.url);
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
          
          var n = starCounts.yellow + starCounts.green + starCounts.red + starCounts.blue + starCounts.purple;
          nextCode.apply (this, [n]);
        }
      }
    }; // onreadystatechange
    xhr.send (null);
  }, // getTotalStarCount
}; // PageInfo.prototype
