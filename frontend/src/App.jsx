import { useAuth } from './context/AuthContext';
import ChatRoom from './components/Chat/ChatRoom';
import AuthPage from './components/AuthPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return user ? <ChatRoom /> : <AuthPage />;
}

export default App;
