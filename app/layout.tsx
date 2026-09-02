import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import './brand.css';
export async function generateMetadata():Promise<Metadata>{
 const host=(await headers()).get('host')||'';
 // Only the exact project subdomain is accepted; forwarded host headers are not used.
 const origin=/^taskflow-marcel\.[a-z0-9.-]+$/i.test(host)?new URL(`https://${host}`):undefined;
 return {title:'My Life — Your work, in focus',description:'A private workspace for projects, tasks, and small steps forward. Organize your work with boards, lists, calendars, subtasks, and notes.',metadataBase:origin,openGraph:{title:'My Life',description:'A little clarity. A lot of progress.',images:[{url:origin?new URL('/og.png',origin).href:'/og.png',width:1536,height:1024}]},twitter:{card:'summary_large_image',title:'My Life',description:'A little clarity. A lot of progress.',images:[origin?new URL('/og.png',origin).href:'/og.png']},icons:{icon:'/favicon.svg'}};
}
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
