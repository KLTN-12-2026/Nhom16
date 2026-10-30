import { jobCategories } from '../../home.data'

export function JobCategories() {
  return (
    <section id="categories" className="section-block categories-section" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-heading section-heading--row">
          <div><span className="section-kicker">Khám phá cơ hội</span><h2 id="categories-title">Ngành nghề được quan tâm</h2><p>Tìm kiếm công việc theo thế mạnh và định hướng phát triển của bạn.</p></div>
          <a className="section-link" href="#all-categories">Tất cả ngành nghề <i className="bi bi-arrow-right" /></a>
        </div>
        <div className="category-grid">
          {jobCategories.map((category) => (
            <a className="category-card" href={`/jobs?category=${category.code}`} key={category.code}>
              <span className={`category-icon category-icon--${category.tone}`}><i className={`bi ${category.icon}`} /></span>
              <span className="category-copy"><strong>{category.name}</strong><small>{category.jobs}</small></span>
              <i className="bi bi-arrow-up-right category-arrow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
