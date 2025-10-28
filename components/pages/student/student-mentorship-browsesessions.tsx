"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  MessageSquare,
  CalendarIcon,
  Star,
} from "lucide-react";
import { AvailableMentor } from "@/data/studentmentorship";


interface BrowseMentorsProps {
  mentors: AvailableMentor[];
  userId: string;
}

export function BrowseMentors({ mentors, userId }: BrowseMentorsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise.some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ||
                         (mentor.bio && mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesExpertise = selectedExpertise.length === 0 || 
                           selectedExpertise.some(expertise => 
                             mentor.expertise.includes(expertise)
                           );
    
    return matchesSearch && matchesExpertise;
  });

  const allExpertise = Array.from(
    new Set(mentors.flatMap(mentor => mentor.expertise))
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search mentors by expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-neon-blue"
            />
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {/* Expertise Filters */}
        <div className="flex flex-wrap gap-2">
          {allExpertise.slice(0, 10).map((expertise) => (
            <Badge
              key={expertise}
              variant={selectedExpertise.includes(expertise) ? "default" : "outline"}
              className="cursor-pointer bg-neon-blue/20 text-neon-blue border-neon-blue/30"
              onClick={() => {
                setSelectedExpertise(prev =>
                  prev.includes(expertise)
                    ? prev.filter(e => e !== expertise)
                    : [...prev, expertise]
                );
              }}
            >
              {expertise}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredMentors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Mentors Found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          filteredMentors.map((mentor, index) => (
            <MentorCard key={mentor.id} mentor={mentor} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function MentorCard({ mentor, index }: { mentor: AvailableMentor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-r from-neon-purple to-pink-400 text-white text-lg">
            {mentor.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-white">{mentor.name}</h3>
              <p className="text-gray-300">{mentor.title}</p>
              <p className="text-gray-400 text-sm">
                {mentor.company || "Independent"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">{mentor.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({mentor.reviews})</span>
              </div>
              <p className="text-lg font-bold text-neon-blue">${mentor.hourlyRate}/hr</p>
            </div>
          </div>

          <p className="text-gray-300 mb-4">
            {mentor.bio || "Experienced mentor ready to help you grow."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Expertise</p>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.slice(0, 4).map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
                {mentor.expertise.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{mentor.expertise.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{mentor.location || "Remote"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{mentor.availability}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{mentor.languages.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-sm text-green-400">{mentor.availability}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Book Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}