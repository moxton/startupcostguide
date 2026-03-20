import { Suspense } from 'react';
import SubmitForm from './SubmitForm';

export const metadata = {
  title: 'Share What You Spent - Startup Cost Guide',
  description: 'Tell us what it actually cost to start your business. Anonymous, 60 seconds. Your real numbers help the next founder plan better.',
};

export default function SubmitPage() {
  return (
    <Suspense>
      <SubmitForm />
    </Suspense>
  );
}
