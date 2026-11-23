const { expect } = require('chai')

const {
  validateJob,
  validateJobUpdate,
} = require('../../app/validator/employer/employer-job.validator')

const localToday = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const validPayload = () => ({
  categoryId: 1,
  title: 'Backend Developer Node.js',
  salaryMin: 0,
  salaryMax: 0,
  location: 'Đà Nẵng',
  workMode: 'OFFICE',
  experienceLevel: '1_2',
  employmentType: 'FULL_TIME',
  positionLevel: 'STAFF',
  description: 'Phát triển và duy trì REST API cho nền tảng tuyển dụng bằng Node.js và MySQL.',
  requirements: ['Có kinh nghiệm phát triển Node.js trong dự án thực tế'],
  benefits: ['Được hưởng đầy đủ bảo hiểm theo quy định pháp luật'],
  skills: ['Node.js'],
  deadline: localToday(),
  publish: true,
})

describe('Employer job validator', () => {
  it('accepts a complete job with a deadline of today and zero salary', async () => {
    const result = await validateJob(validPayload())

    expect(result.salaryMin).to.equal(0)
    expect(result.salaryMax).to.equal(0)
    expect(result.publish).to.equal(true)
  })

  it('strips frontend-only form fields instead of leaking them into the service', async () => {
    const result = await validateJob({
      ...validPayload(),
      requirementsText: 'Dữ liệu chỉ dùng trên giao diện',
      benefitsText: 'Dữ liệu chỉ dùng trên giao diện',
      skillsText: 'Node.js',
      jdFile: { name: 'jd.pdf' },
    })

    expect(result).not.to.have.property('requirementsText')
    expect(result).not.to.have.property('benefitsText')
    expect(result).not.to.have.property('skillsText')
    expect(result).not.to.have.property('jdFile')
  })

  it('rejects a description that makes the UI look complete but has too little meaning', async () => {
    let error
    try {
      await validateJob({ ...validPayload(), description: 'Mô tả công việc còn quá ngắn.' })
    } catch (caught) {
      error = caught
    }

    expect(error).to.have.property('statusCode', 422)
    expect(error.details).to.have.property('description')
  })

  it('rejects vague requirement items', async () => {
    let error
    try {
      await validateJob({ ...validPayload(), requirements: ['Biết'] })
    } catch (caught) {
      error = caught
    }

    expect(error).to.have.property('statusCode', 422)
    expect(Object.values(error.details).join(' ')).to.include('Mỗi yêu cầu cần mô tả rõ ít nhất 2 từ.')
  })

  it('rejects an inverted salary range, including when the minimum is zero', async () => {
    let error
    try {
      await validateJob({ ...validPayload(), salaryMin: 10, salaryMax: 0 })
    } catch (caught) {
      error = caught
    }

    expect(error).to.have.property('statusCode', 422)
    expect(Object.values(error.details).join(' ')).to.include('Mức lương tối đa phải lớn hơn hoặc bằng mức tối thiểu.')
  })

  it('allows updates without the publish-only field', async () => {
    const { publish, ...payload } = validPayload()
    const result = await validateJobUpdate(payload)

    expect(result).not.to.have.property('publish')
  })
})
