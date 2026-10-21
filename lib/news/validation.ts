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

const AltSchema = z
  .string()
  .trim()
  .max(NEWS_CONFIG.photoAltMaxLength, `La description d'une photo ne doit pas dépasser ${NEWS_CONFIG.photoAltMaxLength} caractères.`)
  .default("");

const PhotoLayoutItemSchema = z.discriminatedUnion("kind", [
  /** A photo already stored with the post, by its storage path. */
  z.object({ kind: z.literal("existing"), path: z.string().min(1).max(512), alt: AltSchema }),
  /** A new photo: `file` is its position among the uploaded `images` files. */
  z.object({ kind: z.literal("new"), file: z.number().int().min(0), alt: AltSchema }),
]);

export type PhotoLayoutItem = z.infer<typeof PhotoLayoutItemSchema>;

const INVALID_LAYOUT = "Liste de photos invalide.";

/** `layout` form field: the photos in display order, as JSON. */
const PhotoLayoutSchema = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: INVALID_LAYOUT });
      return z.NEVER;
    }
  })
  .pipe(z.array(PhotoLayoutItemSchema, { message: INVALID_LAYOUT }).max(NEWS_CONFIG.maxImages, TOO_MANY_IMAGES));

/** Every uploaded file is placed exactly once in the layout. */
function usesEveryFileOnce(layout: PhotoLayoutItem[], fileCount: number): boolean {
  const files = layout.flatMap((item) => (item.kind === "new" ? [item.file] : [])).sort((a, b) => a - b);
  return files.length === fileCount && files.every((file, index) => file === index);
}

const ImagesSchema = z.array(ImageFileSchema).max(NEWS_CONFIG.maxImages, TOO_MANY_IMAGES);

/**
 * Multipart body of a new post: `body` text, `images` files, and optionally `layout` (order and descriptions;
 * the files in upload order without description when missing). Text or photos, not both empty.
 */
export const CreateNewsPostSchema = z
  .object({ body: BodySchema, images: ImagesSchema, layout: PhotoLayoutSchema.optional() })
  .transform((post) => ({
    ...post,
    layout: post.layout ?? post.images.map((_, file): PhotoLayoutItem => ({ kind: "new", file, alt: "" })),
  }))
  .refine((post) => post.layout.every((item) => item.kind === "new"), { message: INVALID_LAYOUT, path: ["layout"] })
  .refine((post) => usesEveryFileOnce(post.layout, post.images.length), { message: INVALID_LAYOUT, path: ["layout"] })
  .refine((post) => post.body.length > 0 || post.images.length > 0, { message: EMPTY_POST, path: ["body"] });

/**
 * Multipart body of an edit: the new `body`, the new `images` files, and `layout`: every photo of the post
 * in display order, kept ones by storage path, new ones by file position. Photos left out are deleted.
 */
export const UpdateNewsPostContentSchema = z
  .object({ body: BodySchema, images: ImagesSchema, layout: PhotoLayoutSchema })
  .refine((post) => usesEveryFileOnce(post.layout, post.images.length), { message: INVALID_LAYOUT, path: ["layout"] })
  .refine((post) => post.body.length > 0 || post.layout.length > 0, { message: EMPTY_POST, path: ["body"] });

export const UpdateNewsPostSchema = z.object({
  isPublished: z.boolean({ message: "La visibilité doit être vraie ou fausse." }),
});

export const NewsPostIdSchema = z.string().uuid("Identifiant de publication invalide.");

/** `?page=` of the public feed: a positive integer, 1 when missing or invalid. */
export const NewsFeedPageSchema = z.coerce.number().int().min(1).catch(1);
