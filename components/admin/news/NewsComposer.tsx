"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewsPostCard } from "@/components/shared/news/NewsPostCard";
import { ACCEPTED_IMAGE_LABEL, NEWS_CONFIG } from "@/lib/news/config";
import type { NewsPost } from "@/lib/news/types";
import { prepareImage } from "./prepare-image";

interface NewsComposerProps {
  storeName: string;
  /** Post to edit; omit to write a new one. */
  post?: NewsPost;
  /** Called with the saved post after a successful publish or edit. */
  onSaved: (post: NewsPost) => Promise<void> | void;
  /** Edit mode only: leaves the editor without saving. */
  onCancel?: () => void;
}

/** A photo in the form: already stored (kept by its path) or newly picked (uploaded on save). */
type ComposerImage = { key: string; url: string; width: number; height: number; alt: string } & (
  | { kind: "existing"; path: string }
  | { kind: "new"; file: File }
);

const ACCEPT = NEWS_CONFIG.acceptedImageTypes.join(",");

function revoke(images: ComposerImage[]) {
  images.forEach((image) => image.kind === "new" && URL.revokeObjectURL(image.url));
}

/** Reads the JSON body of an API call and throws its message on failure. */
async function readResponse(res: Response, fallback: string): Promise<{ message: string; post: NewsPost }> {
  if (res.status === 413) throw new Error("Les photos sont trop lourdes. Retirez-en une ou choisissez des photos plus légères.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || fallback);
  return data;
}

/**
 * Form for a news post, new or edited: text, up to NEWS_CONFIG.maxImages photos (new ones shrunk in the browser),
 * and a live preview drawn with the same card as the public site. When editing, the current photos can be
 * removed and new ones added after them.
 */
export function NewsComposer({ storeName, post, onSaved, onCancel }: NewsComposerProps) {
  const isEdit = post !== undefined;
  const [body, setBody] = useState(post?.body ?? "");
  const [images, setImages] = useState<ComposerImage[]>(
    () => post?.images.map((image) => ({ kind: "existing" as const, key: image.path, ...image, alt: image.alt ?? "" })) ?? []
  );
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  // Free the preview URLs when the form goes away
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => revoke(imagesRef.current), []);

  const trimmed = body.trim();
  const remaining = NEWS_CONFIG.maxImages - images.length;
  const hasContent = trimmed.length > 0 || images.length > 0;
  const changed =
    !isEdit ||
    trimmed !== post.body ||
    images.length !== post.images.length ||
    images.some(
      (image, index) =>
        image.kind === "new" || image.path !== post.images[index].path || image.alt.trim() !== (post.images[index].alt ?? "")
    );
  const canSave = hasContent && changed && !preparing;

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const accepted = picked.filter((file) => (NEWS_CONFIG.acceptedImageTypes as readonly string[]).includes(file.type));
    if (accepted.length < picked.length) toast.error(`Formats acceptés : ${ACCEPTED_IMAGE_LABEL}.`);
    if (accepted.length > remaining) toast.warning(`${NEWS_CONFIG.maxImages} photos au maximum par publication.`);
    const files = accepted.slice(0, remaining);
    if (files.length === 0) return;

    setPreparing(true);
    const results = await Promise.allSettled(files.map(prepareImage));
    const prepared = results.flatMap((result) =>
      result.status === "fulfilled"
        ? [
            {
              kind: "new" as const,
              key: result.value.key,
              file: result.value.file,
              url: result.value.previewUrl,
              width: result.value.width,
              height: result.value.height,
              alt: "",
            },
          ]
        : []
    );
    if (prepared.length < files.length) toast.error("Certaines photos n'ont pas pu être lues.");
    setImages((current) => [...current, ...prepared]);
    setPreparing(false);
  };

  const moveImage = (from: number, to: number) => {
    setImages((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const setAlt = (key: string, alt: string) => {
    setImages((current) => current.map((image) => (image.key === key ? { ...image, alt } : image)));
  };

  const removeImage = (removed: ComposerImage) => {
    revoke([removed]);
    setImages((current) => current.filter((image) => image.key !== removed.key));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSubmitting(true);
    const fallback = isEdit ? "Erreur lors de la modification de l'actualité." : "Erreur lors de la publication de l'actualité.";
    try {
      // Photos in display order: kept ones by path, new ones by their position among the uploaded files
      const form = new FormData();
      form.append("body", trimmed);
      let nextFile = 0;
      const layout = images.map((image) => {
        if (image.kind === "existing") return { kind: "existing", path: image.path, alt: image.alt.trim() };
        form.append("images", image.file);
        return { kind: "new", file: nextFile++, alt: image.alt.trim() };
      });
      form.append("layout", JSON.stringify(layout));
      const res = await fetch(isEdit ? `/api/admin/news/${post.id}` : "/api/admin/news", {
        method: isEdit ? "PUT" : "POST",
        body: form,
      });
      const data = await readResponse(res, fallback);
      toast.success(data.message);
      if (!isEdit) {
        revoke(images);
        setImages([]);
        setBody("");
      }
      await onSaved(data.post);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Card padded="md" className={isEdit ? "gap-6 border-[var(--color-primary)]" : "gap-6"}>
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEdit ? "Modifier l'actualité" : "Nouvelle actualité"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor={`${fieldId}-body`} className="block text-sm font-semibold text-[var(--color-text)]">
              Texte
            </label>
            <textarea
              id={`${fieldId}-body`}
              rows={5}
              maxLength={NEWS_CONFIG.bodyMaxLength}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex. : Arrivage de dattes Medjool cette semaine ! Venez les découvrir au rayon fruits secs."
              aria-describedby={`${fieldId}-count`}
              className="w-full min-h-[44px] rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition-all hover:border-[var(--color-border-hover)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            />
            <p id={`${fieldId}-count`} className="text-right text-xs text-[var(--color-text-muted)]">
              {body.length} / {NEWS_CONFIG.bodyMaxLength}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Photos</p>
                <p id={`${fieldId}-photos-help`} className="text-xs text-[var(--color-text-muted)]">
                  Jusqu&apos;à {NEWS_CONFIG.maxImages} photos {ACCEPTED_IMAGE_LABEL}, redimensionnées automatiquement. La
                  première est la plus grande ; décrivez chaque photo en quelques mots (accessibilité, Google).
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInput.current?.click()}
                disabled={remaining <= 0 || preparing}
                loading={preparing}
                aria-describedby={`${fieldId}-photos-help`}
              >
                {!preparing && <ImagePlus aria-hidden />}
                Ajouter des photos ({images.length}/{NEWS_CONFIG.maxImages})
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleFiles}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
            </div>

            {images.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <li key={image.key} className="space-y-2">
                    <div className="relative aspect-square overflow-hidden rounded-[var(--radius-button,12px)] border border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                      <Image src={image.url} alt={image.alt || `Photo ${index + 1}`} fill unoptimized className="object-cover" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => removeImage(image)}
                        aria-label={`Retirer la photo ${index + 1}`}
                        className="absolute top-1.5 right-1.5 rounded-full"
                      >
                        <X aria-hidden />
                      </Button>
                      {images.length > 1 && (
                        <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                            aria-label={`Placer la photo ${index + 1} avant`}
                            className="rounded-full"
                          >
                            <ChevronLeft aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === images.length - 1}
                            aria-label={`Placer la photo ${index + 1} après`}
                            className="rounded-full"
                          >
                            <ChevronRight aria-hidden />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Input
                      value={image.alt}
                      onChange={(e) => setAlt(image.key, e.target.value)}
                      maxLength={NEWS_CONFIG.photoAltMaxLength}
                      placeholder="Description"
                      aria-label={`Description de la photo ${index + 1}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {isEdit && (
              <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                Annuler
              </Button>
            )}
            <Button type="submit" loading={submitting} disabled={!canSave}>
              {!submitting && (isEdit ? <Check aria-hidden /> : <Send aria-hidden />)}
              {isEdit ? "Enregistrer les modifications" : "Publier l'actualité"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--color-text)]">Aperçu sur le site</p>
        {hasContent ? (
          <NewsPostCard
            body={trimmed}
            images={images}
            createdAt={post?.createdAt ?? new Date().toISOString()}
            storeName={storeName}
            now={new Date()}
          />
        ) : (
          <p className="rounded-[var(--radius-card,16px)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            Écrivez un texte ou ajoutez des photos pour voir l&apos;aperçu.
          </p>
        )}
      </div>
    </div>
  );
}
