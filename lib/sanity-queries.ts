import { client } from "./sanity";

export async function getPosts() {
  return client.fetch(
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
}

export async function getFeaturedPosts() {
  return client.fetch(
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
}

export async function getPost(slug: string) {
  return client.fetch(
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
}

export async function getRelatedPosts(
  currentPostId: string,
  categoryIds: string[],
) {
  return client.fetch(
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
}

export async function getPostSlugs() {
  return client.fetch(
    `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
      "slug": slug.current,
      publishedAt,
      _updatedAt
    }`,
  );
}

export async function getFeedPosts(limit = 100) {
  return client.fetch(
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
}

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(title asc) { _id, title, description }`,
  );
}
