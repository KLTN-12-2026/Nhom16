import { all, fork } from 'redux-saga/effects'

import { authSaga } from '../modules/auth/redux'

export function* rootSaga() { yield all([fork(authSaga)]) }
