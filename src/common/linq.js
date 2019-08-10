/*eslint-disable no-extend-native, no-loop-func*/

//Array.prototype.ToArray= function() { return this; };
Array.prototype.where = function (clause, maxItems) {
  var newArray = [];

  // The clause was passed in as a Method that return a Boolean
  for (var index = 0; index < this.length && (!maxItems || maxItems > newArray.length); index++) {
    if (clause(this[index], index)) {
      newArray[newArray.length] = this[index];
    }
  }
  return newArray;
};
Array.prototype.select = function (clause, incNull) {
  var newArray = [];

  // The clause was passed in as a Method that returns a Value
  for (var i = 0; i < this.length; i++) {
    var data = clause ? clause(this[i], i) : this[i];
    if (data != null || incNull) {
      newArray[newArray.length] = data;
    }
  }
  return newArray;
}
Array.prototype.orderBy = function (clause) {
  var tempArray = [];
  for (var i = 0; i < this.length; i++) {
    tempArray[tempArray.length] = this[i];
  }
  return tempArray.sort(function (a, b) {
    var x = clause ? clause(a) : a;
    var y = clause ? clause(b) : b;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}
Array.prototype.orderByDescending = function (clause) {
  var tempArray = [];
  for (var i = 0; i < this.length; i++) {
    tempArray[tempArray.length] = this[i];
  }
  return tempArray.sort(function (a, b) {
    var x = clause ? clause(b) : b;
    var y = clause ? clause(a) : a;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  })
}
Array.prototype.selectMany = function (clause) {
  var r = [];
  for (var i = 0; i < this.length; i++) {
    r = r.concat(clause(this[i]));
  }
  return r;
}
Array.prototype.count = function (clause) {
  if (clause == null) {
    return this.length;
  }
  else {
    return this.where(clause).length;
  }
}
Array.prototype.distinct = function (clause) {
  var item;
  var dict = {};
  var retVal = [];
  for (var i = 0; i < this.length; i++) {
    item = clause ? clause(this[i]) : this[i];
    if (dict[item] == null) {
      dict[item] = true;
      retVal[retVal.length] = item;
    }
  }
  dict = null;
  return retVal;
}
Array.prototype.distinctObj = function (clause) {
  var item;
  var retVal = [];
  //var linq = retVal;
  for (var i = 0; i < this.length; i++) {
    item = clause ? clause(this[i]) : this[i];

    var keys = Object.keys(item);
    if (!retVal.any(function (d) {
      var match = true;
      for (var i = 0; i < keys.length; i++) {
        match = match && d[keys[i]] === item[keys[i]];
      }
      return match;
    })) {
      retVal[retVal.length] = item;
    }
  }
  return retVal;
}
Array.prototype.sum = function (clause) {
  var value = 0;
  if (clause) {
    for (var index = 0; index < this.length; index++) {
      value += clause(this[index]) || 0;
    }
  } else {
    for (var index = 0; index < this.length; index++) {
      value += parseFloat(this[index]) || 0;
    }
  }
  return value;
}
Array.prototype.avg = function (clause) {
  var value = 0;
  var count = 0;
  if (clause) {
    for (var index = 0; index < this.length; index++) {
      var val = parseFloat(clause(this[index]));
      if (val || val === 0) { value = value + val; count++; }
    }
  } else {
    for (var index = 0; index < this.length; index++) {
      var val = parseFloat(this[index]);
      if (val || val === 0) { value = value + val; count++; }
    }
  }
  return count ? value / count : 0;
}
function prepareAgreData(data) {
  if (data && data instanceof Date) {
    return data.getTime();
  } else { return data; }
}
Array.prototype.max = function (clause) {
  var value = 0;
  if (clause) {
    for (var index = 0; index < this.length; index++) {
      var newVal = clause(this[index]) || 0;
      if (prepareAgreData(newVal) > prepareAgreData(value))
        value = newVal;
    }
  } else {
    for (var index = 0; index < this.length; index++) {
      var newVal = this[index] || 0;
      if (prepareAgreData(newVal) > prepareAgreData(value))
        value = newVal;
    }
  }
  return value;
}
Array.prototype.min = function (clause) {
  var value = 0;
  if (clause) {
    for (var index = 0; index < this.length; index++) {
      var newVal = clause(this[index]) || 0;
      if (prepareAgreData(newVal) < prepareAgreData(value))
        value = newVal;
    }
  } else {
    for (var index = 0; index < this.length; index++) {
      var newVal = this[index] || 0;
      if (prepareAgreData(newVal) < prepareAgreData(value))
        value = newVal;
    }
  }
  return value;
}
Array.prototype.any = function (clause) {
  if (typeof clause === "function") {
    for (var index = 0; index < this.length; index++) {
      if (clause(this[index], index)) { return true; }
    }
    return false;
  }
  else if (clause) {
    return this.indexOf(clause) >= 0;
  }
  else { return this.length > 0; }
}
Array.prototype.all = function (clause) {
  for (var index = 0; index < this.length; index++) {
    if (!clause(this[index], index)) { return false; }
  }
  return true;
}
Array.prototype.reverse = function () {
  var retVal = [];
  for (var index = this.length - 1; index > -1; index--)
    retVal[retVal.length] = this[index];
  return retVal;
}
Array.prototype.first = function (clause) {
  if (clause != null) {
    return this.where(clause, 1).first();
  }
  else {
    // If no clause was specified, then return the First element in the Array
    if (this.length > 0)
      return this[0];
    else
      return null;
  }
}
Array.prototype.last = function (clause) {
  if (clause != null) {
    return this.where(clause).last();
  }
  else {
    // If no clause was specified, then return the First element in the Array
    if (this.length > 0)
      return this[this.length - 1];
    else
      return null;
  }
}
Array.prototype.elementAt = function (index) {
  return this[index];
}
Array.prototype.firstIndexOf = function (predicate) {
  for (var index = 0; index < this.length; index++) {
    if (predicate(this[index], index)) {
      return index;
    }
  }
  return -1;
}
Array.prototype.intersect = function (secondArray, clause) {
  var clauseMethod;
  if (clause != undefined) {
    clauseMethod = clause;
  } else {
    clauseMethod = function (item, index, item2, index2) { return item === item2; };
  }

  var sa = secondArray.items || secondArray;

  var result = [];
  for (var a = 0; a < this.length; a++) {
    for (var b = 0; b < sa.length; b++) {
      if (clauseMethod(this[a], a, sa[b], b)) {
        result[result.length] = this[a];
      }
    }
  }
  return result;
}
Array.prototype.defaultIfEmpty = function (defaultValue) {
  if (this.length === 0) {
    return defaultValue;
  }
  return this;
}
Array.prototype.elementAtOrDefault = function (index, defaultValue) {
  if (index >= 0 && index < this.length) {
    return this[index];
  }
  return defaultValue;
}
Array.prototype.firstOrDefault = function (defaultValue, clause) {
  return this.first(clause) || defaultValue;
}
Array.prototype.lastOrDefault = function (defaultValue, clause) {
  return this.last(clause) || defaultValue;
}
Array.prototype.ForEach = function (clause) {
  var total = this.length;
  for (var index = 0; index < total; index++) {
    clause(this[index], index, {
      prev: this[index - 1],
      next: this[index + 1],
      count: total,
      isLast: index === total - 1,
      isFirst: index === 0
    })
  }
  return this;
}
Array.prototype.ToString = function (str) {
  str = str || ',';
  var returnVal = "";
  for (var index = 0; index < this.length; index++) {
    var val = this[index];
    if (val && ("" + val).length > 0)
      returnVal += str + val;
  }
  return returnVal.length ? returnVal.substring(str.length) : "";
};
Array.prototype.remove = function (item) {
  //if (!item) return false;
  var i = this.indexOf(item);
  if (i < 0) { return false; }
  return this.splice(i, 1);
};
Array.prototype.removeAt = function (index, count) {
  if (index < 0) return false;
  return this.splice(index, count || 1);
};
Array.prototype.removeAll = function (clause) {
  var arr = this;
  if (typeof clause === "function") { this.removeAll(this.where(clause)); }
  else if (Array.isArray(clause)) { clause.forEach(function (o) { arr.remove(o); }); }
  return arr;
};
Array.prototype.add = function (item) {
  this.push(item);
  return item;
};
Array.prototype.insertAt = function (index, item) {
  this.splice(index, 0, item);
  return item;
};
Array.prototype.insertRangeAt = function (index, items) {
  this.splice(index, 0, ...items);
  return this;
};
Array.prototype.addDistinct = function (item) {
  if (!this.any(item)) {
    this[this.length] = item;
    return true;
  }
  return false;
};
Array.prototype.addRange = function (items) {
  if (items) {
    for (var i = 0; i < items.length; i++) {
      this.push(items[i]);
    }
  }
  return this;
};
Array.prototype.addDistinctRange = function (items) {
  if (items) {
    for (var i = 0; i < items.length; i++) {
      this.addDistinct(items[i]);
    }
  }
  return this;
};
Array.prototype.groupBy = function (clause, filter) {
  var result = [];
  var valObj = {};
  var isClauseString = typeof clause === 'string';
  if (isClauseString) {
    var tmp = clause;
    clause = function (obj) { return obj[tmp]; }
  }

  for (var i = 0; i < this.length; i++) {
    var item = this[i];
    var key = clause(item);
    var keyStr = null;
    if (typeof key === "object") { keyStr = JSON.stringify(key); }
    var obj = valObj[keyStr || key];
    if (!obj) {
      obj = { key: key, values: [] };
      result.push(valObj[keyStr || key] = obj);
    }
    if (!filter || filter(item)) {
      obj.values.push(item);
    }
  }
  return result;
};
Array.prototype.replace = function (item, newItem) {
  var idx = this.indexOf(item);
  if (idx != -1) this[idx] = newItem;
  return this;
};
Array.prototype.clone = function (items) {
  var result = [];
  for (var i = 0; i < this.length; i++) {
    result[i] = this[i];
  }
  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      result[result.length] = items[i];
    }
  }
  return result;
};
Array.prototype.notIn = function (items, condition) {
  if (!items || (Array.isArray(items) && items.length === 0)) { return this; }
  var ignoreCase = condition === true;
  if (ignoreCase) { items = items.select(function (item) { return typeof item === "string" ? item.toLowerCase() : item; }); }
  if (condition && typeof condition !== "function") { condition = null; }

  if (Array.isArray(items)) {
    if (!condition) {
      return this.where(function (itm) {
        if (ignoreCase && typeof itm === 'string') { itm = itm.toLowerCase(); }

        return items.indexOf(itm) === -1
      });
    }
    else {
      return this.where(function (itm) { return !items.any(function (excl) { return condition(itm, excl); }); });
    }
  }
  else {

  }
}
Array.prototype.in = function (items, condition) {
  if (!items || (Array.isArray(items) && items.length === 0)) { return this; }
  var ignoreCase = condition === true;
  if (ignoreCase) { items = items.select(function (item) { return typeof item === "string" ? item.toLowerCase() : item; }); }
  if (condition && typeof condition !== "function") { condition = null; }

  if (Array.isArray(items)) {
    if (!condition) {
      return this.where(function (itm) {
        if (ignoreCase && typeof itm === 'string') { itm = itm.toLowerCase(); }

        return items.indexOf(itm) > -1
      });
    }
    else {
      return this.where(function (itm) { return items.any(function (excl) { return condition(itm, excl); }); });
    }
  }
  else {

  }
}
Array.prototype.skip = function (index) {
  if (index < 0) { index = 0; }
  var result = [];
  for (var i = index; i < this.length; i++) {
    result.push(this[i]);
  }
  return result;
}
Array.prototype.take = function (count) {
  var result = [];
  for (var i = 0; i < this.length && i < count; i++) {
    result.push(this[i]);
  }
  return result;
}
Array.prototype.union = function (clause) {
  var result = [];
  if (!clause) {
    clause = this;
  }
  else if (Array.isArray(clause)) { // This if condition should not be merged with below condition
    result = this;
  }

  if (Array.isArray(clause)) {
    for (var i = 0; i < clause.length; i++) {
      result.addRange(clause[i]);
    }
  }
  else {
    this.forEach(function (item, idx) {
      var newList = clause(item, idx);
      if (newList) {
        result.addRange(newList);
      }
    });
  }
  return result;
}
Array.prototype.remove = function (func) {
  if (typeof func === "function") {
    for (var i = 0; i < this.length; i++) {
      if (func(this[i])) {
        this.splice(i, 1);
        return true;
      }
    }
  }
  else {
    var index = this.indexOf(func);
    if (index > -1) {
      this.splice(index, 1);
      return true;
    }
  }
}
Array.prototype.contains = function (val) {
  return this.indexOf(val) > -1;
}
Array.prototype.containsAny = function (arr) {
  var $this = this;
  if (arr && Array.isArray(arr)) {
    return arr.any(function (obj) { return $this.indexOf(obj) >= 0; });
  }
  else { return false; }
}
Array.prototype.innerJoin = function (rightArray, onClause) {
  var result = [];

  for (var i = 0; i < this.length; i++) {
    var left = this[i];
    var matches = rightArray.where(function (right) { return onClause(left, right); });
    if (matches.length > 0) {
      matches.forEach(function (right) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
}

Array.prototype.leftJoin = function (rightArray, onClause) {
  var result = [];

  for (var i = 0; i < this.length; i++) {
    var left = this[i];
    var matches = rightArray.where(function (right) { return onClause(left, right); });
    if (matches.length === 0) { result.push({ left: left, right: null }); }
    else {
      matches.forEach(function (right) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
}

Array.prototype.rightJoin = function (rightArray, onClause) {
  var result = [];

  for (var i = 0; i < rightArray.length; i++) {
    var right = rightArray[i];
    var leftMatches = this.where(function (left) { return onClause(left, right); });
    if (leftMatches.length === 0) { result.push({ left: null, right: right }); }
    else {
      leftMatches.forEach(function (left) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
}

Array.prototype.toKeyValuePair = function (clause, filter) {
  var $this = this.groupBy(clause, filter);
  var result = {};
  for (var i = 0; i < $this.length; i++) {
    var item = $this[i];
    result["" + item.key] = item.values;
  }
  return result;
}

// Array flattening related methods
Array.prototype.flattern = function (clause, filter, templ, propPrefix) {
  var $this = this;
  var thisLen = $this.length;
  var resultArray = [];
  for (var i = 0; i < thisLen; i++) {
    var row = $this[i];
    var result = getObject(row, clause, templ ? { ...templ } : {}, propPrefix);
    result.forEach(r => { if (!filter || filter(r)) { resultArray.push(r); } });
  }
  return resultArray;
}

function getObject(row, clause, curItem, propPrefix) {
  propPrefix = propPrefix || '';
  var cols = getColsArr(clause);
  var colsLen = cols.length;
  var returnRaw = false;

  for (var i = 0; i < colsLen; i++) {
    var propName = cols[i];
    var field = clause[propName];
    var repeatOnVal = propName.startsWith('~~');
    if (repeatOnVal) { propName = propName.substring(2); }

    if (field === true) {
      field = propName;
    }

    if (typeof field === 'object' && !Array.isArray(field)) {
      var obj = field;
      var field = field.field;
      if (!field || field === true) { field = propName; }
      var spread = obj.spread === true || !propName;
      var value = getObjVal(row, field);
      var props = obj.props;
      var newVal = null;

      if (value) {
        if (!repeatOnVal) {
          newVal = props ? getObject(value, props, spread ? curItem : {}, spread ? propName : '') : value; // ToDo: Need to check
          if (!spread) {
            curItem[propPrefix + propName] = newVal;
          }
        }
        else if (Array.isArray(value)) {
          var newVal = props ? value.flattern(props, null, spread ? curItem : null, spread ? propName : '') : value;
          if (!spread) {
            curItem = newVal.map(nv => {
              var ret = { ...curItem, [propPrefix + propName]: nv };
              var newValProps = Object.keys(nv).forEach(nvp => {
                if (nvp.startsWith('...')) {
                  ret[nvp.substring(3)] = nv[nvp];
                  delete nv[nvp];
                }
              });

              return ret;
            });
            returnRaw = true;
          }
        }

      }
    }
    else {
      var value = getObjVal(row, field);
      curItem[propPrefix + propName] = value;
    }
  }
  return returnRaw ? curItem : [curItem];
}

function getObjVal(row, prop) {
  if (typeof prop === 'string') {
    var split = prop.split('.');
    var value = row[split[0]];
    for (var j = 1; value && j < split.length; j++) {
      value = value[split[j]];
    }
    return value;
  }
  else if (typeof prop === 'function') {
    return prop(row);
  }
}

function getColsArr(obj) {
  var cols = Object.keys(obj);
  if (cols.filter(c => c.startsWith('~~')).length > 1) { throw Error('#Error: Multiple array recurssion not allowed'); }// check to see if their are more than one ~~ item
  cols = cols.orderBy(c => c.startsWith('~~') ? 2 : 1); //sort ~~ at end
  return cols;
}
