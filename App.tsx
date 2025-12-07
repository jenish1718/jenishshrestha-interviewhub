import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

// Wrapper to conditionally render Footer only on non-auth pages if desired, 
// or just keep it everywhere. For this specific design, footers usually aren't on auth pages.
const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;