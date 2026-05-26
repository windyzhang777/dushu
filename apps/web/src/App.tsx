import { ErrorBoundary } from '@/common/ErrorBoundary';
import { ThemeProvider } from '@/common/theme-provider';
import { BookLibrary } from '@/pages/BookLibrary';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="sepia">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BookLibrary />} />
            {/* <Route path="/book/:id" element={<BookReader />} /> */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
