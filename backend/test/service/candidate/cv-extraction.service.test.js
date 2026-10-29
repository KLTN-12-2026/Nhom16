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
    const result = extractBasicInformation('CURRICULUM VITAE\nNguyễn Văn Bình\nBackend Developer\nKỹ năng\nNode.js\nKinh nghiệm\n3 năm')

    assert.equal(result.candidateName, 'Nguyễn Văn Bình')
    assert.equal(result.candidateEmail, null)
    assert.equal(result.candidatePhone, null)
  })

  it('does not treat an arbitrary technical document as a candidate profile', () => {
    const result = extractBasicInformation('Hệ thống: Peacom web\nNhánh: develop-v6.1.0-refactor\nDanh sách tính năng thay đổi')

    assert.equal(result.isLikelyCv, false)
    assert.equal(result.candidateName, null)
    assert.equal(result.headline, null)
  })
})
