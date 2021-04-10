class ListTrim {
  constructor(list, maxSize, trimToSize) {
    this._list = list;
    this._maxSize = maxSize
    this._trimToSize = trimToSize
  }

  getTrimmed() {
    if (this._list.length > this._maxSize)
      while (this._list.length > this._trimToSize) this._list.shift()
    return this._list
  }
}

module.exports = ListTrim
