import Image from "next/image";
import { urlFor } from "@/lib/sanity";

interface AuthorCardProps {
  author: {
    name: string;
    image?: { asset: { _ref: string } };
    bio?: Array<{ children?: Array<{ text: string }> }>;
  };
}

export function AuthorCard({ author }: AuthorCardProps) {
  const bioText = author.bio
    ?.map((b) => b.children?.map((c) => c.text).join(""))
    .join(" ");

  return (
    <div className="glass-card border border-white/10 rounded-xl p-6 flex items-start gap-4">
      {author.image ? (
        <Image
          src={urlFor(author.image).width(80).height(80).url()}
          alt={author.name}
          width={56}
          height={56}
          className="rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 flex-shrink-0" />
      )}
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
          Written by
        </p>
        <p className="text-lg font-semibold text-white">{author.name}</p>
        {bioText && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{bioText}</p>
        )}
      </div>
    </div>
  );
}
