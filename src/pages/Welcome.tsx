import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import KButton from '@/components/KButton';
import { useAuth } from '@/contexts/AuthContext';
import { initHouseholdForNewUser } from '@/db/households';
import { supabase } from '@/services/supabase';

export default function Welcome() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    pseudo: '',
    password: '',
    birthDate: '',
    householdCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.pseudo.trim()) {
      newErrors.pseudo = 'Le pseudo est requis';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'La date de naissance est requise';
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.birthDate)) {
      newErrors.birthDate = 'Format invalide (JJ/MM/AAAA)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const [day, month, year] = formData.birthDate.split('/');
      const birthdateISO = `${year}-${month}-${day}`;

      await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthdate: birthdateISO,
      });

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (!newUser) throw new Error('Erreur lors de la création du compte');

      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await initHouseholdForNewUser(
        newUser.id,
        formData.householdCode || null,
        formData.pseudo
      );

      if (result.error) {
        setErrors({ householdCode: result.error });
        setLoading(false);
        return;
      }

      if (!result.householdId) {
        throw new Error('Le foyer n\'a pas pu être créé');
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({ general: error.message || 'Erreur lors de l\'inscription' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-k-background">
      <div className="max-w-mobile mx-auto p-6">
        <div className="flex justify-center my-4">
          <img src="/kifekoi logo.png" alt="kifékoi" className="h-20" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center py-4">Bienvenue !</h2>

        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Par exemple : Dupont"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.lastName ? 'border-2 border-red-500' : ''
              }`}
              required
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Par exemple : Marie"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.firstName ? 'border-2 border-red-500' : ''
              }`}
              required
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Adresse mail
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="exemple@email.com"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.email ? 'border-2 border-red-500' : ''
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="pseudo" className="block text-sm font-semibold text-gray-900 mb-2">
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              value={formData.pseudo}
              onChange={(e) => handleChange('pseudo', e.target.value)}
              placeholder="Par exemple : Marie75"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.pseudo ? 'border-2 border-red-500' : ''
              }`}
              disabled={loading}
              required
            />
            {errors.pseudo && (
              <p className="mt-1 text-sm text-red-600">{errors.pseudo}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Au moins 6 caractères"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.password ? 'border-2 border-red-500' : ''
              }`}
              disabled={loading}
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-semibold text-gray-900 mb-2">
              Date de naissance
            </label>
            <input
              id="birthDate"
              type="text"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              placeholder="JJ/MM/AAAA"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.birthDate ? 'border-2 border-red-500' : ''
              }`}
              disabled={loading}
              required
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="householdCode" className="block text-sm font-semibold text-gray-900 mb-2">
              Code foyer (facultatif)
            </label>
            <input
              id="householdCode"
              type="text"
              value={formData.householdCode}
              onChange={(e) => handleChange('householdCode', e.target.value)}
              placeholder="XXXXXX"
              className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 ${
                errors.householdCode ? 'border-2 border-red-500' : ''
              }`}
              disabled={loading}
            />
            {errors.householdCode && (
              <p className="mt-1 text-sm text-red-600">{errors.householdCode}</p>
            )}
          </div>

          <div className="pt-6">
            <KButton variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Inscription...' : 'M\'inscrire'}
            </KButton>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-k-orange font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
