import './globals.css';

export const metadata = {
  title: 'SLM-125M · Closed-book vs Grounded',
  description:
    'Compare two 125M-parameter models trained from scratch on US case law, SEC filings, and web text: a closed-book model vs a grounded / RAFT model.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
