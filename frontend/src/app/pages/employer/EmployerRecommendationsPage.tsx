import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type ApplicationData,
  downloadApplicationCvApi,
  type EmployerCandidateRecommendationItem,
  type EmployerCandidateRecommendationsResponse,
  getEmployerCandidateRecommendationsApi,
  toggleFavoriteCandidateApi,
  updateApplicationStatusApi,
} from '../../apis/recruitment'
import '../../../styles/recruitment-ai.scss'

const statusLabels: Record<string, string> = {
  RECEIVED: 'Đã tiếp nhận',
  REVIEWING: 'Đang xem xét',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Đề nghị nhận việc',
  REJECTED: 'Từ chối',
}

const tierLabel = (tier: EmployerCandidateRecommendationItem['matchTier']) => {
  if (tier === 'high') return 'Phù hợp cao'
  if (tier === 'medium') return 'Khá phù hợp'
  return 'Cần bổ sung'
}

export default function EmployerRecommendationsPage() {
  const [data, setData] = useState<EmployerCandidateRecommendationsResponse | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(undefined)
  const [pool, setPool] = useState<'employer' | 'job'>('employer')
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState<number>(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('SCORE_DESC')
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [busyCandidateId, setBusyCandidateId] = useState<number | null>(null)
  const [downloadingAppId, setDownloadingAppId] = useState<number | null>(null)

  const loadRecommendations = useCallback(async (jobIdToLoad?: number, poolToLoad: 'employer' | 'job' = pool) => {
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await getEmployerCandidateRecommendationsApi({
        jobId: jobIdToLoad,
        pool: poolToLoad,
      })
      setData(response)
      if (response.selectedJob) {
        setSelectedJobId(response.selectedJob.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách gợi ý ứng viên.')
    } finally {
      setLoading(false)
    }
  }, [pool])

  useEffect(() => {
    void loadRecommendations(selectedJobId, pool)
  }, [loadRecommendations, pool, selectedJobId])

  const visibleItems = useMemo(() => {
    const items = data?.recommendations || []
    const keyword = search.trim().toLocaleLowerCase('vi-VN')

    const filtered = items.filter((item) => {
      if (item.matchScore < minScore) return false
      if (statusFilter === 'FAVORITE' && !item.isFavorite) return false
      if (statusFilter && statusFilter !== 'FAVORITE' && item.application.status !== statusFilter) return false
      if (keyword) {
        const haystack = [
          item.candidate.fullName,
          item.candidate.email,
          item.candidate.title,
          item.cv.displayName,
          item.cv.headline || '',
          ...item.cv.skills,
          ...item.matchedCriteria,
        ].join(' ').toLocaleLowerCase('vi-VN')
        if (!haystack.includes(keyword)) return false
      }
      return true
    })

    return [...filtered].sort((left, right) => {
      if (sortBy === 'SCORE_ASC') return (left.matchScore - right.matchScore) || (left.rank - right.rank)
      if (sortBy === 'MATCHED_DESC') return (right.matchedCriteria.length - left.matchedCriteria.length) || (right.matchScore - left.matchScore)
      if (sortBy === 'APPLIED_NEWEST') return new Date(right.application.appliedAt).getTime() - new Date(left.application.appliedAt).getTime()
      if (sortBy === 'NAME_ASC') return left.candidate.fullName.localeCompare(right.candidate.fullName, 'vi')
      return (right.matchScore - left.matchScore) || (left.rank - right.rank)
    })
  }, [data?.recommendations, minScore, search, sortBy, statusFilter])

  const comparedCandidates = useMemo(
    () => (data?.recommendations || []).filter((item) => compareIds.includes(item.candidate.id)),
    [compareIds, data?.recommendations],
  )

  const handleToggleFavorite = async (item: EmployerCandidateRecommendationItem) => {
    setBusyCandidateId(item.candidate.id)
    setFeedback(null)
    try {
      const { data: res } = await toggleFavoriteCandidateApi(item.candidate.id)
      setData((prev) => {
        if (!prev) return prev
        const nextRecs = prev.recommendations.map((rec) => (
          rec.candidate.id === item.candidate.id ? { ...rec, isFavorite: res.favorite } : rec
        ))
        return {
          ...prev,
          recommendations: nextRecs,
          meta: {
            ...prev.meta,
            favoriteCount: nextRecs.filter((rec) => rec.isFavorite).length,
          },
        }
      })
      setFeedback({
        type: 'success',
        message: res.favorite
          ? `Đã lưu ứng viên "${item.candidate.fullName}" vào danh sách yêu thích.`
          : `Đã bỏ lưu ứng viên "${item.candidate.fullName}".`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể cập nhật ứng viên yêu thích.',
      })
    } finally {
      setBusyCandidateId(null)
    }
  }

  const handleInviteInterview = async (item: EmployerCandidateRecommendationItem) => {
    setBusyCandidateId(item.candidate.id)
    setFeedback(null)
    try {
      const note = `Được đề xuất từ hệ thống gợi ý ứng viên (điểm phù hợp ${item.matchScore}%) cho vị trí ${data?.selectedJob?.title || item.application.jobTitle}.`
      const { data: updated } = await updateApplicationStatusApi(item.application.id, 'INTERVIEW', note)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recommendations: prev.recommendations.map((rec) => (
            rec.application.id === item.application.id
              ? { ...rec, application: { ...rec.application, status: updated.status || 'INTERVIEW' } }
              : rec
          )),
        }
      })
      setFeedback({
        type: 'success',
        message: `Đã chuyển hồ sơ của "${item.candidate.fullName}" sang trạng thái Phỏng vấn.`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái mời phỏng vấn.',
      })
    } finally {
      setBusyCandidateId(null)
    }
  }

  const handleDownloadCv = async (item: EmployerCandidateRecommendationItem) => {
    setDownloadingAppId(item.application.id)
    setFeedback(null)
    try {
      await downloadApplicationCvApi({
        id: item.application.id,
        cv: {
          id: item.cv.id,
          displayName: item.cv.displayName,
          originalName: item.cv.originalName,
        },
      } as ApplicationData)
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể tải file CV của ứng viên.',
      })
    } finally {
      setDownloadingAppId(null)
    }
  }

  const toggleCompare = (candidateId: number) => {
    setCompareIds((current) => (
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : current.length < 3
          ? [...current, candidateId]
          : current
    ))
  }

  const selectedJob = data?.selectedJob || null
  const jobs = data?.jobs || []

  return (
    <main className="ai-studio">
      <div className="container">
        <header className="ai-studio__header">
          <div>
            <span className="ai-studio__eyebrow">
              <i className="bi bi-people-fill" /> PB19 · Gợi ý ứng viên phù hợp
            </span>
            <h1>Sàng lọc & xếp hạng ứng viên theo tin tuyển dụng</h1>
            <p>
              Đối chiếu CV ứng viên với yêu cầu JD của từng vị trí để hiển thị điểm phù hợp, tiêu chí đáp ứng và tiêu chí còn thiếu. Chỉ hiển thị hồ sơ ứng viên thuộc phạm vi quyền xem của doanh nghiệp.
            </p>
          </div>
          <div className="ai-studio__trust">
            <i className="bi bi-shield-lock-fill" />
            <div>
              <strong>Bảo mật & đúng phạm vi quyền</strong>
              <span>Chỉ đánh giá ứng viên đã nộp hồ sơ vào doanh nghiệp và tự động cập nhật khi CV/JD thay đổi.</span>
            </div>
          </div>
        </header>

        <section className="ai-metrics">
          <article>
            <i className="bi bi-person-lines-fill" />
            <div>
              <small>Hồ sơ ứng viên hợp lệ</small>
              <strong>{data?.meta.totalCandidates ?? 0} ứng viên</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-award-fill" />
            <div>
              <small>Phù hợp cao (&ge; 70%)</small>
              <strong>{data?.meta.highMatchCount ?? 0} ứng viên</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-heart-fill" />
            <div>
              <small>Ứng viên đã lưu yêu thích</small>
              <strong>{data?.meta.favoriteCount ?? 0} hồ sơ</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-briefcase-fill" />
            <div>
              <small>Tin đang dùng đối chiếu</small>
              <strong>{selectedJob ? selectedJob.title : 'Chưa có tin'}</strong>
            </div>
          </article>
        </section>

        {feedback && (
          <div className={`ai-feedback ${feedback.type === 'error' ? 'ai-feedback--error' : 'ai-feedback--success'}`} role="status">
            <i className={`bi ${feedback.type === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'}`} />
            <div>
              <strong>{feedback.type === 'error' ? 'Thông báo lỗi' : 'Thao tác thành công'}</strong>
              <span>{feedback.message}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)}>Đóng</button>
          </div>
        )}

        {error && (
          <div className="ai-feedback ai-feedback--error" role="alert">
            <i className="bi bi-exclamation-triangle-fill" />
            <div>
              <strong>Không thể tải gợi ý ứng viên</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void loadRecommendations(selectedJobId, pool)}>Thử lại</button>
          </div>
        )}

        {!loading && data?.emptyReason === 'NO_EMPLOYER_JOBS' && (
          <section className="ai-editor">
            <div className="ai-editor__empty">
              <span><i className="bi bi-briefcase" /></span>
              <h2>Doanh nghiệp chưa có tin tuyển dụng</h2>
              <p>Hãy tạo và đăng ít nhất một tin tuyển dụng để hệ thống đối chiếu và xếp hạng hồ sơ ứng viên phù hợp.</p>
              <div className="mt-3">
                <Link className="btn btn-success px-4" to="/employer/jobs/new">
                  <i className="bi bi-plus-circle me-2" />Tạo tin tuyển dụng ngay
                </Link>
              </div>
            </div>
          </section>
        )}

        {(loading || jobs.length > 0) && (
          <>
            <section className="ai-rec-toolbar ai-rec-toolbar--employer" aria-label="Bộ lọc và sắp xếp ứng viên">
              <label>
                <span><i className="bi bi-briefcase" />Tin tuyển dụng mục tiêu</span>
                <select
                  aria-label="Tin tuyển dụng mục tiêu"
                  value={selectedJobId || ''}
                  disabled={loading || jobs.length === 0}
                  onChange={(event) => setSelectedJobId(Number(event.target.value))}
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.status}){job.hasCompletedJdAnalysis ? ` · JD AI v${job.jdAnalysisVersion}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span><i className="bi bi-funnel" />Phạm vi nguồn hồ sơ</span>
                <select
                  aria-label="Phạm vi nguồn hồ sơ"
                  value={pool}
                  disabled={loading}
                  onChange={(event) => setPool(event.target.value as 'employer' | 'job')}
                >
                  <option value="employer">Tất cả ứng viên đã nộp vào doanh nghiệp</option>
                  <option value="job">Chỉ ứng viên nộp trực tiếp tin này</option>
                </select>
              </label>

              <label>
                <span><i className="bi bi-search" />Tìm tên, email, chức danh, kỹ năng</span>
                <input
                  type="search"
                  placeholder="VD: Nguyễn Văn A, React, Node.js..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label>
                <span><i className="bi bi-sliders" />Điểm phù hợp tối thiểu</span>
                <select
                  aria-label="Điểm phù hợp tối thiểu"
                  value={minScore}
                  onChange={(event) => setMinScore(Number(event.target.value))}
                >
                  <option value={0}>Mọi mức điểm</option>
                  <option value={45}>Từ 45% trở lên</option>
                  <option value={70}>Từ 70% trở lên (Phù hợp cao)</option>
                  <option value={85}>Từ 85% trở lên</option>
                </select>
              </label>

              <label>
                <span><i className="bi bi-bookmark-check" />Lọc theo trạng thái</span>
                <select
                  aria-label="Lọc theo trạng thái"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="FAVORITE">Đã lưu yêu thích</option>
                  <option value="RECEIVED">Đã tiếp nhận</option>
                  <option value="REVIEWING">Đang xem xét</option>
                  <option value="INTERVIEW">Phỏng vấn</option>
                  <option value="OFFER">Đề nghị nhận việc</option>
                </select>
              </label>

              <div className="d-flex gap-2 align-items-end">
                <label className="flex-grow-1">
                  <span><i className="bi bi-sort-down" />Sắp xếp theo</span>
                  <select
                    aria-label="Sắp xếp theo"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="SCORE_DESC">Điểm phù hợp cao → thấp</option>
                    <option value="MATCHED_DESC">Nhiều tiêu chí phù hợp nhất</option>
                    <option value="APPLIED_NEWEST">Nộp hồ sơ mới nhất</option>
                    <option value="NAME_ASC">Tên ứng viên A → Z</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="ai-rec-refresh"
                  disabled={loading}
                  onClick={() => void loadRecommendations(selectedJobId, pool)}
                >
                  <i className={`bi bi-arrow-clockwise ${loading ? 'ai-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </section>

            {selectedJob && (
              <div className="ai-rec-cv-banner">
                <div>
                  <strong>Tiêu chuẩn JD đang áp dụng:</strong> {selectedJob.title} · {selectedJob.location} · {selectedJob.experienceLabel}
                  {selectedJob.hasCompletedJdAnalysis ? ` (Đã phân tích JD AI v${selectedJob.jdAnalysisVersion})` : ' (Đối chiếu từ kỹ năng & yêu cầu tin tuyển dụng)'}
                </div>
                <div className="ai-rec-cv-banner__skills">
                  {(selectedJob.tags || []).slice(0, 8).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  <Link className="ms-2 text-success fw-bold text-decoration-none" to="/employer/ai/jd-analysis">
                    <i className="bi bi-cpu me-1" />Cập nhật phân tích JD
                  </Link>
                </div>
              </div>
            )}

            {comparedCandidates.length > 0 && (
              <aside className="ai-rec-compare-panel" aria-label="Bảng so sánh nhanh ứng viên">
                <header>
                  <strong>
                    <i className="bi bi-columns-gap" />
                    Shortlist so sánh nhanh ({comparedCandidates.length}/3 ứng viên)
                  </strong>
                  <button type="button" onClick={() => setCompareIds([])}>
                    Xóa danh sách so sánh
                  </button>
                </header>
                <div className="ai-rec-compare-grid">
                  {comparedCandidates.map((item) => (
                    <article key={item.candidate.id}>
                      <h4>#{item.rank} · {item.candidate.fullName} ({item.matchScore}%)</h4>
                      <p>{item.cv.headline || item.candidate.title}</p>
                      <small>
                        <b>Đạt ({item.matchedCriteria.length}):</b>{' '}
                        {item.matchedCriteria.slice(0, 4).join(', ') || 'Chưa có'}
                      </small>
                      <small>
                        <b>Thiếu ({item.missingCriteria.length}):</b>{' '}
                        {item.missingCriteria.slice(0, 3).join('; ') || 'Không có'}
                      </small>
                    </article>
                  ))}
                </div>
              </aside>
            )}

            {loading ? (
              <section className="ai-editor">
                <div className="ai-progress">
                  <div className="ai-progress__visual">
                    <i className="bi bi-person-check-fill" />
                  </div>
                  <div>
                    <strong>Đang chấm điểm và xếp hạng hồ sơ ứng viên...</strong>
                    <p>Hệ thống đang đối chiếu CV ứng viên với tiêu chí JD của vị trí đang chọn.</p>
                    <span className="ai-progress__bar"><i /></span>
                  </div>
                </div>
              </section>
            ) : visibleItems.length === 0 ? (
              <section className="ai-editor">
                <div className="ai-editor__empty">
                  <span><i className="bi bi-person-bounding-box" /></span>
                  <h2>
                    {data?.emptyReason === 'NO_APPLICANTS'
                      ? 'Chưa có hồ sơ ứng viên trong phạm vi này'
                      : 'Không có ứng viên khớp bộ lọc hiện tại'}
                  </h2>
                  <p>
                    {data?.emptyReason === 'NO_APPLICANTS' && pool === 'job'
                      ? 'Tin tuyển dụng này chưa có người nộp trực tiếp. Bạn có thể chuyển phạm vi sang "Tất cả ứng viên đã nộp vào doanh nghiệp" để sàng lọc nguồn hồ sơ sẵn có.'
                      : 'Hãy thử giảm ngưỡng điểm tối thiểu, xóa từ khóa tìm kiếm hoặc chọn lại trạng thái lọc.'}
                  </p>
                  <div className="mt-3 d-flex gap-2 justify-content-center">
                    {pool === 'job' && (
                      <button type="button" className="btn btn-success" onClick={() => setPool('employer')}>
                        Xem tất cả hồ sơ nộp vào doanh nghiệp
                      </button>
                    )}
                    {(search || minScore > 0 || statusFilter) && (
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        onClick={() => { setSearch(''); setMinScore(0); setStatusFilter('') }}
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <div className="ai-rec-list">
                {visibleItems.map((item) => {
                  const isCompared = compareIds.includes(item.candidate.id)
                  const isBusy = busyCandidateId === item.candidate.id

                  return (
                    <article className="ai-rec-card" key={`${item.candidate.id}-${item.application.id}`}>
                      <div className="ai-rec-card__top">
                        <div>
                          <div className="ai-rec-card__badges">
                            <span className="ai-rec-rank">#{item.rank}</span>
                            <span className={`ai-rec-tier is-${item.matchTier}`}>
                              {tierLabel(item.matchTier)}
                            </span>
                            <span className="ai-rec-source">
                              <i className={`bi ${item.scoreSource === 'ai_verified' ? 'bi-patch-check-fill' : 'bi-diagram-3-fill'}`} />
                              {item.scoreSource === 'ai_verified' ? 'AI đã đối chiếu sâu' : 'Đối chiếu tiêu chí JD'}
                            </span>
                            <span className="ai-pill is-completed">
                              <i className="bi bi-circle-fill" />
                              {statusLabels[item.application.status] || item.application.status}
                            </span>
                            {item.isFavorite && (
                              <span className="ai-rec-source text-danger">
                                <i className="bi bi-heart-fill" /> Đã lưu yêu thích
                              </span>
                            )}
                          </div>

                          <h2 className="ai-rec-title">
                            <Link to={item.application.profileUrl}>{item.candidate.fullName}</Link>
                          </h2>
                          <p className="ai-rec-company">
                            {item.cv.headline || item.candidate.title} · {item.candidate.email}
                          </p>

                          <div className="ai-rec-meta">
                            <span>
                              <i className="bi bi-file-earmark-person" />
                              CV: {item.cv.displayName} (v{item.cv.analysisVersion})
                            </span>
                            <span>
                              <i className="bi bi-briefcase" />
                              {item.application.isDirectApplicant
                                ? 'Ứng tuyển trực tiếp tin này'
                                : `Hồ sơ nộp tại: ${item.application.jobTitle}`}
                            </span>
                            <span>
                              <i className="bi bi-calendar-check" />
                              Nộp ngày {new Date(item.application.appliedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        <div className="ai-score-card">
                          <div
                            className="ai-score-card__ring"
                            style={{ '--match-score': `${item.matchScore}%` } as CSSProperties}
                          >
                            <strong>{item.matchScore}%</strong>
                            <small>phù hợp</small>
                          </div>
                          <div className="ai-score-card__copy">
                            <span>ĐIỂM ỨNG VIÊN</span>
                            <strong>{tierLabel(item.matchTier)}</strong>
                            <small>
                              Đạt <b>{item.matchedCriteria.length}</b> tiêu chí · Thiếu <b>{item.missingCriteria.length}</b> tiêu chí
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="ai-rec-card__body">
                        <div className="ai-rec-panel is-matched">
                          <header>
                            <strong><i className="bi bi-check2-circle" />Tiêu chí & kỹ năng phù hợp</strong>
                            <em>{item.matchedCriteria.length}</em>
                          </header>
                          {item.matchedCriteria.length > 0 || item.partialCriteria.length > 0 ? (
                            <div className="ai-rec-chips">
                              {item.matchedCriteria.map((criterion) => (
                                <span key={criterion}><i className="bi bi-check-lg" />{criterion}</span>
                              ))}
                              {item.partialCriteria.map((partial) => (
                                <span key={partial} className="is-partial" title="Khớp một phần">
                                  <i className="bi bi-dash-circle" />{partial}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="ai-rec-empty-note">
                              Chưa ghi nhận kỹ năng trùng khớp trực tiếp với JD của vị trí này.
                            </p>
                          )}
                        </div>

                        <div className="ai-rec-panel is-missing">
                          <header>
                            <strong><i className="bi bi-exclamation-circle" />Tiêu chí còn thiếu</strong>
                            <em>{item.missingCriteria.length}</em>
                          </header>
                          {item.missingCriteria.length > 0 ? (
                            <ul className="ai-rec-missing-list">
                              {item.missingCriteria.map((missing) => (
                                <li key={missing}>{missing}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="ai-rec-empty-note">
                              Hồ sơ ứng viên đáp ứng đầy đủ các tiêu chí cốt lõi của tin tuyển dụng.
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="ai-rec-explanation">
                        <i className="bi bi-info-circle-fill" />
                        {item.explanation}
                      </p>

                      <footer className="ai-rec-card__footer">
                        <div className="ai-rec-actions">
                          <Link to={item.application.profileUrl}>
                            <i className="bi bi-person-vcard" />Xem hồ sơ ứng tuyển
                          </Link>

                          <button
                            type="button"
                            disabled={downloadingAppId === item.application.id}
                            onClick={() => void handleDownloadCv(item)}
                          >
                            <i className="bi bi-file-earmark-arrow-down" />
                            {downloadingAppId === item.application.id ? 'Đang tải CV...' : 'Tải CV'}
                          </button>

                          <button
                            type="button"
                            className={item.isFavorite ? 'is-saved' : ''}
                            disabled={isBusy}
                            onClick={() => void handleToggleFavorite(item)}
                          >
                            <i className={`bi ${item.isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} />
                            {item.isFavorite ? 'Đã lưu yêu thích' : 'Lưu ứng viên'}
                          </button>

                          <button
                            type="button"
                            className={isCompared ? 'is-applied' : ''}
                            disabled={!isCompared && compareIds.length >= 3}
                            onClick={() => toggleCompare(item.candidate.id)}
                          >
                            <i className="bi bi-columns-gap" />
                            {isCompared ? 'Đã chọn so sánh' : 'So sánh'}
                          </button>
                        </div>

                        <div className="ai-rec-actions">
                          {['INTERVIEW', 'OFFER'].includes(item.application.status) ? (
                            <button type="button" className="is-applied" disabled>
                              <i className="bi bi-check2-all" />
                              {statusLabels[item.application.status]}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="is-primary"
                              disabled={isBusy || item.application.status === 'REJECTED'}
                              onClick={() => void handleInviteInterview(item)}
                            >
                              <i className="bi bi-calendar2-check" />Mời phỏng vấn
                            </button>
                          )}
                        </div>
                      </footer>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
