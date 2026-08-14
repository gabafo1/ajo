"use client";

import { Disclosure } from "@headlessui/react";
import { Menu, X } from "lucide-react";
import Alajo from "@/assets/alajo1.svg";
import ButtonLink from "@/app/Home/common/ButtonLink";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

function Nav() {
  const textLinkClasses =
    "font-semibold text-xl text-gray-500 hover:text-gray-900 active:text-gray-400";
  
  const navLinks = [
    { href: "#how_it_works", text: "How It Works" },
    { href: "#features", text: "Features" },
    { href: "#partners", text: "Partners" },
  ];

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          {/* Top Navbar */}
          <div className="flex h-[15vh] max-w-7xl items-center justify-between px-8 lg:px-12 xl:m-auto">
            <div className="flex items-center">
              <ButtonLink href="/">
                <Image
                  src={Alajo}
                  alt="Alajo logo"
                  className="w-[150px] border-none"
                  priority
                />
              </ButtonLink>
              <div className="ml-4 hidden items-center space-x-4 sm:ml-6 sm:flex lg:ml-8 lg:space-x-8">
                {navLinks.map((link, index) => (
                  <ButtonLink
                    key={index}
                    href={link.href}
                    className={textLinkClasses}
                  >
                    {link.text}
                  </ButtonLink>
                ))}
              </div>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              <SignedOut>
                <Link
                  role="button"
                  href="/pricing"
                  className="rounded-xl bg-gray-800 px-5 py-3 text-white hover:bg-green-500 active:bg-green-600 transition-colors inline-block"
                >
                  Get Started
                </Link>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="rounded-xl border-2 border-gray-800 px-5 py-3 font-semibold text-gray-800 hover:border-gray-900 active:border-gray-600 transition-colors"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-gray-800 px-5 py-3 text-white hover:bg-green-500 active:bg-green-600 transition-colors inline-block"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <Disclosure.Button className="rounded-md p-2 text-gray-500 hover:bg-gray-700 hover:text-white sm:hidden">
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              {open ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Disclosure.Button>
          </div>

          {/* Mobile Menu Panel */}
          <Disclosure.Panel className="space-y-2 px-4 pb-4 sm:hidden">
            {navLinks.map((link, index) => (
              <Disclosure.Button
                key={index}
                as="a"
                href={link.href}
                className="block w-full text-left py-2 font-semibold text-gray-700 hover:text-gray-900"
              >
                {link.text}
              </Disclosure.Button>
            ))}

            {/* Mobile Action Buttons */}
            <div className="mt-4 space-y-2">
              <SignedOut>
                <Link
                  role="button"
                  href="/pricing"
                  className="rounded-xl bg-gray-800 px-5 py-3 text-white hover:bg-green-500 active:bg-green-600 transition-colors inline-block"
                >
                  Get Started
                </Link>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="rounded-xl border-2 border-gray-800 px-5 py-3 text-center font-semibold text-gray-800 hover:border-gray-900 active:border-gray-600 transition-colors inline-block"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="block rounded-xl bg-gray-800 px-5 py-3 text-center text-white hover:bg-green-500 active:bg-green-600 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 py-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-sm font-semibold text-gray-700">Account</span>
                </div>
              </SignedIn>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export default Nav;