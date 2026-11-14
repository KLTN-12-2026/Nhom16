import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import { authReducer } from '../modules/auth/redux'
import { candidateCvReducer } from '../modules/candidate-cv/redux'
import { jobsReducer } from '../modules/jobs/redux'
import { recruitmentReducer } from '../modules/recruitment/redux'
import { recruitmentAiReducer } from '../modules/recruitment-ai/redux'
import { rootSaga } from './root.saga'

const sagaMiddleware = createSagaMiddleware()
export const store = configureStore({ reducer: { auth: authReducer, candidateCv: candidateCvReducer, jobs: jobsReducer, recruitment: recruitmentReducer, recruitmentAi: recruitmentAiReducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware) })
sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
