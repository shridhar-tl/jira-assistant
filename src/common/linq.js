/*eslint-disable no-extend-native, no-loop-func*/

//Array.prototype.ToArray= function() { return this; };
Array.prototype.where = function (clause, maxItems) {
  const newArray = [];

  // The clause was passed in as a Method that return a Boolean
  // eslint-disable-next-line no-unmodified-loop-condition
  for (let index = 0; index < this.length && (!maxItems || maxItems > newArray.length); index++) {
    if (clause(this[index], index)) {
      newArray[newArray.length] = this[index];
    }
  }
  return newArray;
};
Array.prototype.select = function (clause, incNull) {
  const newArray = [];

  // The clause was passed in as a Method that returns a Value
  for (let i = 0; i < this.length; i++) {
    const data = clause ? clause(this[i], i) : this[i];
    if (data !== null || incNull) {
      newArray[newArray.length] = data;
    }
  }
  return newArray;
};
Array.prototype.orderBy = function (clause) {
  const tempArray = [];
  for (let i = 0; i < this.length; i++) {
    tempArray[tempArray.length] = this[i];
  }
  return tempArray.sort(function (a, b) {
    const x = clause ? clause(a) : a;
    const y = clause ? clause(b) : b;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
};
Array.prototype.orderByDescending = function (clause) {
  const tempArray = [];
  for (let i = 0; i < this.length; i++) {
    tempArray[tempArray.length] = this[i];
  }
  return tempArray.sort(function (a, b) {
    const x = clause ? clause(b) : b;
    const y = clause ? clause(a) : a;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
};

Array.prototype.sortBy = function (clause, desc) {
  if (clause && typeof clause === "string") {
    const tmpSort = clause;
    clause = (b) => b[tmpSort];
  }
  return desc ? this.orderByDescending(clause) : this.orderBy(clause);
};

Array.prototype.selectMany = function (clause) {
  let r = [];
  for (let i = 0; i < this.length; i++) {
    r = r.concat(clause(this[i]));
  }
  return r;
};
Array.prototype.count = function (clause) {
  if (!clause) {
    return this.length;
  }
  else {
    return this.where(clause).length;
  }
};
Array.prototype.distinct = function (clause, excludeNulls) {
  let item;
  const dict = {};
  const retVal = [];
  for (let i = 0; i < this.length; i++) {
    item = clause ? clause(this[i]) : this[i];
    if (excludeNulls && item === null) { continue; }
    if (!dict[item]) {
      dict[item] = true;
      retVal.push(item);
    }
  }
  return retVal;
};
Array.prototype.distinctObj = function (clause) {
  let item;
  const retVal = [];
  //var linq = retVal;
  for (let i = 0; i < this.length; i++) {
    item = clause ? clause(this[i]) : this[i];

    const keys = Object.keys(item);
    if (!retVal.any(function (d) {
      let match = true;
      for (let i = 0; i < keys.length; i++) {
        match = match && d[keys[i]] === item[keys[i]];
      }
      return match;
    })) {
      retVal[retVal.length] = item;
    }
  }
  return retVal;
};
Array.prototype.sum = function (clause) {
  let value = 0, index;
  if (clause) {
    for (index = 0; index < this.length; index++) {
      value += clause(this[index]) || 0;
    }
  } else {
    for (index = 0; index < this.length; index++) {
      value += parseFloat(this[index]) || 0;
    }
  }
  return value;
};
Array.prototype.avg = function (clause) {
  let value = 0;
  let count = 0, val, index;
  if (clause) {
    for (index = 0; index < this.length; index++) {
      val = parseFloat(clause(this[index]));
      if (val || val === 0) { value = value + val; count++; }
    }
  } else {
    for (index = 0; index < this.length; index++) {
      val = parseFloat(this[index]);
      if (val || val === 0) { value = value + val; count++; }
    }
  }
  return count ? value / count : 0;
};
function prepareAgreData(data) {
  if (data && data instanceof Date) {
    return data.getTime();
  } else { return data; }
}
Array.prototype.max = function (clause) {
  let value = 0, index, newVal;
  if (clause) {
    for (index = 0; index < this.length; index++) {
      newVal = clause(this[index]) || 0;
      if (prepareAgreData(newVal) > prepareAgreData(value)) { value = newVal; }
    }
  } else {
    for (index = 0; index < this.length; index++) {
      newVal = this[index] || 0;
      if (prepareAgreData(newVal) > prepareAgreData(value)) { value = newVal; }
    }
  }
  return value;
};
Array.prototype.min = function (clause) {
  let value = 0, index, newVal;
  if (clause) {
    for (index = 0; index < this.length; index++) {
      newVal = clause(this[index]) || 0;
      if (prepareAgreData(newVal) < prepareAgreData(value)) { value = newVal; }
    }
  } else {
    for (index = 0; index < this.length; index++) {
      newVal = this[index] || 0;
      if (prepareAgreData(newVal) < prepareAgreData(value)) { value = newVal; }
    }
  }
  return value;
};
Array.prototype.any = function (clause) {
  if (typeof clause === "function") {
    for (let index = 0; index < this.length; index++) {
      if (clause(this[index], index)) { return true; }
    }
    return false;
  }
  else if (clause) {
    return this.indexOf(clause) >= 0;
  }
  else { return this.length > 0; }
};
Array.prototype.all = function (clause) {
  for (let index = 0; index < this.length; index++) {
    if (!clause(this[index], index)) { return false; }
  }
  return true;
};
Array.prototype.reverse = function () {
  const retVal = [];
  for (let index = this.length - 1; index > -1; index--) { retVal[retVal.length] = this[index]; }
  return retVal;
};
Array.prototype.first = function (clause) {
  if (clause) {
    return this.where(clause, 1).first();
  }
  else {
    // If no clause was specified, then return the First element in the Array
    if (this.length > 0) { return this[0]; }
    else { return null; }
  }
};
Array.prototype.last = function (clause) {
  if (clause) {
    return this.where(clause).last();
  }
  else {
    // If no clause was specified, then return the First element in the Array
    if (this.length > 0) { return this[this.length - 1]; }
    else { return null; }
  }
};
Array.prototype.elementAt = function (index) {
  return this[index];
};
Array.prototype.firstIndexOf = function (predicate) {
  for (let index = 0; index < this.length; index++) {
    if (predicate(this[index], index)) {
      return index;
    }
  }
  return -1;
};
Array.prototype.intersect = function (secondArray, clause) {
  const clauseMethod = clause || function (item, index, item2, index2) { return item === item2; };

  const sa = secondArray.items || secondArray;

  const result = [];
  for (let a = 0; a < this.length; a++) {
    for (let b = 0; b < sa.length; b++) {
      if (clauseMethod(this[a], a, sa[b], b)) {
        result[result.length] = this[a];
      }
    }
  }
  return result;
};
Array.prototype.defaultIfEmpty = function (defaultValue) {
  if (this.length === 0) {
    return defaultValue;
  }
  return this;
};
Array.prototype.elementAtOrDefault = function (index, defaultValue) {
  if (index >= 0 && index < this.length) {
    return this[index];
  }
  return defaultValue;
};
Array.prototype.firstOrDefault = function (defaultValue, clause) {
  return this.first(clause) || defaultValue;
};
Array.prototype.lastOrDefault = function (defaultValue, clause) {
  return this.last(clause) || defaultValue;
};
Array.prototype.ToString = function (str) {
  str = str || ',';
  let returnVal = "";
  for (let index = 0; index < this.length; index++) {
    const val = this[index];
    if (val && (`${val}`).length > 0) { returnVal += str + val; }
  }
  return returnVal.length ? returnVal.substring(str.length) : "";
};
Array.prototype.remove = function (item) {
  //if (!item) return false;
  const i = this.indexOf(item);
  if (i < 0) { return false; }
  return this.splice(i, 1);
};
Array.prototype.removeAt = function (index, count) {
  if (index < 0) { return false; }
  return this.splice(index, count || 1);
};
Array.prototype.removeAll = function (clause) {
  const arr = this;
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
    for (let i = 0; i < items.length; i++) {
      this.push(items[i]);
    }
  }
  return this;
};
Array.prototype.addDistinctRange = function (items) {
  if (items) {
    for (let i = 0; i < items.length; i++) {
      this.addDistinct(items[i]);
    }
  }
  return this;
};
Array.prototype.groupBy = function (clause, filter) {
  const result = [];
  const valObj = {};
  const isClauseString = typeof clause === 'string';
  if (isClauseString) {
    const tmp = clause;
    clause = function (obj) { return obj[tmp]; };
  }

  for (let i = 0; i < this.length; i++) {
    const item = this[i];
    const key = clause(item);
    let keyStr = null;
    if (typeof key === "object") { keyStr = JSON.stringify(key); }
    let obj = valObj[keyStr || key];
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
  const idx = this.indexOf(item);
  if (idx !== -1) { this[idx] = newItem; }
  return this;
};
Array.prototype.clone = function (items) {
  const result = [];

  for (let i = 0; i < this.length; i++) {
    result[i] = this[i];
  }
  if (items && items.length > 0) {
    for (let x = 0; x < items.length; x++) {
      result[result.length] = items[x];
    }
  }
  return result;
};
Array.prototype.notIn = function (items, condition) {
  if (!items || (Array.isArray(items) && items.length === 0)) { return this; }
  const ignoreCase = condition === true;
  if (ignoreCase) { items = items.select(function (item) { return typeof item === "string" ? item.toLowerCase() : item; }); }
  if (condition && typeof condition !== "function") { condition = null; }

  if (Array.isArray(items)) {
    if (!condition) {
      return this.where(function (itm) {
        if (ignoreCase && typeof itm === 'string') { itm = itm.toLowerCase(); }

        return items.indexOf(itm) === -1;
      });
    }
    else {
      return this.where(function (itm) { return !items.any(function (excl) { return condition(itm, excl); }); });
    }
  }
  else {
    // ToDo: yet to implement
  }
};
Array.prototype.in = function (items, condition) {
  if (!items || (Array.isArray(items) && items.length === 0)) { return this; }
  const ignoreCase = condition === true;
  if (ignoreCase) { items = items.select(function (item) { return typeof item === "string" ? item.toLowerCase() : item; }); }
  if (condition && typeof condition !== "function") { condition = null; }

  if (Array.isArray(items)) {
    if (!condition) {
      return this.where(function (itm) {
        if (ignoreCase && typeof itm === 'string') { itm = itm.toLowerCase(); }

        return items.indexOf(itm) > -1;
      });
    }
    else {
      return this.where(function (itm) { return items.any(function (excl) { return condition(itm, excl); }); });
    }
  }
  else {
    // ToDo: Yet to implement
  }
};
Array.prototype.skip = function (index) {
  if (index < 0) { index = 0; }
  const result = [];
  for (let i = index; i < this.length; i++) {
    result.push(this[i]);
  }
  return result;
};
Array.prototype.take = function (count) {
  const result = [];
  for (let i = 0; i < this.length && i < count; i++) {
    result.push(this[i]);
  }
  return result;
};
Array.prototype.union = function (clause) {
  let result = [];
  if (!clause) {
    clause = this;
  }
  else if (Array.isArray(clause)) { // This if condition should not be merged with below condition
    result = this;
  }

  if (Array.isArray(clause)) {
    for (let i = 0; i < clause.length; i++) {
      result.addRange(clause[i]);
    }
  }
  else {
    this.forEach(function (item, idx) {
      const newList = clause(item, idx);
      if (newList) {
        result.addRange(newList);
      }
    });
  }
  return result;
};
Array.prototype.remove = function (func) {
  if (typeof func === "function") {
    for (let i = 0; i < this.length; i++) {
      if (func(this[i])) {
        this.splice(i, 1);
        return true;
      }
    }
  }
  else {
    const index = this.indexOf(func);
    if (index > -1) {
      this.splice(index, 1);
      return true;
    }
  }
};
Array.prototype.contains = function (val) {
  return this.indexOf(val) > -1;
};

Array.prototype.asyncForEach = async function (callback) {
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index);
  }
};

Array.prototype.containsAny = function (arr) {
  const $this = this;
  if (arr && Array.isArray(arr)) {
    return arr.any(function (obj) { return $this.indexOf(obj) >= 0; });
  }
  else { return false; }
};
Array.prototype.innerJoin = function (rightArray, onClause) {
  const result = [];

  for (let i = 0; i < this.length; i++) {
    const left = this[i];
    const matches = rightArray.where(function (right) { return onClause(left, right); });
    if (matches.length > 0) {
      matches.forEach(function (right) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
};

Array.prototype.leftJoin = function (rightArray, onClause) {
  const result = [];

  for (let i = 0; i < this.length; i++) {
    const left = this[i];
    const matches = rightArray.where(function (right) { return onClause(left, right); });
    if (matches.length === 0) { result.push({ left: left, right: null }); }
    else {
      matches.forEach(function (right) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
};

Array.prototype.rightJoin = function (rightArray, onClause) {
  const result = [];

  for (let i = 0; i < rightArray.length; i++) {
    const right = rightArray[i];
    const leftMatches = this.where(function (left) { return onClause(left, right); });
    if (leftMatches.length === 0) { result.push({ left: null, right: right }); }
    else {
      leftMatches.forEach(function (left) {
        result.push({ left: left, right: right });
      });
    }
  }

  return result;
};

Array.prototype.toKeyValuePair = function (clause, filter) {
  const $this = this.groupBy(clause, filter);
  const result = {};
  for (let i = 0; i < $this.length; i++) {
    const item = $this[i];
    result[`${item.key}`] = item.values;
  }
  return result;
};


Array.prototype.findIndex = function (clause, maxItems) {
  const source = this;
  const newArray = [];

  // The clause was passed in as a Method that return a Boolean
  // eslint-disable-next-line no-unmodified-loop-condition
  for (let index = 0; index < source.length && (!maxItems || maxItems > newArray.length); index++) {
    if (clause(source[index], index)) {
      newArray[newArray.length] = index;
    }
  }
  return newArray;
};

// Array flattening related methods
Array.prototype.flattern = function (clause, filter, templ, propPrefix) {
  const $this = this;
  const thisLen = $this.length;
  const resultArray = [];
  for (let i = 0; i < thisLen; i++) {
    const row = $this[i];
    const result = getObject(row, clause, templ ? { ...templ } : {}, propPrefix);
    result.forEach(r => { if (!filter || filter(r)) { resultArray.push(r); } });
  }
  return resultArray;
};

// eslint-disable-next-line complexity
function getObject(row, clause, curItem, propPrefix) {
  propPrefix = propPrefix || '';
  const cols = getColsArr(clause);
  const colsLen = cols.length;
  let returnRaw = false;

  for (let i = 0; i < colsLen; i++) {
    let propName = cols[i];
    let field = clause[propName];
    const repeatOnVal = propName.startsWith('~~');
    if (repeatOnVal) { propName = propName.substring(2); }

    if (field === true) {
      field = propName;
    }

    if (typeof field === 'object' && !Array.isArray(field)) {
      const obj = field;
      field = field.field;
      if (!field || field === true) { field = propName; }
      const spread = obj.spread === true || !propName;
      const value = getObjVal(row, field);
      const props = obj.props;
      let newVal = null;

      if (value) {
        if (!repeatOnVal) {
          newVal = props ? getObject(value, props, spread ? curItem : {}, spread ? propName : '') : value; // ToDo: Need to check
          if (!spread) {
            curItem[propPrefix + propName] = newVal;
          }
        }
        else if (Array.isArray(value)) {
          newVal = props ? value.flattern(props, null, spread ? curItem : null, spread ? propName : '') : value;
          if (!spread) {
            curItem = newVal.map(nv => {
              const ret = { ...curItem, [propPrefix + propName]: nv };
              Object.keys(nv).forEach(nvp => {
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
      const value = getObjVal(row, field);
      curItem[propPrefix + propName] = value;
    }
  }
  return returnRaw ? curItem : [curItem];
}

function getObjVal(row, prop) {
  if (typeof prop === 'string') {
    const split = prop.split('.');
    let value = row[split[0]];
    for (let j = 1; value && j < split.length; j++) {
      value = value[split[j]];
    }
    return value;
  }
  else if (typeof prop === 'function') {
    return prop(row);
  }
}

function getColsArr(obj) {
  let cols = Object.keys(obj);
  if (cols.filter(c => c.startsWith('~~')).length > 1) { throw Error('#Error: Multiple array recurssion not allowed'); }// check to see if their are more than one ~~ item
  cols = cols.orderBy(c => (c.startsWith('~~') ? 2 : 1)); //sort ~~ at end
  return cols;
}
