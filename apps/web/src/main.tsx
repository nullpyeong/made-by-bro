import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// 디자인 시스템(SSOT): tokens.css(변수) → tailwind.css(유틸) → app.css(시맨틱, 점진 retire)
import './styles/tokens.css'
import './styles/tailwind.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
