import ReactDOM from 'react-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Discography from '@/components/sections/Discography';
import VideoSection from '@/components/sections/VideoSection';
import Live from '@/components/sections/Live';
import Socials from '@/components/sections/Socials';
import Merch from '@/components/sections/Merch';
import Plugins from '@/components/sections/Plugins';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/Footer';
import NewReleasePopup from '@/components/NewReleasePopup';
import { HDR_ENV } from '@/lib/hdr';

export default function Home() {
  // Lance le téléchargement de l'environnement HDR dès le HTML, en parallèle
  // du bundle 3D, au lieu d'attendre que le canvas soit monté.
  ReactDOM.preload(HDR_ENV, { as: 'fetch', crossOrigin: 'anonymous' });

  return (
    <main className="relative">
      <NewReleasePopup />
      <Navbar />
      <Hero />
      <About />
      <Discography />
      <VideoSection />
      <Live />
      <Socials />
      <Merch />
      <Plugins />
      <Contact />
      <Footer />
    </main>
  );
}
