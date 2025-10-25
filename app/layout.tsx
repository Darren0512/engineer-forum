
import './globals.css';
import React from 'react';

export const metadata = {
  title: '工程師資訊分享平台',
  description: 'Next.js + Firestore forum',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
