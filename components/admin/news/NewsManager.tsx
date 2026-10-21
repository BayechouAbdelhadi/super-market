"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { NewsPostCard } from "@/components/shared/news/NewsPostCard";
import { NEWS_CONFIG } from "@/lib/news/config";
import type { NewsPost } from "@/lib/news/types";
import { NewsComposer } from "./NewsComposer";

interface NewsManagerProps {
  initialPosts: NewsPost[];
  initialTotal: number;
  loadFailed: boolean;
  storeName: string;
  /** Server time of the page load, so "il y a …" renders the same on server and browser. */
  now: string;
}

/** Reads the JSON body of an API call and throws its message on failure. */
async function readResponse<T>(res: Response, fallback: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || fallback);
  return data as T;
}

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

/**
 * Admin screen for the store news: write a post with photos, then edit (in place), hide, show or delete published posts.
 */
export function NewsManager({ initialPosts, initialTotal, loadFailed, storeName, now }: NewsManagerProps) {
  const pageSize = NEWS_CONFIG.listPageSize;
  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState(() => new Date(now));
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bring the editor into view: the card it replaces may be far down the list
  useEffect(() => {
    if (editingId) document.getElementById(`news-${editingId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadPage = async (target: number) => {
    try {
      const res = await fetch(`/api/admin/news?page=${target}&limit=${pageSize}`);
      const data = await readResponse<{ posts: NewsPost[]; total: number; page: number }>(
        res,
        "Impossible de charger les actualités."
      );
      setPosts(data.posts);
      setTotal(data.total);
      setPage(data.page);
      setReferenceTime(new Date());
      setEditingId(null);
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de charger les actualités."));
    }
  };

  const handleToggle = async (post: NewsPost) => {
    setBusyId(post.id);
    try {
      const res = await fetch(`/api/admin/news/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      const data = await readResponse<{ post: NewsPost; message: string }>(res, "Erreur de modification.");
      setPosts((current) => current.map((p) => (p.id === data.post.id ? data.post : p)));
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur de modification."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (post: NewsPost) => {
    if (!window.confirm("Supprimer définitivement cette actualité et ses photos ?")) return;
    setBusyId(post.id);
    try {
      const res = await fetch(`/api/admin/news/${post.id}`, { method: "DELETE" });
      const data = await readResponse<{ message: string }>(res, "Erreur de suppression.");
      toast.success(data.message);
      // Step back when the last post of the page is gone
      await loadPage(posts.length === 1 && page > 1 ? page - 1 : page);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur de suppression."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Actualités</h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Partagez les arrivages, nouveautés et événements du magasin. La dernière actualité publiée s&apos;affiche
            sur la page d&apos;accueil, toutes les autres dans la section « Nos actualités ».
          </p>
        </div>
        <Link
          href="/actualites"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "secondary" })}
        >
          <ExternalLink aria-hidden />
          Voir sur le site
        </Link>
      </div>

      {loadFailed && (
        <Alert variant="danger">
          Impossible de charger les actualités. Vérifiez que la table <code>news_posts</code> existe dans la base.
        </Alert>
      )}

      <NewsComposer storeName={storeName} onSaved={() => loadPage(1)} />

      <section aria-labelledby="news-list-title" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="news-list-title" className="text-lg font-bold text-[var(--color-text)]">
            Actualités publiées
          </h2>
          <span className="text-sm text-[var(--color-text-muted)]">{total}</span>
        </div>

        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-card,16px)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            Aucune actualité pour le moment. La section n&apos;apparaît pas sur la page d&apos;accueil.
          </p>
        ) : (
          <ul className="grid items-start gap-6 md:grid-cols-2">
            {posts.map((post) =>
              post.id === editingId ? (
                <li key={post.id} id={`news-${post.id}`} className="scroll-mt-4 md:col-span-2">
                  <NewsComposer
                    storeName={storeName}
                    post={post}
                    onCancel={() => setEditingId(null)}
                    onSaved={(saved) => {
                      setPosts((current) => current.map((p) => (p.id === saved.id ? saved : p)));
                      setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li key={post.id} id={`news-${post.id}`}>
                  <NewsPostCard
                    body={post.body}
                    images={post.images}
                    createdAt={post.createdAt}
                    updatedAt={post.updatedAt}
                    storeName={storeName}
                    now={referenceTime}
                    className={post.isPublished ? undefined : "opacity-70"}
                    headerAside={
                      <Badge variant={post.isPublished ? "success" : "neutral"} size="sm">
                        {post.isPublished ? "Publiée" : "Masquée"}
                      </Badge>
                    }
                    footer={
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setEditingId(post.id)}
                          disabled={busyId === post.id}
                          className="flex-1"
                        >
                          <Pencil aria-hidden />
                          Modifier
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleToggle(post)}
                          disabled={busyId === post.id}
                          className="flex-1"
                        >
                          {post.isPublished ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                          {post.isPublished ? "Masquer" : "Afficher"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post)}
                          disabled={busyId === post.id}
                          aria-label="Supprimer l'actualité"
                          title="Supprimer"
                          className="hover:bg-danger-subtle hover:text-danger-text"
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    }
                  />
                </li>
              )
            )}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={loadPage}
        />
      </section>
    </div>
  );
}
