import CTA from "./Home/Sections/CTA";
import FeaturesSection from "./Home/Sections/Features";
import Hero from "./Home/Sections/Hero";
import Steps from "./Home/Sections/Steps";
import Nav from "./Home/Sections/Nav";


export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <Steps />
      <FeaturesSection />
      <CTA />
    </div>

  )
}
