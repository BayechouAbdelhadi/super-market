import { z } from "zod";
import { ACCEPTED_IMAGE_LABEL, NEWS_CONFIG } from "./config";

const maxImageMb = NEWS_CONFIG.maxImageBytes / (1024 * 1024);

const ImageFileSchema = z
  .instanceof(File, { message: "Pièce jointe invalide." })
  .refine((file) => file.size > 0, "Une des images est vide.")
  .refine((file) => file.size <= NEWS_CONFIG.maxImageBytes, `Chaque image doit faire ${maxImageMb} Mo au maximum.`)
  .refine(
    (file) => (NEWS_CONFIG.acceptedImageTypes as readonly string[]).includes(file.type.toLowerCase()),
    `Format d'image non supporté. Formats acceptés : ${ACCEPTED_IMAGE_LABEL}.`
  );

const BodySchema = z
  .string({ message: "Le texte doit être une chaîne de caractères." })
  .trim()
  .max(NEWS_CONFIG.bodyMaxLength, `Le texte ne doit pas dépasser ${NEWS_CONFIG.bodyMaxLength} caractères.`);

const TOO_MANY_IMAGES = `${NEWS_CONFIG.maxImages} images au maximum par publication.`;
const EMPTY_POST = "Ajoutez un texte ou au moins une image.";

/** Multipart body of a new post: `body` text and `images` files (both optional, but not both empty). */
export const CreateNewsPostSchema = z
  .object({
    body: BodySchema,
    images: z.array(ImageFileSchema).max(NEWS_CONFIG.maxImages, TOO_MANY_IMAGES),
  })
  .refine((post) => post.body.length > 0 || post.images.length > 0, { message: EMPTY_POST, path: ["body"] });

/**
 * Multipart body of an edit: the new `body`, the storage paths of the current photos to keep (`keepImages`),
 * and the new photos to add after them (`images`). Paths that do not belong to the post are ignored by the service.
 */
export const UpdateNewsPostContentSchema = z
  .object({
    body: BodySchema,
    keepImages: z.array(z.string().min(1).max(512)).max(NEWS_CONFIG.maxImages, TOO_MANY_IMAGES),
    images: z.array(ImageFileSchema).max(NEWS_CONFIG.maxImages, TOO_MANY_IMAGES),
  })
  .refine((post) => post.keepImages.length + post.images.length <= NEWS_CONFIG.maxImages, {
    message: TOO_MANY_IMAGES,
    path: ["images"],
  })
  .refine((post) => post.body.length > 0 || post.keepImages.length + post.images.length > 0, {
    message: EMPTY_POST,
    path: ["body"],
  });

export const UpdateNewsPostSchema = z.object({
  isPublished: z.boolean({ message: "La visibilité doit être vraie ou fausse." }),
});

export const NewsPostIdSchema = z.string().uuid("Identifiant de publication invalide.");

/** `?page=` of the public feed: a positive integer, 1 when missing or invalid. */
export const NewsFeedPageSchema = z.coerce.number().int().min(1).catch(1);
