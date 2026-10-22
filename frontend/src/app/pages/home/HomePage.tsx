import { HeroSection } from './components/hero-section'
import { SiteFooter } from './components/site-footer'
import { SiteHeader } from './components/site-header'
import './home-page.scss'

function HomePage() {
  return (
    <div className="home-page">
      <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
      </main>
      <SiteFooter />
    </div>
  )
}

export default HomePage
