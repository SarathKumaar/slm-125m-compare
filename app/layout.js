import './globals.css';

export const metadata = {
  title: 'SLM-125M · Legal/Financial Chat',
  description:
    'A 125M-parameter small language model trained from scratch on US case law, SEC filings, and web text.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
