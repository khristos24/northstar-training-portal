import Script from 'next/script';
import { loginMarkup } from '../../lib/login-view';
export const metadata = { title: 'Sign in' };
export default function Login() {
  return <><div dangerouslySetInnerHTML={{ __html: loginMarkup() }}/><Script src="/login.js" strategy="afterInteractive"/></>;
}
