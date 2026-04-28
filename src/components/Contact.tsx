import { motion } from 'motion/react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In Touch</h2>
          <p className="text-lg text-foreground/70 mb-12 max-w-xl mx-auto">
            Although I'm not currently looking for any new opportunities, my inbox is always open. 
            Whether you have a question or just want to say hi, I'll try my best to get back to you!
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="bg-primary/20 p-3 rounded-xl text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Email Me</h3>
                  <a href="mailto:hello@example.com" className="text-foreground/70 hover:text-primary transition-colors">
                    hello@example.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Socials</h3>
                  <div className="flex gap-4 mt-1">
                    <a href="#" className="text-foreground/70 hover:text-primary transition-colors">LinkedIn</a>
                    <a href="#" className="text-foreground/70 hover:text-primary transition-colors">Twitter</a>
                  </div>
                </div>
              </div>
            </div>
            
            <form className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  placeholder="Your Name" 
                  className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Your Email" 
                  className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">Message</label>
                <textarea 
                  id="message" 
                  rows={4} 
                  placeholder="Your Message" 
                  className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Send Message
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
