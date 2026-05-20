import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { SidebarProvider } from './context/SidebarContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/global.scss'

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <RouterProvider router={router} />
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
