import { Github, Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-8 border-t border-white/10 bg-background">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-foreground/60 text-sm">
          © {new Date().getFullYear()} Shahnoza Erkinova. All rights reserved.
        </p>
        
        <div className="flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-foreground/60 hover:text-primary transition-colors">
            <span className="sr-only">GitHub</span>
            <Github className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-foreground/60 hover:text-primary transition-colors">
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-foreground/60 hover:text-primary transition-colors">
            <span className="sr-only">Twitter</span>
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
