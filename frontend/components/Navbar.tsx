// components/Navbar.tsx
'use client';

import { ShieldCheck, LogIn, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react'; // Import Menu and Transition
import { Fragment } from 'react'; // Import Fragment

const Navbar = () => {
  // Simple state to simulate login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    // Keep the Zinc navbar style
    <nav className="w-full bg-zinc-950 sticky top-0 z-50 shadow-md shadow-zinc-900/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title (Same) */}
          <Link href="/" className="flex items-center gap-2 text-zinc-100 hover:text-zinc-300 transition-colors">
            <ShieldCheck className="w-6 h-6 text-zinc-400" />
            <span className="font-semibold text-lg">ScamShield AI</span>
          </Link>

          {/* --- NEW User Dropdown Menu --- */}
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                {/* The button that opens the dropdown (User Icon) */}
                <Menu.Button className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-zinc-500 transition-colors">
                  <UserCircle className="w-6 h-6" />
                </Menu.Button>
              </div>

              {/* The Dropdown Panel with Transition */}
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-zinc-700 rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1 ">
                    {isLoggedIn ? (
                      // Logout Item
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-zinc-700 text-white' : 'text-zinc-300'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                          >
                            <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    ) : (
                      // Login Item
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogin}
                            className={`${
                              active ? 'bg-zinc-700 text-white' : 'text-zinc-300'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                          >
                            <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                            Login
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                  {/* Optional: Add more items here if needed */}
                  {/* <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button className={`${ active ? 'bg-zinc-700 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}>
                           <Settings className="mr-2 h-5 w-5" aria-hidden="true" /> Settings
                         </button>
                       )}
                     </Menu.Item>
                  </div> */}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          {/* --- End User Dropdown Menu --- */}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;