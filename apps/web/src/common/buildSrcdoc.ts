import type { ReaderSettings } from '@dushu/shared';

function rewriteResourceUrls(html: string, bookId: string): string {
  const resourceBase = `/api/book/${bookId}/resources/`;
  return html.replace(/(src|href)="(?!https?:\/\/|data:|#|mailto:)([^"]+)"/g, (_match: string, attr: string, url: string) => {
    const cleanUrl = url.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
    return `${attr}="${resourceBase}${cleanUrl}"`;
  });
}

/* Extract content inside <body> (chapter HTML is a full XHTML document) */
function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : html;
}

export function buildChapterFragment(html: string, bookId: string): string {
  let bodyContent = extractBody(html);
  // Strip width/height on svg/img/image so CSS controls sizing and aspect ratio
  bodyContent = bodyContent.replace(/<(svg|img|image)\b([^>]*)/gi, (_match) => _match.replace(/\s(width|height)="[^"]*"/gi, ''));
  return rewriteResourceUrls(bodyContent, bookId);
}

export function buildSrcDoc(html: string, bookId: string, setting: ReaderSettings, isDark: boolean, initialUnitIndex: number = 0): string {
  const rewritten = buildChapterFragment(html, bookId);
  const colorScheme = isDark ? 'dark' : 'light';
  const isScrollMode = setting.pageView === 'scroll';
  const bodyOverflow = isScrollMode ? 'auto' : 'hidden';
  const bodyHeight = '100%';
  const bodyMinHeight = 'auto';

  const script = isScrollMode
    ? `
      (() => {
        let sentNearBottom = false;
        const getScrollRoot = () => document.body;

        const emitScrollSignals = () => {
          const root = getScrollRoot();
          if (!root) return;

          const maxScroll = Math.max(1, root.scrollHeight - root.clientHeight);
          const progress = root.scrollTop / maxScroll;
          parent.postMessage({ type: 'reader-scroll-progress', progress }, '*');

          // Emit near-bottom signal when within 200px of the end
          const nearBottom = root.scrollHeight - (root.scrollTop + root.clientHeight) < 200;
          if (nearBottom && !sentNearBottom) {
            parent.postMessage({ type: 'reader-near-bottom' }, '*');
            sentNearBottom = true;
          } else if (!nearBottom) {
            sentNearBottom = false;
          }
        };

        window.addEventListener('scroll', emitScrollSignals, { passive: true });
        document.addEventListener('scroll', emitScrollSignals, { passive: true });
        document.body.addEventListener('scroll', emitScrollSignals, { passive: true });

        window.addEventListener('message', (event) => {
          const data = event.data;
          if (!data || typeof data !== 'object') return;

          if (data.type === 'reader-append-unit' && typeof data.unitIndex === 'number' && typeof data.html === 'string') {
            const section = document.createElement('section');
            section.id = 'unit-' + data.unitIndex;
            section.dataset.unit = String(data.unitIndex);
            section.innerHTML = data.html;
            document.body.appendChild(section);
            sentNearBottom = false; // reset so next scroll check can fire again
            parent.postMessage({ type: 'reader-unit-appended', unitIndex: data.unitIndex }, '*');
            requestAnimationFrame(emitScrollSignals);
          }

          if (data.type === 'reader-scroll-to-unit' && typeof data.unitIndex === 'number') {
            const section = document.getElementById('unit-' + data.unitIndex);
            section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });

        requestAnimationFrame(emitScrollSignals);
      })();
      `
    : '';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <base href="/" />
        <style>
          * {
            box-sizing: border-box;
          }
          html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
          }
          body {
            padding: 0 clamp(12rem,10vw,20rem);
            height: ${bodyHeight};
            min-height: ${bodyMinHeight};
            overflow-y: ${bodyOverflow};
            font-family: ${setting.fontFamily};
            font-size: ${setting.fontSize}px;
            line-height: ${setting.lineHeight};
            color-scheme: ${colorScheme};
            color: light-dark(#1a1a1a, #e5e5e5);
            background-color: light-dark(transparent, #1a1a1a);
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          img, svg {
            display: block;
            max-width: calc(100% - 3rem);
            max-height: 80vh;
            height: auto;
            margin: 1em auto;
          }
          a { color: inherit; }
          h1, h2, h3, h4, h5, h6 {
            line-height: 1.3;
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          p {
            margin: ${setting.paragraphSpacing}em 0;
            text-indent: ${setting.indent}em;
          }
          blockquote {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 3px solid light-dark(#ddd, #444);
            color: light-dark(#555, #aaa);
          }
        </style>
      </head>
      <body>
        <section id="unit-${initialUnitIndex}" data-unit="${initialUnitIndex}">${rewritten}</section>
      </body>
      ${script ? `<script>${script}</script>` : ''}
    </html>
  `;
}
