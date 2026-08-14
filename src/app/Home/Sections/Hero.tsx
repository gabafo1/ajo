
import Phone from "@/assets/mockup.svg";
import HeroImage from "@/assets/hero.png";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

function Hero() {
  return (
    <section className="relative sm:py-90 mt-4 flex h-fit max-w-7xl flex-col items-center gap-10 px-8 sm:gap-16 md:my-0 md:h-[84.9vh] md:flex-row md:gap-0 lg:px-12 xl:m-auto xl:gap-0 xl:overflow-hidden">
      <div className="sm:w-full md:w-3/6">
        <h1 className="mx-auto mb-8 w-[14ch] text-center text-4xl font-semibold text-gray-800 sm:text-5xl md:mx-0 md:text-left">
          Save Together,
          <br />
          <span className="font-bold leading-18">
            <span className="text-green-500">Grow</span> Together
          </span>
        </h1>
        <p className="m-auto w-[34ch] text-center text-gray-500 md:m-0 md:text-left">
            Alajo helps your savings group manage contributions, payouts, and records digitally and transparently.
        </p>
        <div className="mt-10 hidden justify-center space-x-2 sm:flex md:justify-normal">
            <Link
                role="button"
                href="/pricing" // Replace with the target URL or path
                className="flex gap-3 rounded-lg bg-zinc-900 px-4 py-3 text-white hover:bg-zinc-950 active:bg-zinc-800"
              >
               Get Started Saving <ArrowRight />
            </Link>
        </div>
      </div>
      <div className="md:w-3/6 xl:mb-12 xl:overflow-hidden">
        <Image
          className="right-0 m-auto w-72 xl:absolute xl:left-6 xl:right-0 xl:mt-32 xl:w-80"
          src={Phone}
          alt="Kobodrop app frame"
        />
        <Image
          className="hidden rounded-2xl xl:flex"
          src={HeroImage}
          alt="A woman happily using Kobodrop"
        />
      </div>
    </section>
  );
}

export default Hero;