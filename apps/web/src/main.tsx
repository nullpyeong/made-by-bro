import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// 디자인 시스템(SSOT): docs/design/tokens.css + docs/pages/app.css 를 그대로 사용
import './styles/tokens.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
