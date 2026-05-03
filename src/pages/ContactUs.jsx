import React, { useEffect } from "react";
import { HiHome, HiPhone } from "react-icons/hi2";
import { MdEmail } from "react-icons/md";
import { motion } from "framer-motion";

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = "marketing@pinksurfing.com";
    const subject = encodeURIComponent(e.target.subject.value);
    const body = encodeURIComponent(
      `Name: ${e.target.name.value}\nEmail: ${e.target.email.value}\nMessage: ${e.target.message.value}`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start"
        >
          {/* Form Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-[#FF7004] to-[#ff9d52] bg-clip-text text-transparent">
                Let's make something unique together
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">
                Have a vision? We're here to help you bring it to life with precision and care.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Your Name
                  </label>
                  <input
                    name="name"
                    id="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF7004] dark:focus:border-[#FF7004] focus:ring-1 focus:ring-[#FF7004] outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Your Email
                  </label>
                  <input
                    name="email"
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF7004] dark:focus:border-[#FF7004] focus:ring-1 focus:ring-[#FF7004] outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Subject
                </label>
                <input
                  name="subject"
                  id="subject"
                  type="text"
                  required
                  placeholder="What are we building?"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF7004] dark:focus:border-[#FF7004] focus:ring-1 focus:ring-[#FF7004] outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Your Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  required
                  placeholder="Tell us more about your project..."
                  rows="5"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#FF7004] dark:focus:border-[#FF7004] focus:ring-1 focus:ring-[#FF7004] outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full md:w-auto px-8 py-4 bg-[#FF7004] hover:bg-[#e66503] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-colors duration-200 uppercase tracking-wider text-sm"
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>

          {/* Info Section */}
          <motion.div variants={itemVariants} className="lg:pl-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF7004] to-[#ff9d52] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-8 md:p-12 rounded-3xl bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-10">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Contact Us</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    We'd love to hear from you! Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10 text-[#FF7004]">
                      <HiHome className="text-2xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Office Address</h4>
                      <p className="text-slate-500 dark:text-slate-400">
                        840 West El Camino Suite 180,<br />
                        Mountain View, CA 94040
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10 text-[#FF7004]">
                      <MdEmail className="text-2xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Email Us</h4>
                      <a 
                        href="mailto:marketing@pinksurfing.com"
                        className="text-slate-500 dark:text-slate-400 hover:text-[#FF7004] transition-colors"
                      >
                        marketing@pinksurfing.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-4">
                  <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-semibold tracking-widest uppercase">
                    Available 24/7
                  </span>
                  <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-semibold tracking-widest uppercase">
                    Support Priority
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
