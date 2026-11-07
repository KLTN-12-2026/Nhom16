const { expect } = require('chai')
const { serializeJdFile } = require('../../../app/service/employer/job-jd.service')

describe('Sprint 2 PB14 - Job JD file handling', () => {
  it('serializes JD file metadata without internal storagePath or storedName', () => {
    const mockFile = {
      id: 42,
      jobId: 10,
      uploadedById: 5,
      originalName: 'Mo-ta-Frontend-React.pdf',
      storedName: 'f7d3a2b1-4c6e-49b8-9b8e-32d88f6a9c1e.pdf',
      storagePath: 'uploads/jd/f7d3a2b1-4c6e-49b8-9b8e-32d88f6a9c1e.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      createdAt: '2026-11-07T12:00:00.000Z',
    }

    const result = serializeJdFile(mockFile)
    expect(result).to.deep.equal({
      id: 42,
      jobId: 10,
      originalName: 'Mo-ta-Frontend-React.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      createdAt: '2026-11-07T12:00:00.000Z',
    })
    expect(result).not.to.have.property('storagePath')
    expect(result).not.to.have.property('storedName')
  })
})

