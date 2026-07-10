import Navbar from '@/components/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Discography from '@/components/sections/Discography';
import VideoSection from '@/components/sections/VideoSection';
import Live from '@/components/sections/Live';
import Socials from '@/components/sections/Socials';
import Merch from '@/components/sections/Merch';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/Footer';
import NewReleasePopup from '@/components/NewReleasePopup';

export default function Home() {
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
      <Contact />
      <Footer />
    </main>
  );
}
