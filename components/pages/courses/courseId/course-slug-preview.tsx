"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

export default function CoursePreview({
  thumbnail,
  previewVideo,
}: {
  thumbnail: string;
  previewVideo?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isYoutube = previewVideo ? isYoutubeUrl(previewVideo) : false;
  const previewSrc = previewVideo ? toYoutubeEmbedUrl(previewVideo) : "";

  return (
    <div className="relative w-full  h-[70vh] rounded-lg overflow-hidden">
      {/* Thumbnail */}
      <Image
        src={thumbnail}
        alt="Course Thumbnail"
        width={100}
        height={100}
        className="w-full h-full object-cover"
      />

      {/* Play Button if video exists */}
      {previewVideo ? (
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white" />
          </div>
        </motion.button>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center">
          <Play className="w-10 h-10 text-neon-blue mb-2" />
          <p className="text-gray-300">No preview available</p>
        </div>
      )}

      {/* Modal Preview */}
      {isOpen && previewVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Course Preview</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {isYoutube ? (
              <iframe
                src={`${previewSrc}?autoplay=1`}
                title="Course preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-[70vh]"
              />
            ) : (
              <video
                src={previewVideo}
                controls
                autoPlay
                className="w-full h-[70vh] object-cover"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
