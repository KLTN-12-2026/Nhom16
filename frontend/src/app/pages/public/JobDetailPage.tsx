import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ROUTE } from '../../constants/route.constant'
import { useAuth } from '../../provider/auth-provider'

interface JobData {
  id: number
  title: string
  company: string
  companyLogo?: string
  companyLogoClass?: string
  salary: string
  location: string
  workMode: string
  postedAt: string
  deadline: string
  status: string
  tags: string[]
  description: string
  requirements: string[]
  benefits: string[]
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy việc làm hoặc tin đã đóng.')
        return res.json()
      })
      .then((res) => {
        setJob(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Đang tải...</span></div>
        <p className="mt-3 text-muted">Đang tải thông tin việc làm...</p>
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block px-4 py-3">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {error || 'Tin tuyển dụng không tồn tại.'}
        </div>
        <div className="mt-4">
          <Link to={ROUTE.JOBS} className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-2" /> Quay lại danh sách việc làm
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="job-detail-page container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to={ROUTE.HOME}>Trang chủ</Link></li>
          <li className="breadcrumb-item"><Link to={ROUTE.JOBS}>Việc làm</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{job.title}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
            <div className="d-flex align-items-start gap-3">
              <div className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-4" style={{ width: 64, height: 64 }}>
                {job.companyLogo || 'NT'}
              </div>
              <div className="flex-grow-1">
                <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill mb-2">Đang tuyển dụng</span>
                <h1 className="h3 fw-bold mb-1">{job.title}</h1>
                <p className="text-secondary fw-semibold mb-0">{job.company}</p>
              </div>
            </div>

            <hr className="my-3 text-muted" />

            <div className="row g-3 py-2">
              <div className="col-sm-6 col-md-3">
                <small className="text-muted d-block">Mức lương</small>
                <strong className="text-primary fs-6">{job.salary}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <small className="text-muted d-block">Địa điểm</small>
                <strong>{job.location}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <small className="text-muted d-block">Hình thức</small>
                <strong>{job.workMode}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <small className="text-muted d-block">Hạn nộp hồ sơ</small>
                <strong className="text-danger">{job.deadline}</strong>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              {job.tags.map((tag) => (
                <span key={tag} className="badge bg-light text-dark border px-2 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
            <h2 className="h5 fw-bold text-dark border-bottom pb-2 mb-3">Mô tả công việc</h2>
            <p className="text-secondary lh-lg">{job.description}</p>

            <h2 className="h5 fw-bold text-dark border-bottom pb-2 mb-3 mt-4">Yêu cầu ứng viên</h2>
            <ul className="text-secondary lh-lg ps-3">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="mb-1">{req}</li>
              ))}
            </ul>

            <h2 className="h5 fw-bold text-dark border-bottom pb-2 mb-3 mt-4">Quyền lợi & Chế độ</h2>
            <ul className="text-secondary lh-lg ps-3">
              {job.benefits.map((ben, idx) => (
                <li key={idx} className="mb-1">{ben}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 position-sticky" style={{ top: 90 }}>
            <h3 className="h6 fw-bold mb-3">Hành động ứng tuyển</h3>

            {applied ? (
              <div className="alert alert-success d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-5" />
                <span>Bạn đã gửi hồ sơ ứng tuyển thành công!</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary w-100 py-2 fw-semibold rounded-pill mb-2"
                onClick={() => {
                  if (!user) {
                    alert('Vui lòng đăng nhập với tài khoản Ứng viên để nộp hồ sơ.')
                  } else {
                    setApplied(true)
                  }
                }}
              >
                <i className="bi bi-send me-2" /> Nộp hồ sơ ngay
              </button>
            )}

            <button type="button" className="btn btn-outline-secondary w-100 py-2 rounded-pill mb-3">
              <i className="bi bi-bookmark me-2" /> Lưu tin việc làm
            </button>

            <hr className="text-muted my-3" />

            <div className="company-summary">
              <h4 className="h6 fw-bold mb-2">Thông tin công ty</h4>
              <p className="small text-muted mb-1"><strong>Tên:</strong> {job.company}</p>
              <p className="small text-muted mb-1"><strong>Trụ sở:</strong> {job.location}</p>
              <p className="small text-muted mb-0"><strong>Quy mô:</strong> 50 - 150 nhân viên</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
