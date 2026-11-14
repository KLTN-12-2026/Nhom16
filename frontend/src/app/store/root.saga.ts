import { all, fork } from 'redux-saga/effects'

import { authSaga } from '../modules/auth/redux'
import { candidateCvSaga } from '../modules/candidate-cv/redux'
import { jobsSaga } from '../modules/jobs/redux'
import { recruitmentSaga } from '../modules/recruitment/redux'
import { recruitmentAiSaga } from '../modules/recruitment-ai/redux'

export function* rootSaga() { yield all([fork(authSaga), fork(candidateCvSaga), fork(jobsSaga), fork(recruitmentSaga), fork(recruitmentAiSaga)]) }
