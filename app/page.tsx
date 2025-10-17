import Image from "next/image";
import { Navbar } from "../assets/assets";
import Button from "../assets/components/Button";

import mascot1 from "../assets/images/breathy/breathy1.png";
import mascot2 from "../assets/images/breathy/breathy2.png";
import mascot3 from "../assets/images/breathy/breathy3.png";
import mascot4 from "../assets/images/breathy/breathy4.png";
import phone from "../assets/images/phone.png"; 
import diamond1 from "../assets/images/diamond1.png";
import diamond2 from "../assets/images/diamond2.png";
import styles from './page.module.css'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-2 text-center">
          <div className="relative inline-block mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg, #B7285C 0%, #FE61A2 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Investigasi Dahakmu
              </span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg, #B7285C 0%, #FE61A2 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                dengan Breathy
              </span>
            </h1>

            {/* diamonds around title */}
            <Image src={diamond1} alt="diamond" width={28} height={28} style={{ position: 'absolute', left: -36, top: 12 }} />
            <Image src={diamond2} alt="diamond" width={36} height={36} style={{ position: 'absolute', right: -44, top: -18 }} />
          </div>

          <p className="mt-6 text-gray-600 text-lg">Asisten Pintar untuk Kesehatan Pernapasan.</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              href="/register"
              className="px-10 py-3 text-lg font-semibold shadow-[0_12px_24px_rgba(252,76,150,0.35)] hover:shadow-[0_16px_32px_rgba(252,80,154,0.4)]"
            >
              Daftar Sekarang
            </Button>
            <a
              href="https://wa.me/6288980872764"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-200"
              style={{
                backgroundImage: "linear-gradient(120deg, #FC4C96 0%, #FF99C0 50%, #FC509A 100%)",
                boxShadow: "0 8px 0 rgba(0,0,0,0.06), inset 0 -6px 0 rgba(0,0,0,0.06)",
              }}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 2a9.94 9.94 0 00-8.94 14.48L2 22l5.66-1.92A10 10 0 1012 2zm0 18a7.94 7.94 0 01-4.07-1.12l-.29-.17-3.36 1.14 1.12-3.27-.18-.3A7.94 7.94 0 1112 20zm4.38-5.18c-.24-.12-1.43-.7-1.65-.78s-.38-.12-.54.12-.61.78-.75.94-.27.18-.51.06a6.5 6.5 0 01-1.91-1.18 7 7 0 01-1.29-1.62c-.13-.24 0-.37.1-.49s.24-.28.36-.42a1.62 1.62 0 00.24-.4.45.45 0 000-.42c-.06-.12-.54-1.3-.75-1.79s-.4-.42-.54-.43h-.45a.86.86 0 00-.61.28 2.55 2.55 0 00-.8 1.9 4.44 4.44 0 001 2.35 10.17 10.17 0 003.9 3.18 12.59 12.59 0 001.29.48 3.09 3.09 0 001.42.09 2.32 2.32 0 001.52-1.08 1.9 1.9 0 00.13-1.08c-.05-.09-.22-.15-.46-.27z" />
                </svg>
              </span>
              <span>WA Bot</span>
            </a>
          </div>
        </div>

        {/* decorative background: large semicircle at bottom + two outline rings */}
        <div className="pointer-events-none">
          {/* semicircle (large, sits under the page bottom) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -600,
              width: 1200,
              height: 900,
              borderTopLeftRadius: '50%',
              borderTopRightRadius: '50%',
              background: '#FED6DF',
              opacity: 0.95,
              zIndex: 0,
            }}
          />

          {/* two centered outline rings (larger, border-only) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -760,
              width: 1400,
              height: 1100,
              borderRadius: '50%',
              border: '2px solid rgba(254,214,223,0.38)',
              boxSizing: 'border-box',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -840,
              width: 1600,
              height: 1250,
              borderRadius: '50%',
              border: '2px solid rgba(254,214,223,0.28)',
              boxSizing: 'border-box',
              zIndex: 0,
            }}
          />
        </div>
        

        {/* mascots and phone mock placed visually */}
        <div className="relative max-w-7xl mx-auto px-6 mt-0 lg:mt-0" style={{ height: 420 }}>
          <div className="absolute left-8 bottom-6">
            <div className={styles.mascot}>
              <Image src={mascot1} alt="mascot" width={260} height={160} />
            </div>
          </div>
          <div className="absolute left-40 bottom-50">
            <div className={`${styles.mascot} ${styles['mascot-small']}`}>
              <Image src={mascot2} alt="mascot" width={240} height={170} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className={`w-[320px] h-[560px] flex items-center justify-center overflow-hidden ${styles.phone}`}>
              <Image src={phone} alt="phone" width={360} height={500} />
            </div>
          </div>

          <div className="absolute right-44 bottom-50">
            <div className={`${styles.mascot} ${styles['mascot-right']}`}>
              <Image src={mascot3} alt="mascot" width={240} height={170} />
            </div>
          </div>
          <div className="absolute right-8 bottom-20">
            <div className={styles.mascot}>
              <Image src={mascot4} alt="mascot" width={220} height={140} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
