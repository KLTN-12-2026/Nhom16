import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { CatalogItem } from '../../apis/admin/admin-management.api'
import { adminActions } from '../../modules/admin/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

type CatalogForm = { name: string; code: string; legalReference: string }
type CatalogType = 'INDUSTRY' | 'SKILL' | 'POSITION'

const tabs: Record<CatalogType, string> = {
  INDUSTRY: 'Ngành nghề',
  SKILL: 'Kỹ năng',
  POSITION: 'Vị trí',
}

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch()
  const { catalogs, loading, error, message } = useAppSelector((state) => state.admin)
  const [type, setType] = useState<CatalogType>('INDUSTRY')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CatalogForm>()

  useEffect(() => {
    dispatch(adminActions.catalogsLoad())
  }, [dispatch])

  const catalogMap: Record<CatalogType, CatalogItem[]> = {
    INDUSTRY: catalogs.industries,
    SKILL: catalogs.skills,
    POSITION: catalogs.positions,
  }
  const items = catalogMap[type]
  const activeCount = items.filter((item) => item.active).length

  const submit = handleSubmit((form) => {
    dispatch(adminActions.catalogCreate({
      type,
      name: form.name,
      ...(type === 'INDUSTRY' ? { code: form.code, legalReference: form.legalReference } : {}),
    }))
    reset()
  })

  return (
    <section className="admin-page admin-workspace admin-page--operational">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-header__eyebrow">Dữ liệu nền tảng</span>
          <h1>Danh mục hệ thống</h1>
          <p>Chuẩn hóa ngành nghề, kỹ năng và vị trí sử dụng xuyên suốt hệ thống tuyển dụng.</p>
        </div>
        <div className="admin-page-header__summary" aria-label="Thống kê danh mục">
          <span><strong>{items.length}</strong>Tổng mục</span>
          <span><strong>{activeCount}</strong>Đang dùng</span>
          <span><strong>{items.length - activeCount}</strong>Đã tắt</span>
        </div>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {message && <div className="admin-alert admin-alert--success">{message}</div>}

      <nav className="admin-tabs admin-tabs--compact" aria-label="Loại danh mục">
        {(Object.entries(tabs) as [CatalogType, string][]).map(([value, label]) => (
          <button type="button" className={type === value ? 'active' : ''} onClick={() => setType(value)} key={value}>
            {label}<span>{catalogMap[value].length}</span>
          </button>
        ))}
      </nav>

      <div className="admin-catalog-workspace">
        <form className="admin-compact-form" onSubmit={submit}>
          <div className="admin-compact-form__heading">
            <span className="admin-page-header__eyebrow">Thêm dữ liệu</span>
            <h2>{tabs[type]} mới</h2>
            <p>Tạo mục mới cho danh sách lựa chọn trong hệ thống.</p>
          </div>

          <label>
            Tên {tabs[type].toLowerCase()}
            <input {...register('name', { required: 'Vui lòng nhập tên.' })} placeholder={`Nhập tên ${tabs[type].toLowerCase()}`} />
          </label>
          {errors.name && <small className="text-danger">{errors.name.message}</small>}

          {type === 'INDUSTRY' && (
            <>
              <label>
                Mã ngành
                <input {...register('code', { required: 'Vui lòng nhập mã ngành.' })} placeholder="Ví dụ: CNTT" />
              </label>
              {errors.code && <small className="text-danger">{errors.code.message}</small>}
              <label>
                Căn cứ danh mục
                <input {...register('legalReference')} placeholder="Danh mục nghề nghiệp Việt Nam" />
              </label>
            </>
          )}

          <button className="admin-primary-button" disabled={loading} type="submit">
            <i className="bi bi-plus-lg" /> {loading ? 'Đang lưu...' : 'Tạo danh mục'}
          </button>
        </form>

        <div className="admin-table-shell">
          <div className="admin-table-shell__heading">
            <div>
              <span className="admin-page-header__eyebrow">{tabs[type]}</span>
              <h2>Danh sách hiện hành</h2>
            </div>
            <span>{items.length} mục</span>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Mã / Căn cứ</th>
                  <th>Trạng thái</th>
                  <th className="admin-table-actions-column">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="admin-table-primary">{item.name}</strong></td>
                    <td>{item.code || item.legalReference || '—'}</td>
                    <td>
                      <span className={`admin-status admin-status--${item.active ? 'active' : 'inactive'}`}>
                        {item.active ? 'Đang sử dụng' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="admin-table-actions-column">
                      <button
                        type="button"
                        className={`admin-toggle-button ${item.active ? '' : 'admin-toggle-button--restore'}`}
                        disabled={loading}
                        onClick={() => dispatch(adminActions.catalogToggle({ type, id: item.id, active: !item.active }))}
                      >
                        <i className={`bi ${item.active ? 'bi-pause-circle' : 'bi-arrow-counterclockwise'}`} />
                        {item.active ? 'Ngừng dùng' : 'Khôi phục'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && !items.length && (
                  <tr><td colSpan={4} className="admin-table-empty">Chưa có dữ liệu trong danh mục này.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
