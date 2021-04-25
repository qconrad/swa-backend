class NestedCancellationRemover {
  constructor(alert_user_map) {
    this.alert_user_map = alert_user_map
  }

  get() {
    let alertUserMap = this.alert_user_map
    for (const curMap of alertUserMap) {
      if (curMap.alert.properties.messageType === "Cancel")
        this._checkForContinuations(alertUserMap, curMap);
    }
    return alertUserMap
  }

  _checkForContinuations(alertUserMap, cancel) {
    for (const curMap of alertUserMap) {
      if (curMap.alert.properties.messageType === "Update" && this._isSameEvent(curMap, cancel))
        this._removeCommonUsersFromCancel(cancel, curMap);
    }
    this.deleteIfNoUsers(cancel, alertUserMap);
  }

  _isSameEvent(curMap, cancel) {
    return curMap.alert.properties.event === cancel.alert.properties.event;
  }

  deleteIfNoUsers(cancel, alertUserMap) {
    if (cancel.users.length === 0) alertUserMap.splice(alertUserMap.indexOf(cancel), 1)
  }

  _removeCommonUsersFromCancel(cancel, update) {
    for (const user of update.users) this._removeUserFromCancel(user, cancel);
  }

  _removeUserFromCancel(user, cancel) {
    let j = cancel.users.length;
    while (j--) if (cancel.users[j].token === user.token) cancel.users.splice(j, 1);
  }
}

module.exports = NestedCancellationRemover