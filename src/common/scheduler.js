const scheduler = new (function () {
  const schedules = {};

  this.create = function (id, time, callback, options) {
    options = options || {};
    let sch = schedules[id];
    if (sch) { sch.cancel(); }

    sch = new Schedule(id, time, function () {
      callback(sch);
    }, function () { delete schedules[id]; }, options);
    schedules[id] = sch;
    return sch;
  };

  //this.clear = function () { }

  function Schedule(id, time, callback, cancelled, options) {
    //this.id = id;
    //this.time = time;
    let waitTime = null;
    if (time instanceof Date) {
      waitTime = time.getTime() - (new Date()).getTime();
    }
    else if (typeof time === "number") {
      waitTime = time * 60 * 1000;
    }
    const obj = {};
    if (waitTime >= 0) {
      if (options.recursive) {
        obj.cTokken = setInterval(callback, waitTime);
      }
      else {
        obj.cTokken = setTimeout(function () { cancelled(); callback(this); }, waitTime);
      }
    }

    this.cancel = function () {
      if (obj && obj.cTokken) {
        if (options.recursive) {
          clearInterval(obj.cTokken);
        }
        else {
          clearTimeout(obj.cTokken);
        }

        cancelled();
      }
    };
  }
})();

export { scheduler };