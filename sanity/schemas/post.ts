import { defineType, defineField } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
    }),
    defineField({
      name: "featured",
      title: "Featured Post",
      type: "boolean",
      description:
        "Mark this post as featured to highlight it on the blog page",
      initialValue: false,
    }),
    defineField({
      name: "readingTime",
      title: "Reading Time (minutes)",
      type: "number",
      description:
        "Estimated reading time in minutes. Auto-calculated if left empty.",
      validation: (Rule) => Rule.min(1).max(60),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      description:
        "Optional search optimization overrides. Leave blank to use auto-generated metadata.",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "Optional override for page title (recommended: <= 60 chars)",
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return true;
              if (typeof value !== "string") return true;
              if (value.length > 60) {
                return "Meta title is too long. Keep it under 60 characters.";
              }
              if (value.length < 30) {
                return "Meta title is short. Aim for 30-60 characters for stronger CTR.";
              }
              return true;
            }).warning(),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description:
            "Optional override for meta description (recommended: 140-160 chars)",
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return true;
              if (typeof value !== "string") return true;
              if (value.length > 160) {
                return "Meta description is too long. Keep it under 160 characters.";
              }
              if (value.length < 80) {
                return "Meta description is short. Aim for 80-160 characters.";
              }
              return true;
            }).warning(),
        }),
        defineField({
          name: "focusKeyword",
          title: "Focus Keyword",
          type: "string",
          description: "Primary keyword phrase for this post",
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return true;
              if (typeof value !== "string") return true;
              if (value.length > 80) {
                return "Focus keyword is too long. Use a shorter keyword phrase.";
              }
              if (value.split(" ").length > 8) {
                return "Focus keyword looks broad. Keep it to a concise phrase.";
              }
              return true;
            }).warning(),
        }),
        defineField({
          name: "canonicalUrl",
          title: "Canonical URL Override",
          type: "url",
          description:
            "Optional absolute canonical URL. Leave empty to use the post URL.",
          validation: (Rule) =>
            Rule.uri({ scheme: ["http", "https"], allowRelative: false })
              .custom((value) => {
                if (!value) return true;
                if (typeof value !== "string") return true;
                if (!value.includes("palmtechniq.com")) {
                  return "Canonical URL points off-domain. Confirm this is intentional.";
                }
                return true;
              })
              .warning(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage",
      featured: "featured",
    },
    prepare(selection) {
      const { author, featured } = selection;
      return {
        ...selection,
        subtitle: `${featured ? "⭐ " : ""}${author ? `by ${author}` : ""}`,
      };
    },
  },
});
