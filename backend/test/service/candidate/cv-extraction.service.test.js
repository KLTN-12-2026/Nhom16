const assert = require('node:assert/strict')

const { extractBasicInformation, extractCareerSections } = require('../../../app/service/candidate/cv-extraction.service')

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

  it('extracts skills, certificates and projects from Vietnamese and English CV sections', () => {
    const result = extractCareerSections(`
      KỸ NĂNG
      ReactJS, TypeScript | Node.js
      Git; MySQL
      CHỨNG CHỈ
      TOEIC 850 - IIG Vietnam
      AWS Certified Cloud Practitioner
      DỰ ÁN
      TopCV - Nền tảng tuyển dụng sử dụng React và Node.js
      E-commerce API - REST API quản lý đơn hàng
      HỌC VẤN
      Đại học Công nghệ
    `)

    assert.deepEqual(result.skills, ['ReactJS', 'TypeScript', 'Node.js', 'Git', 'MySQL'])
    assert.deepEqual(result.certificates, ['TOEIC 850 - IIG Vietnam', 'AWS Certified Cloud Practitioner'])
    assert.deepEqual(result.projects, [
      'TopCV - Nền tảng tuyển dụng sử dụng React và Node.js',
      'E-commerce API - REST API quản lý đơn hàng',
    ])
  })

  it('extracts education and experience only from the supplied CV content', () => {
    const result = extractCareerSections(`
      HỌC VẤN
      Đại học Duy Tân - Công nghệ phần mềm - 2022 đến 2026
      KINH NGHIỆM
      Thực tập sinh Backend tại Peacom - 06/2026 đến 09/2026
      KỸ NĂNG
      NodeJS, MySQL
    `)

    assert.deepEqual(result.education, ['Đại học Duy Tân - Công nghệ phần mềm - 2022 đến 2026'])
    assert.deepEqual(result.experience, ['Thực tập sinh Backend tại Peacom - 06/2026 đến 09/2026'])
    assert.deepEqual(result.skills, ['NodeJS', 'MySQL'])
  })

  it('supports section content written on the same line as its heading', () => {
    const result = extractCareerSections('Skills: JavaScript, React, Docker\nCertifications: IELTS 7.0\nProjects: Candidate matching system')

    assert.deepEqual(result.skills, ['JavaScript', 'React', 'Docker'])
    assert.deepEqual(result.certificates, ['IELTS 7.0'])
    assert.deepEqual(result.projects, ['Candidate matching system'])
  })
})
