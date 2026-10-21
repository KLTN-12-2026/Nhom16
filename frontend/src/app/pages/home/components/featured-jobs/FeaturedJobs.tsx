import { featuredJobs, type FeaturedJob } from '../../home.data'

function JobCard({ job }: { job: FeaturedJob }) {
  return (
    <article className="job-card">
      <div className="job-card__top">
        <span className={`job-logo ${job.logoClass}`} aria-hidden="true">{job.logo}</span>
        <button className="save-job" type="button" aria-label={`Lưu việc làm ${job.role}`}><i className="bi bi-bookmark" /></button>
      </div>
      <div className="job-card__heading"><p>{job.company}</p><h3><a href={`#job-${job.id}`}>{job.role}</a></h3></div>
      <div className="job-meta">
        <span><i className="bi bi-geo-alt" />{job.location}</span><span><i className="bi bi-briefcase" />{job.workMode}</span><span><i className="bi bi-cash-stack" />{job.salary}</span>
      </div>
      <div className="job-tags">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="job-card__footer">
        <div className="match-indicator" aria-label={`${job.match}% phù hợp`}><i className="bi bi-stars" /><strong>{job.match}% phù hợp</strong></div>
        <span>{job.postedAt}</span>
      </div>
    </article>
  )
}

export function FeaturedJobs() {
  return (
    <section id="featured-jobs" className="section-block jobs-section" aria-labelledby="jobs-title">
      <div className="container">
        <div className="section-heading section-heading--row">
          <div><span className="section-kicker">Cơ hội dành cho bạn</span><h2 id="jobs-title">Việc làm nổi bật</h2><p>Khám phá những vị trí mới nhất được tuyển chọn từ các doanh nghiệp.</p></div>
          <a className="section-link" href="#all-jobs">Xem tất cả việc làm <i className="bi bi-arrow-right" /></a>
        </div>
        <div className="row g-4">
          {featuredJobs.map((job) => <div className="col-md-6 col-xl-4" key={job.id}><JobCard job={job} /></div>)}
        </div>
      </div>
    </section>
  )
}
