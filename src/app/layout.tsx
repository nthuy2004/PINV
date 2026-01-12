import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    variable: '--font-inter',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'LearnHub - Tìm bạn học cùng',
    description: 'Ứng dụng giúp học sinh, sinh viên tìm bạn học dựa trên điểm chung',
    keywords: ['học tập', 'tìm bạn học', 'study buddy', 'sinh viên', 'học sinh'],
    authors: [{ name: 'LearnHub Team' }],
    openGraph: {
        title: 'LearnHub - Tìm bạn học cùng',
        description: 'Ứng dụng giúp học sinh, sinh viên tìm bạn học dựa trên điểm chung',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.variable} ${outfit.variable} font-sans`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
