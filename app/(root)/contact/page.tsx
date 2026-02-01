"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "support@cyberlearn.com",
      description: "We'll respond within 24 hours",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+1 (555) 123-4567",
      description: "Available 9 AM - 6 PM PST",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "San Francisco, CA",
      description: "123 Tech Avenue, SF 94105",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Get in</span>
              <br />
              <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Have questions? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}>
                <Card className="glass-card p-8 border-white/10 text-center hover:border-neon-blue/30 transition-all duration-300 hover-glow">
                  <method.icon className="w-12 h-12 text-neon-blue mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-lg text-gray-300 mb-2">{method.value}</p>
                  <p className="text-gray-400">{method.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Send us a Message
              </h2>
              <p className="text-lg text-gray-300">
                Fill out the form below and we'll get back to you soon
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}>
              <Card className="glass-card p-8 border-white/10">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Name
                      </label>
                      <Input
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Email
                      </label>
                      <Input
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Subject
                    </label>
                    <Input
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="glass-card border-white/20 focus:border-neon-blue/50 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Message
                    </label>
                    <textarea
                      placeholder="Tell us more..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={6}
                      className="glass-card border border-white/20 rounded-lg focus:border-neon-blue/50 text-white placeholder:text-gray-400 p-4 w-full bg-white/5 resize-none"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                    Send Message
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
