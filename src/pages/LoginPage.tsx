import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { Lock, Chrome } from 'lucide-react';
import { isValidEmail, VALIDATION_MESSAGES } from '../utils/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    else if (!isValidEmail(formData.email)) newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
    if (!formData.password) newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      showToast('Connexion réussie', 'success');
      navigate('/planning');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur lors de la connexion';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      showToast('Redirection vers Google...', 'info');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur lors de la connexion Google';
      showToast(msg, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              créez un compte
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              placeholder="votre@email.com"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
              {loading ? 'Connexion...' : (<><Lock className="w-4 h-4" />Se connecter</>)}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            {googleLoading ? 'Connexion...' : (<><Chrome className="w-5 h-5" />Continuer avec Google</>)}
          </Button>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
