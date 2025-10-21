// components/Footer.tsx
const Footer = () => {
    const currentYear = new Date().getFullYear();
  
    return (
      // Zinc background, subtle padding
      <footer className="w-full bg-zinc-950 mt-auto py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center text-zinc-500 text-xs"> {/* Smaller text */}
          <p>&copy; {currentYear} ScamShield AI. All rights reserved.</p>
          {/* Optional: Add links here */}
           {/* <p className="mt-1">
             <a href="/privacy" className="hover:text-zinc-300">Privacy Policy</a> |
             <a href="/terms" className="hover:text-zinc-300">Terms of Service</a>
           </p> */}
        </div>
      </footer>
    );
  };
  
  export default Footer;