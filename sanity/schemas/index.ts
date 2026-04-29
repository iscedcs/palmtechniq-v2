import { type SchemaTypeDefinition } from "sanity";
import { post } from "./post";
import { author } from "./author";
import { category } from "./category";
import { blockContent } from "./block-content";

export const schemaTypes: SchemaTypeDefinition[] = [
  post,
  author,
  category,
  blockContent,
];
