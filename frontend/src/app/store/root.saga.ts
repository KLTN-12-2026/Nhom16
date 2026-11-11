import { all, fork } from 'redux-saga/effects'

import { authSaga } from '../modules/auth/redux'
import { candidateCvSaga } from '../modules/candidate-cv/redux'
import { jobsSaga } from '../modules/jobs/redux'
import { recruitmentSaga } from '../modules/recruitment/redux'

export function* rootSaga() { yield all([fork(authSaga), fork(candidateCvSaga), fork(jobsSaga), fork(recruitmentSaga)]) }
