
var Logger = function () {
  this.init.apply (this, arguments);
}; // Logger

Logger.prototype = {
  init: function () {
    this.logs = [];
  }, // init
  
  add: function (message, args) {
    args = args || {};
    args.message = message;
    this.logs.push (args);
    
    if (this.onlog) {
      this.onlog.apply (this, [args]);
    }
  }, // add
}; // Logger.prototype
