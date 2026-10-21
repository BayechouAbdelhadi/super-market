import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import { NEWS_CONFIG } from '@/lib/news/config';
import { detectImageType } from '@/lib/media/image-format';
import { formatNewsDate } from '@/lib/news/format';
import {
  CreateNewsPostSchema,
  NewsFeedPageSchema,
  NewsPostIdSchema,
  UpdateNewsPostContentSchema,
  UpdateNewsPostSchema,
} from '@/lib/news/validation';
import { createNewsPost, deleteNewsPost, getLatestNewsPost, updateNewsPost } from '@/lib/news/service';
import { SharpImageProcessor } from '@/lib/media/adapters/sharp-image-processor';
import type { IImageProcessor, IPublicImageStore } from '@/lib/media/ports';
import type { ImageOutput, ProcessedImage } from '@/lib/media/types';
import type { INewsRepository } from '@/lib/news/ports';
import type { NewNewsPost, NewsPost, NewsPostContent, NewsPostPage } from '@/lib/news/types';

class MemoryNewsRepository implements INewsRepository {
  constructor(public posts: NewsPost[] = []) {}

  private page(posts: NewsPost[], offset: number, limit: number): NewsPostPage {
    const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  async list(offset: number, limit: number) {
    return this.page(this.posts, offset, limit);
  }

  async listPublished(offset: number, limit: number) {
    return this.page(this.posts.filter((p) => p.isPublished), offset, limit);
  }

  async findById(id: string) {
    return this.posts.find((p) => p.id === id) ?? null;
  }

  async create(post: NewNewsPost): Promise<NewsPost> {
    const created = { ...post, isPublished: true, createdAt: new Date().toISOString(), updatedAt: null };
    this.posts.push(created);
    return created;
  }

  async updateContent(id: string, content: NewsPostContent) {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return null;
    Object.assign(post, content, { updatedAt: new Date().toISOString() });
    return post;
  }

  async setPublished(id: string, isPublished: boolean) {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return null;
    post.isPublished = isPublished;
    return post;
  }

  async delete(id: string) {
    const post = this.posts.find((p) => p.id === id) ?? null;
    this.posts = this.posts.filter((p) => p.id !== id);
    return post;
  }
}

class MemoryImageStore implements IPublicImageStore {
  files = new Map<string, ProcessedImage>();

  async upload(path: string, image: ProcessedImage): Promise<string> {
    if (this.files.has(path)) throw new Error(`already exists: ${path}`);
    this.files.set(path, image);
    return `https://cdn.test/${path}`;
  }

  async remove(paths: string[]) {
    paths.forEach((path) => this.files.delete(path));
  }
}

const fakeProcessor: IImageProcessor = {
  async process() {
    return { bytes: new Uint8Array([1]), width: 800, height: 600, contentType: 'image/webp', extension: 'webp' };
  },
};

const WEBP_OUTPUT: ImageOutput = { format: 'webp', maxDimension: NEWS_CONFIG.imageMaxDimension, quality: NEWS_CONFIG.imageQuality };

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const HTML = new TextEncoder().encode('<html><script>alert(1)</script>');

/** Upload, kept photo and new photo of a layout. */
const up = (bytes: Uint8Array, alt = '') => ({ bytes, alt });
const keep = (path: string, alt = '') => ({ kind: 'existing' as const, path, alt });
const add = (bytes: Uint8Array, alt = '') => ({ kind: 'new' as const, upload: up(bytes, alt) });

function deps(repo = new MemoryNewsRepository(), images = new MemoryImageStore(), processor = fakeProcessor) {
  return { repo, images, processor };
}

function post(id: string, createdAt: string, isPublished = true): NewsPost {
  return { id, body: `Post ${id}`, images: [], isPublished, createdAt, createdBy: null, updatedAt: null };
}

function file(name: string, type: string, size = 10) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('News', () => {
  describe('validation', () => {
    it('accepts text only, photos only, or both', () => {
      expect(CreateNewsPostSchema.safeParse({ body: ' Arrivage ', images: [] }).data?.body).toBe('Arrivage');
      expect(CreateNewsPostSchema.safeParse({ body: '', images: [file('a.jpg', 'image/jpeg')] }).success).toBe(true);
      expect(CreateNewsPostSchema.safeParse({ body: 'Hi', images: [file('a.png', 'image/png')] }).success).toBe(true);
    });

    it('rejects an empty post and a too long text', () => {
      expect(CreateNewsPostSchema.safeParse({ body: '   ', images: [] }).success).toBe(false);
      const tooLong = 'a'.repeat(NEWS_CONFIG.bodyMaxLength + 1);
      expect(CreateNewsPostSchema.safeParse({ body: tooLong, images: [] }).success).toBe(false);
    });

    it('rejects too many, too large, empty or non-image files', () => {
      const tooMany = Array.from({ length: NEWS_CONFIG.maxImages + 1 }, (_, i) => file(`${i}.jpg`, 'image/jpeg'));
      expect(CreateNewsPostSchema.safeParse({ body: '', images: tooMany }).success).toBe(false);
      const tooLarge = file('big.jpg', 'image/jpeg', NEWS_CONFIG.maxImageBytes + 1);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: [tooLarge] }).success).toBe(false);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: [file('e.jpg', 'image/jpeg', 0)] }).success).toBe(false);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: [file('x.svg', 'image/svg+xml')] }).success).toBe(false);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: ['not a file'] }).success).toBe(false);
    });

    it('accepts an edit layout mixing kept and new photos, within the limit', () => {
      const files = [file('c.jpg', 'image/jpeg'), file('d.jpg', 'image/jpeg')];
      const layout = [
        { kind: 'new', file: 1, alt: 'Dattes' },
        { kind: 'existing', path: 'news/a/1.webp' },
        { kind: 'new', file: 0 },
      ];
      const parsed = UpdateNewsPostContentSchema.safeParse({ body: '', images: files, layout: JSON.stringify(layout) });
      expect(parsed.success).toBe(true);
      expect(parsed.data?.layout[1]).toEqual({ kind: 'existing', path: 'news/a/1.webp', alt: '' });

      const tooMany = JSON.stringify([...layout, { kind: 'existing', path: 'b' }, { kind: 'existing', path: 'c' }]);
      expect(UpdateNewsPostContentSchema.safeParse({ body: 'x', images: files, layout: tooMany }).success).toBe(false);
      expect(UpdateNewsPostContentSchema.safeParse({ body: ' ', images: [], layout: '[]' }).success).toBe(false);
    });

    it('rejects a layout that does not place every new file exactly once, or is not JSON', () => {
      const files = [file('c.jpg', 'image/jpeg')];
      const parse = (layout: string) => UpdateNewsPostContentSchema.safeParse({ body: 'x', images: files, layout }).success;
      expect(parse('[]')).toBe(false);
      expect(parse(JSON.stringify([{ kind: 'new', file: 0 }, { kind: 'new', file: 0 }]))).toBe(false);
      expect(parse(JSON.stringify([{ kind: 'new', file: 3 }]))).toBe(false);
      expect(parse('not json')).toBe(false);
      const longAlt = 'a'.repeat(NEWS_CONFIG.photoAltMaxLength + 1);
      expect(parse(JSON.stringify([{ kind: 'new', file: 0, alt: longAlt }]))).toBe(false);
    });

    it('lets a new post order and describe its photos, without kept photos', () => {
      const files = [file('a.jpg', 'image/jpeg'), file('b.jpg', 'image/jpeg')];
      const layout = JSON.stringify([{ kind: 'new', file: 1, alt: 'Vitrine' }, { kind: 'new', file: 0 }]);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: files, layout }).data?.layout[0]).toEqual({ kind: 'new', file: 1, alt: 'Vitrine' });
      const withKept = JSON.stringify([{ kind: 'existing', path: 'news/x/1.webp' }, { kind: 'new', file: 0 }, { kind: 'new', file: 1 }]);
      expect(CreateNewsPostSchema.safeParse({ body: '', images: files, layout: withKept }).success).toBe(false);
    });

    it('requires a uuid id, a boolean visibility, and falls back to page 1', () => {
      expect(NewsPostIdSchema.safeParse('../etc').success).toBe(false);
      expect(NewsPostIdSchema.safeParse('6f1c1a8e-6d3b-4c2a-9a59-3a8b0f1d2e4c').success).toBe(true);
      expect(UpdateNewsPostSchema.safeParse({ isPublished: 'yes' }).success).toBe(false);
      expect(NewsFeedPageSchema.parse('3')).toBe(3);
      expect(NewsFeedPageSchema.parse('-2')).toBe(1);
      expect(NewsFeedPageSchema.parse('abc')).toBe(1);
      expect(NewsFeedPageSchema.parse(undefined)).toBe(1);
    });
  });

  describe('detectImageType', () => {
    it('reads the real format from the first bytes', () => {
      expect(detectImageType(JPEG)).toBe('image/jpeg');
      expect(detectImageType(PNG)).toBe('image/png');
      expect(detectImageType(WEBP)).toBe('image/webp');
    });

    it('rejects anything else, whatever its declared type', () => {
      expect(detectImageType(HTML)).toBeNull();
      expect(detectImageType(new Uint8Array())).toBeNull();
      expect(detectImageType(new TextEncoder().encode('GIF89a'))).toBeNull();
    });
  });

  describe('formatNewsDate', () => {
    const now = new Date('2026-10-21T12:00:00Z');

    it('is relative for the last week, then shows the date', () => {
      expect(formatNewsDate('2026-10-21T11:59:30Z', now)).toBe("À l'instant");
      expect(formatNewsDate('2026-10-21T13:00:00Z', now)).toBe("À l'instant");
      expect(formatNewsDate('2026-10-21T11:55:00Z', now)).toBe('Il y a 5 minutes');
      expect(formatNewsDate('2026-10-21T09:00:00Z', now)).toBe('Il y a 3 heures');
      expect(formatNewsDate('2026-10-20T10:00:00Z', now)).toBe('Hier');
      expect(formatNewsDate('2026-10-17T10:00:00Z', now)).toBe('Il y a 4 jours');
      expect(formatNewsDate('2026-10-01T10:00:00Z', now)).toBe('1 octobre 2026');
    });
  });

  describe('createNewsPost', () => {
    it('stores every photo, then the post with their urls', async () => {
      const d = deps();
      const result = await createNewsPost({ body: 'Arrivage', images: [up(JPEG), up(PNG)] }, 'admin@test', d);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.post.images).toHaveLength(2);
      expect(result.post.images[0]).toMatchObject({ width: 800, height: 600 });
      expect(result.post.images[0].path).toMatch(new RegExp(`^news/${result.post.id}/1-[0-9a-f]{12}\\.webp$`));
      expect(result.post.images[0].url).toBe(`https://cdn.test/${result.post.images[0].path}`);
      expect(result.post.createdBy).toBe('admin@test');
      expect(d.images.files.size).toBe(2);
    });

    it('rejects a file that is not a real image, before storing anything', async () => {
      const d = deps();
      const result = await createNewsPost({ body: '', images: [up(JPEG), up(HTML)] }, null, d);

      expect(result).toEqual({ ok: false, reason: 'INVALID_IMAGE', index: 1 });
      expect(d.images.files.size).toBe(0);
      expect(d.repo.posts).toHaveLength(0);
    });

    it('rejects an image the processor cannot decode', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const broken: IImageProcessor = { process: async () => Promise.reject(new Error('corrupt')) };
      const result = await createNewsPost({ body: '', images: [up(JPEG)] }, null, deps(undefined, undefined, broken));
      expect(result).toEqual({ ok: false, reason: 'INVALID_IMAGE', index: 0 });
    });

    it('removes the stored photos when saving the post fails', async () => {
      const d = deps();
      vi.spyOn(d.repo, 'create').mockRejectedValue(new Error('db down'));

      await expect(createNewsPost({ body: 'x', images: [up(JPEG), up(WEBP)] }, null, d)).rejects.toThrow('db down');
      expect(d.images.files.size).toBe(0);
    });
  });

  describe('updateNewsPost', () => {
    async function seeded(imageCount = 2) {
      const d = deps();
      const images = Array.from({ length: imageCount }, () => (up(JPEG)));
      const created = await createNewsPost({ body: 'Avant', images }, null, d);
      if (!created.ok) throw new Error('setup failed');
      return { d, post: created.post };
    }

    it('changes the text, keeps the chosen photos, adds the new ones where placed, and deletes the others', async () => {
      const { d, post } = await seeded(2);
      const [first, second] = post.images;

      const result = await updateNewsPost(post.id, { body: 'Après', photos: [add(PNG, 'Nouvelle'), keep(second.path, 'Rayon')] }, d);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.post.body).toBe('Après');
      expect(result.post.updatedAt).not.toBeNull();
      expect(result.post.images).toHaveLength(2);
      expect(result.post.images[0].path).toMatch(new RegExp(`^news/${post.id}/1-`));
      expect(result.post.images[0].alt).toBe('Nouvelle');
      expect(result.post.images[1]).toEqual({ ...second, alt: 'Rayon' });
      expect(d.images.files.has(first.path)).toBe(false);
      expect(d.images.files.has(second.path)).toBe(true);
      expect(d.images.files.size).toBe(2);
    });

    it('ignores kept paths that are not photos of this post', async () => {
      const { d, post } = await seeded(1);
      const result = await updateNewsPost(
        post.id,
        { body: 'x', photos: [keep(post.images[0].path), keep('news/other-post/1.webp'), keep(post.images[0].path)] },
        d
      );
      expect(result.ok && result.post.images).toEqual(post.images);
    });

    it('clears a description left empty', async () => {
      const { d, post } = await seeded(1);
      const described = await updateNewsPost(post.id, { body: 'x', photos: [keep(post.images[0].path, 'Vitrine')] }, d);
      expect(described.ok && described.post.images[0].alt).toBe('Vitrine');
      const cleared = await updateNewsPost(post.id, { body: 'x', photos: [keep(post.images[0].path, '')] }, d);
      expect(cleared.ok && 'alt' in cleared.post.images[0]).toBe(false);
    });

    it('rejects an unknown post, an empty result and too many photos', async () => {
      const { d, post } = await seeded(3);
      const all = post.images.map((image) => image.path);

      expect(await updateNewsPost('missing', { body: 'x', photos: [] }, d)).toEqual({
        ok: false,
        reason: 'NOT_FOUND',
      });
      expect(await updateNewsPost(post.id, { body: '', photos: [] }, d)).toEqual({
        ok: false,
        reason: 'EMPTY',
      });
      expect(
        await updateNewsPost(post.id, { body: '', photos: [...all.map((path) => keep(path)), add(JPEG), add(JPEG)] }, d)
      ).toEqual({ ok: false, reason: 'TOO_MANY_IMAGES' });
      expect(d.images.files.size).toBe(3);
    });

    it('rejects a new file that is not a real image, without touching the post', async () => {
      const { d, post } = await seeded(1);
      const result = await updateNewsPost(post.id, { body: 'x', photos: [add(HTML)] }, d);

      expect(result).toEqual({ ok: false, reason: 'INVALID_IMAGE', index: 0 });
      expect(d.repo.posts[0].body).toBe('Avant');
      expect(d.images.files.has(post.images[0].path)).toBe(true);
    });

    it('keeps the old photos and removes the new ones when saving fails', async () => {
      const { d, post } = await seeded(1);
      vi.spyOn(d.repo, 'updateContent').mockRejectedValue(new Error('db down'));

      await expect(
        updateNewsPost(post.id, { body: 'x', photos: [add(WEBP)] }, d)
      ).rejects.toThrow('db down');
      expect([...d.images.files.keys()]).toEqual([post.images[0].path]);
    });

    it('removes the new photos when the post is deleted meanwhile', async () => {
      const { d, post } = await seeded(1);
      vi.spyOn(d.repo, 'updateContent').mockResolvedValue(null);

      const result = await updateNewsPost(post.id, { body: 'x', photos: [add(WEBP)] }, d);
      expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
      expect([...d.images.files.keys()]).toEqual([post.images[0].path]);
    });
  });

  describe('deleteNewsPost', () => {
    it('deletes the post and its photos', async () => {
      const d = deps();
      const created = await createNewsPost({ body: 'x', images: [up(JPEG)] }, null, d);
      if (!created.ok) throw new Error('setup failed');

      expect(await deleteNewsPost(created.post.id, d)).toBe(true);
      expect(d.repo.posts).toHaveLength(0);
      expect(d.images.files.size).toBe(0);
    });

    it('returns false for an unknown post', async () => {
      expect(await deleteNewsPost('missing', deps())).toBe(false);
    });

    it('still succeeds when the photos cannot be removed', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const d = deps();
      const created = await createNewsPost({ body: 'x', images: [up(JPEG)] }, null, d);
      if (!created.ok) throw new Error('setup failed');
      vi.spyOn(d.images, 'remove').mockRejectedValue(new Error('storage down'));

      expect(await deleteNewsPost(created.post.id, d)).toBe(true);
    });
  });

  describe('getLatestNewsPost', () => {
    it('returns the newest published post', async () => {
      const repo = new MemoryNewsRepository([
        post('old', '2026-10-01T10:00:00Z'),
        post('hidden', '2026-10-20T10:00:00Z', false),
        post('latest', '2026-10-10T10:00:00Z'),
      ]);
      expect((await getLatestNewsPost({ repo }))?.id).toBe('latest');
    });

    it('returns null when there is none, or when storage fails', async () => {
      expect(await getLatestNewsPost({ repo: new MemoryNewsRepository() })).toBeNull();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const failing = new MemoryNewsRepository();
      vi.spyOn(failing, 'listPublished').mockRejectedValue(new Error('db down'));
      expect(await getLatestNewsPost({ repo: failing })).toBeNull();
    });
  });

  describe('SharpImageProcessor', () => {
    it('shrinks large photos to WebP and drops their metadata', async () => {
      const input = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#3366cc' } })
        .jpeg()
        .withMetadata({ exif: { IFD0: { Make: 'TestCam' } } })
        .toBuffer();

      const result = await new SharpImageProcessor().process(input, WEBP_OUTPUT);
      expect(result).toMatchObject({ width: NEWS_CONFIG.imageMaxDimension, height: 1440, contentType: 'image/webp' });
      const meta = await sharp(result.bytes).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
    });

    it('applies the camera orientation and never enlarges', async () => {
      // Orientation 6: stored landscape, displayed portrait
      const input = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#000' } })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer();

      const result = await new SharpImageProcessor().process(input, WEBP_OUTPUT);
      expect(result).toMatchObject({ width: 300, height: 400 });
    });

    it('writes JPEG for emails, with a white background behind transparency', async () => {
      const input = await sharp({ create: { width: 3000, height: 1000, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .png()
        .toBuffer();
      const result = await new SharpImageProcessor().process(input, { format: 'jpeg', maxDimension: 1200, quality: 85 });
      expect(result).toMatchObject({ width: 1200, height: 400, contentType: 'image/jpeg', extension: 'jpg' });
      const { data } = await sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
      expect([data[0], data[1], data[2]]).toEqual([255, 255, 255]);
    });

    it('throws on bytes that only look like an image', async () => {
      await expect(new SharpImageProcessor().process(JPEG, WEBP_OUTPUT)).rejects.toThrow();
    });
  });
});
