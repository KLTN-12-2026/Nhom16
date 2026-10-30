import { all, fork } from 'redux-saga/effects'

import { authSaga } from '../modules/auth/redux'
import { jobsSaga } from '../modules/jobs/redux'

export function* rootSaga() { yield all([fork(authSaga), fork(jobsSaga)]) }
