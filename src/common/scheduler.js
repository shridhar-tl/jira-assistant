const $ = window['$'];

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

// eslint-disable-next-line no-unused-vars
function loadScript(src, scriptId, isLoaded, done, retryCount) {
  if (!retryCount && retryCount !== 0) {
    retryCount = 10;
  }
  console.log(`Loading script:- ${src}`);

  const scriptGAPI = document.createElement("script");
  scriptGAPI.id = scriptId;
  scriptGAPI.src = src;
  scriptGAPI.async = true;
  scriptGAPI.defer = true;
  //var scriptGAPI = $("head").append('<script id="' + scriptId + '" async defer src="' + src + '"></script>').get(0);
  const lSch = scheduler.create(`scriptLoader${retryCount}`, 0.2, completeCallback);

  scriptGAPI.onload = function () {
    this.onload = function () { /* Nothing to do here */ };
    completeCallback(lSch);
  };
  scriptGAPI.onerror = function (err) { /* Nothing to do here */ };
  scriptGAPI.onreadystatechange = function () { if (this.readyState === 'complete') { this.onload(); } };

  $('head').append(scriptGAPI);

  function completeCallback(sch) {
    sch.cancel();
    if (!isLoaded()) {
      console.error(`Script not loaded:- ${src}`);
      scheduler.create(`scriptLoadCaller${retryCount}`, 10, function () {
        $(`#${scriptId}`).remove();
        loadScript(src, scriptId, isLoaded, done, --retryCount);
      });
    }
    else {
      done();
    }
  }
}
