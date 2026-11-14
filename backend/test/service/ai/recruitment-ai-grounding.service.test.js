const { expect } = require('chai')

const {
  assertMeaningfulJobSource,
  buildJdCriteria,
  calculateMatchScore,
  normalizeComparisonResult,
} = require('../../../app/service/ai/recruitment-ai.service')

describe('Recruitment AI grounding and JD quality gates', () => {
  const validJd = {
    responsibilities: ['Phát triển API REST bằng Node.js'],
    requiredSkills: ['Node.js', 'MySQL'],
    preferredSkills: ['Redis'],
    experienceRequirements: ['Tối thiểu 1 năm kinh nghiệm backend'],
    educationRequirements: ['Tốt nghiệp Công nghệ thông tin'],
    mandatoryRequirements: ['Có kinh nghiệm xây dựng REST API'],
  }

  it('rejects the garbage JD that previously produced a 77% match', () => {
    expect(() => assertMeaningfulJobSource({
      title: 'front end', description: 'adasdadadasdasdasdasdasdsadasd', requirements: ['ádsada'], benefits: ['ádasadsa'], skills: ['react'],
    })).to.throw().with.property('code', 'JD_SOURCE_INVALID')
  })

  it('builds one unique canonical criterion list from the JD', () => {
    const criteria = buildJdCriteria({ ...validJd, requiredSkills: ['Node.js', ' node.js ', 'MySQL'], mandatoryRequirements: ['Node.js'] })
    expect(criteria.map(item => item.text)).to.deep.equal(['Node.js', 'MySQL', 'Tối thiểu 1 năm kinh nghiệm backend', 'Tốt nghiệp Công nghệ thông tin', 'Phát triển API REST bằng Node.js', 'Redis'])
    expect(new Set(criteria.map(item => item.id)).size).to.equal(criteria.length)
  })

  it('limits comparison to the 8 most important unique JD criteria', () => {
    const criteria = buildJdCriteria({ mandatoryRequirements: Array.from({ length: 20 }, (_, index) => `Tiêu chí bắt buộc số ${index + 1}`) })
    expect(criteria).to.have.length(8)
    expect(criteria[7].text).to.equal('Tiêu chí bắt buộc số 8')
  })

  it('rejects invented criterion ids from the model', () => {
    const criteria = buildJdCriteria(validJd)
    expect(() => normalizeComparisonResult({ metCriteria: [{ criterionId: 'invented-criterion', evidence: 'Không có trong JD.' }], partialCriteria: [], missingCriteria: [], explanation: 'Kết quả đối chiếu.' }, criteria)).to.throw().with.property('code', 'CV_JOB_COMPARISON_UNGROUNDED')
  })

  it('rejects a criterion classified into more than one group', () => {
    const criteria = buildJdCriteria(validJd)
    const criterionId = criteria[0].id
    expect(() => normalizeComparisonResult({ metCriteria: [{ criterionId, evidence: 'Bằng chứng A.' }], partialCriteria: [{ criterionId, evidence: 'Bằng chứng B.' }], missingCriteria: [], explanation: 'Kết quả đối chiếu.' }, criteria)).to.throw().with.property('code', 'CV_JOB_COMPARISON_UNGROUNDED')
  })

  it('fills omitted criteria as missing and preserves canonical JD text', () => {
    const criteria = buildJdCriteria(validJd)
    const result = normalizeComparisonResult({ metCriteria: [{ criterionId: criteria[0].id, evidence: 'CV ghi rõ kinh nghiệm REST API.' }], partialCriteria: [], missingCriteria: [], explanation: 'Chỉ đối chiếu trên dữ liệu có trong CV.' }, criteria)
    expect(result.metCriteria[0].criterion).to.equal(criteria[0].text)
    expect(result.missingCriteria).to.have.length(criteria.length - 1)
    expect(result.metCriteria.length + result.partialCriteria.length + result.missingCriteria.length).to.equal(criteria.length)
  })

  it('adds a safe explanation when a small local model omits only that field', () => {
    const criteria = buildJdCriteria(validJd)
    const result = normalizeComparisonResult({ classifications: [{ criterionId: criteria[0].id, status: 'met', evidence: 'CV có kinh nghiệm REST API.' }] }, criteria)
    expect(result.explanation).to.include('tiêu chí JD')
    expect(result.metCriteria).to.have.length(1)
  })

  it('rejects unknown classification statuses from JSON mode', () => {
    const criteria = buildJdCriteria(validJd)
    expect(() => normalizeComparisonResult({ classifications: [{ criterionId: criteria[0].id, status: 'maybe', evidence: 'Không rõ.' }] }, criteria)).to.throw().with.property('code', 'CV_JOB_COMPARISON_UNGROUNDED')
  })

  it('normalizes compact aliases returned by a small local model', () => {
    const criteria = buildJdCriteria(validJd)
    const result = normalizeComparisonResult({ criteria: [{ id: criteria[0].id, status: 'met', message: 'CV có REST API.' }] }, criteria)
    expect(result.metCriteria[0].criterion).to.equal(criteria[0].text)
    expect(result.explanation).to.include('tiêu chí JD')
  })

  it('does not let the model mark an explicitly listed CV skill as missing', () => {
    const criteria = buildJdCriteria({ mandatoryRequirements: ['Có kinh nghiệm Node.js và TypeScript', 'Có kinh nghiệm triển khai hệ thống thực tế'] })
    const result = normalizeComparisonResult({ criteria: [{ id: criteria[0].id, status: 'missing', message: 'Không có.' }] }, criteria, { skills: ['Node.js', 'TypeScript'] })
    expect(result.missingCriteria.map(item => item.criterion)).to.not.include(criteria[0].text)
    expect(result.metCriteria).to.have.length(1)
    expect(result.metCriteria[0].evidence).to.include('node js')
  })

  it('calculates the match score deterministically from grounded groups', () => {
    expect(calculateMatchScore({ metCriteria: [{}, {}], partialCriteria: [{}, {}, {}, {}], missingCriteria: [{}, {}] })).to.equal(50)
    expect(calculateMatchScore()).to.equal(null)
  })
})
