"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const footerLinks = {
  platform: [
    { name: "Courses", href: "/courses" },
    { name: "Become a Tutor", href: "/become-a-tutor" },
    // { name: "Pricing", href: "/pricing" },
    // { name: "Success Stories", href: "/success-stories" },
  ],
  features: [
    { name: "AI Interview Coach", href: "/features/ai-interview" },
    { name: "LinkedIn Builder", href: "/features/linkedin-builder" },
    { name: "Live Mentorship", href: "/features/mentorship" },
    { name: "Project-Based Learning", href: "/features/projects" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    // { name: "Press", href: "/press" },
    // { name: "Blog", href: "/blog" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", color: "hover:text-blue-400" },
  { icon: Twitter, href: "#", color: "hover:text-sky-400" },
  { icon: Instagram, href: "#", color: "hover:text-pink-400" },
  { icon: Linkedin, href: "#", color: "hover:text-blue-600" },
  { icon: Youtube, href: "#", color: "hover:text-red-400" },
  { icon: Github, href: "#", color: "hover:text-gray-400" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-background to-gray-900/50">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Stay</span>{" "}
            <span className="text-gradient">Updated</span>
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get the latest courses, features, and learning tips delivered to
            your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              placeholder="Enter your email"
              className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
            />
            <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white hover-glow">
              Subscribe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        <Separator className="bg-white/10" />

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Image
                  src="/assets/standalone.png"
                  alt=""
                  width={100}
                  height={100}
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold text-gradient">
                  PalmTechnIQ
                </span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Changing education with AI-powered learning, expert mentorship,
                and cutting-edge technology. Your journey to success starts
                here.
              </p>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-neon-blue" />
                  support@palmtechniq.com
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-neon-blue" />
                  +234 (807) 956-8910
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-neon-blue" />
                  Lagos, NG
                </div>
              </div>
            </motion.div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(([category, links], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <h4 className="text-white font-semibold text-lg mb-6 capitalize">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-neon-blue transition-colors duration-300 hover:translate-x-1 inline-block">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Copyright */}
            <div className="flex items-center text-gray-300 mb-4 md:mb-0">
              <span>©{currentYear} PalmTechnIQ. Made with</span>
              <Heart className="w-4 h-4 mx-2 text-red-400 fill-current" />
              <span>for learners worldwide</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 transition-all duration-300 hover:scale-110 ${social.color}`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}>
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
