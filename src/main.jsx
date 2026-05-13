import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'


createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-7ss74shg5ie3a0l5.us.auth0.com"
      clientId="3sxDi31vcDlJUI4DFYxVVmqMSER6JUD3"
      authorizationParams={{
        audience: "https://dev-7ss74shg5ie3a0l5.us.auth0.com/api/v2/",
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)