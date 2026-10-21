const workflowSteps = [
  { number: '01', icon: 'bi-cloud-arrow-up', title: 'Tải CV lên hệ thống', description: 'Hỗ trợ định dạng PDF và DOCX. Quá trình tải lên nhanh chóng và an toàn.' },
  { number: '02', icon: 'bi-cpu', title: 'AI phân tích hồ sơ', description: 'Hệ thống trích xuất kỹ năng, kinh nghiệm, học vấn và đánh giá chất lượng CV.' },
  { number: '03', icon: 'bi-bullseye', title: 'Nhận kết quả phù hợp', description: 'Xem điểm đánh giá, gợi ý cải thiện và danh sách việc làm phù hợp với hồ sơ.' },
]

export function AIWorkflow() {
  return (
    <section id="ai-workflow" className="section-block workflow-section" aria-labelledby="workflow-title">
      <div className="container">
        <div className="section-heading section-heading--center"><span className="section-kicker">Đơn giản và hiệu quả</span><h2 id="workflow-title">Từ CV đến cơ hội mới chỉ trong 3 bước</h2><p>Hệ thống giúp bạn hiểu rõ hồ sơ và tiếp cận công việc phù hợp mà không cần quy trình phức tạp.</p></div>
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <article className="workflow-card" key={step.number}>
              <span className="workflow-number">{step.number}</span><div className="workflow-icon"><i className={`bi ${step.icon}`} /></div><h3>{step.title}</h3><p>{step.description}</p>
              {index < workflowSteps.length - 1 && <i className="bi bi-arrow-right workflow-arrow" aria-hidden="true" />}
            </article>
          ))}
        </div>
        <div className="workflow-action"><a className="btn btn-primary btn-lg" href="#upload-cv"><i className="bi bi-upload" /> Phân tích CV miễn phí</a><span>Không yêu cầu thẻ thanh toán</span></div>
      </div>
    </section>
  )
}
