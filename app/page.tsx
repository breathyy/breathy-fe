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
              <Button href="/register" className="mt-8 px-8 py-3 text-lg">
                Daftar Sekarang
              </Button>
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
