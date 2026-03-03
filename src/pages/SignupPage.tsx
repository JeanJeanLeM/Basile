import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { Mail, Chrome } from 'lucide-react';
import { isValidEmail, isValidPassword, VALIDATION_MESSAGES } from '../utils/validation';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!formData.email) newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    else if (!isValidEmail(formData.email)) newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
    if (!formData.password) newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    else if (!isValidPassword(formData.password)) newErrors.password = VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
    if (!formData.confirmPassword) newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_MISMATCH;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password);
      if (error) throw error;
      showToast('Inscription réussie. Vérifiez votre email si la confirmation est activée.', 'success');
      navigate('/planning');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : "Erreur lors de l'inscription";
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      showToast('Redirection vers Google...', 'info');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : "Erreur lors de l'inscription Google";
      showToast(msg, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Inscription</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              connectez-vous
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
              error={errors.email}
              placeholder="votre@email.com"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: undefined }); }}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
            <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
              {loading ? 'Inscription...' : (<><Mail className="w-4 h-4" />S'inscrire</>)}
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
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            {googleLoading ? 'Inscription...' : (<><Chrome className="w-5 h-5" />Continuer avec Google</>)}
          </Button>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
