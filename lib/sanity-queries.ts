import { client } from "./sanity";

export async function getPosts() {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
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
      title,
      slug,
      excerpt,
      body,
      mainImage,
      publishedAt,
      featured,
      readingTime,
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

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(title asc) { _id, title, description }`,
  );
}
