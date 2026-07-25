import './globals.css';

export const metadata = {
  title: '125M vs Gemma 2B · Closed-book vs Grounded',
  description:
    'Compare four fine-tunes across a from-scratch 125M model and Gemma 2B: closed-book vs grounded / RAFT, on legal + financial QA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
