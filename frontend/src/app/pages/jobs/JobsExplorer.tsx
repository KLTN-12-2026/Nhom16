import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { type JobData, type JobFilters, type JobCategory, listJobCategoriesApi, listPublicJobsApi } from '../../apis/job'
import { ROUTE } from '../../constants/route.constant'
import { jobActions } from '../../modules/jobs/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import './jobs-explorer.scss'

const locations = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Bình Dương', 'Toàn quốc']
const salaryOptions = [['UNDER_10', 'Dưới 10 triệu'], ['10_20', '10 - 20 triệu'], ['20_30', '20 - 30 triệu'], ['OVER_30', 'Trên 30 triệu']]
const experienceOptions = [['NONE', 'Không yêu cầu'], ['1_2', '1 - 2 năm'], ['2_5', '2 - 5 năm'], ['OVER_5', 'Trên 5 năm']]

const defaultFilters: JobFilters = { search: '', category: '', location: '', salary: '', experience: '', workMode: '', employmentType: '', positionLevel: '', sort: 'LATEST', page: 1, limit: 8 }

function FavoriteButton({ job, favorite }: { job: JobData; favorite: boolean }) {
  const dispatch = useAppDispatch()
  return (
    <button className={`job-favorite${favorite ? ' is-favorite' : ''}`} type="button" aria-pressed={favorite} aria-label={`${favorite ? 'Bỏ lưu' : 'Lưu'} việc làm ${job.title}`} onClick={(event) => { event.stopPropagation(); dispatch(jobActions.favoriteToggle(job.id)) }}>
      <i className={`bi ${favorite ? 'bi-heart-fill' : 'bi-heart'}`} />
    </button>
  )
}

function JobCard({ job, active, favorite, onPreview, candidate }: { job: JobData; active: boolean; favorite: boolean; onPreview: () => void; candidate: boolean }) {
  const detailPath = candidate ? `/candidate/jobs/${job.id}` : `/jobs/${job.id}`
  return (
    <article className={`jobs-explorer-card${active ? ' is-active' : ''}`} onMouseEnter={onPreview} onFocus={onPreview} tabIndex={0}>
      <span className={`jobs-explorer-card__logo ${job.companyLogoClass}`}>{job.companyLogo}</span>
      <div className="jobs-explorer-card__body">
        <div className="jobs-explorer-card__heading">
          <div><h2><Link to={detailPath}>{job.title}</Link></h2><p>{job.company}</p></div>
          <FavoriteButton favorite={favorite} job={job} />
        </div>
        <div className="jobs-explorer-card__meta">
          <strong><i className="bi bi-cash-stack" />{job.salary}</strong>
          <span><i className="bi bi-geo-alt" />{job.location}</span>
          <span><i className="bi bi-briefcase" />{job.workModeLabel}</span>
          <span><i className="bi bi-clock" />{job.postedAt}</span>
        </div>
        <div className="jobs-explorer-card__tags">{job.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="jobs-explorer-card__actions">
          <Link className="job-action job-action--secondary" to={candidate ? `${ROUTE.CANDIDATE_CVS}?jobId=${job.id}` : `${ROUTE.LOGIN}?returnTo=/candidate/jobs`}><i className="bi bi-stars" />AI so khớp CV</Link>
          <Link className="job-action job-action--primary" to={detailPath}>Nộp đơn</Link>
        </div>
      </div>
    </article>
  )
}

function JobPreview({ job, candidate, favorite }: { job: JobData; candidate: boolean; favorite: boolean }) {
  const detailPath = candidate ? `/candidate/jobs/${job.id}` : `/jobs/${job.id}`
  return (
    <section className="job-preview" aria-live="polite">
      <div className="job-preview__header">
        <span className={`jobs-explorer-card__logo ${job.companyLogoClass}`}>{job.companyLogo}</span>
        <div><span>{job.company}</span><h2>{job.title}</h2></div>
        <FavoriteButton favorite={favorite} job={job} />
      </div>
      <div className="job-preview__facts">
        <span><i className="bi bi-diagram-3" />{job.category.shortName}</span>
        <span><i className="bi bi-hourglass-split" />{job.experienceLabel}</span>
        <span><i className="bi bi-person-badge" />{job.positionLabel}</span>
      </div>
      <div className="job-preview__content">
        <h3>Mô tả công việc</h3><p>{job.description}</p>
        <h3>Yêu cầu chính</h3><ul>{job.requirements.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Quyền lợi</h3><ul>{job.benefits.slice(0, 2).map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="job-preview__actions">
        <Link to={detailPath} className="job-action job-action--secondary">Xem chi tiết</Link>
        <Link to={candidate ? `${ROUTE.CANDIDATE_CVS}?jobId=${job.id}` : ROUTE.LOGIN} className="job-action job-action--ai"><i className="bi bi-stars" />AI so khớp CV</Link>
        <Link to={detailPath} className="job-action job-action--primary">Nộp đơn</Link>
      </div>
    </section>
  )
}

export function JobsExplorer({ candidate = false }: { candidate?: boolean }) {
  const [searchParams] = useSearchParams()
  const initialFilters = { ...defaultFilters, category: searchParams.get('category') || '' }
  const dispatch = useAppDispatch()
  const { selectedJobId, favoriteJobIds, favoritesInitialized } = useAppSelector((state) => state.jobs)
  const { register, handleSubmit, reset, setValue, getValues } = useForm<JobFilters>({ defaultValues: initialFilters })
  const [filters, setFilters] = useState<JobFilters>(initialFilters)
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [jobs, setJobs] = useState<JobData[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!favoritesInitialized) dispatch(jobActions.favoritesLoad())
  }, [dispatch, favoritesInitialized])

  useEffect(() => {
    listJobCategoriesApi().then((response) => setCategories(response.data.categories)).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    listPublicJobsApi(filters)
      .then((response) => {
        setJobs(response.data.jobs)
        setPagination(response.data.pagination)
        dispatch(jobActions.select(response.data.jobs[0]?.id || null))
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [dispatch, filters])

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0]
  const submitFilters = (values: JobFilters) => setFilters({ ...values, page: 1, limit: 8 })
  const selectCategory = (code: string) => {
    setValue('category', code)
    setFilters({ ...getValues(), category: code, page: 1, limit: 8 })
  }
  const clearFilters = () => { reset(defaultFilters); setFilters(defaultFilters) }
  const changePage = (page: number) => setFilters((current) => ({ ...current, page }))

  return (
    <div className="jobs-explorer-page">
      <section className="jobs-search-hero">
        <div className="container">
          <p className="jobs-search-hero__eyebrow">Cơ hội nghề nghiệp dành cho bạn</p>
          <h1>Tìm công việc phù hợp</h1>
          <p>Khám phá tin tuyển dụng đã được công khai từ các doanh nghiệp trên hệ thống.</p>
          <form className="jobs-search-form" onSubmit={handleSubmit(submitFilters)}>
            <label><i className="bi bi-search" /><input {...register('search')} placeholder="Chức danh, công ty hoặc từ khóa" /></label>
            <label><i className="bi bi-grid" /><select {...register('category')}><option value="">Tất cả ngành nghề</option>{categories.map((category) => <option key={category.code} value={category.code}>{category.shortName}</option>)}</select></label>
            <label><i className="bi bi-geo-alt" /><select {...register('location')}><option value="">Tất cả địa điểm</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
            <button type="submit"><i className="bi bi-search" />Tìm kiếm</button>
            <button type="button" className="jobs-filter-toggle" onClick={() => setShowFilters((value) => !value)}><i className="bi bi-funnel" />Bộ lọc</button>
          </form>
          <nav className="job-category-strip" aria-label="Năm nhóm nghề nghiệp">
            {categories.map((category) => <button type="button" className={filters.category === category.code ? 'is-active' : ''} key={category.code} onClick={() => selectCategory(category.code)}>{category.shortName}</button>)}
          </nav>
        </div>
      </section>

      <div className="container jobs-explorer-layout">
        <aside className={`jobs-filter-sidebar${showFilters ? ' is-open' : ''}`}>
          <form className="jobs-filter-panel" onSubmit={handleSubmit(submitFilters)}>
            <div className="jobs-filter-panel__heading"><div><i className="bi bi-funnel-fill" /><h2>Lọc nâng cao</h2></div><button type="button" onClick={clearFilters}>Xóa lọc</button></div>
            <label>Ngành nghề<select {...register('category')}><option value="">Tất cả ngành nghề</option>{categories.map((category) => <option key={category.code} value={category.code}>{category.shortName}</option>)}</select></label>
            <label>Mức lương<select {...register('salary')}><option value="">Tất cả mức lương</option>{salaryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Kinh nghiệm<select {...register('experience')}><option value="">Tất cả kinh nghiệm</option>{experienceOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Hình thức làm việc<select {...register('workMode')}><option value="">Tất cả hình thức</option><option value="OFFICE">Tại văn phòng</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Từ xa</option></select></label>
            <label>Loại công việc<select {...register('employmentType')}><option value="">Tất cả loại công việc</option><option value="FULL_TIME">Toàn thời gian</option><option value="INTERNSHIP">Thực tập</option><option value="CONTRACT">Hợp đồng</option></select></label>
            <label>Cấp bậc<select {...register('positionLevel')}><option value="">Tất cả cấp bậc</option><option value="INTERN">Thực tập sinh</option><option value="STAFF">Nhân viên</option><option value="MANAGER">Quản lý</option></select></label>
            <button className="jobs-filter-panel__submit" type="submit">Áp dụng bộ lọc</button>
          </form>
        </aside>

        <main className="jobs-results">
          <div className="jobs-results__heading">
            <div><span>{pagination.total} cơ hội</span><h2>Việc làm đang tuyển</h2></div>
            <select aria-label="Sắp xếp việc làm" {...register('sort')} onChange={(event) => { setValue('sort', event.target.value); setFilters({ ...getValues(), sort: event.target.value, page: 1 }) }}>
              <option value="LATEST">Mới nhất</option><option value="SALARY_DESC">Lương cao nhất</option><option value="SALARY_ASC">Lương thấp nhất</option>
            </select>
          </div>
          {loading && <div className="jobs-state"><span className="spinner-border text-primary" /><p>Đang tải việc làm...</p></div>}
          {!loading && error && <div className="jobs-state jobs-state--error"><i className="bi bi-exclamation-circle" /><p>{error}</p><button type="button" onClick={() => setFilters({ ...filters })}>Thử lại</button></div>}
          {!loading && !error && jobs.length === 0 && <div className="jobs-state"><i className="bi bi-search" /><h3>Không tìm thấy việc làm phù hợp</h3><p>Hãy thay đổi từ khóa hoặc xóa bớt bộ lọc.</p><button type="button" onClick={clearFilters}>Xóa bộ lọc</button></div>}
          {!loading && !error && jobs.map((job) => <JobCard candidate={candidate} active={job.id === selectedJob?.id} favorite={favoriteJobIds.includes(job.id)} job={job} key={job.id} onPreview={() => dispatch(jobActions.select(job.id))} />)}
          {pagination.totalPages > 1 && <nav className="jobs-pagination" aria-label="Phân trang việc làm"><button type="button" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}><i className="bi bi-chevron-left" /></button><span>Trang {pagination.page} / {pagination.totalPages}</span><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => changePage(pagination.page + 1)}><i className="bi bi-chevron-right" /></button></nav>}
        </main>

        <aside className="jobs-preview-sidebar">
          {selectedJob
            ? <JobPreview candidate={candidate} favorite={favoriteJobIds.includes(selectedJob.id)} job={selectedJob} />
            : <div className="job-preview job-preview--empty"><i className="bi bi-hand-index-thumb" /><p>Di chuột vào một việc làm để xem chi tiết.</p></div>}
        </aside>
      </div>
    </div>
  )
}
