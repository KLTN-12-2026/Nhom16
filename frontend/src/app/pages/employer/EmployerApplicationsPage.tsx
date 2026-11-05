import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  downloadApplicationCvApi,
  toggleFavoriteCandidateApi,
  updateApplicationStatusApi,
  type ApplicationData,
} from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const statusMeta: Record<string, { label: string; icon: string; tone: string }> = {
  RECEIVED: { label: 'Đã tiếp nhận', icon: 'bi-inbox', tone: 'blue' },
  REVIEWING: { label: 'Đang xem xét', icon: 'bi-search', tone: 'amber' },
  INTERVIEW: { label: 'Phỏng vấn', icon: 'bi-camera-video', tone: 'violet' },
  OFFER: { label: 'Đề nghị nhận việc', icon: 'bi-patch-check', tone: 'green' },
  REJECTED: { label: 'Từ chối', icon: 'bi-x-circle', tone: 'red' },
}

const pipeline = ['RECEIVED', 'REVIEWING', 'INTERVIEW', 'OFFER']

interface FilterForm {
  search: string
  status: string
}

export default function EmployerApplicationsPage() {
  const dispatch = useAppDispatch()
  const { employerApplications: items, error: storeError, loading } = useAppSelector((state) => state.recruitment)
  const [localError, setLocalError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const { register, watch, reset } = useForm<FilterForm>({ defaultValues: { search: '', status: '' } })
  const search = watch('search').trim().toLowerCase()
  const status = watch('status')
  const error = localError || storeError
  const load = () => dispatch(recruitmentActions.employerApplicationsLoad())

  useEffect(() => { load() }, [dispatch])

  const counts = useMemo(() => Object.keys(statusMeta).reduce<Record<string, number>>((result, key) => {
    result[key] = items.filter((item) => item.status === key).length
    return result
  }, {}), [items])

  const filteredItems = useMemo(() => items.filter((item) => {
    const keyword = `${item.candidate?.fullName || ''} ${item.candidate?.email || ''} ${item.job.title} ${item.cv.displayName}`.toLowerCase()
    return (!status || item.status === status) && (!search || keyword.includes(search))
  }), [items, search, status])

  const update = async (item: ApplicationData, nextStatus: string) => {
    setBusyId(item.id)
    setLocalError('')
    setFeedback('')
    try {
      await updateApplicationStatusApi(item.id, nextStatus)
      setFeedback(`Đã chuyển ${item.candidate?.fullName || 'ứng viên'} sang “${statusMeta[nextStatus]?.label || nextStatus}”.`)
      load()
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ ứng tuyển.')
    } finally {
      setBusyId(null)
    }
  }

  const favorite = async (item: ApplicationData) => {
    if (!item.candidate) return
    setBusyId(item.id)
    setLocalError('')
    try {
      await toggleFavoriteCandidateApi(item.candidate.id)
      setFeedback(`Đã cập nhật danh sách ứng viên yêu thích.`)
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Không thể lưu ứng viên yêu thích.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="employer-applications-page">
      <div className="container">
        <header className="application-manager-header">
          <div>
            <span className="application-manager-kicker">Trung tâm ứng viên</span>
            <h1>Quản lý hồ sơ ứng tuyển</h1>
            <p>Theo dõi và xử lý ứng viên xuyên suốt quy trình tuyển dụng.</p>
          </div>
          <div className="application-manager-total"><i className="bi bi-people" /><span><strong>{items.length}</strong><small>Tổng hồ sơ</small></span></div>
        </header>

        <section className="application-pipeline" aria-label="Tổng quan quy trình tuyển dụng">
          {pipeline.map((key) => {
            const meta = statusMeta[key]
            return <button className={`application-stage application-stage--${meta.tone}${status === key ? ' is-active' : ''}`} type="button" key={key} onClick={() => reset({ search: watch('search'), status: status === key ? '' : key })}>
              <span><i className={`bi ${meta.icon}`} /></span><div><small>{meta.label}</small><strong>{counts[key] || 0}</strong></div><i className="bi bi-chevron-right" />
            </button>
          })}
          <button className={`application-stage application-stage--red${status === 'REJECTED' ? ' is-active' : ''}`} type="button" onClick={() => reset({ search: watch('search'), status: status === 'REJECTED' ? '' : 'REJECTED' })}>
            <span><i className="bi bi-x-circle" /></span><div><small>Không phù hợp</small><strong>{counts.REJECTED || 0}</strong></div>
          </button>
        </section>

        {(error || feedback) && <div className={`application-manager-message${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}><i className={`bi ${error ? 'bi-exclamation-triangle' : 'bi-check-circle'}`} /><span>{error || feedback}</span><button type="button" aria-label="Đóng thông báo" onClick={() => { setLocalError(''); setFeedback('') }}><i className="bi bi-x-lg" /></button></div>}

        <section className="application-workspace">
          <div className="application-toolbar">
            <div><h2>Danh sách ứng viên</h2><span>{filteredItems.length} hồ sơ phù hợp</span></div>
            <form>
              <label className="application-search"><i className="bi bi-search" /><input placeholder="Tìm ứng viên, email, vị trí hoặc CV..." {...register('search')} /></label>
              <label className="application-filter"><i className="bi bi-funnel" /><select aria-label="Lọc trạng thái" {...register('status')}><option value="">Tất cả trạng thái</option>{Object.entries(statusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
              {(search || status) && <button className="application-clear-filter" type="button" onClick={() => reset()}>Xóa lọc</button>}
            </form>
          </div>

          {loading && <div className="application-state"><span className="spinner-border text-success" /><p>Đang tải hồ sơ ứng viên...</p></div>}

          {!loading && filteredItems.length === 0 && <div className="application-state"><span><i className="bi bi-person-vcard" /></span><h3>{items.length ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có ứng viên mới'}</h3><p>{items.length ? 'Hãy thử thay đổi từ khóa hoặc trạng thái đang lọc.' : 'Hồ sơ sẽ xuất hiện tại đây khi ứng viên nộp đơn vào tin tuyển dụng.'}</p>{items.length > 0 && <button type="button" onClick={() => reset()}>Xóa bộ lọc</button>}</div>}

          {!loading && filteredItems.length > 0 && <div className="application-candidate-list">
            {filteredItems.map((item) => {
              const meta = statusMeta[item.status] || { label: item.status, icon: 'bi-circle', tone: 'gray' }
              const skills = Array.isArray(item.cv.skills) ? item.cv.skills : []
              const fullName = item.candidate?.fullName || 'Ứng viên'
              const isBusy = busyId === item.id
              const stageIndex = pipeline.indexOf(item.status)
              return <article className="application-candidate-card" key={item.id}>
                <div className="application-candidate-card__identity">
                  <div className="application-candidate-avatar">{fullName.trim().charAt(0).toUpperCase()}</div>
                  <div><span className={`application-status application-status--${meta.tone}`}><i className={`bi ${meta.icon}`} />{meta.label}</span><h3>{fullName}</h3><p>{item.cv.headline || 'Ứng viên tìm việc'}</p><a href={`mailto:${item.candidate?.email}`}>{item.candidate?.email}</a></div>
                </div>

                <div className="application-candidate-card__details">
                  <div className="application-job-context"><span><i className="bi bi-briefcase" />Ứng tuyển vị trí</span><strong>{item.job.title}</strong><small><i className="bi bi-calendar3" /> Nộp ngày {new Date(item.appliedAt).toLocaleDateString('vi-VN')}</small></div>
                  <div className="application-cv-context"><span><i className="bi bi-file-earmark-person" />Hồ sơ sử dụng</span><strong>{item.cv.displayName}</strong><button type="button" onClick={() => void downloadApplicationCvApi(item).catch((cause) => setLocalError(cause.message))}><i className="bi bi-download" /> Tải CV</button></div>
                  {skills.length > 0 && <div className="application-skills">{skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}{skills.length > 5 && <span>+{skills.length - 5}</span>}</div>}
                  {item.coverLetter && <blockquote><i className="bi bi-quote" />{item.coverLetter}</blockquote>}
                </div>

                <div className="application-candidate-card__workflow">
                  <div className="application-mini-pipeline" aria-label="Tiến trình ứng viên">{pipeline.map((key, index) => <span className={item.status === 'REJECTED' ? '' : index <= stageIndex ? 'is-complete' : ''} title={statusMeta[key].label} key={key} />)}</div>
                  <div className="application-primary-actions">
                    {item.status === 'RECEIVED' && <button className="application-action application-action--primary" type="button" disabled={isBusy} onClick={() => void update(item, 'REVIEWING')}><i className="bi bi-search" />Bắt đầu xem xét</button>}
                    {['RECEIVED', 'REVIEWING'].includes(item.status) && <button className="application-action application-action--primary" type="button" disabled={isBusy} onClick={() => void update(item, 'INTERVIEW')}><i className="bi bi-camera-video" />Mời phỏng vấn</button>}
                    {['REVIEWING', 'INTERVIEW'].includes(item.status) && <button className="application-action application-action--primary" type="button" disabled={isBusy} onClick={() => void update(item, 'OFFER')}><i className="bi bi-send-check" />Gửi đề nghị</button>}
                    {item.status === 'OFFER' && <span className="application-complete-label"><i className="bi bi-check2-circle" />Đã gửi đề nghị nhận việc</span>}
                  </div>
                  <div className="application-secondary-actions">
                    {item.candidate && <button type="button" disabled={isBusy} onClick={() => void favorite(item)}><i className="bi bi-heart" />Yêu thích</button>}
                    {!['OFFER', 'REJECTED'].includes(item.status) && <button className="is-danger" type="button" disabled={isBusy} onClick={() => void update(item, 'REJECTED')}><i className="bi bi-x-circle" />Từ chối</button>}
                  </div>
                </div>
              </article>
            })}
          </div>}
        </section>
      </div>
    </main>
  )
}
