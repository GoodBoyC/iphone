import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import VerificationPage from './pages/VerificationPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/confirm" element={<ConfirmationPage />} />
        <Route path="/nover/admin" element={<AdminPage />} />
        <Route path="*" element={
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center pt-16">
            <div className="text-center">
              <h1 className="text-4xl font-black text-white mb-4">404</h1>
              <p className="text-zinc-500 mb-6">Page not found</p>
              <a href="/" className="text-amber-400 hover:text-amber-300 font-medium">Return Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
