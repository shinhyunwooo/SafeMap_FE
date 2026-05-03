import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import SearchPage from './pages/SearchPage'
import RouteResultPage from './pages/RouteResultPage'
import NavigationPage from './pages/NavigationPage'

function App() {
  return (
    <BrowserRouter>
      <div className="h-full max-w-[390px] mx-auto relative overflow-hidden bg-white">
        <Routes>
          <Route path="/"            element={<MainPage />} />
          <Route path="/search"      element={<SearchPage />} />
          <Route path="/route-result" element={<RouteResultPage />} />
          <Route path="/navigation"  element={<NavigationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App