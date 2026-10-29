const assert = require('node:assert/strict')

const { extractBasicInformation } = require('../../../app/service/candidate/cv-extraction.service')

describe('CV extraction service', () => {
  it('extracts the candidate name, headline, email and Vietnamese phone number', () => {
    const result = extractBasicInformation(`
      NGUYỄN MINH ANH
      Frontend Developer
      minh.anh@example.com | 0912 345 678
      Kinh nghiệm làm việc
    `)

    assert.equal(result.candidateName, 'NGUYỄN MINH ANH')
    assert.equal(result.headline, 'Frontend Developer')
    assert.equal(result.candidateEmail, 'minh.anh@example.com')
    assert.equal(result.candidatePhone, '0912345678')
  })

  it('returns null for contact fields that do not exist', () => {
    const result = extractBasicInformation('CURRICULUM VITAE\nNguyễn Văn Bình\nBackend Developer')

    assert.equal(result.candidateName, 'Nguyễn Văn Bình')
    assert.equal(result.candidateEmail, null)
    assert.equal(result.candidatePhone, null)
  })
})
