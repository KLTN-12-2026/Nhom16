const { expect } = require('chai')

const {
  assertMeaningfulJobSource,
  buildJdCriteria,
  calculateMatchScore,
  compactCvForComparison,
  compareCvWithJob,
  normalizeComparisonResult,
  parseModelJson,
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

  it('resolves criteria with direct technical evidence locally without calling the AI', async () => {
    const result = await compareCvWithJob({
      jd: { requiredSkills: ['Node.js', 'MySQL', 'Redis'] },
      cv: { skills: ['NodeJS', 'JavaScript', 'MySQL', 'Redis'] },
    })
    expect(result.metCriteria.map(item => item.criterion)).to.have.members(['Redis', 'Node.js', 'MySQL'])
    expect(result.partialCriteria).to.have.length(0)
    expect(result.missingCriteria).to.have.length(0)
    expect(result.explanation).to.be.a('string').and.not.empty
  })

  it('understands a generic requirement ("hệ quản trị CSDL") from a specific technology ("MySQL") without the AI', async () => {
    const result = await compareCvWithJob({
      jd: { requiredSkills: ['Thành thạo hệ quản trị CSDL', 'Framework frontend', 'Dịch vụ cloud'] },
      cv: { skills: ['Thành thạo MySQL', 'ReactJS', 'AWS'] },
    })
    expect(result.metCriteria).to.have.length(3)
    expect(result.missingCriteria).to.have.length(0)
  })

  it('treats "A hoặc B" as met when the CV has either one', async () => {
    const result = await compareCvWithJob({
      jd: { requiredSkills: ['MySQL hoặc PostgreSQL', 'Docker'] },
      cv: { skills: ['PostgreSQL', 'Docker'] },
    })
    expect(result.metCriteria).to.have.length(2)
  })

  it('does not accept a different specific technology as a full match', async () => {
    const originalUrl = process.env.OLLAMA_BASE_URL
    process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:9'
    try {
      const result = await compareCvWithJob({
        jd: { requiredSkills: ['PostgreSQL', 'Docker'] },
        cv: { skills: ['MySQL', 'Docker'] },
      }).catch(() => null)
      if (result) expect(result.metCriteria.map(item => item.criterion)).to.not.include('PostgreSQL')
    } finally {
      if (originalUrl === undefined) delete process.env.OLLAMA_BASE_URL
      else process.env.OLLAMA_BASE_URL = originalUrl
    }
  })

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

  it('understands common technical abbreviations instead of comparing words literally', () => {
    const criteria = buildJdCriteria({ mandatoryRequirements: ['Có kinh nghiệm JavaScript, TypeScript và Node.js', 'Có kinh nghiệm triển khai sản phẩm thực tế'] })
    const result = normalizeComparisonResult(
      { criteria: [{ id: criteria[0].id, status: 'missing', message: 'Không có.' }] },
      criteria,
      { skills: ['JS', 'TS', 'NodeJS'] },
    )
    expect(result.missingCriteria.map(item => item.criterion)).to.not.include(criteria[0].text)
    expect(result.metCriteria).to.have.length(1)
  })

  it('recognizes semantically equivalent REST API wording', () => {
    const criteria = buildJdCriteria({ mandatoryRequirements: ['Có kinh nghiệm xây dựng REST API', 'Có kinh nghiệm triển khai sản phẩm thực tế'] })
    const result = normalizeComparisonResult(
      { criteria: [{ id: criteria[0].id, status: 'missing', message: 'Không có.' }] },
      criteria,
      { experience: ['Developed RESTful web services for a recruitment platform'] },
    )
    expect(result.missingCriteria.map(item => item.criterion)).to.not.include(criteria[0].text)
  })

  it('keeps relevant late CV evidence while removing unrelated content before AI inference', () => {
    const criteria = buildJdCriteria({ mandatoryRequirements: ['Có kinh nghiệm Node.js và Redis', 'Có kinh nghiệm triển khai sản phẩm thực tế'] })
    const compact = compactCvForComparison({
      experience: Array.from({ length: 20 }, (_, index) => `Nội dung không liên quan số ${index + 1}`).concat('Xây dựng NodeJS API và cache bằng Redis'),
      projects: Array.from({ length: 20 }, (_, index) => `Dự án thiết kế số ${index + 1}`),
      skills: ['HTML', 'CSS', 'NodeJS', 'Redis'],
    }, criteria)
    expect(compact.experience.join(' ')).to.include('NodeJS API')
    expect(compact.experience.length).to.be.at.most(4)
    expect(compact.projects.length).to.be.at.most(4)
  })

  it('calculates the match score deterministically from grounded groups', () => {
    expect(calculateMatchScore({ metCriteria: [{}, {}], partialCriteria: [{}, {}, {}, {}], missingCriteria: [{}, {}] })).to.equal(50)
    expect(calculateMatchScore()).to.equal(null)
  })

  it('parses structured JSON wrapped by a small local model with extra text', () => {
    expect(parseModelJson('Kết quả:\n```json\n{"title":"Backend Developer"}\n```')).to.deep.equal({ title: 'Backend Developer' })
  })

  it('rejects a truncated structured response with a stable error code', () => {
    expect(() => parseModelJson('{"title":"Backend Developer"')).to.throw().with.property('code', 'AI_RESULT_INVALID')
  })
})
