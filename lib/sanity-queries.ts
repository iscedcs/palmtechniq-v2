import { cache } from "react";
import type { QueryParams } from "next-sanity";
import { client } from "./sanity";

// Helper to safely execute Sanity queries with exponential backoff retry for transient network drops / rate limits
async function fetchWithRetry<T>(
  query: string,
  params?: QueryParams,
  retries = 4,
  baseDelay = 400,
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return params
        ? await client.fetch<T>(query, params)
        : await client.fetch<T>(query);
    } catch (err: any) {
      lastError = err;
      const isNetworkError =
        err?.code === "ECONNRESET" ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "ENOTFOUND" ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "UND_ERR_SOCKET" ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("network") ||
        err?.message?.includes("socket") ||
        err?.statusCode === 429 ||
        (typeof err?.statusCode === "number" && err.statusCode >= 500);

      if (attempt === retries - 1 || !isNetworkError) {
        throw err;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 200;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export const getPosts = cache(async () => {
  try {
    return await fetchWithRetry<any[]>(
      `*[_type == "post"] | order(publishedAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        excerpt,
        mainImage,
        publishedAt,
        featured,
        readingTime,
        "author": author->{name, image},
        "categories": categories[]->{ _id, title }
      }`,
    );
  } catch (error) {
    console.error("Error fetching posts from Sanity:", error);
    return [];
  }
});

export const getFeaturedPosts = cache(async () => {
  try {
    return await fetchWithRetry<any[]>(
      `*[_type == "post" && featured == true] | order(publishedAt desc)[0...3] {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        excerpt,
        mainImage,
        publishedAt,
        readingTime,
        "author": author->{name, image},
        "categories": categories[]->{ _id, title }
      }`,
    );
  } catch (error) {
    console.error("Error fetching featured posts from Sanity:", error);
    return [];
  }
});

export const getPost = cache(async (slug: string) => {
  try {
    return await fetchWithRetry<any>(
      `*[_type == "post" && slug.current == $slug][0] {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        excerpt,
        body,
        mainImage,
        publishedAt,
        featured,
        readingTime,
        "seo": seo{
          metaTitle,
          metaDescription,
          focusKeyword,
          canonicalUrl
        },
        "author": author->{name, image, bio},
        "categories": categories[]->{ _id, title },
        "headings": body[style in ["h2", "h3"]]{
          "text": children[0].text,
          "style": style,
          "_key": _key
        }
      }`,
      { slug },
    );
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}" from Sanity:`, error);
    return null;
  }
});

export const getRelatedPosts = cache(
  async (currentPostId: string, categoryIds: string[]) => {
    if (!currentPostId || !categoryIds || categoryIds.length === 0) return [];
    try {
      return await fetchWithRetry<any[]>(
        `*[_type == "post" && _id != $currentPostId && count(categories[@._ref in $categoryIds]) > 0] | order(publishedAt desc)[0...3] {
          _id,
          title,
          slug,
          excerpt,
          mainImage,
          publishedAt,
          readingTime,
          "author": author->{name, image},
          "categories": categories[]->{ _id, title }
        }`,
        { currentPostId, categoryIds },
      );
    } catch (error) {
      console.error("Error fetching related posts from Sanity:", error);
      return [];
    }
  },
);

export const getPostSlugs = cache(async () => {
  try {
    return await fetchWithRetry<any[]>(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
        "slug": slug.current,
        publishedAt,
        _updatedAt
      }`,
    );
  } catch (error) {
    console.error("Error fetching post slugs from Sanity:", error);
    return [];
  }
});

export const getFeedPosts = cache(async (limit = 100) => {
  try {
    return await fetchWithRetry<any[]>(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...$limit] {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        excerpt,
        mainImage,
        publishedAt,
        "seo": seo{
          metaTitle,
          metaDescription,
          focusKeyword,
          canonicalUrl
        },
        "author": author->{name},
        "categories": categories[]->{ title }
      }`,
      { limit },
    );
  } catch (error) {
    console.error("Error fetching feed posts from Sanity:", error);
    return [];
  }
});

export const getCategories = cache(async () => {
  try {
    return await fetchWithRetry<any[]>(
      `*[_type == "category"] | order(title asc) { _id, title, description }`,
    );
  } catch (error) {
    console.error("Error fetching categories from Sanity:", error);
    return [];
  }
});
