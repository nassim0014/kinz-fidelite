import { JoinForm } from '@/components/card/JoinForm';

export const metadata = { title: 'Rejoindre' };

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <p className="text-center font-display text-4xl tracking-widest">KINZ</p>
      <h1 className="mt-4 text-center font-display text-2xl">Le Code KINZ</h1>
      <p className="mt-2 text-center text-sm">
        Un tampon par visite dès 40 TND, des récompenses aux nombres premiers, et 50 niveaux à
        gravir.
      </p>
      <div className="mt-6">
        <JoinForm />
      </div>
    </main>
  );
}
