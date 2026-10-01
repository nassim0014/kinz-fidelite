import { LoginForm } from '@/components/staff/LoginForm';

export const metadata = { title: 'Connexion équipe' };

export default function StaffLoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center font-display text-2xl">Espace équipe KINZ</h1>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
