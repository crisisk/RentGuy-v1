import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthGuard, AuthSpinner, AccessDenied } from '../router/guards';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'guest';
}

/**
 * Beveiligde route component voor authenticatie en autorisatie
 * @param children Te renderen content bij toegang
 * @param requiredRole Optionele benodigde gebruikersrol
 */
export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allowed, isLoading, error, role, requiredRole: neededRole } = useAuthGuard(requiredRole);

  // Redirect logica voor niet-ingelogde gebruikers
  useEffect(() => {
    if (!isLoading && !allowed && !error && role === 'guest') {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [allowed, isLoading, error, navigate, location, role]);

  if (isLoading) {
    return <AuthSpinner />;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-700" role="alert">
        <h2 className="font-bold mb-2">Authenticatiefout</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!allowed) {
    return requiredRole ? (
      <AccessDenied requiredRole={neededRole} />
    ) : (
      <AccessDenied />
    );
  }

  return <>{children}</>;
};

/* Testscenario's:
1. Route zonder requiredRole:
   - Toegang voor alle ingelogde gebruikers
2. Route met requiredRole 'admin':
   - Alleen toegang voor admins
3. Directe navigatie naar route zonder login:
   - Redirect naar login met originele locatie
4. Gebruiker krijgt toegang na login:
   - Keert terug naar originele gevraagde route
5. Mobiele weergave:
   - Componenten zijn responsive en leesbaar op kleine schermen
*/