import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';

// Built once at build time: navy background, brand mark left, headline right.
export const GET: APIRoute = async () => {
  const [mark, font] = await Promise.all([
    readFile('src/assets/brand/mark.png'),
    readFile('node_modules/@fontsource/inter/files/inter-latin-800-normal.woff'),
  ]);
  const el = (type: string, style: object, children?: unknown, extra: object = {}) => ({
    type,
    props: { style, children, ...extra },
  });
  const svg = await satori(
    el(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '0 80px',
        gap: 56,
        background: '#0B2350',
      },
      [
        el('img', { width: 360, height: 360 }, undefined, {
          src: `data:image/png;base64,${mark.toString('base64')}`,
          width: 360,
          height: 360,
        }),
        el('div', { display: 'flex', flexDirection: 'column', flex: 1 }, [
          el(
            'div',
            { color: '#7FBFFF', fontSize: 26, letterSpacing: 4 },
            'FINAL EXPENSE · MEDICARE',
          ),
          el(
            'div',
            { color: '#FFFFFF', fontSize: 62, lineHeight: 1.08, marginTop: 20, letterSpacing: -1 },
            'Live insurance calls, priced the way your agency sells.',
          ),
        ]),
      ],
    ) as never,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: font, weight: 800, style: 'normal' }],
    },
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
