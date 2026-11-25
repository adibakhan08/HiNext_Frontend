import { BrandShowcase } from '../components/BrandShowcase';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px]">
      <BrandShowcase />
      <LoginForm />
    </main>
  );
}