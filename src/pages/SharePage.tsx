import { Share2, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import { UI_MESSAGES } from '../utils/constants';

/** URL publique de l'app (Firebase Hosting en prod). Utilisée pour le partage. */
const SHARE_BASE_URL =
  import.meta.env.VITE_PUBLIC_URL || window.location.origin;

export default function SharePage() {
  const handleShare = async () => {
    const url = SHARE_BASE_URL;
    const title = 'Basile - Gestion de plans de cultures potagères';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: 'Découvrez Basile, une application pour gérer vos plans de cultures potagères !',
          url,
        });
      } catch (error) {
        // L'utilisateur a annulé le partage
        console.log('Partage annulé');
      }
    } else {
      // Fallback : copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(url);
        alert('Lien copié dans le presse-papier !');
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
      }
    }
  };

  const handleFeedback = () => {
    const email = 'contact@basile.app'; // À remplacer par votre email
    const subject = encodeURIComponent('Retour sur Basile');
    const body = encodeURIComponent('Bonjour,\n\n');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate">{UI_MESSAGES.SHARE_TITLE}</h1>
      </header>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Partager l'application</h2>
          <p className="text-gray-600 mb-4">
            Partagez Basile avec vos amis et votre famille pour les aider à
            gérer leurs propres plans de cultures potagères.
          </p>
          <Button onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Partager
          </Button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Envoyer un retour</h2>
          <p className="text-gray-600 mb-4">
            Vos commentaires et suggestions nous aident à améliorer Basile.
          </p>
          <Button
            variant="secondary"
            onClick={handleFeedback}
            className="flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {UI_MESSAGES.SHARE_FEEDBACK}
          </Button>
        </div>
      </div>
    </div>
  );
}
