import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { createContext, useContext, type ReactNode } from 'react'

type ExecuteRecaptcha = (action: string) => Promise<string | null>

const RecaptchaContext = createContext<ExecuteRecaptcha>(async () => null)

function RecaptchaBridge({ children }: { children: ReactNode }) {
  const { executeRecaptcha } = useGoogleReCaptcha()
  return (
    <RecaptchaContext.Provider value={async (action) => executeRecaptcha ? executeRecaptcha(action) : null}>
      {children}
    </RecaptchaContext.Provider>
  )
}

export function ExternalAuthProvider({ children }: { children: ReactNode }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  let content = children

  if (recaptchaKey) {
    content = <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}><RecaptchaBridge>{content}</RecaptchaBridge></GoogleReCaptchaProvider>
  }
  if (googleClientId) content = <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>

  return <>{content}</>
}

export const useRecaptcha = () => useContext(RecaptchaContext)
export const isGoogleConfigured = () => Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
