import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { listJobCategoriesApi, type JobCategory } from '../../apis/job'
import {
  createEmployerJobApi,
  getEmployerJobApi,
  updateEmployerJobApi,
  uploadJobJdApi,
  type EmployerJobInput,
} from '../../apis/recruitment'

interface FormData
  extends Omit<EmployerJobInput, 'categoryId' | 'requirements' | 'benefits' | 'skills'> {
  categoryId: string
  requirementsText: string
  benefitsText: string
  skillsText: string
  jdFile?: FileList
}

const splitItems = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

export default function EmployerJobFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      workMode: 'OFFICE',
      experienceLevel: 'NONE',
      employmentType: 'FULL_TIME',
      positionLevel: 'STAFF',
      publish: false,
    },
  })

  const values = watch()
  const completionItems = useMemo(
    () => [
      { label: 'Thông tin vị trí', done: Boolean(values.title && values.categoryId && values.location) },
      { label: 'Mức lương & điều kiện', done: Boolean(values.deadline && values.employmentType) },
      { label: 'Mô tả công việc', done: Boolean(values.description && values.description.length >= 20) },
      { label: 'Yêu cầu ứng viên', done: Boolean(values.requirementsText) },
      { label: 'Quyền lợi & kỹ năng', done: Boolean(values.benefitsText && values.skillsText) },
    ],
    [values],
  )
  const completion = Math.round(
    (completionItems.filter((item) => item.done).length / completionItems.length) * 100,
  )

  useEffect(() => {
    listJobCategoriesApi()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setError('Không thể tải danh sách ngành nghề.'))
  }, [])

  useEffect(() => {
    if (!id) return
    getEmployerJobApi(id)
      .then((response) => {
        const job = response.data
        reset({
          categoryId: String(job.category.id),
          title: job.title,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          location: job.location,
          workMode: job.workMode,
          experienceLevel: job.experienceLevel,
          employmentType: job.employmentType,
          positionLevel: job.positionLevel,
          description: job.description,
          requirementsText: job.requirements.join('\n'),
          benefitsText: job.benefits.join('\n'),
          skillsText: job.tags.join(', '),
          deadline: job.deadline,
        })
      })
      .catch((cause) => setError(cause.message))
  }, [id, reset])

  const onSubmit = handleSubmit(async (formValues) => {
    try {
      setError('')
      const payload = {
        ...formValues,
        publish: !id && Boolean(formValues.publish),
        categoryId: Number(formValues.categoryId),
        salaryMin: formValues.salaryMin ? Number(formValues.salaryMin) : null,
        salaryMax: formValues.salaryMax ? Number(formValues.salaryMax) : null,
        requirements: splitItems(formValues.requirementsText),
        benefits: splitItems(formValues.benefitsText),
        skills: splitItems(formValues.skillsText),
      }
      const response = id
        ? await updateEmployerJobApi(Number(id), payload)
        : await createEmployerJobApi(payload)
      if (formValues.jdFile?.[0]) await uploadJobJdApi(response.data.id, formValues.jdFile[0])
      navigate('/employer/jobs')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu tin tuyển dụng.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  const submitAs = (intent: 'draft' | 'publish') => {
    setValue('publish', intent === 'publish')
  }

  return (
    <main className="employer-job-editor">
      <div className="container">
        <button className="job-editor-back" type="button" onClick={() => navigate('/employer/jobs')}>
          <i className="bi bi-arrow-left" /> Quay lại danh sách tin
        </button>

        <header className="job-editor-header">
          <div>
            <span className="job-editor-kicker">Trung tâm tuyển dụng</span>
            <h1>{id ? 'Chỉnh sửa tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}</h1>
            <p>Thông tin đầy đủ và rõ ràng giúp tin tuyển dụng tiếp cận đúng ứng viên hơn.</p>
          </div>
          <span className="job-editor-status"><i className="bi bi-pencil-square" /> Bản nháp</span>
        </header>

        {error && <div className="alert alert-danger job-editor-alert">{error}</div>}

        <form className="job-editor-layout" onSubmit={onSubmit}>
          <div className="job-editor-main">
            <section className="job-form-section">
              <div className="job-form-section__heading">
                <span className="job-form-section__number">1</span>
                <div><h2>Thông tin vị trí</h2><p>Giúp ứng viên nhận biết nhanh công việc đang tuyển.</p></div>
              </div>
              <div className="job-form-grid job-form-grid--2">
                <label className="job-field job-field--wide">
                  <span>Chức danh <b>*</b></span>
                  <input placeholder="Ví dụ: Frontend Developer" {...register('title', { required: true, minLength: 5 })} />
                  {errors.title && <small>Vui lòng nhập chức danh ít nhất 5 ký tự.</small>}
                </label>
                <label className="job-field">
                  <span>Ngành nghề <b>*</b></span>
                  <select {...register('categoryId', { required: true })}>
                    <option value="">Chọn ngành nghề</option>
                    {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                  {errors.categoryId && <small>Vui lòng chọn ngành nghề.</small>}
                </label>
                <label className="job-field">
                  <span>Địa điểm làm việc <b>*</b></span>
                  <input placeholder="Ví dụ: Hải Châu, Đà Nẵng" {...register('location', { required: true })} />
                  {errors.location && <small>Vui lòng nhập địa điểm làm việc.</small>}
                </label>
              </div>
            </section>

            <section className="job-form-section">
              <div className="job-form-section__heading">
                <span className="job-form-section__number">2</span>
                <div><h2>Điều kiện tuyển dụng</h2><p>Thiết lập mức lương, hình thức và yêu cầu kinh nghiệm.</p></div>
              </div>
              <div className="job-form-grid job-form-grid--2">
                <div className="job-salary-group">
                  <span className="job-salary-group__label">Mức lương (VNĐ)</span>
                  <div><label className="job-field"><span>Từ</span><input type="number" min="0" placeholder="10.000.000" {...register('salaryMin')} /></label><span className="job-salary-separator">—</span><label className="job-field"><span>Đến</span><input type="number" min="0" placeholder="20.000.000" {...register('salaryMax')} /></label></div>
                </div>
                <label className="job-field"><span>Hạn nhận hồ sơ <b>*</b></span><input type="date" {...register('deadline', { required: true })} />{errors.deadline && <small>Vui lòng chọn hạn nhận hồ sơ.</small>}</label>
                <label className="job-field"><span>Hình thức làm việc</span><select {...register('workMode')}><option value="OFFICE">Tại văn phòng</option><option value="HYBRID">Kết hợp (Hybrid)</option><option value="REMOTE">Làm việc từ xa</option></select></label>
                <label className="job-field"><span>Kinh nghiệm</span><select {...register('experienceLevel')}><option value="NONE">Không yêu cầu</option><option value="1_2">1 - 2 năm</option><option value="2_5">2 - 5 năm</option><option value="OVER_5">Trên 5 năm</option></select></label>
                <label className="job-field"><span>Loại công việc</span><select {...register('employmentType')}><option value="FULL_TIME">Toàn thời gian</option><option value="PART_TIME">Bán thời gian</option><option value="INTERNSHIP">Thực tập</option><option value="CONTRACT">Hợp đồng</option></select></label>
                <label className="job-field"><span>Cấp bậc</span><select {...register('positionLevel')}><option value="INTERN">Thực tập sinh</option><option value="STAFF">Nhân viên</option><option value="MANAGER">Quản lý</option></select></label>
              </div>
            </section>

            <section className="job-form-section">
              <div className="job-form-section__heading">
                <span className="job-form-section__number">3</span>
                <div><h2>Nội dung tuyển dụng</h2><p>Mô tả cụ thể để tăng chất lượng hồ sơ ứng tuyển.</p></div>
              </div>
              <div className="job-form-grid">
                <label className="job-field"><span>Mô tả công việc <b>*</b></span><textarea rows={6} placeholder="Mô tả vai trò, nhiệm vụ và phạm vi công việc..." {...register('description', { required: true, minLength: 20 })} />{errors.description && <small>Nội dung mô tả cần ít nhất 20 ký tự.</small>}</label>
                <div className="job-form-grid job-form-grid--2">
                  <label className="job-field"><span>Yêu cầu ứng viên <b>*</b></span><em>Mỗi yêu cầu trên một dòng</em><textarea rows={7} placeholder={'Tốt nghiệp chuyên ngành liên quan\nCó kinh nghiệm ReactJS...'} {...register('requirementsText', { required: true })} />{errors.requirementsText && <small>Vui lòng nhập yêu cầu ứng viên.</small>}</label>
                  <label className="job-field"><span>Quyền lợi <b>*</b></span><em>Mỗi quyền lợi trên một dòng</em><textarea rows={7} placeholder={'Thưởng hiệu suất\nBảo hiểm đầy đủ...'} {...register('benefitsText', { required: true })} />{errors.benefitsText && <small>Vui lòng nhập quyền lợi.</small>}</label>
                </div>
                <label className="job-field"><span>Kỹ năng cần có <b>*</b></span><em>Phân tách bằng dấu phẩy</em><input placeholder="ReactJS, TypeScript, REST API" {...register('skillsText', { required: true })} />{errors.skillsText && <small>Vui lòng nhập ít nhất một kỹ năng.</small>}</label>
              </div>
            </section>

            <section className="job-form-section job-form-section--upload">
              <div className="job-form-section__heading">
                <span className="job-form-section__number">4</span>
                <div><h2>Tài liệu mô tả công việc</h2><p>Đính kèm JD để ứng viên có thể xem thông tin chi tiết.</p></div>
              </div>
              <label className="job-file-drop">
                <i className="bi bi-cloud-arrow-up" />
                <strong>Chọn file JD từ máy tính</strong>
                <span>Hỗ trợ PDF, DOCX · dung lượng tối đa 5 MB</span>
                <input type="file" accept=".pdf,.docx" {...register('jdFile')} />
              </label>
            </section>

            <div className="job-editor-actions">
              <button type="button" className="job-btn job-btn--ghost" onClick={() => navigate('/employer/jobs')}>Hủy</button>
              <div>
                {!id && <button type="submit" className="job-btn job-btn--secondary" disabled={isSubmitting} onClick={() => submitAs('draft')}><i className="bi bi-save" /> Lưu bản nháp</button>}
                <button type="submit" className="job-btn job-btn--primary" disabled={isSubmitting} onClick={() => submitAs('publish')}>
                  {isSubmitting ? 'Đang lưu...' : id ? 'Lưu thay đổi' : 'Đăng tin tuyển dụng'} <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          </div>

          <aside className="job-editor-sidebar">
            <div className="job-progress-card">
              <div className="job-progress-card__top"><span>Mức độ hoàn thiện</span><strong>{completion}%</strong></div>
              <div className="job-progress-track"><span style={{ width: `${completion}%` }} /></div>
              <ul>{completionItems.map((item) => <li className={item.done ? 'is-done' : ''} key={item.label}><i className={`bi ${item.done ? 'bi-check-circle-fill' : 'bi-circle'}`} /> {item.label}</li>)}</ul>
            </div>
            <div className="job-tip-card"><i className="bi bi-stars" /><div><strong>Mẹo viết tin hiệu quả</strong><p>Tiêu đề rõ ràng, mức lương minh bạch và mô tả cụ thể giúp tăng tỷ lệ ứng tuyển phù hợp.</p></div></div>
            <div className="job-review-card"><i className="bi bi-shield-check" /><div><strong>Tin tuyển dụng được kiểm duyệt</strong><p>Nội dung sẽ được kiểm tra để đảm bảo chất lượng trước khi hiển thị.</p></div></div>
          </aside>
        </form>
      </div>
    </main>
  )
}
