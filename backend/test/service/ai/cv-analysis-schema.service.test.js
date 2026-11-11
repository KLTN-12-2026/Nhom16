const assert = require('node:assert/strict')

const { validateCvAnalysis } = require('../../../app/service/ai/cv-analysis-schema.service')

describe('CV analysis schema service', () => {
  it('keeps only the structured internal CV analysis fields', () => {
    const result = validateCvAnalysis({
      candidateName: '  Nguyễn Văn A  ',
      candidateEmail: null,
      candidatePhone: null,
      headline: 'Backend Developer',
      education: ['Đại học Duy Tân'],
      experience: ['Peacom', 'Peacom'],
      skills: ['NodeJS'],
      certificates: [],
      projects: [],
      avatarAbsolutePath: null,
      extractionStatus: 'completed',
      externalData: 'must not be persisted',
    })

    assert.equal(result.candidateName, 'Nguyễn Văn A')
    assert.deepEqual(result.experience, ['Peacom'])
    assert.equal(Object.hasOwn(result, 'externalData'), false)
  })

  it('rejects an invalid analysis JSON structure before database persistence', () => {
    assert.throws(() => validateCvAnalysis({ extractionStatus: 'completed', skills: 'NodeJS' }), /Invalid CV analysis field/)
  })

  it('moves project and GitHub items out of certificates', () => {
    const result = validateCvAnalysis({
      candidateName: 'Lê Văn Mỹ',
      candidateEmail: 'my@example.com',
      candidatePhone: null,
      headline: 'Full-stack Developer Intern',
      education: [],
      experience: [],
      skills: ['React'],
      certificates: [
        'Full-stack Developer – Team Project',
        'Fashion website with an integrated chatbot',
        'GitHub: https://github.com/my1410/example',
        'TOEIC 750',
      ],
      projects: ['Full-stack Developer – Team Project'],
    })

    assert.deepEqual(result.certificates, ['TOEIC 750'])
    assert.deepEqual(result.projects, [
      'Full-stack Developer – Team Project',
      'Fashion website with an integrated chatbot',
      'GitHub: https://github.com/my1410/example',
    ])
  })
})
