import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type CandidateJobRecommendationsResponse,
  getCandidateJobRecommendationsApi,
  type JobRecommendationItem,
} from '../../apis/ai/recruitment-ai.api'
import { applyToJobApi, toggleFavoriteJobApi } from '../../apis/recruitment'
import { ROUTE } from '../../constants/route.constant'
import '../../../styles/recruitment-ai.scss'

const daysUntil = (deadline: string) => Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)

const tierLabel = (tier: JobRecommendationItem['matchTier']) => {
  if (tier === 'high') return 'Phù hợp cao'
  if (tier === 'medium') return 'Khá phù hợp'
  return 'Cần bổ sung'
}

export default function CandidateJobRecommendationsPage() {
  const [data, setData] = useState<CandidateJobRecommendationsResponse | null>(null)
  const [selectedCvId, setSelectedCvId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState<number>(0)
  const [hideApplied, setHideApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [savingJobId, setSavingJobId] = useState<number | null>(null)
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null)
  const [applyCvId, setApplyCvId] = useState<number>(0)
  const [coverLetter, setCoverLetter] = useState('')
  const [submittingApply, setSubmittingApply] = useState(false)

  const loadRecommendations = useCallback(async (cvIdToLoad?: number) => {
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await getCandidateJobRecommendationsApi({ cvId: cvIdToLoad })
      setData(response)
      if (response.selectedCv) {
        setSelectedCvId(response.selectedCv.id)
        setApplyCvId(response.selectedCv.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách gợi ý việc làm.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecommendations(selectedCvId)
  }, [loadRecommendations, selectedCvId])

  const filteredItems = useMemo(() => {
    const list = data?.recommendations || []
    const keyword = search.trim().toLocaleLowerCase('vi-VN')
    return list.filter((item) => {
      if (item.matchScore < minScore) return false
      if (hideApplied && item.hasApplied) return false
      if (keyword) {
        const haystack = [
          item.job.title,
          item.job.company,
          item.job.location,
          ...(item.job.tags || []),
          ...item.matchedSkills,
        ].join(' ').toLocaleLowerCase('vi-VN')
        if (!haystack.includes(keyword)) return false
      }
      return true
    })
  }, [data?.recommendations, hideApplied, minScore, search])

  const highMatchCount = useMemo(
    () => (data?.recommendations || []).filter((item) => item.matchScore >= 70).length,
    [data?.recommendations],
  )

  const handleToggleSave = async (item: JobRecommendationItem) => {
    setSavingJobId(item.job.id)
    setFeedback(null)
    try {
      const { data: res } = await toggleFavoriteJobApi(item.job.id)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recommendations: prev.recommendations.map((rec) => (
            rec.job.id === item.job.id ? { ...rec, isSaved: res.favorite } : rec
          )),
        }
      })
      setFeedback({
        type: 'success',
        message: res.favorite
          ? `Đã lưu "${item.job.title}" vào danh sách quan tâm.`
          : `Đã bỏ lưu "${item.job.title}".`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái lưu việc làm.',
      })
    } finally {
      setSavingJobId(null)
    }
  }

  const openApplyBox = (item: JobRecommendationItem) => {
    setApplyingJobId(item.job.id)
    setApplyCvId(data?.selectedCv?.id || data?.analyzedCvs?.[0]?.id || 0)
    setCoverLetter('')
  }

  const handleApplySubmit = async (item: JobRecommendationItem) => {
    if (!applyCvId) return
    setSubmittingApply(true)
    setFeedback(null)
    try {
      const { data: application } = await applyToJobApi(item.job.id, applyCvId, coverLetter.trim() || undefined)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recommendations: prev.recommendations.map((rec) => (
            rec.job.id === item.job.id
              ? { ...rec, hasApplied: true, applicationStatus: application.status || 'RECEIVED' }
              : rec
          )),
        }
      })
      setApplyingJobId(null)
      setCoverLetter('')
      setFeedback({
        type: 'success',
        message: `Đã ứng tuyển thành công vị trí "${item.job.title}".`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ứng tuyển không thành công, vui lòng thử lại.',
      })
    } finally {
      setSubmittingApply(false)
    }
  }

  const selectedCv = data?.selectedCv || null
  const analyzedCvs = data?.analyzedCvs || []

  return (
    <main className="ai-studio">
      <div className="container">
        <header className="ai-studio__header">
          <div>
            <span className="ai-studio__eyebrow">
              <i className="bi bi-stars" /> PB18 · Gợi ý việc làm thông minh
            </span>
            <h1>Việc làm phù hợp với CV của bạn</h1>
            <p>
              Xếp hạng các tin tuyển dụng đang mở dựa hoàn toàn trên dữ liệu CV đã phân tích và yêu cầu JD trong hệ thống. Tự động loại bỏ tin đã đóng hoặc hết hạn.
            </p>
          </div>
          <div className="ai-studio__trust">
            <i className="bi bi-shield-check" />
            <div>
              <strong>Dữ liệu nội bộ & tự động cập nhật</strong>
              <span>Điểm số và tiêu chí tự động làm mới khi CV, JD hoặc trạng thái tin thay đổi.</span>
            </div>
          </div>
        </header>

        <section className="ai-metrics">
          <article>
            <i className="bi bi-briefcase-fill" />
            <div>
              <small>Việc làm đang tuyển</small>
              <strong>{data?.meta.totalActiveJobs ?? 0} công việc</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-fire" />
            <div>
              <small>Độ phù hợp cao (&ge; 70%)</small>
              <strong>{highMatchCount} cơ hội</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-cpu-fill" />
            <div>
              <small>Đã đối chiếu AI chuyên sâu</small>
              <strong>{data?.meta.aiVerifiedCount ?? 0} công việc</strong>
            </div>
          </article>
          <article>
            <i className="bi bi-file-earmark-person-fill" />
            <div>
              <small>CV đang dùng để xếp hạng</small>
              <strong>{selectedCv ? `${selectedCv.displayName} (v${selectedCv.analysisVersion})` : 'Chưa có CV'}</strong>
            </div>
          </article>
        </section>

        {feedback && (
          <div className={`ai-feedback ${feedback.type === 'error' ? 'ai-feedback--error' : 'ai-feedback--success'}`} role="status">
            <i className={`bi ${feedback.type === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'}`} />
            <div>
              <strong>{feedback.type === 'error' ? 'Thông báo lỗi' : 'Cập nhật thành công'}</strong>
              <span>{feedback.message}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)}>Đóng</button>
          </div>
        )}

        {error && (
          <div className="ai-feedback ai-feedback--error" role="alert">
            <i className="bi bi-exclamation-triangle-fill" />
            <div>
              <strong>Không thể tải gợi ý việc làm</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void loadRecommendations(selectedCvId)}>Thử lại</button>
          </div>
        )}

        {!loading && data?.emptyReason === 'CV_ANALYSIS_REQUIRED' && (
          <section className="ai-editor">
            <div className="ai-editor__empty">
              <span><i className="bi bi-file-earmark-medical" /></span>
              <h2>Bạn cần ít nhất một CV đã được phân tích</h2>
              <p>
                Hệ thống cần trích xuất kỹ năng, học vấn và kinh nghiệm từ CV của bạn để tính điểm và xếp hạng việc làm phù hợp.
              </p>
              <div className="mt-3 d-flex gap-2 justify-content-center">
                <Link className="btn btn-success px-4" to={ROUTE.CANDIDATE_CVS}>
                  <i className="bi bi-upload me-2" />Quản lý & Phân tích CV ngay
                </Link>
              </div>
            </div>
          </section>
        )}

        {(loading || analyzedCvs.length > 0) && (
          <>
            <section className="ai-rec-toolbar" aria-label="Bộ lọc gợi ý việc làm">
              <label>
                <span><i className="bi bi-file-earmark-check" />Chọn CV đối chiếu</span>
                <select
                  aria-label="Chọn CV đối chiếu"
                  value={selectedCvId || ''}
                  disabled={loading || analyzedCvs.length === 0}
                  onChange={(event) => setSelectedCvId(Number(event.target.value))}
                >
                  {analyzedCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.displayName} {cv.isDefault ? '(Mặc định)' : ''} — v{cv.analysisVersion}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span><i className="bi bi-search" />Tìm theo vị trí, công ty, kỹ năng</span>
                <input
                  type="search"
                  placeholder="VD: React, Node.js, Backend..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label>
                <span><i className="bi bi-sliders" />Ngưỡng điểm phù hợp</span>
                <select
                  aria-label="Ngưỡng điểm phù hợp"
                  value={minScore}
                  onChange={(event) => setMinScore(Number(event.target.value))}
                >
                  <option value={0}>Tất cả mức điểm</option>
                  <option value={45}>Từ 45% trở lên (Khá phù hợp)</option>
                  <option value={70}>Từ 70% trở lên (Phù hợp cao)</option>
                </select>
              </label>

              <label className="ai-rec-toggle">
                <input
                  type="checkbox"
                  checked={hideApplied}
                  onChange={(event) => setHideApplied(event.target.checked)}
                />
                <strong>Ẩn việc đã ứng tuyển</strong>
              </label>

              <button
                type="button"
                className="ai-rec-refresh"
                disabled={loading}
                onClick={() => void loadRecommendations(selectedCvId)}
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'ai-spin' : ''}`} />
                Làm mới
              </button>
            </section>

            {selectedCv && (
              <div className="ai-rec-cv-banner">
                <div>
                  <strong>Hồ sơ đang so khớp:</strong> {selectedCv.displayName}
                  {selectedCv.headline ? ` · ${selectedCv.headline}` : ''}
                </div>
                {selectedCv.skills.length > 0 && (
                  <div className="ai-rec-cv-banner__skills">
                    {selectedCv.skills.slice(0, 8).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <section className="ai-editor">
                <div className="ai-progress">
                  <div className="ai-progress__visual">
                    <i className="bi bi-magic" />
                  </div>
                  <div>
                    <strong>Đang tính điểm phù hợp và xếp hạng các việc làm đang mở...</strong>
                    <p>Hệ thống đang đối chiếu kỹ năng và yêu cầu từ CV của bạn với các tin tuyển dụng còn hạn.</p>
                    <span className="ai-progress__bar"><i /></span>
                  </div>
                </div>
              </section>
            ) : filteredItems.length === 0 ? (
              <section className="ai-editor">
                <div className="ai-editor__empty">
                  <span><i className="bi bi-search-heart" /></span>
                  <h2>Không tìm thấy việc làm khớp bộ lọc hiện tại</h2>
                  <p>Hãy thử giảm ngưỡng điểm lọc, xóa từ khóa tìm kiếm hoặc chọn một CV khác.</p>
                  {(search || minScore > 0 || hideApplied) && (
                    <button
                      type="button"
                      className="btn btn-outline-success mt-3"
                      onClick={() => { setSearch(''); setMinScore(0); setHideApplied(false) }}
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </div>
              </section>
            ) : (
              <div className="ai-rec-list">
                {filteredItems.map((item) => {
                  const days = daysUntil(item.job.deadline)
                  const isApplyingThis = applyingJobId === item.job.id

                  return (
                    <article className="ai-rec-card" key={item.job.id}>
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
                            {item.hasApplied && (
                              <span className="ai-pill is-completed">
                                <i className="bi bi-circle-fill" /> Đã ứng tuyển
                              </span>
                            )}
                          </div>

                          <h2 className="ai-rec-title">
                            <Link to={`/candidate/jobs/${item.job.id}`}>{item.job.title}</Link>
                          </h2>
                          <p className="ai-rec-company">{item.job.company}</p>

                          <div className="ai-rec-meta">
                            <span><i className="bi bi-cash-stack" />{item.job.salary}</span>
                            <span><i className="bi bi-geo-alt" />{item.job.location}</span>
                            <span><i className="bi bi-briefcase" />{item.job.experienceLabel}</span>
                            <span><i className="bi bi-laptop" />{item.job.workModeLabel}</span>
                            <span>
                              <i className="bi bi-clock" />
                              {days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày (${new Date(item.job.deadline).toLocaleDateString('vi-VN')})`}
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
                            <span>ĐIỂM GỢI Ý</span>
                            <strong>{tierLabel(item.matchTier)}</strong>
                            <small>
                              Khớp <b>{item.matchedSkills.length}</b> kỹ năng · Thiếu <b>{item.missingRequirements.length}</b> yêu cầu
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="ai-rec-card__body">
                        <div className="ai-rec-panel is-matched">
                          <header>
                            <strong><i className="bi bi-check2-circle" />Kỹ năng & điểm phù hợp</strong>
                            <em>{item.matchedSkills.length}</em>
                          </header>
                          {item.matchedSkills.length > 0 || item.partialMatches.length > 0 ? (
                            <div className="ai-rec-chips">
                              {item.matchedSkills.map((skill) => (
                                <span key={skill}><i className="bi bi-check-lg" />{skill}</span>
                              ))}
                              {item.partialMatches.map((partial) => (
                                <span key={partial} className="is-partial" title="Khớp một phần">
                                  <i className="bi bi-dash-circle" />{partial}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="ai-rec-empty-note">
                              Chưa ghi nhận kỹ năng trùng khớp trực tiếp trong CV hiện tại.
                            </p>
                          )}
                        </div>

                        <div className="ai-rec-panel is-missing">
                          <header>
                            <strong><i className="bi bi-exclamation-circle" />Các yêu cầu còn thiếu</strong>
                            <em>{item.missingRequirements.length}</em>
                          </header>
                          {item.missingRequirements.length > 0 ? (
                            <ul className="ai-rec-missing-list">
                              {item.missingRequirements.map((reqText) => (
                                <li key={reqText}>{reqText}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="ai-rec-empty-note">
                              CV của bạn đã bao phủ các kỹ năng và yêu cầu cốt lõi của công việc này.
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
                          <Link to={`/candidate/jobs/${item.job.id}`}>
                            <i className="bi bi-box-arrow-up-right" />Xem chi tiết
                          </Link>

                          <button
                            type="button"
                            className={item.isSaved ? 'is-saved' : ''}
                            disabled={savingJobId === item.job.id}
                            onClick={() => void handleToggleSave(item)}
                          >
                            <i className={`bi ${item.isSaved ? 'bi-heart-fill' : 'bi-heart'}`} />
                            {item.isSaved ? 'Đã lưu' : 'Lưu việc làm'}
                          </button>

                          {item.hasApplied ? (
                            <button type="button" className="is-applied" disabled>
                              <i className="bi bi-check2-all" />Đã ứng tuyển
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="is-primary"
                              onClick={() => (isApplyingThis ? setApplyingJobId(null) : openApplyBox(item))}
                            >
                              <i className="bi bi-send-check" />Ứng tuyển ngay
                            </button>
                          )}
                        </div>

                        <Link className="text-decoration-none small fw-semibold text-success" to="/candidate/ai/job-match">
                          <i className="bi bi-stars me-1" />Đối chiếu AI chi tiết
                        </Link>
                      </footer>

                      {isApplyingThis && !item.hasApplied && (
                        <div className="ai-rec-apply-box">
                          <h4><i className="bi bi-send me-2" />Ứng tuyển nhanh: {item.job.title}</h4>
                          <div className="ai-rec-apply-grid">
                            <div>
                              <label className="form-label small fw-bold mb-1">CV nộp ứng tuyển</label>
                              <select
                                aria-label="CV nộp ứng tuyển"
                                value={applyCvId}
                                onChange={(event) => setApplyCvId(Number(event.target.value))}
                              >
                                {analyzedCvs.map((cv) => (
                                  <option key={cv.id} value={cv.id}>
                                    {cv.displayName} (v{cv.analysisVersion})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="form-label small fw-bold mb-1">Thư giới thiệu ngắn (tùy chọn)</label>
                              <textarea
                                placeholder="Giới thiệu ngắn gọn điểm mạnh hoặc kinh nghiệm phù hợp với vị trí này..."
                                value={coverLetter}
                                onChange={(event) => setCoverLetter(event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="ai-rec-apply-actions">
                            <button
                              type="button"
                              disabled={submittingApply}
                              onClick={() => setApplyingJobId(null)}
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              className="is-submit"
                              disabled={submittingApply || !applyCvId}
                              onClick={() => void handleApplySubmit(item)}
                            >
                              {submittingApply ? 'Đang gửi hồ sơ...' : 'Xác nhận ứng tuyển'}
                            </button>
                          </div>
                        </div>
                      )}
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

