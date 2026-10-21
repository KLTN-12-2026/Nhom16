import { GoogleLogin } from '@react-oauth/google'

import { isGoogleConfigured } from '../../../../provider/external-auth-provider'

export function GoogleAuthButton({ onCredential }: { onCredential: (credential: string) => void }) {
  if (!isGoogleConfigured()) return <p className="auth-config-note">Đăng nhập Google sẽ khả dụng sau khi cấu hình Client ID.</p>
  return <div className="google-login"><GoogleLogin width="360" shape="pill" text="continue_with" onSuccess={(result) => result.credential && onCredential(result.credential)} onError={() => undefined} /></div>
}
