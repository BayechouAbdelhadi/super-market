import { describe, it, expect, vi } from 'vitest';
import { uploadCampaignImage } from '@/lib/marketing/campaign-images';
import { CampaignImageUploadSchema } from '@/lib/marketing/validation';
import { MEDIA_CONFIG } from '@/lib/media/config';
import type { IImageProcessor, IPublicImageStore } from '@/lib/media/ports';
import type { ImageOutput, ProcessedImage } from '@/lib/media/types';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const SVG = new TextEncoder().encode('<svg onload="alert(1)"/>');
const CAMPAIGN = '6f1c1a8e-6d3b-4c2a-9a59-3a8b0f1d2e4c';

function deps() {
  const stored = new Map<string, ProcessedImage>();
  const outputs: ImageOutput[] = [];
  const processor: IImageProcessor = {
    async process(_bytes, output) {
      outputs.push(output);
      return { bytes: new Uint8Array([1]), width: 1200, height: 600, contentType: 'image/jpeg', extension: 'jpg' };
    },
  };
  const images: IPublicImageStore = {
    async upload(path, image) {
      stored.set(path, image);
      return `https://cdn.test/${path}`;
    },
    async remove() {},
  };
  return { stored, outputs, deps: { processor, images } };
}

describe('campaign images', () => {
  it('stores an email-safe JPEG under the campaign folder', async () => {
    const { stored, outputs, deps: d } = deps();
    const result = await uploadCampaignImage(JPEG, CAMPAIGN, d);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toMatch(new RegExp(`^compaigns/${CAMPAIGN}/img-\\d+-[0-9a-f]{12}\\.jpg$`));
    expect(result.url).toBe(`https://cdn.test/${result.path}`);
    expect(outputs[0]).toEqual({ format: 'jpeg', maxDimension: 1200, quality: 85 });
    expect(stored.size).toBe(1);
  });

  it('gives a draft without id its own folder', async () => {
    const { deps: d } = deps();
    const result = await uploadCampaignImage(JPEG, undefined, d);
    expect(result.ok && result.path).toMatch(/^compaigns\/[0-9a-f-]{36}\/img-/);
  });

  it('rejects anything that is not really an image, before storing', async () => {
    const { stored, deps: d } = deps();
    expect(await uploadCampaignImage(SVG, CAMPAIGN, d)).toEqual({ ok: false, reason: 'INVALID_IMAGE' });
    expect(stored.size).toBe(0);
  });

  it('rejects an image the processor cannot decode', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { deps: d } = deps();
    d.processor = { process: async () => Promise.reject(new Error('corrupt')) };
    expect(await uploadCampaignImage(JPEG, CAMPAIGN, d)).toEqual({ ok: false, reason: 'INVALID_IMAGE' });
  });

  it('validates the upload form: image type, size and uuid campaign id', () => {
    const file = (type: string, size = 10) => new File([new Uint8Array(size)], 'x', { type });
    expect(CampaignImageUploadSchema.safeParse({ file: file('image/png') }).success).toBe(true);
    expect(CampaignImageUploadSchema.safeParse({ file: file('image/svg+xml') }).success).toBe(false);
    expect(CampaignImageUploadSchema.safeParse({ file: file('image/png', MEDIA_CONFIG.maxImageBytes + 1) }).success).toBe(false);
    expect(CampaignImageUploadSchema.safeParse({ file: file('image/png'), campaignId: '../../etc' }).success).toBe(false);
    expect(CampaignImageUploadSchema.safeParse({ file: null }).success).toBe(false);
  });
});
