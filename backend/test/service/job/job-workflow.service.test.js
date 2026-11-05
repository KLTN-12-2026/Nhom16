const { expect } = require('chai')

const {
  APPLICATION_STATUS,
  JOB_STATUS,
  assertApplicationTransition,
  assertJobTransition,
} = require('../../../app/service/job/job-workflow.service')

describe('Sprint 2 job workflow', () => {
  it('allows an employer to publish a draft job', () => {
    expect(() => assertJobTransition(JOB_STATUS.DRAFT, JOB_STATUS.ACTIVE)).not.to.throw()
  })

  it('does not allow a closed job to become active again', () => {
    expect(() => assertJobTransition(JOB_STATUS.CLOSED, JOB_STATUS.ACTIVE))
      .to.throw('Trạng thái tin tuyển dụng không hợp lệ.')
  })

  it('allows a received application to enter review', () => {
    expect(() => assertApplicationTransition(APPLICATION_STATUS.RECEIVED, APPLICATION_STATUS.REVIEWING)).not.to.throw()
  })

  it('allows rejection from an active recruitment stage', () => {
    expect(() => assertApplicationTransition(APPLICATION_STATUS.INTERVIEW, APPLICATION_STATUS.REJECTED)).not.to.throw()
  })

  it('does not allow changing a terminal application status', () => {
    expect(() => assertApplicationTransition(APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.REVIEWING))
      .to.throw('Trạng thái hồ sơ ứng tuyển không hợp lệ.')
  })
})
