import HomeHero from "../components/home/HomeHero";
import QuickLinks from "../components/home/QuickLinks";
import PartyHighlight from "../components/home/PartyHighlight";
import SeoFeatures from "../components/home/SeoFeatures";
import Services from "../components/home/Services";
import TasteBox from "../components/home/TasteBox";
import FoodCategories from "../components/home/FoodCategories";
import TiffinSection from "../components/home/TiffinSection";
import CateringSection from "../components/home/CateringSection";
import SnacksSection from "../components/home/SnacksSection";
import VratSection from "../components/home/VratSection";
import SignatureDishes from "../components/home/SignatureDishes";
import Offers from "../components/home/Offers";
import YoutubeSection from "../components/home/YoutubeSection";
import WhyMithora from "../components/home/WhyMithora";
import OrderJourney from "../components/home/OrderJourney";
import Discovery from "../components/home/Discovery";
import FAQ from "../components/home/FAQ";
import LiveOrder from "../components/home/LiveOrder";
export default function Home() {
  return (
    <main>
      <HomeHero />
      <QuickLinks />
      <PartyHighlight />
      <SeoFeatures />
      <Services />
      <TasteBox />
      <FoodCategories />
      <TiffinSection />
      <CateringSection />
      <SnacksSection />
      <VratSection />
      <SignatureDishes />
      <Offers />
      <YoutubeSection />
      <WhyMithora />
      <OrderJourney />
      <Discovery />
      <FAQ />
      <LiveOrder />
    </main>
  );
}