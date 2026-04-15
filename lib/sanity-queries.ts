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
      "author": author->{name, image},
      "categories": categories[]->{ title }
    }`
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
      "author": author->{name, image, bio},
      "categories": categories[]->{ title }
    }`,
    { slug }
  );
}

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(title asc) { _id, title, description }`
  );
}
